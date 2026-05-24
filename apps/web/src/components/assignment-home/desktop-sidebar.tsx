import {
  BookOpen,
  CheckCircle2,
  ClipboardList,
  FolderOpen,
  Grid2X2,
  Settings,
  Sparkles,
  UsersRound,
} from "lucide-react";

import { BrandMark } from "./brand-mark";

const navItems = [
  { id: "home", label: "Home", icon: Grid2X2, action: "list" },
  { id: "groups", label: "My Groups", icon: UsersRound },
  { id: "assignments", label: "Assignments", icon: ClipboardList, action: "list" },
  { id: "toolkit", label: "AI Teacher's Toolkit", icon: BookOpen, action: "create" },
  { id: "library", label: "My Library", icon: FolderOpen },
];

type DesktopSidebarProps = {
  activeView: "list" | "create" | "output";
  assignmentCount: number;
  onCreateAssignment: () => void;
  onShowAssignments: () => void;
};

export function DesktopSidebar({
  activeView,
  assignmentCount,
  onCreateAssignment,
  onShowAssignments,
}: DesktopSidebarProps) {
  const isCreateActive = activeView === "create";

  return (
    <aside className="fixed bottom-2 left-2 top-2 z-20 hidden w-[228px] flex-col rounded-[12px] bg-[#fbfbfb] px-5 py-[24px] shadow-[8px_0_34px_rgba(0,0,0,0.14)] md:flex">
      <BrandMark />

      <button
        type="button"
        onClick={onCreateAssignment}
        aria-current={isCreateActive ? "page" : undefined}
        className={`mt-[38px] inline-flex h-[37px] w-full items-center justify-center gap-2 rounded-full border-[3px] bg-[linear-gradient(180deg,#404040_0%,#222_100%)] text-[12px] font-medium text-white shadow-[0_2px_5px_rgba(0,0,0,0.15)] transition hover:brightness-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff7356] ${
          isCreateActive ? "border-[#111111] ring-2 ring-[#ff7356]" : "border-[#ff7356]"
        }`}
      >
        <Sparkles className="h-4 w-4 fill-white" strokeWidth={1.8} />
        Create Assignment
      </button>

      <nav className="mt-[43px] space-y-[7px]">
        {navItems.map(({ id, label, icon: Icon, action }) => {
          const active =
            (id === "assignments" && activeView !== "create") ||
            (id === "toolkit" && activeView === "create");
          const disabled = !action;
          const onClick =
            action === "create" ? onCreateAssignment : onShowAssignments;

          return (
            <button
              key={id}
              type="button"
              onClick={disabled ? undefined : onClick}
              disabled={disabled}
              aria-current={active ? "page" : undefined}
              className={`group flex h-[29px] w-full items-center gap-2 rounded-[5px] px-[10px] text-left text-[12px] transition ${
                active
                  ? "bg-[#ebebeb] font-medium text-[#242424]"
                  : disabled
                    ? "cursor-default text-[#a1a1a1]"
                    : "text-[#858585] hover:bg-[#f0f0f0] hover:text-[#363636]"
              }`}
            >
              <Icon className="h-[15px] w-[15px] shrink-0" strokeWidth={1.8} />
              <span className="truncate">{label}</span>
              {id === "assignments" && assignmentCount > 0 ? (
                <span className="ml-auto rounded-full bg-[#ff5f3f] px-[6px] py-[1px] text-[8px] font-bold text-white">
                  {assignmentCount}
                </span>
              ) : null}
              {active && !(id === "assignments" && assignmentCount > 0) ? (
                <CheckCircle2 className="ml-auto h-[12px] w-[12px] shrink-0 text-[#31c45a]" strokeWidth={2} />
              ) : null}
            </button>
          );
        })}
      </nav>

      <div className="mt-auto">
        <button
          type="button"
          className="flex h-[29px] items-center gap-2 rounded-[5px] px-[10px] text-[12px] text-[#858585] transition hover:bg-[#f0f0f0] hover:text-[#363636]"
        >
          <Settings className="h-[15px] w-[15px]" strokeWidth={1.8} />
          Settings
        </button>

        <div className="mt-4 flex h-[58px] items-center gap-3 rounded-[10px] bg-[#eeeeee] px-[13px]">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#ffe6d6] text-[10px] font-bold text-[#222]">
            DPS
          </div>
          <div className="min-w-0">
            <p className="truncate text-[12px] font-bold text-[#222]">
              Delhi Public School
            </p>
            <p className="mt-1 truncate text-[10px] text-[#707070]">
              Bokaro Steel City
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
