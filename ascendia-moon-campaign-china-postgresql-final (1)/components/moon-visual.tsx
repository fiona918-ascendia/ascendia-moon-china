type MoonVisualProps = {
  completionCount: number;
  size?: "hero" | "question" | "report" | "mini";
  labelled?: boolean;
};

export function MoonVisual({ completionCount, size = "question", labelled = false }: MoonVisualProps) {
  const count = Math.max(0, Math.min(6, completionCount));
  const illumination = count === 0 ? 0.09 : 0.4 + count * 0.1;
  const shadowShift = -(count * 17.1);

  return (
    <div
      className={`moon-visual moon-visual--${size}`}
      style={{
        "--moon-illumination": illumination,
        "--moon-shadow-shift": `${shadowShift}%`
      } as React.CSSProperties}
      role={labelled ? "img" : undefined}
      aria-label={labelled ? `当前已点亮 ${count} 项，共 6 项` : undefined}
    >
      <span className="moon-visual__glow" />
      <span className="moon-visual__disc">
        <span className="moon-visual__texture" />
        <span className="moon-visual__shade" />
      </span>
    </div>
  );
}
