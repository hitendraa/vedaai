import { env } from "@vedaai/env/server";
import {
  AssignmentModel,
  AssessmentResultModel,
  connectDb,
} from "@vedaai/db";
import { Job, Queue, Worker } from "bullmq";
import { Redis } from "ioredis";
import type { Server } from "socket.io";
import { generateQuestionPaper } from "../services/question-generator";

type AssignmentGenerationJob = {
  assignmentId: string;
};

type AssignmentStatus =
  | "draft"
  | "queued"
  | "generating"
  | "completed"
  | "failed";

let worker: Worker<AssignmentGenerationJob> | null = null;
let queue: Queue<AssignmentGenerationJob> | null = null;
let redisConnection: Redis | null = null;
let redisWarningShown = false;

function warnRedisOnce(message: string) {
  if (redisWarningShown) {
    return;
  }

  redisWarningShown = true;
  console.error(
    `Redis unavailable: ${message}. Start Redis or update REDIS_URL to enable background generation.`,
  );
}

function getRedisConnection() {
  if (redisConnection) {
    return redisConnection;
  }

  redisConnection = new Redis(env.REDIS_URL, {
    enableOfflineQueue: false,
    lazyConnect: true,
    maxRetriesPerRequest: null,
    retryStrategy: () => null,
  });

  redisConnection.on("error", (error) => {
    warnRedisOnce(error.message);
  });

  return redisConnection;
}

async function ensureRedisConnection() {
  const connection = getRedisConnection();

  if (connection.status !== "ready") {
    await connection.connect();
  }

  await connection.ping();
  return connection;
}

function getAssignmentGenerationQueue() {
  if (queue) {
    return queue;
  }

  queue = new Queue<AssignmentGenerationJob>("assignment-generation", {
    connection: getRedisConnection(),
    skipVersionCheck: true,
  });

  queue.on("error", (error) => {
    warnRedisOnce(error.message);
  });

  return queue;
}

function getAssignmentRoom(assignmentId: string) {
  return `assignment:${assignmentId}`;
}

function emitAssignmentStatus(
  io: Server,
  assignmentId: string,
  status: AssignmentStatus,
  errorMessage?: string,
) {
  const payload = {
    assignmentId,
    status,
    errorMessage,
  };

  io.to(getAssignmentRoom(assignmentId)).emit("assignment:status", payload);
  io.emit("assignments:changed", payload);
}

async function setAssignmentStatus(
  assignmentId: string,
  status: AssignmentStatus,
  errorMessage?: string,
) {
  await AssignmentModel.findByIdAndUpdate(assignmentId, {
    status,
    errorMessage,
  });
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Generation failed.";
}

async function processGenerationJob(job: Job<AssignmentGenerationJob>) {
  await connectDb();

  const assignment = await AssignmentModel.findById(job.data.assignmentId);

  if (!assignment) {
    throw new Error("Assignment not found.");
  }

  await AssignmentModel.findByIdAndUpdate(assignment._id, {
    status: "generating",
    errorMessage: undefined,
  });

  const questionPaper = await generateQuestionPaper({
    title: assignment.title,
    dueDate: assignment.dueDate,
    questionTypes: assignment.questionTypes.map((questionType) => ({
      type: questionType.type,
      numberOfQuestions: questionType.numberOfQuestions,
      marks: questionType.marks,
    })),
    additionalInstructions: assignment.additionalInstructions,
    attachments: assignment.attachments.map((attachment) => ({
      originalName: attachment.originalName,
      path: attachment.path,
      mimeType: attachment.mimeType,
    })),
  });

  const totalMarks = questionPaper.sections.reduce(
    (total, section) =>
      total +
      section.questions.reduce(
        (sectionTotal, question) => sectionTotal + question.marks,
        0,
      ),
    0,
  );

  await AssessmentResultModel.findOneAndUpdate(
    { assignmentId: assignment._id },
    {
      assignmentId: assignment._id,
      sections: questionPaper.sections,
      totalMarks,
      generatedBy: env.OPENAI_MODEL,
    },
    { new: true, upsert: true, runValidators: true },
  );

  await AssignmentModel.findByIdAndUpdate(assignment._id, {
    status: "completed",
    errorMessage: undefined,
  });
}

export async function enqueueAssignmentGeneration(assignmentId: string) {
  await connectDb();

  try {
    await ensureRedisConnection();

    await setAssignmentStatus(assignmentId, "queued");

    const job = await getAssignmentGenerationQueue().add(
      "generate",
      { assignmentId },
      {
        attempts: 2,
        backoff: {
          type: "exponential",
          delay: 3000,
        },
        removeOnComplete: 50,
        removeOnFail: 100,
      },
    );

    await AssignmentModel.findByIdAndUpdate(assignmentId, {
      jobId: job.id,
      status: "queued",
      errorMessage: undefined,
    });

    return {
      errorMessage: undefined,
      jobId: job.id,
      status: "queued" as const,
    };
  } catch (error) {
    const message = getErrorMessage(error);
    warnRedisOnce(message);

    await setAssignmentStatus(
      assignmentId,
      "failed",
      "Redis is not running. Start Redis and click Regenerate.",
    );

    return {
      errorMessage: "Redis is not running. Start Redis and click Regenerate.",
      jobId: undefined,
      status: "failed" as const,
    };
  }
}

export async function startAssignmentGenerationWorker(io: Server) {
  if (worker) {
    return worker;
  }

  try {
    await ensureRedisConnection();
  } catch (error) {
    warnRedisOnce(getErrorMessage(error));
    return null;
  }

  worker = new Worker<AssignmentGenerationJob>(
    "assignment-generation",
    async (job) => {
      emitAssignmentStatus(io, job.data.assignmentId, "generating");
      await processGenerationJob(job);
      emitAssignmentStatus(io, job.data.assignmentId, "completed");
    },
    {
      connection: getRedisConnection(),
      concurrency: 1,
      skipVersionCheck: true,
    },
  );

  worker.on("failed", async (job, error) => {
    if (!job) {
      return;
    }

    const message = getErrorMessage(error);
    await setAssignmentStatus(job.data.assignmentId, "failed", message);
    emitAssignmentStatus(io, job.data.assignmentId, "failed", message);
  });

  worker.on("error", (error) => {
    warnRedisOnce(error.message);
  });

  return worker;
}
