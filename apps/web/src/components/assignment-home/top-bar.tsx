import { Bell, ChevronDown, Grid2X2, MoveLeft } from "lucide-react";

type DesktopTopBarProps = {
  currentView: "list" | "create" | "output";
  onBack: () => void;
};

const viewLabels = {
  create: "Create New",
  list: "Assignment",
  output: "Generated Paper",
};

export function DesktopTopBar({ currentView, onBack }: DesktopTopBarProps) {
  const canGoBack = currentView !== "list";

  return (
    <header className="fixed left-[244px] right-[10px] top-2 z-20 hidden h-[42px] items-center justify-between rounded-[12px] bg-white px-[16px] shadow-[0_1px_0_rgba(255,255,255,0.75)] md:flex">
      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label="Back"
          onClick={onBack}
          disabled={!canGoBack}
          className={`grid h-[31px] w-[31px] place-items-center rounded-[8px] bg-white text-[#151515] transition ${
            canGoBack
              ? "hover:bg-[#f5f5f5]"
              : "cursor-default opacity-35"
          }`}
        >
          <MoveLeft className="h-[19px] w-[19px]" strokeWidth={1.8} />
        </button>
        <div className="flex items-center gap-2 text-[12px] font-medium text-[#a0a0a0]">
          <Grid2X2 className="h-[14px] w-[14px]" strokeWidth={1.8} />
          {viewLabels[currentView]}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label="Notifications"
          className="relative grid h-[30px] w-[30px] place-items-center rounded-full bg-[#fafafa] text-[#141414]"
        >
          <Bell className="h-[17px] w-[17px]" strokeWidth={1.8} />
          <span className="absolute right-[5px] top-[5px] h-[5px] w-[5px] rounded-full bg-[#ff5c3f]" />
        </button>
        <button
          type="button"
          className="flex h-[34px] items-center gap-2 rounded-full bg-white pl-1 pr-2 shadow-[0_2px_10px_rgba(0,0,0,0.04)]"
        >
          <span className="grid h-[28px] w-[28px] place-items-center rounded-full bg-[#252525] text-[9px] font-bold text-white">
            JD
          </span>
          <span className="text-[12px] font-semibold text-[#333333]">John Doe</span>
          <ChevronDown className="h-[14px] w-[14px] text-[#333333]" strokeWidth={1.8} />
        </button>
      </div>
    </header>
  );
}
