import { createReadStream } from "node:fs";
import OpenAI, { toFile } from "openai";
import { env } from "@vedaai/env/server";

type QuestionTypeConfig = {
  type: string;
  numberOfQuestions: number;
  marks: number;
};

type AttachmentInput = {
  originalName: string;
  path: string;
  mimeType: string;
};

export type GeneratedQuestion = {
  text: string;
  difficulty: "easy" | "medium" | "hard";
  marks: number;
};

export type GeneratedSection = {
  title: string;
  instruction: string;
  questions: GeneratedQuestion[];
};

export type GeneratedQuestionPaper = {
  sections: GeneratedSection[];
};

type GenerateQuestionPaperInput = {
  title: string;
  dueDate: Date;
  questionTypes: QuestionTypeConfig[];
  additionalInstructions?: string;
  attachments: AttachmentInput[];
};

const questionPaperJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["sections"],
  properties: {
    sections: {
      type: "array",
      minItems: 1,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["title", "instruction", "questions"],
        properties: {
          title: { type: "string" },
          instruction: { type: "string" },
          questions: {
            type: "array",
            minItems: 1,
            items: {
              type: "object",
              additionalProperties: false,
              required: ["text", "difficulty", "marks"],
              properties: {
                text: { type: "string" },
                difficulty: {
                  type: "string",
                  enum: ["easy", "medium", "hard"],
                },
                marks: {
                  type: "integer",
                  minimum: 1,
                },
              },
            },
          },
        },
      },
    },
  },
} as const;

function getOpenAIClient() {
  if (!env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not configured.");
  }

  return new OpenAI({
    apiKey: env.OPENAI_API_KEY,
  });
}

function buildPrompt(input: GenerateQuestionPaperInput) {
  const questionPlan = input.questionTypes
    .map(
      (questionType, index) =>
        `${index + 1}. ${questionType.type}: ${questionType.numberOfQuestions} questions, ${questionType.marks} marks each`,
    )
    .join("\n");

  const attachmentList =
    input.attachments.length > 0
      ? input.attachments
          .map(
            (attachment, index) =>
              `${index + 1}. ${attachment.originalName} (${attachment.mimeType})`,
          )
          .join("\n")
      : "No uploaded source material.";

  return [
    "Create a teacher-ready assessment question paper from the assignment setup and uploaded source material.",
    "Do not include markdown fences or prose outside the required JSON schema.",
    "Group questions into exam-paper sections such as Section A, Section B, etc.",
    "Respect the requested question types, counts, marks, and difficulty variety.",
    "Make the output clear enough to render directly as a structured exam paper.",
    "",
    `Assignment title: ${input.title}`,
    `Due date: ${input.dueDate.toISOString()}`,
    "",
    "Requested question plan:",
    questionPlan,
    "",
    "Uploaded files:",
    attachmentList,
    "",
    `Additional instructions: ${input.additionalInstructions || "None"}`,
  ].join("\n");
}

async function uploadAttachments(
  client: OpenAI,
  attachments: AttachmentInput[],
) {
  const uploadedFiles = await Promise.all(
    attachments.map(async (attachment) => {
      const file = await toFile(
        createReadStream(attachment.path),
        attachment.originalName,
        { type: attachment.mimeType },
      );

      return client.files.create({
        file,
        purpose: "user_data",
      });
    }),
  );

  return uploadedFiles.map((file) => file.id);
}

function parseQuestionPaper(text: string): GeneratedQuestionPaper {
  const parsed = JSON.parse(text) as GeneratedQuestionPaper;

  return {
    sections: parsed.sections.map((section) => ({
      title: section.title,
      instruction: section.instruction,
      questions: section.questions.map((question) => ({
        text: question.text,
        difficulty: question.difficulty,
        marks: question.marks,
      })),
    })),
  };
}

export async function generateQuestionPaper(
  input: GenerateQuestionPaperInput,
): Promise<GeneratedQuestionPaper> {
  const client = getOpenAIClient();
  const uploadedFileIds = await uploadAttachments(client, input.attachments);

  const response = await client.responses.create({
    model: env.OPENAI_MODEL,
    input: [
      {
        role: "system",
        content:
          "You are an expert assessment designer. Return only schema-valid JSON.",
      },
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text: buildPrompt(input),
          },
          ...uploadedFileIds.map((fileId) => ({
            type: "input_file" as const,
            file_id: fileId,
          })),
        ],
      },
    ],
    text: {
      format: {
        type: "json_schema",
        name: "assessment_question_paper",
        schema: questionPaperJsonSchema,
        strict: true,
      },
    },
  });

  return parseQuestionPaper(response.output_text);
}
