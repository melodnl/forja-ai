"use client";

import { BaseEdge, getBezierPath, type EdgeProps } from "@xyflow/react";

export function AnimatedEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  selected,
}: EdgeProps) {
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  return (
    <>
      <defs>
        <linearGradient id={`gradient-${id}`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="var(--forja-border-strong)" />
          <stop offset="50%" stopColor="var(--forja-ember)" />
          <stop offset="100%" stopColor="var(--forja-border-strong)" />
          {selected && (
            <animate
              attributeName="x1"
              values="-100%;100%"
              dur="2s"
              repeatCount="indefinite"
            />
          )}
        </linearGradient>
      </defs>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke: selected ? "var(--forja-ember)" : "var(--canvas-edge)",
          strokeWidth: selected ? 2 : 1.5,
          transition: "stroke 0.2s ease-out, stroke-width 0.2s ease-out",
        }}
      />
      {selected && (
        <circle r="3" fill="var(--forja-ember)">
          <animateMotion dur="2s" repeatCount="indefinite" path={edgePath} />
        </circle>
      )}
    </>
  );
}
