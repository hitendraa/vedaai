import Image from "next/image";
import { Plus } from "lucide-react";

export function EmptyAssignments({
  onCreateAssignment,
}: {
  onCreateAssignment: () => void;
}) {
  return (
    <section className="mx-auto flex w-full max-w-[390px] flex-col items-center text-center md:max-w-[460px]">
      <Image
        src="/Illustrations.svg"
        alt=""
        width={300}
        height={300}
        priority
        className="h-[160px] w-[160px] md:h-[214px] md:w-[214px]"
      />
      <h1 className="mt-2 text-[16px] font-bold leading-tight text-[#2b2b2b] md:mt-4 md:text-[17px]">
        No assignments yet
      </h1>
      <p className="mt-3 max-w-[330px] text-[12px] leading-[1.42] text-[#7a7a7a] md:max-w-[420px]">
        Create your first assignment to start collecting and grading student
        submissions. You can set up rubrics, define marking criteria, and let AI
        assist with grading.
      </p>
      <button
        type="button"
        onClick={onCreateAssignment}
        className="mt-7 inline-flex h-[34px] items-center justify-center gap-2 rounded-full bg-[#111111] px-5 text-[12px] font-medium text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.16)] transition hover:bg-[#1d1d1d] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff6e4d] md:h-[36px] md:px-6"
      >
        <Plus className="h-4 w-4" strokeWidth={1.8} />
        Create Your First Assignment
      </button>
    </section>
  );
}
