import Image from "next/image";

type BrandMarkProps = {
  compact?: boolean;
};

export function BrandMark({ compact = false }: BrandMarkProps) {
  return (
    <div className="flex items-center gap-2">
      <Image
        src="/logo 2.png"
        alt="VedaAI"
        width={compact ? 32 : 34}
        height={compact ? 32 : 34}
        priority
        className="shrink-0 rounded-md object-contain"
      />
      <span
        className={
          compact
            ? "text-[18px] font-bold leading-none text-[#282828]"
            : "text-[20px] font-bold leading-none text-[#282828]"
        }
      >
        VedaAI
      </span>
    </div>
  );
}
