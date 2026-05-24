"use client";

import { useEffect, useState } from "react";

import { AssignmentOutput } from "./assignment-output";
import { AssignmentList } from "./assignment-list";
import { CreateAssignmentForm } from "./create-assignment-form";
import { DesktopSidebar } from "./desktop-sidebar";
import {
  MobileBottomNav,
  MobileFloatingActionButton,
  MobileHeader,
} from "./mobile-chrome";
import { DesktopTopBar } from "./top-bar";
import { useAssignmentStore } from "./assignment-store";

type AssignmentView = "list" | "create" | "output";

export function AssignmentHomePage() {
  const [view, setView] = useState<AssignmentView>("list");
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string | null>(
    null,
  );
  const { assignments, connectSocket, fetchAssignments } = useAssignmentStore();
  const isCreateView = view === "create";
  const assignmentCount = assignments.length;

  function showAssignments() {
    setSelectedAssignmentId(null);
    setView("list");
  }

  function showCreateAssignment() {
    setView("create");
  }

  useEffect(() => {
    connectSocket();
    void fetchAssignments();
  }, [connectSocket, fetchAssignments]);

  return (
    <main className="min-h-svh bg-[#cfcfcf] text-[#252525]">
      <DesktopSidebar
        activeView={view}
        assignmentCount={assignmentCount}
        onCreateAssignment={showCreateAssignment}
        onShowAssignments={showAssignments}
      />
      <DesktopTopBar currentView={view} onBack={showAssignments} />
      <MobileHeader />

      <div
        className={`flex min-h-svh items-start justify-center px-1 pb-28 pt-[58px] md:ml-[244px] md:px-8 ${
          isCreateView ? "md:pb-8 md:pt-[58px]" : "md:pb-0 md:pt-[58px]"
        }`}
      >
        <div className="w-full">
          {isCreateView ? (
            <CreateAssignmentForm
              onBack={showAssignments}
              onCreated={(assignmentId) => {
                setSelectedAssignmentId(assignmentId);
                setView("output");
              }}
            />
          ) : view === "output" && selectedAssignmentId ? (
            <AssignmentOutput
              assignmentId={selectedAssignmentId}
              onBack={showAssignments}
            />
          ) : (
            <AssignmentList
              onBack={showAssignments}
              onCreateAssignment={showCreateAssignment}
              onViewAssignment={(assignmentId) => {
                setSelectedAssignmentId(assignmentId);
                setView("output");
              }}
            />
          )}
        </div>
      </div>

      {view !== "list" ? null : (
        <>
          <MobileFloatingActionButton onCreateAssignment={showCreateAssignment} />
          <MobileBottomNav
            activeView={view}
            assignmentCount={assignmentCount}
            onCreateAssignment={showCreateAssignment}
            onShowAssignments={showAssignments}
          />
        </>
      )}
    </main>
  );
}
