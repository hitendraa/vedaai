"use client";

import { io, type Socket } from "socket.io-client";
import { create } from "zustand";

export const serverUrl =
  process.env.NEXT_PUBLIC_SERVER_URL?.replace(/\/$/, "") ||
  "http://localhost:3000";

export type AssignmentStatus =
  | "draft"
  | "queued"
  | "generating"
  | "completed"
  | "failed";

export type Assignment = {
  id: string;
  title: string;
  dueDate: string;
  questionTypes: Array<{
    type: string;
    numberOfQuestions: number;
    marks: number;
  }>;
  additionalInstructions: string;
  status: AssignmentStatus;
  errorMessage?: string;
  attachments: Array<{
    originalName: string;
    fileName: string;
    mimeType: string;
    size: number;
  }>;
  createdAt?: string;
  updatedAt?: string;
};

export type AssessmentResult = {
  id: string;
  assignmentId: string;
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
  createdAt?: string;
};

export type CreateAssignmentPayload = {
  title: string;
  dueDate: string;
  questionTypes: Assignment["questionTypes"];
  additionalInstructions: string;
  files: File[];
};

type AssignmentStore = {
  assignments: Assignment[];
  results: Record<string, AssessmentResult | null>;
  isLoading: boolean;
  isCreating: boolean;
  error: string | null;
  fetchAssignments: () => Promise<void>;
  createAssignment: (payload: CreateAssignmentPayload) => Promise<Assignment>;
  deleteAssignment: (assignmentId: string) => Promise<void>;
  fetchResult: (assignmentId: string) => Promise<void>;
  downloadAssignmentPdf: (assignmentId: string) => Promise<Blob>;
  regenerateAssignment: (assignmentId: string) => Promise<void>;
  connectSocket: () => void;
};

let socket: Socket | null = null;

async function parseResponse<T>(response: Response): Promise<T> {
  if (response.ok) {
    return response.json() as Promise<T>;
  }

  const body = (await response.json().catch(() => null)) as {
    error?: string;
  } | null;

  throw new Error(body?.error || "Request failed.");
}

function upsertAssignment(assignments: Assignment[], next: Assignment) {
  const index = assignments.findIndex((assignment) => assignment.id === next.id);

  if (index === -1) {
    return [next, ...assignments];
  }

  return assignments.map((assignment) =>
    assignment.id === next.id ? next : assignment,
  );
}

export const useAssignmentStore = create<AssignmentStore>((set, get) => ({
  assignments: [],
  results: {},
  isLoading: false,
  isCreating: false,
  error: null,

  async fetchAssignments() {
    set({ isLoading: true, error: null });

    try {
      const data = await parseResponse<{ assignments: Assignment[] }>(
        await fetch(`${serverUrl}/api/assignments`, {
          cache: "no-store",
        }),
      );

      set({ assignments: data.assignments, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Failed to load.",
        isLoading: false,
      });
    }
  },

  async createAssignment(payload) {
    set({ isCreating: true, error: null });

    try {
      const formData = new FormData();
      formData.append("title", payload.title);
      formData.append("dueDate", payload.dueDate);
      formData.append("questionTypes", JSON.stringify(payload.questionTypes));
      formData.append("additionalInstructions", payload.additionalInstructions);
      payload.files.forEach((file) => formData.append("files", file));

      const data = await parseResponse<{ assignment: Assignment }>(
        await fetch(`${serverUrl}/api/assignments`, {
          method: "POST",
          body: formData,
        }),
      );

      set((state) => ({
        assignments: upsertAssignment(state.assignments, data.assignment),
        isCreating: false,
      }));

      get().connectSocket();
      socket?.emit("assignment:join", data.assignment.id);

      return data.assignment;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Failed to create.",
        isCreating: false,
      });
      throw error;
    }
  },

  async deleteAssignment(assignmentId) {
    await fetch(`${serverUrl}/api/assignments/${assignmentId}`, {
      method: "DELETE",
    }).then((response) => {
      if (!response.ok) {
        throw new Error("Failed to delete assignment.");
      }
    });

    set((state) => ({
      assignments: state.assignments.filter(
        (assignment) => assignment.id !== assignmentId,
      ),
      results: Object.fromEntries(
        Object.entries(state.results).filter(([id]) => id !== assignmentId),
      ),
    }));
  },

  async fetchResult(assignmentId) {
    try {
      const data = await parseResponse<{ result: AssessmentResult }>(
        await fetch(`${serverUrl}/api/assignments/${assignmentId}/result`, {
          cache: "no-store",
        }),
      );

      set((state) => ({
        results: {
          ...state.results,
          [assignmentId]: data.result,
        },
      }));
    } catch {
      set((state) => ({
        results: {
          ...state.results,
          [assignmentId]: null,
        },
      }));
    }
  },

  async downloadAssignmentPdf(assignmentId) {
    const response = await fetch(`${serverUrl}/api/assignments/${assignmentId}/pdf`, {
      cache: "no-store",
    });

    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;

      throw new Error(body?.error || "Failed to download PDF.");
    }

    return response.blob();
  },

  async regenerateAssignment(assignmentId) {
    const data = await parseResponse<{ assignment: Assignment }>(
      await fetch(`${serverUrl}/api/assignments/${assignmentId}/generate`, {
        method: "POST",
      }),
    );

    set((state) => ({
      assignments: upsertAssignment(state.assignments, data.assignment),
    }));
  },

  connectSocket() {
    if (socket) {
      return;
    }

    socket = io(serverUrl);
    socket.on(
      "assignment:status",
      (payload: {
        assignmentId: string;
        status: AssignmentStatus;
        errorMessage?: string;
      }) => {
        set((state) => ({
          assignments: state.assignments.map((assignment) =>
            assignment.id === payload.assignmentId
              ? {
                  ...assignment,
                  status: payload.status,
                  errorMessage: payload.errorMessage,
                }
              : assignment,
          ),
        }));

        if (payload.status === "completed") {
          void get().fetchResult(payload.assignmentId);
        }
      },
    );

    socket.on("assignments:changed", () => {
      void get().fetchAssignments();
    });
  },
}));
