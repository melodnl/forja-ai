export function ForjaLogo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizeMap = {
    sm: { text: "text-xl", spark: 8 },
    md: { text: "text-3xl", spark: 12 },
    lg: { text: "text-5xl", spark: 16 },
  };

  const { text, spark } = sizeMap[size];

  return (
    <div className="flex items-center gap-1">
      <span className={`${text} font-extrabold tracking-tight text-[var(--forja-text)]`}>
        FOR
      </span>
      <span className="relative">
        <span className={`${text} font-extrabold tracking-tight text-[var(--forja-text)]`}>
          J
        </span>
        <svg
          width={spark}
          height={spark}
          viewBox="0 0 16 16"
          fill="none"
          className="absolute -top-1 -right-0.5"
        >
          <path
            d="M8 0L9.5 6.5L16 8L9.5 9.5L8 16L6.5 9.5L0 8L6.5 6.5L8 0Z"
            fill="var(--forja-ember)"
          />
        </svg>
      </span>
      <span className={`${text} font-extrabold tracking-tight text-[var(--forja-text)]`}>
        A
      </span>
      <span className={`${text} font-extrabold tracking-tight text-[var(--forja-ember)] ml-0.5`}>
        .ai
      </span>
    </div>
  );
}
