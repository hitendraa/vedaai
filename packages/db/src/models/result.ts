import mongoose from "mongoose";
import type { InferSchemaType, Model } from "mongoose";

const { Schema } = mongoose;

const questionSchema = new Schema(
  {
    text: { type: String, required: true, trim: true },
    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      required: true,
    },
    marks: { type: Number, required: true, min: 1 },
  },
  { _id: false },
);

const sectionSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    instruction: { type: String, required: true, trim: true },
    questions: { type: [questionSchema], default: [] },
  },
  { _id: false },
);

const resultSchema = new Schema(
  {
    assignmentId: {
      type: Schema.Types.ObjectId,
      ref: "Assignment",
      required: true,
      index: true,
    },
    sections: { type: [sectionSchema], default: [] },
    totalMarks: { type: Number, required: true, min: 0 },
    generatedBy: { type: String, default: "ai", trim: true },
  },
  { timestamps: true },
);

export type AssessmentResult = InferSchemaType<typeof resultSchema>;

export const AssessmentResultModel =
  (mongoose.models.AssessmentResult as Model<AssessmentResult> | undefined) ??
  mongoose.model<AssessmentResult>("AssessmentResult", resultSchema);
