"use client";

import { useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";
import {
  CalendarPlus,
  ChevronDown,
  ChevronLeft,
  Minus,
  Mic,
  Plus,
  UploadCloud,
  X,
} from "lucide-react";
import { useAssignmentStore } from "./assignment-store";

type QuestionRow = {
  id: string;
  type: string;
  questions: number;
  marks: number;
};

const questionTypeOptions = [
  "Multiple Choice Questions",
  "Short Questions",
  "Diagram/Graph-Based Questions",
  "Numerical Problems",
  "Long Answer Questions",
  "Case-Based Questions",
];

const initialRows: QuestionRow[] = [
  { id: "mcq", type: "Multiple Choice Questions", questions: 4, marks: 1 },
  { id: "short", type: "Short Questions", questions: 3, marks: 2 },
  { id: "diagram", type: "Diagram/Graph-Based Questions", questions: 5, marks: 5 },
  { id: "numerical", type: "Numerical Problems", questions: 5, marks: 5 },
];

const maxFileSize = 10 * 1024 * 1024;
const maxFileCount = 5;
const allowedFileTypes = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/jpeg",
  "image/png",
  "image/webp",
  "text/markdown",
  "text/plain",
]);

type CreateAssignmentFormProps = {
  onBack: () => void;
  onCreated: (assignmentId: string) => void;
};

export function CreateAssignmentForm({
  onBack,
  onCreated,
}: CreateAssignmentFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { createAssignment, error, isCreating } = useAssignmentStore();
  const [title, setTitle] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [dueDate, setDueDate] = useState("");
  const [additionalInfo, setAdditionalInfo] = useState("");
  const [rows, setRows] = useState<QuestionRow[]>(initialRows);
  const [localError, setLocalError] = useState("");

  const totals = useMemo(() => {
    return rows.reduce(
      (acc, row) => ({
        questions: acc.questions + row.questions,
        marks: acc.marks + row.questions * row.marks,
      }),
      { questions: 0, marks: 0 },
    );
  }, [rows]);

  function handleFiles(files: FileList | File[]) {
    const nextFiles = Array.from(files);

    if (nextFiles.length === 0) {
      return;
    }

    if (selectedFiles.length + nextFiles.length > maxFileCount) {
      setLocalError(`You can upload up to ${maxFileCount} files.`);
      return;
    }

    const invalidFile = nextFiles.find(
      (file) => !allowedFileTypes.has(file.type) || file.size > maxFileSize,
    );

    if (invalidFile) {
      setLocalError(
        "Only PDF, DOCX, TXT, MD, JPG, PNG, WEBP files up to 10MB are allowed.",
      );
      return;
    }

    setLocalError("");
    setSelectedFiles((current) => [...current, ...nextFiles]);
  }

  function updateRow(id: string, patch: Partial<QuestionRow>) {
    setRows((current) =>
      current.map((row) => (row.id === id ? { ...row, ...patch } : row)),
    );
  }

  function adjustNumber(id: string, key: "questions" | "marks", delta: number) {
    setRows((current) =>
      current.map((row) =>
        row.id === id
          ? { ...row, [key]: Math.max(1, row[key] + delta) }
          : row,
      ),
    );
  }

  function addQuestionType() {
    setRows((current) => [
      ...current,
      {
        id: `row-${Date.now()}`,
        type: "Multiple Choice Questions",
        questions: 4,
        marks: 4,
      },
    ]);
  }

  function removeQuestionType(id: string) {
    setRows((current) =>
      current.length === 1 ? current : current.filter((row) => row.id !== id),
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!title.trim()) {
      setLocalError("Assignment title is required.");
      return;
    }

    if (!dueDate) {
      setLocalError("Due date is required.");
      return;
    }

    setLocalError("");

    const assignment = await createAssignment({
      title,
      dueDate,
      additionalInstructions: additionalInfo,
      files: selectedFiles,
      questionTypes: rows.map((row) => ({
        type: row.type,
        numberOfQuestions: row.questions,
        marks: row.marks,
      })),
    });

    onCreated(assignment.id);
  }

  return (
    <section className="mx-auto w-full max-w-[1048px] pb-8 md:pb-9">
      <MobileCreateTitle onBack={onBack} />
      <DesktopCreateHeader />
      <ProgressSteps />

      <form
        id="create-assignment-form"
        onSubmit={handleSubmit}
        className="mx-auto mt-[15px] w-full max-w-[905px] rounded-[16px] bg-[#f4f4f4] px-[13px] py-[22px] shadow-[0_18px_60px_rgba(255,255,255,0.42)] md:mt-[31px] md:rounded-[31px] md:px-[39px] md:py-[42px]"
      >
        <div>
          <h2 className="text-[16px] font-bold leading-tight text-[#2b2b2b] md:text-[18px]">
            Assignment Details
          </h2>
          <p className="mt-[5px] text-[10px] leading-none text-[#858585] md:text-[12px]">
            Basic information about your assignment
          </p>
        </div>

        <label className="mt-[16px] block md:mt-[22px]">
          <span className="text-[11px] font-bold text-[#202020] md:text-[13px]">
            Assignment Title
          </span>
          <span className="mt-[7px] flex h-[34px] items-center rounded-full border border-[#d4d4d4] bg-white px-[14px] md:h-[38px]">
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Quiz on Electricity"
              className="min-w-0 flex-1 bg-transparent text-[11px] text-[#2b2b2b] outline-none placeholder:text-[#b5b5b5] md:text-[13px]"
            />
          </span>
        </label>

        <div
          onDragOver={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setIsDragging(false);
            handleFiles(event.dataTransfer.files);
          }}
          className={`mt-[19px] flex min-h-[108px] flex-col items-center justify-center rounded-[17px] border border-dashed bg-white px-4 text-center transition md:min-h-[169px] md:rounded-[23px] ${
            isDragging ? "border-[#111111]" : "border-[#a6a6a6]"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.docx,.txt,.md,.jpg,.jpeg,.png,.webp"
            className="hidden"
            onChange={(event) => {
              if (event.target.files) {
                handleFiles(event.target.files);
              }
            }}
          />
          <UploadCloud className="h-[22px] w-[22px] text-[#111111] md:h-[26px] md:w-[26px]" strokeWidth={2.2} />
          <p className="mt-[12px] text-[11px] font-medium text-[#181818] md:mt-[18px] md:text-[13px]">
            {selectedFiles.length > 0
              ? `${selectedFiles.length} file${selectedFiles.length === 1 ? "" : "s"} selected`
              : "Choose files or drag & drop them here"}
          </p>
          <p className="mt-[7px] text-[9px] text-[#a3a3a3] md:text-[11px]">
            PDF, DOCX, TXT, MD, JPG, PNG, WEBP up to 10MB each
          </p>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="mt-[11px] h-[31px] rounded-full bg-[#f3f3f3] px-[22px] text-[10px] font-medium text-[#242424] md:h-[38px] md:px-[29px] md:text-[12px]"
          >
            Browse Files
          </button>
        </div>

        <p className="mx-auto mt-[11px] max-w-[240px] text-center text-[11px] leading-[1.2] text-[#8d8d8d] md:max-w-none md:text-[13px]">
          Upload images of your preferred document/image
        </p>
        {selectedFiles.length > 0 ? (
          <div className="mx-auto mt-[10px] flex max-w-[620px] flex-wrap justify-center gap-2">
            {selectedFiles.map((file) => (
              <button
                key={`${file.name}-${file.lastModified}`}
                type="button"
                onClick={() =>
                  setSelectedFiles((current) =>
                    current.filter((item) => item !== file),
                  )
                }
                className="inline-flex max-w-[220px] items-center gap-1 rounded-full bg-white px-3 py-1 text-[10px] text-[#333333]"
              >
                <span className="truncate">{file.name}</span>
                <X className="h-3 w-3 shrink-0" />
              </button>
            ))}
          </div>
        ) : null}

        <label className="mt-[14px] block md:mt-[23px]">
          <span className="text-[11px] font-bold text-[#202020] md:text-[13px]">
            Due Date
          </span>
          <span className="mt-[7px] flex h-[34px] items-center rounded-full border border-[#d4d4d4] bg-white px-[14px] md:h-[38px]">
            <input
              type="date"
              value={dueDate}
              onChange={(event) => setDueDate(event.target.value)}
              className="min-w-0 flex-1 bg-transparent text-[11px] text-[#2b2b2b] outline-none placeholder:text-[#b5b5b5] md:text-[13px]"
            />
            <CalendarPlus className="h-[17px] w-[17px] text-[#171717]" strokeWidth={1.9} />
          </span>
        </label>

        <div className="mt-[13px]">
          <div className="hidden grid-cols-[1fr_92px_92px] gap-[24px] px-[1px] md:grid">
            <span className="text-[12px] font-bold text-[#202020]">
              Question Type
            </span>
            <span className="text-center text-[12px] font-bold text-[#202020]">
              No. of Questions
            </span>
            <span className="text-center text-[12px] font-bold text-[#202020]">
              Marks
            </span>
          </div>
          <p className="mb-[7px] text-[11px] font-bold text-[#202020] md:hidden">
            Question Type
          </p>

          <div className="space-y-[10px] md:mt-[11px] md:space-y-[12px]">
            {rows.map((row) => (
              <QuestionTypeRow
                key={row.id}
                row={row}
                onTypeChange={(type) => updateRow(row.id, { type })}
                onAdjust={(key, delta) => adjustNumber(row.id, key, delta)}
                onRemove={() => removeQuestionType(row.id)}
              />
            ))}
          </div>
        </div>

        <div className="mt-[11px] flex items-start justify-between gap-4 md:mt-[14px]">
          <button
            type="button"
            onClick={addQuestionType}
            className="inline-flex items-center gap-[8px] text-[11px] font-bold text-[#222222] md:text-[12px]"
          >
            <span className="grid h-[25px] w-[25px] place-items-center rounded-full bg-[#242424] text-white md:h-[31px] md:w-[31px]">
              <Plus className="h-[16px] w-[16px]" strokeWidth={2} />
            </span>
            Add Question Type
          </button>

          <div className="mt-[3px] text-right text-[11px] leading-[1.65] text-[#111111] md:mt-[20px] md:text-[13px]">
            <p>Total Questions : {totals.questions}</p>
            <p>Total Marks : {totals.marks}</p>
          </div>
        </div>

        <label className="mt-[18px] block md:mt-[14px]">
          <span className="text-[11px] font-bold text-[#202020] md:text-[13px]">
            Additional Information (For better output)
          </span>
          <span className="mt-[8px] flex min-h-[84px] rounded-[16px] bg-white px-[14px] py-[12px] md:min-h-[96px] md:rounded-[22px] md:px-[18px]">
            <textarea
              value={additionalInfo}
              onChange={(event) => setAdditionalInfo(event.target.value)}
              placeholder="e.g Generate a question paper for 3 hour exam duration..."
              className="min-h-[58px] flex-1 resize-none bg-transparent text-[11px] text-[#292929] outline-none placeholder:text-[#9f9f9f] md:text-[12px]"
            />
            <button
              type="button"
              aria-label="Voice input"
              className="mt-auto grid h-[24px] w-[24px] place-items-center rounded-full bg-[#f6f6f6] text-[#111111]"
            >
              <Mic className="h-[13px] w-[13px]" strokeWidth={2} />
            </button>
          </span>
        </label>
        {localError || error ? (
          <p className="mt-[12px] rounded-[13px] bg-white px-4 py-3 text-[11px] font-medium text-[#d91f11]">
            {localError || error}
          </p>
        ) : null}
      </form>

      <div className="mx-auto mt-[21px] flex w-full max-w-[905px] items-center justify-between px-[30px] md:px-0">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex h-[38px] items-center gap-2 rounded-full bg-white px-[24px] text-[12px] font-medium text-[#171717] md:h-[43px] md:px-[27px] md:text-[14px]"
        >
          <ChevronLeft className="h-[17px] w-[17px]" strokeWidth={1.8} />
          Previous
        </button>
        <button
          type="submit"
          form="create-assignment-form"
          disabled={isCreating}
          className="inline-flex h-[38px] items-center gap-2 rounded-full bg-[#111111] px-[24px] text-[12px] font-medium text-white shadow-[0_8px_22px_rgba(0,0,0,0.18)] disabled:cursor-not-allowed disabled:opacity-60 md:h-[43px] md:px-[27px] md:text-[14px]"
        >
          {isCreating ? "Creating..." : "Next"}
          <span aria-hidden="true">-&gt;</span>
        </button>
      </div>
    </section>
  );
}

function DesktopCreateHeader() {
  return (
    <div className="hidden items-start gap-[10px] md:flex">
      <span className="mt-[7px] grid h-[18px] w-[18px] place-items-center rounded-full bg-[#95e7ac]">
        <span className="h-[9px] w-[9px] rounded-full bg-[#31c45a]" />
      </span>
      <div>
        <h1 className="text-[21px] font-bold leading-tight text-[#242424]">
          Create Assignment
        </h1>
        <p className="mt-[4px] text-[11px] leading-none text-[#9b9b9b]">
          Set up a new assignment for your students
        </p>
      </div>
    </div>
  );
}

function MobileCreateTitle({ onBack }: { onBack: () => void }) {
  return (
    <div className="relative mb-[18px] flex h-[35px] w-full items-center justify-center md:hidden">
      <button
        type="button"
        onClick={onBack}
        aria-label="Back"
        className="absolute left-0 top-1/2 grid h-[31px] w-[31px] -translate-y-1/2 place-items-center rounded-full bg-[#eeeeee] text-[#222222]"
      >
        <ChevronLeft className="h-[18px] w-[18px]" strokeWidth={2.2} />
      </button>
      <h1 className="text-center text-[12px] font-bold leading-none text-[#1f1f1f]">
        Create Assignment
      </h1>
    </div>
  );
}

function ProgressSteps() {
  return (
    <div className="mx-auto mt-[10px] grid w-full max-w-[215px] grid-cols-2 gap-[5px] md:mt-[59px] md:max-w-[800px] md:gap-[8px]">
      <span className="h-[3px] rounded-full bg-[#5c5c5c] md:h-[5px]" />
      <span className="h-[3px] rounded-full bg-[#d8d8d8] md:h-[5px]" />
    </div>
  );
}

function QuestionTypeRow({
  row,
  onTypeChange,
  onAdjust,
  onRemove,
}: {
  row: QuestionRow;
  onTypeChange: (type: string) => void;
  onAdjust: (key: "questions" | "marks", delta: number) => void;
  onRemove: () => void;
}) {
  return (
    <div className="rounded-[16px] bg-white p-[8px] md:grid md:grid-cols-[1fr_24px_92px_92px] md:items-center md:gap-[16px] md:rounded-none md:bg-transparent md:p-0">
      <label className="relative block">
        <select
          value={row.type}
          onChange={(event) => onTypeChange(event.target.value)}
          className="h-[32px] w-full appearance-none rounded-full bg-white px-[16px] pr-[36px] text-[10px] text-[#1f1f1f] outline-none md:h-[39px] md:text-[12px]"
        >
          {questionTypeOptions.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-[14px] top-1/2 h-[13px] w-[13px] -translate-y-1/2 text-[#111111]" strokeWidth={1.8} />
      </label>

      <button
        type="button"
        onClick={onRemove}
        aria-label="Remove question type"
        className="absolute right-[19px] mt-[-27px] grid h-[20px] w-[20px] place-items-center rounded-full text-[#111111] md:static md:mt-0"
      >
        <X className="h-[14px] w-[14px]" strokeWidth={1.8} />
      </button>

      <div className="mt-[8px] grid grid-cols-2 gap-[8px] rounded-[14px] bg-[#eeeeee] p-[7px] md:contents">
        <Stepper
          label="No. of Questions"
          value={row.questions}
          onMinus={() => onAdjust("questions", -1)}
          onPlus={() => onAdjust("questions", 1)}
        />
        <Stepper
          label="Marks"
          value={row.marks}
          onMinus={() => onAdjust("marks", -1)}
          onPlus={() => onAdjust("marks", 1)}
        />
      </div>
    </div>
  );
}

function Stepper({
  label,
  value,
  onMinus,
  onPlus,
}: {
  label: string;
  value: number;
  onMinus: () => void;
  onPlus: () => void;
}) {
  return (
    <div>
      <p className="mb-[6px] text-center text-[9px] text-[#252525] md:hidden">
        {label}
      </p>
      <div className="grid h-[32px] grid-cols-[24px_1fr_24px] items-center rounded-full bg-white px-[4px] md:h-[39px]">
        <button
          type="button"
          onClick={onMinus}
          aria-label={`Decrease ${label}`}
          className="grid h-[24px] w-[24px] place-items-center rounded-full text-[#c9c9c9] hover:bg-[#f5f5f5]"
        >
          <Minus className="h-[13px] w-[13px]" strokeWidth={2} />
        </button>
        <span className="text-center text-[11px] font-bold text-[#111111] md:text-[12px]">
          {value}
        </span>
        <button
          type="button"
          onClick={onPlus}
          aria-label={`Increase ${label}`}
          className="grid h-[24px] w-[24px] place-items-center rounded-full text-[#c9c9c9] hover:bg-[#f5f5f5]"
        >
          <Plus className="h-[13px] w-[13px]" strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}
