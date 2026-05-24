import mongoose from "mongoose";
import type { InferSchemaType, Model } from "mongoose";

const { Schema } = mongoose;

const questionConfigSchema = new Schema(
  {
    type: { type: String, required: true, trim: true },
    numberOfQuestions: { type: Number, required: true, min: 1 },
    marks: { type: Number, required: true, min: 1 },
  },
  { _id: false },
);

const attachmentSchema = new Schema(
  {
    originalName: { type: String, required: true, trim: true },
    fileName: { type: String, required: true, trim: true },
    path: { type: String, required: true, trim: true },
    mimeType: { type: String, required: true, trim: true },
    size: { type: Number, required: true, min: 1 },
  },
  { _id: false },
);

const assignmentSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    dueDate: { type: Date, required: true },
    sourceFileUrl: { type: String, trim: true },
    sourceFileName: { type: String, trim: true },
    attachments: { type: [attachmentSchema], default: [] },
    questionTypes: {
      type: [questionConfigSchema],
      required: true,
      validate: {
        validator: (value: unknown[]) => value.length > 0,
        message: "At least one question type is required.",
      },
    },
    additionalInstructions: { type: String, default: "", trim: true },
    status: {
      type: String,
      enum: ["draft", "queued", "generating", "completed", "failed"],
      default: "draft",
      index: true,
    },
    jobId: { type: String, trim: true, index: true },
    errorMessage: { type: String, trim: true },
  },
  { timestamps: true },
);

export type Assignment = InferSchemaType<typeof assignmentSchema>;

export const AssignmentModel =
  (mongoose.models.Assignment as Model<Assignment> | undefined) ??
  mongoose.model<Assignment>("Assignment", assignmentSchema);
