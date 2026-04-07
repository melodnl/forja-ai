export function ForjaLogo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizeMap = {
    sm: { w: 115, h: 28 },
    md: { w: 158, h: 38 },
    lg: { w: 230, h: 54 },
  };

  const { w, h } = sizeMap[size];

  return (
    <svg width={w} height={h} viewBox="0 0 158 38" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Forge icon — anvil + hammer */}
      <rect x="1" y="7" width="24" height="24" rx="7" fill="var(--forja-ember)" />
      <rect x="7" y="14" width="12" height="3.5" rx="1.5" fill="var(--forja-bg)" />
      <rect x="11.5" y="17.5" width="3" height="8" rx="1.5" fill="var(--forja-bg)" />
      {/* Sparks */}
      <circle cx="20" cy="10" r="1.8" fill="var(--forja-glow)">
        <animate attributeName="opacity" values="1;0.4;1" dur="2s" repeatCount="indefinite" />
      </circle>
      <circle cx="23.5" cy="13.5" r="1.2" fill="var(--forja-amber)" opacity="0.7">
        <animate attributeName="opacity" values="0.7;0.2;0.7" dur="2.5s" repeatCount="indefinite" />
      </circle>
      <circle cx="17" cy="7.5" r="1" fill="var(--forja-amber)" opacity="0.5">
        <animate attributeName="opacity" values="0.5;0.1;0.5" dur="1.8s" repeatCount="indefinite" />
      </circle>

      {/* FORJEA text */}
      <text
        x="32"
        y="26"
        fontFamily="system-ui, -apple-system, sans-serif"
        fontWeight="800"
        fontSize="21"
        letterSpacing="-0.3"
        fill="var(--forja-text)"
      >
        FORJEA
      </text>

      {/* .app pill badge */}
      <rect x="112" y="12" width="42" height="18" rx="9" fill="var(--forja-ember)" opacity="0.15" />
      <text
        x="119"
        y="25.5"
        fontFamily="system-ui, -apple-system, sans-serif"
        fontWeight="700"
        fontSize="13"
        fill="var(--forja-ember)"
      >
        .app
      </text>
    </svg>
  );
}
