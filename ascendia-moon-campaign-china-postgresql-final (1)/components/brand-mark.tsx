import Image from "next/image";

type BrandMarkProps = {
  compact?: boolean;
  light?: boolean;
};

export function BrandMark({ compact = false, light = true }: BrandMarkProps) {
  return (
    <div className={`brand-mark ${light ? "brand-mark--light" : "brand-mark--dark"} ${compact ? "brand-mark--compact" : ""}`}>
      <span className="brand-mark__logo">
        <Image
          className="brand-mark__logo-image"
          src="/assets/ascendia-logo-transparent.png"
          width={1862}
          height={845}
          sizes="(max-width: 520px) 108px, 148px"
          unoptimized
          alt="Ascendia Partners"
        />
      </span>
      <span className="brand-mark__cn">信宏咨询</span>
    </div>
  );
}
