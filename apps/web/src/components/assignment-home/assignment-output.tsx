"use client";

import { useEffect, useState } from "react";
import {
  ChevronLeft,
  Download,
  LoaderCircle,
  RefreshCcw,
} from "lucide-react";
import {
  type AssessmentResult,
  type Assignment,
  useAssignmentStore,
} from "./assignment-store";

type AssignmentOutputProps = {
  assignmentId: string;
  onBack: () => void;
};

export function AssignmentOutput({
  assignmentId,
  onBack,
}: AssignmentOutputProps) {
  const {
    assignments,
    downloadAssignmentPdf,
    fetchResult,
    regenerateAssignment,
    results,
  } = useAssignmentStore();
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState("");
  const assignment = assignments.find((item) => item.id === assignmentId);
  const result = results[assignmentId];
  const canDownload = assignment?.status === "completed" && Boolean(result);

  useEffect(() => {
    void fetchResult(assignmentId);
  }, [assignmentId, fetchResult]);

  async function handleDownload() {
    if (!assignment || !canDownload) {
      return;
    }

    setIsDownloading(true);
    setDownloadError("");

    try {
      const blob = await downloadAssignmentPdf(assignment.id);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = getPdfFileName(assignment.title);
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      setDownloadError(
        error instanceof Error ? error.message : "Failed to download PDF.",
      );
    } finally {
      setIsDownloading(false);
    }
  }

  return (
    <section className="mx-auto w-full max-w-[980px] pb-8">
      <div className="sticky top-[58px] z-10 mx-auto mb-[14px] flex w-full max-w-[794px] items-center justify-between gap-2 rounded-[18px] bg-[#111111] px-3 py-3 text-white shadow-[0_16px_45px_rgba(0,0,0,0.18)] md:static md:max-w-none md:rounded-[22px] md:px-4">
        <button
          type="button"
          onClick={onBack}
          className="grid h-[34px] w-[34px] shrink-0 place-items-center rounded-full bg-white/10 text-white transition hover:bg-white/15 md:w-auto md:px-4"
          aria-label="Back"
        >
          <ChevronLeft className="h-4 w-4" strokeWidth={2} />
          <span className="sr-only md:not-sr-only md:ml-2 md:inline md:text-[12px] md:font-medium">
            Back
          </span>
        </button>

        <div className="min-w-0 flex-1 text-center md:text-left">
          <p className="truncate text-[11px] font-bold md:text-[14px]">
            {assignment?.title || "Generated Question Paper"}
          </p>
          <p className="mt-0.5 truncate text-[9px] text-white/62 md:text-[11px]">
            Delhi Public School, Sector-4, Bokaro
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {assignment ? (
            <button
              type="button"
              onClick={() => void regenerateAssignment(assignment.id)}
              className="grid h-[34px] w-[34px] place-items-center rounded-full bg-white/10 text-white transition hover:bg-white/15 md:w-auto md:px-4"
              aria-label="Regenerate"
            >
              <RefreshCcw className="h-4 w-4" strokeWidth={1.8} />
              <span className="sr-only md:not-sr-only md:ml-2 md:inline md:text-[12px] md:font-medium">
                Regenerate
              </span>
            </button>
          ) : null}

          <button
            type="button"
            onClick={() => void handleDownload()}
            disabled={!canDownload || isDownloading}
            className="inline-flex h-[34px] items-center gap-2 rounded-full bg-white px-3 text-[11px] font-bold text-[#111111] transition hover:bg-[#f1f1f1] disabled:cursor-not-allowed disabled:opacity-45 md:px-4 md:text-[12px]"
          >
            {isDownloading ? (
              <LoaderCircle className="h-4 w-4 animate-spin" strokeWidth={2} />
            ) : (
              <Download className="h-4 w-4" strokeWidth={2} />
            )}
            PDF
          </button>
        </div>
      </div>

      <OutputProgressSteps />

      {downloadError ? (
        <p className="mx-auto mb-3 mt-4 max-w-[794px] rounded-[14px] bg-white px-4 py-3 text-[11px] font-medium text-[#d91f11]">
          {downloadError}
        </p>
      ) : null}

      <div className="mx-auto mt-4 flex w-full max-w-[794px] justify-center md:mt-6">
        {!assignment ? (
          <StateMessage message="Assignment not found." />
        ) : assignment.status === "failed" ? (
          <StateMessage
            message={assignment.errorMessage || "Generation failed."}
          />
        ) : assignment.status !== "completed" ? (
          <StateMessage
            isLoading
            message={`Question paper is ${assignment.status}...`}
          />
        ) : !result ? (
          <StateMessage isLoading message="Loading generated question paper..." />
        ) : (
          <QuestionPaper assignment={assignment} result={result} />
        )}
      </div>
    </section>
  );
}

function QuestionPaper({
  assignment,
  result,
}: {
  assignment: Assignment;
  result: AssessmentResult;
}) {
  return (
    <article className="min-h-[calc(100svh-160px)] w-full overflow-hidden rounded-[18px] border border-white/65 bg-[#fffefe] px-[18px] py-[24px] text-[#151515] shadow-[0_24px_90px_rgba(0,0,0,0.22)] md:min-h-[1123px] md:rounded-[24px] md:px-[64px] md:py-[62px]">
      <header className="text-center">
        <h1 className="text-[14px] font-bold leading-tight md:text-[20px]">
          Delhi Public School, Sector-4, Bokaro
        </h1>
        <p className="mt-5 text-[11px] font-bold md:text-[13px]">
          Subject: {assignment.title}
        </p>
        <p className="mt-1 text-[10px] font-bold md:text-[12px]">Class: 5th</p>
      </header>

      <div className="mt-7 grid gap-2 text-[9px] leading-[1.5] md:grid-cols-2 md:text-[11px]">
        <p>
          <span className="font-bold">Time Allowed:</span> 45 minutes
        </p>
        <p className="md:text-right">
          <span className="font-bold">Maximum Marks:</span> {result.totalMarks}
        </p>
      </div>

      <p className="mt-6 text-[9px] leading-[1.6] md:text-[11px]">
        All questions are compulsory unless stated otherwise.
      </p>

      <StudentInfoSection />

      <div className="mt-8 space-y-8 md:mt-10 md:space-y-10">
        {result.sections.map((section) => (
          <section key={section.title}>
            <div className="text-center">
              <h2 className="text-[11px] font-bold md:text-[13px]">
                {section.title}
              </h2>
              <p className="mt-1 text-[9px] font-medium italic text-[#3d3d3d] md:text-[10px]">
                {section.instruction}
              </p>
            </div>

            <ol className="mt-5 space-y-4 md:mt-6 md:space-y-5">
              {section.questions.map((question, index) => (
                <li
                  key={`${section.title}-${index}`}
                  className="grid grid-cols-[18px_1fr] gap-1 text-[9px] leading-[1.55] md:grid-cols-[25px_1fr] md:gap-2 md:text-[11px]"
                >
                  <span>{index + 1}.</span>
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <p className="min-w-0 flex-1">{question.text}</p>
                      <span className="shrink-0 whitespace-nowrap font-medium">
                        [{question.marks} Mark
                        {question.marks === 1 ? "" : "s"}]
                      </span>
                    </div>
                    <DifficultyBadge difficulty={question.difficulty} />
                  </div>
                </li>
              ))}
            </ol>
          </section>
        ))}
      </div>
    </article>
  );
}

function OutputProgressSteps() {
  return (
    <div className="mx-auto grid w-full max-w-[215px] grid-cols-2 gap-[5px] md:max-w-[800px] md:gap-[8px]">
      <span className="h-[3px] rounded-full bg-[#d8d8d8] md:h-[5px]" />
      <span className="h-[3px] rounded-full bg-[#5c5c5c] md:h-[5px]" />
    </div>
  );
}

function StudentInfoSection() {
  return (
    <div className="mt-6 grid gap-2 border-b border-t border-[#dedede] py-4 text-[9px] md:grid-cols-3 md:gap-6 md:text-[11px]">
      {["Name", "Roll Number", "Section"].map((label) => (
        <label key={label} className="flex items-end gap-2">
          <span className="font-bold">{label}:</span>
          <span className="mb-[3px] block h-[1px] min-w-0 flex-1 bg-[#111111]" />
        </label>
      ))}
    </div>
  );
}

function StateMessage({
  isLoading = false,
  message,
}: {
  isLoading?: boolean;
  message: string;
}) {
  return (
    <div className="flex min-h-[420px] w-full flex-col items-center justify-center rounded-[22px] border border-white/70 bg-white px-6 text-center text-[13px] font-medium text-[#6d6d6d] shadow-[0_24px_80px_rgba(0,0,0,0.12)] md:min-h-[560px] md:rounded-[28px]">
      {isLoading ? (
        <>
          <span className="mb-5 grid h-[58px] w-[58px] place-items-center rounded-full bg-[#f1f1f1]">
            <LoaderCircle
              className="h-7 w-7 animate-spin text-[#111111]"
              strokeWidth={2}
            />
          </span>
          <p className="mb-1 text-[14px] font-bold text-[#222222]">
            Generating question paper
          </p>
        </>
      ) : null}
      {message}
    </div>
  );
}

function DifficultyBadge({
  difficulty,
}: {
  difficulty: "easy" | "medium" | "hard";
}) {
  const label = {
    easy: "Easy",
    medium: "Moderate",
    hard: "Hard",
  }[difficulty];

  const className = {
    easy: "text-[#16833a]",
    medium: "text-[#8a5f00]",
    hard: "text-[#d91f11]",
  }[difficulty];

  return (
    <span className={`mt-1 inline-flex text-[8px] font-bold md:text-[9px] ${className}`}>
      {label}
    </span>
  );
}

function getPdfFileName(title: string) {
  const safeTitle =
    title
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || "assignment";

  return `${safeTitle}-question-paper.pdf`;
}
