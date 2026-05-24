import {
  AssignmentModel,
  AssessmentResultModel,
  connectDb,
} from "@vedaai/db";
import { Router } from "express";
import type { NextFunction, Request, Response } from "express";
import { z } from "zod";
import { enqueueAssignmentGeneration } from "../jobs/assignment-generation";
import { assignmentUpload, toAttachment } from "../lib/uploads";
import { renderAssignmentPdf } from "../services/assignment-pdf";

const objectIdPattern = /^[0-9a-fA-F]{24}$/;

const questionTypeSchema = z.object({
  type: z.string().trim().min(1, "Question type is required."),
  numberOfQuestions: z.coerce
    .number()
    .int("Number of questions must be a whole number.")
    .positive("Number of questions must be greater than 0."),
  marks: z.coerce
    .number()
    .int("Marks must be a whole number.")
    .positive("Marks must be greater than 0."),
});

const optionalTextSchema = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value ? value : undefined));

const optionalUrlSchema = z
  .union([z.url(), z.literal("")])
  .optional()
  .transform((value) => (value ? value : undefined));

const createAssignmentSchema = z.object({
  title: z.string().trim().min(1, "Assignment title is required.").max(140),
  dueDate: z.coerce.date("Due date is required."),
  sourceFileUrl: optionalUrlSchema,
  sourceFileName: optionalTextSchema,
  questionTypes: z
    .array(questionTypeSchema)
    .min(1, "At least one question type is required."),
  additionalInstructions: z.string().trim().max(2000).optional().default(""),
});

const updateAssignmentSchema = createAssignmentSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required.",
  });

type AssignmentRecord = {
  _id: { toString(): string };
  title: string;
  dueDate: Date;
  sourceFileUrl?: string;
  sourceFileName?: string;
  questionTypes: Array<{
    type: string;
    numberOfQuestions: number;
    marks: number;
  }>;
  additionalInstructions: string;
  status: string;
  jobId?: string;
  errorMessage?: string;
  attachments?: Array<{
    originalName: string;
    fileName: string;
    path: string;
    mimeType: string;
    size: number;
  }>;
  createdAt?: Date;
  updatedAt?: Date;
};

type ResultRecord = {
  _id: { toString(): string };
  assignmentId: { toString(): string };
  sections: Array<{
    title: string;
    instruction: string;
    questions: Array<{
      text: string;
      difficulty: "easy" | "medium" | "hard";
      marks: number;
    }>;
  }>;
  totalMarks: number;
  generatedBy: string;
  createdAt?: Date;
  updatedAt?: Date;
};

type AsyncRoute = (
  req: Request,
  res: Response,
  next: NextFunction,
) => Promise<void>;

const router = Router();

function asyncRoute(handler: AsyncRoute) {
  return (req: Request, res: Response, next: NextFunction) => {
    void handler(req, res, next).catch(next);
  };
}

function serializeAssignment(assignment: AssignmentRecord) {
  return {
    id: assignment._id.toString(),
    title: assignment.title,
    dueDate: assignment.dueDate.toISOString(),
    sourceFileUrl: assignment.sourceFileUrl,
    sourceFileName: assignment.sourceFileName,
    questionTypes: assignment.questionTypes,
    additionalInstructions: assignment.additionalInstructions,
    status: assignment.status,
    jobId: assignment.jobId,
    errorMessage: assignment.errorMessage,
    attachments:
      assignment.attachments?.map((attachment) => ({
        originalName: attachment.originalName,
        fileName: attachment.fileName,
        mimeType: attachment.mimeType,
        size: attachment.size,
      })) ?? [],
    createdAt: assignment.createdAt?.toISOString(),
    updatedAt: assignment.updatedAt?.toISOString(),
  };
}

function serializeResult(result: ResultRecord) {
  return {
    id: result._id.toString(),
    assignmentId: result.assignmentId.toString(),
    sections: result.sections,
    totalMarks: result.totalMarks,
    generatedBy: result.generatedBy,
    createdAt: result.createdAt?.toISOString(),
    updatedAt: result.updatedAt?.toISOString(),
  };
}

function isValidAssignmentId(id: string) {
  return objectIdPattern.test(id);
}

function getAssignmentId(req: Request, res: Response) {
  const { id } = req.params;

  if (typeof id !== "string" || !isValidAssignmentId(id)) {
    res.status(400).json({ error: "Invalid assignment id." });
    return null;
  }

  return id;
}

function sendValidationError(res: Response, error: z.ZodError) {
  res.status(400).json({
    error: "Validation failed.",
    issues: error.issues.map((issue) => ({
      path: issue.path.join("."),
      message: issue.message,
    })),
  });
}

function normalizeAssignmentBody(body: unknown) {
  if (!body || typeof body !== "object") {
    return body;
  }

  const normalized = { ...(body as Record<string, unknown>) };

  if (typeof normalized.questionTypes === "string") {
    normalized.questionTypes = JSON.parse(normalized.questionTypes);
  }

  return normalized;
}

function getDownloadFileName(title: string) {
  const safeTitle =
    title
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || "assignment";

  return `${safeTitle}-question-paper.pdf`;
}

router.get(
  "/",
  asyncRoute(async (_req, res) => {
    await connectDb();

    const assignments = await AssignmentModel.find()
      .sort({ createdAt: -1 })
      .lean<AssignmentRecord[]>();

    res.status(200).json({
      assignments: assignments.map(serializeAssignment),
    });
  }),
);

router.post(
  "/",
  assignmentUpload.array("files", 5),
  asyncRoute(async (req, res) => {
    let body: unknown;

    try {
      body = normalizeAssignmentBody(req.body);
    } catch {
      res.status(400).json({ error: "Question types must be valid JSON." });
      return;
    }

    const parsed = createAssignmentSchema.safeParse(body);

    if (!parsed.success) {
      sendValidationError(res, parsed.error);
      return;
    }

    await connectDb();

    const files = (req.files ?? []) as Express.Multer.File[];
    const assignment = await AssignmentModel.create({
      ...parsed.data,
      attachments: files.map(toAttachment),
      status: "queued",
    });
    const enqueueResult = await enqueueAssignmentGeneration(
      assignment._id.toString(),
    );
    assignment.jobId = enqueueResult.jobId;
    assignment.status = enqueueResult.status;
    assignment.errorMessage = enqueueResult.errorMessage;
    await assignment.save();

    res.status(201).json({
      assignment: serializeAssignment(
        assignment.toObject() as unknown as AssignmentRecord,
      ),
    });
  }),
);

router.post(
  "/:id/generate",
  asyncRoute(async (req, res) => {
    const id = getAssignmentId(req, res);

    if (!id) {
      return;
    }

    await connectDb();

    const assignment = await AssignmentModel.findById(id).lean<AssignmentRecord>();

    if (!assignment) {
      res.status(404).json({ error: "Assignment not found." });
      return;
    }

    const enqueueResult = await enqueueAssignmentGeneration(id);

    res.status(202).json({
      assignment: {
        ...serializeAssignment(assignment),
        status: enqueueResult.status,
        jobId: enqueueResult.jobId,
        errorMessage: enqueueResult.errorMessage,
      },
    });
  }),
);

router.get(
  "/:id",
  asyncRoute(async (req, res) => {
    const id = getAssignmentId(req, res);

    if (!id) {
      return;
    }

    await connectDb();

    const assignment = await AssignmentModel.findById(id).lean<AssignmentRecord>();

    if (!assignment) {
      res.status(404).json({ error: "Assignment not found." });
      return;
    }

    res.status(200).json({
      assignment: serializeAssignment(assignment),
    });
  }),
);

router.get(
  "/:id/result",
  asyncRoute(async (req, res) => {
    const id = getAssignmentId(req, res);

    if (!id) {
      return;
    }

    await connectDb();

    const result = await AssessmentResultModel.findOne({
      assignmentId: id,
    }).lean<ResultRecord>();

    if (!result) {
      res.status(404).json({ error: "Result not found." });
      return;
    }

    res.status(200).json({
      result: serializeResult(result),
    });
  }),
);

router.get(
  "/:id/pdf",
  asyncRoute(async (req, res) => {
    const id = getAssignmentId(req, res);

    if (!id) {
      return;
    }

    await connectDb();

    const [assignment, result] = await Promise.all([
      AssignmentModel.findById(id).lean<AssignmentRecord>(),
      AssessmentResultModel.findOne({
        assignmentId: id,
      }).lean<ResultRecord>(),
    ]);

    if (!assignment) {
      res.status(404).json({ error: "Assignment not found." });
      return;
    }

    if (!result) {
      res.status(404).json({ error: "Result not found." });
      return;
    }

    const pdf = await renderAssignmentPdf({
      assignment: {
        title: assignment.title,
        dueDate: assignment.dueDate,
      },
      result: {
        sections: result.sections,
        totalMarks: result.totalMarks,
      },
    });

    res
      .status(200)
      .setHeader("Content-Type", "application/pdf")
      .setHeader(
        "Content-Disposition",
        `attachment; filename="${getDownloadFileName(assignment.title)}"`,
      )
      .send(pdf);
  }),
);

router.patch(
  "/:id",
  asyncRoute(async (req, res) => {
    const id = getAssignmentId(req, res);

    if (!id) {
      return;
    }

    const parsed = updateAssignmentSchema.safeParse(req.body);

    if (!parsed.success) {
      sendValidationError(res, parsed.error);
      return;
    }

    await connectDb();

    const assignment = await AssignmentModel.findByIdAndUpdate(id, parsed.data, {
      new: true,
      runValidators: true,
    }).lean<AssignmentRecord>();

    if (!assignment) {
      res.status(404).json({ error: "Assignment not found." });
      return;
    }

    res.status(200).json({
      assignment: serializeAssignment(assignment),
    });
  }),
);

router.delete(
  "/:id",
  asyncRoute(async (req, res) => {
    const id = getAssignmentId(req, res);

    if (!id) {
      return;
    }

    await connectDb();

    const assignment = await AssignmentModel.findByIdAndDelete(id);

    if (!assignment) {
      res.status(404).json({ error: "Assignment not found." });
      return;
    }

    await AssessmentResultModel.deleteMany({ assignmentId: id });

    res.status(204).send();
  }),
);

export { router as assignmentsRouter };
