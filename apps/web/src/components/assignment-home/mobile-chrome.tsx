import {
  Bell,
  BookOpen,
  ClipboardList,
  Grid2X2,
  Menu,
  Plus,
  Sparkles,
} from "lucide-react";

import { BrandMark } from "./brand-mark";

const tabs = [
  { id: "home", label: "Home", icon: Grid2X2, action: "list" },
  { id: "assignments", label: "Assignments", icon: ClipboardList, action: "list" },
  { id: "library", label: "Library", icon: BookOpen },
  { id: "toolkit", label: "AI Toolkit", icon: Sparkles, action: "create" },
];

export function MobileHeader() {
  return (
    <header className="fixed left-1 right-1 top-[10px] z-30 flex h-[46px] items-center justify-between rounded-[10px] bg-white px-[10px] shadow-[0_1px_0_rgba(255,255,255,0.75)] md:hidden">
      <BrandMark compact />
      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label="Notifications"
          className="relative grid h-8 w-8 place-items-center rounded-full bg-[#f8f8f8] text-[#141414]"
        >
          <Bell className="h-[17px] w-[17px]" strokeWidth={1.8} />
          <span className="absolute right-[5px] top-[4px] h-[5px] w-[5px] rounded-full bg-[#ff5c3f]" />
        </button>
        <div className="grid h-[27px] w-[27px] place-items-center rounded-full bg-[#252525] text-[9px] font-bold text-white">
          JD
        </div>
        <button
          type="button"
          aria-label="Open menu"
          className="grid h-8 w-7 place-items-center text-[#141414]"
        >
          <Menu className="h-[19px] w-[19px]" strokeWidth={2.2} />
        </button>
      </div>
    </header>
  );
}

type MobileBottomNavProps = {
  activeView: "list" | "create" | "output";
  assignmentCount: number;
  onCreateAssignment: () => void;
  onShowAssignments: () => void;
};

export function MobileBottomNav({
  activeView,
  assignmentCount,
  onCreateAssignment,
  onShowAssignments,
}: MobileBottomNavProps) {
  return (
    <nav className="fixed bottom-[11px] left-1 right-1 z-30 mx-auto flex h-[52px] max-w-[278px] items-center justify-around rounded-[17px] bg-[#111111] px-4 shadow-[0_10px_28px_rgba(0,0,0,0.32)] md:hidden">
      {tabs.map(({ id, label, icon: Icon, action }) => {
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
            className={`relative flex min-w-[46px] flex-col items-center gap-[3px] text-[8px] transition ${
              active
                ? "text-white"
                : disabled
                  ? "cursor-default text-[#555555]"
                  : "text-[#666666] hover:text-[#bdbdbd]"
            }`}
          >
            {active ? (
              <span className="absolute -top-[7px] h-[3px] w-[20px] rounded-full bg-white" />
            ) : null}
            <Icon className="h-[15px] w-[15px]" strokeWidth={active ? 2.2 : 1.8} />
            <span>{label}</span>
            {id === "assignments" && assignmentCount > 0 ? (
              <span className="absolute -right-[5px] top-0 grid h-[13px] min-w-[13px] place-items-center rounded-full bg-[#ff5f3f] px-[3px] text-[7px] font-bold text-white">
                {assignmentCount}
              </span>
            ) : null}
          </button>
        );
      })}
    </nav>
  );
}

export function MobileFloatingAction() {
  return <MobileFloatingActionButton />;
}

type MobileFloatingActionButtonProps = {
  onCreateAssignment?: () => void;
};

export function MobileFloatingActionButton({
  onCreateAssignment,
}: MobileFloatingActionButtonProps) {
  return (
    <button
      type="button"
      aria-label="Create assignment"
      onClick={onCreateAssignment}
      className="fixed bottom-[97px] right-[8px] z-30 grid h-10 w-10 place-items-center rounded-full bg-white text-[#ff5f3f] shadow-[0_7px_22px_rgba(0,0,0,0.16)] md:hidden"
    >
      <Plus className="h-5 w-5" strokeWidth={1.8} />
    </button>
  );
}
