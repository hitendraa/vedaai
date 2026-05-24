"use client";

import { useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  Filter,
  LoaderCircle,
  MoreVertical,
  Plus,
  Search,
} from "lucide-react";
import { EmptyAssignments } from "./empty-assignments";
import { type Assignment, useAssignmentStore } from "./assignment-store";

type AssignmentListProps = {
  onBack: () => void;
  onCreateAssignment: () => void;
  onViewAssignment: (assignmentId: string) => void;
};

export function AssignmentList({
  onBack,
  onCreateAssignment,
  onViewAssignment,
}: AssignmentListProps) {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const { assignments, deleteAssignment, isLoading, error } =
    useAssignmentStore();

  const filteredAssignments = assignments.filter((assignment) =>
    assignment.title.toLowerCase().includes(search.trim().toLowerCase()),
  );

  return (
    <section className="mx-auto w-full max-w-[1390px]">
      <MobileAssignmentTitle onBack={onBack} />
      <DesktopAssignmentHeader />
      <AssignmentToolbar search={search} onSearchChange={setSearch} />

      {error ? (
        <p className="mt-3 rounded-[14px] bg-white px-4 py-3 text-[12px] text-[#d91f11]">
          {error}
        </p>
      ) : null}

      {isLoading ? (
        <p className="mt-8 text-center text-[12px] font-medium text-[#777777]">
          Loading assignments...
        </p>
      ) : filteredAssignments.length === 0 ? (
        <div className="grid min-h-[calc(100svh-180px)] place-items-center">
          <EmptyAssignments onCreateAssignment={onCreateAssignment} />
        </div>
      ) : (
        <div className="mt-[12px] grid gap-[12px] pb-28 md:grid-cols-2 md:gap-x-[12px] md:gap-y-[10px] md:pb-24">
          {filteredAssignments.map((assignment) => (
            <AssignmentCard
              assignment={assignment}
              key={assignment.id}
              isMenuOpen={openMenuId === assignment.id}
              onToggleMenu={() => {
                setOpenMenuId((current) =>
                  current === assignment.id ? null : assignment.id,
                );
              }}
              onView={() => {
                setOpenMenuId(null);
                onViewAssignment(assignment.id);
              }}
              onDelete={() => {
                setOpenMenuId(null);
                void deleteAssignment(assignment.id);
              }}
            />
          ))}
        </div>
      )}

      <DesktopCreateDock onCreateAssignment={onCreateAssignment} />
    </section>
  );
}

function DesktopAssignmentHeader() {
  return (
    <div className="mb-[14px] hidden items-start gap-[10px] md:flex">
      <span className="mt-[8px] grid h-[18px] w-[18px] place-items-center rounded-full bg-[#95e7ac]">
        <span className="h-[9px] w-[9px] rounded-full bg-[#31c45a]" />
      </span>
      <div>
        <h1 className="text-[21px] font-bold leading-tight text-[#242424]">
          Assignments
        </h1>
        <p className="mt-[4px] text-[11px] leading-none text-[#9b9b9b]">
          Manage and create assignments for your classes.
        </p>
      </div>
    </div>
  );
}

function MobileAssignmentTitle({ onBack }: { onBack: () => void }) {
  return (
    <div className="relative mb-[12px] flex h-[34px] w-full items-center justify-center md:hidden">
      <button
        type="button"
        onClick={onBack}
        aria-label="Back"
        className="absolute left-0 top-1/2 grid h-[31px] w-[31px] -translate-y-1/2 place-items-center rounded-full bg-[#eeeeee] text-[#222222] shadow-[inset_0_1px_0_rgba(255,255,255,0.5)]"
      >
        <ChevronLeft className="h-[18px] w-[18px]" strokeWidth={2.2} />
      </button>
      <h1 className="text-center text-[12px] font-bold leading-none text-[#1f1f1f]">
        Assignments
      </h1>
    </div>
  );
}

function AssignmentToolbar({
  search,
  onSearchChange,
}: {
  search: string;
  onSearchChange: (value: string) => void;
}) {
  return (
    <div className="grid h-[40px] grid-cols-[75px_1fr] items-center gap-[12px] rounded-[14px] bg-white px-[10px] shadow-[0_1px_0_rgba(255,255,255,0.68)] md:h-[62px] md:grid-cols-[1fr_460px] md:gap-5 md:rounded-[22px] md:px-[18px]">
      <button
        type="button"
        className="flex h-[28px] items-center gap-[5px] rounded-full text-[9px] text-[#b4b4b4] md:h-[34px] md:text-[12px]"
      >
        <Filter className="h-[13px] w-[13px] md:h-[16px] md:w-[16px]" strokeWidth={1.7} />
        <span className="hidden md:inline">Filter By</span>
        <span className="md:hidden">Filter</span>
      </button>

      <label className="flex h-[32px] min-w-0 items-center gap-[8px] rounded-full border border-[#d5d5d5] bg-white px-[12px] md:h-[40px] md:px-[18px]">
        <Search className="h-[13px] w-[13px] shrink-0 text-[#a4a4a4] md:h-[16px] md:w-[16px]" strokeWidth={1.8} />
        <input
          aria-label="Search assignment"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          className="min-w-0 flex-1 bg-transparent text-[9px] text-[#292929] outline-none placeholder:text-[#b4b4b4] md:text-[12px]"
          placeholder="Search Assignment"
        />
      </label>
    </div>
  );
}

function AssignmentCard({
  assignment,
  isMenuOpen,
  onToggleMenu,
  onView,
  onDelete,
}: {
  assignment: Assignment;
  isMenuOpen: boolean;
  onToggleMenu: () => void;
  onView: () => void;
  onDelete: () => void;
}) {
  return (
    <article className="relative min-h-[83px] rounded-[16px] bg-[#fbfbfb] px-[16px] py-[16px] shadow-[0_1px_0_rgba(255,255,255,0.6)] md:min-h-[100px] md:rounded-[18px] md:px-[30px] md:py-[24px]">
      <div className="flex items-start justify-between gap-4">
        <h2 className="max-w-[230px] text-[12px] font-bold leading-tight text-[#242424] underline decoration-[#242424]/55 underline-offset-[2px] md:max-w-none md:text-[21px]">
          {assignment.title}
        </h2>
        <StatusBadge status={assignment.status} />
        <button
          type="button"
          aria-label="Assignment actions"
          onClick={onToggleMenu}
          aria-expanded={isMenuOpen}
          className="absolute right-[15px] top-[14px] grid h-[24px] w-[22px] place-items-center text-[#111111] md:right-[32px] md:top-[25px] md:text-[#9f9f9f]"
        >
          <MoreVertical className="h-[19px] w-[19px]" strokeWidth={2.3} />
        </button>
      </div>

      {isMenuOpen ? (
        <AssignmentActionMenu onView={onView} onDelete={onDelete} />
      ) : null}

      <div className="mt-[27px] flex items-center gap-[5px] whitespace-nowrap text-[10px] leading-none text-[#777777] md:absolute md:bottom-[27px] md:left-[30px] md:right-[30px] md:mt-0 md:justify-between md:text-[12px]">
        <p>
          <span className="font-bold text-[#111111]">Assigned on :</span>{" "}
          {formatDate(assignment.createdAt)}
        </p>
        <p>
          <span className="font-bold text-[#111111]">Due :</span>{" "}
          {formatDate(assignment.dueDate)}
        </p>
      </div>
    </article>
  );
}

function AssignmentActionMenu({
  onView,
  onDelete,
}: {
  onView: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="absolute right-[34px] top-[40px] z-10 w-[142px] overflow-hidden rounded-[11px] bg-white py-[9px] text-[10px] shadow-[0_10px_35px_rgba(0,0,0,0.16)] md:right-[70px] md:top-[58px] md:w-[171px] md:py-[11px] md:text-[11px]">
      <button
        type="button"
        onClick={onView}
        className="block w-full px-[18px] py-[7px] text-left text-[#111111] hover:bg-[#f7f7f7] md:px-[22px]"
      >
        View Assignment
      </button>
      <button
        type="button"
        onClick={onDelete}
        className="block w-full px-[18px] py-[7px] text-left text-[#e51c1c] hover:bg-[#fff5f5] md:px-[22px]"
      >
        Delete
      </button>
    </div>
  );
}

function StatusBadge({ status }: { status: Assignment["status"] }) {
  const label = {
    completed: "Ready",
    draft: "Draft",
    failed: "Failed",
    generating: "Generating",
    queued: "Queued",
  }[status];

  const Icon = {
    completed: CheckCircle2,
    draft: null,
    failed: AlertCircle,
    generating: LoaderCircle,
    queued: LoaderCircle,
  }[status];

  const className = {
    completed: "bg-[#e9f8ef] text-[#16833a]",
    draft: "bg-[#eeeeee] text-[#595959]",
    failed: "bg-[#fff1ef] text-[#d91f11]",
    generating: "bg-[#fff5db] text-[#8a5f00]",
    queued: "bg-[#edf1ff] text-[#3152b8]",
  }[status];

  return (
    <span
      className={`absolute bottom-[14px] right-[16px] inline-flex items-center gap-1 rounded-full px-2 py-1 text-[9px] font-bold md:bottom-auto md:right-[62px] md:top-[25px] md:text-[10px] ${className}`}
    >
      {Icon ? (
        <Icon
          className={`h-[10px] w-[10px] ${
            status === "generating" || status === "queued" ? "animate-spin" : ""
          }`}
          strokeWidth={2.1}
        />
      ) : null}
      {label}
    </span>
  );
}

function formatDate(value?: string) {
  if (!value) {
    return "--";
  }

  return new Intl.DateTimeFormat("en-GB").format(new Date(value));
}

function DesktopCreateDock({
  onCreateAssignment,
}: {
  onCreateAssignment: () => void;
}) {
  return (
    <>
      <div className="pointer-events-none fixed bottom-0 left-[244px] right-0 z-20 hidden h-[76px] bg-[linear-gradient(180deg,rgba(207,207,207,0)_0%,rgba(207,207,207,0.72)_42%,rgba(207,207,207,0.96)_100%)] backdrop-blur-[3px] md:block" />
      <button
        type="button"
        onClick={onCreateAssignment}
        className="fixed bottom-[17px] left-[calc(50%+122px)] z-30 hidden h-[37px] -translate-x-1/2 items-center gap-2 rounded-full bg-[#111111] px-[26px] text-[13px] font-medium text-white shadow-[0_8px_22px_rgba(0,0,0,0.2)] transition hover:bg-[#1d1d1d] md:inline-flex"
      >
        <Plus className="h-[17px] w-[17px]" strokeWidth={1.8} />
        Create Assignment
      </button>
    </>
  );
}
