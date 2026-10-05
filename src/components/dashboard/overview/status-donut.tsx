"use client";

import type { CSSProperties, ReactNode } from "react";
import { useState } from "react";

import { CountUp } from "@/components/count-up";
import { formatEuro, formatPercent } from "@/lib/money";

import { CardHeader, LegendDot } from "./dashboard-card";
import { useRevealOnce } from "./use-reveal-once";

export type DonutSegment = {
  key: string;
  label: string;
  amount: number;
  color: string;
};

const SIZE = 168;
const STROKE = 16;
const RADIUS = (SIZE - STROKE - 4) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const GAP = 2.5;

export function StatusDonut({
  id,
  title,
  meta,
  action,
  actionHref,
  segments,
  centerValue,
  centerLabel,
  footnote,
  style,
}: {
  id: string;
  title: string;
  meta?: ReactNode;
  action?: string;
  actionHref?: string;
  segments: DonutSegment[];
  centerValue: string;
  centerLabel: string;
  footnote?: string;
  style?: CSSProperties;
}) {
  const [ref, revealed] = useRevealOnce<HTMLDivElement>();
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const total = segments.reduce((sum, segment) => sum + segment.amount, 0);
  const lengths = segments.map((segment) =>
    total === 0 ? 0 : (segment.amount / total) * CIRCUMFERENCE,
  );
  const arcs = segments.map((segment, index) => ({
    ...segment,
    start: lengths.slice(0, index).reduce((sum, length) => sum + length, 0),
    length: Math.max(lengths[index] - GAP, 0),
  }));
  const activeArc = (() => {
    const arc = arcs.find((item) => item.key === activeKey);
    if (!arc) return null;
    // The SVG is rotated -90deg, so arcs start at 12 o'clock and run clockwise.
    const angle = ((arc.start + arc.length / 2) / CIRCUMFERENCE) * 2 * Math.PI;
    const ring = (RADIUS / SIZE) * 100;
    return { ...arc, x: 50 + Math.sin(angle) * ring, y: 50 - Math.cos(angle) * ring };
  })();

  return (
    <section
      aria-labelledby={`${id}-title`}
      className="dashboard-card dashboard-enter dashboard-anchor flex min-h-[200px] flex-col px-3.5 py-3 xl:h-full xl:min-h-0"
      id={id}
      style={style}
    >
      <CardHeader
        action={action}
        actionHref={actionHref}
        meta={meta}
        title={title}
        titleId={`${id}-title`}
      />
      {footnote ? <p className="dashboard-label mt-0.5 truncate" title={footnote}>{footnote}</p> : null}

      <div
        className="mt-2 grid min-h-0 flex-1 grid-cols-[120px_minmax(0,1fr)] items-center gap-2.5"
        data-revealed={revealed}
        ref={ref}
      >
        <div className="relative mx-auto h-[116px] w-[116px]">
          <svg aria-hidden="true" className="h-full w-full -rotate-90" viewBox={`0 0 ${SIZE} ${SIZE}`}>
            <circle
              cx={SIZE / 2}
              cy={SIZE / 2}
              fill="none"
              r={RADIUS}
              stroke="#eef3f9"
              strokeWidth={STROKE}
            />
            {arcs.map((arc, index) => (
              <circle
                className="donut-segment cursor-pointer"
                cx={SIZE / 2}
                cy={SIZE / 2}
                fill="none"
                key={arc.key}
                r={RADIUS}
                stroke={arc.color}
                strokeLinecap="butt"
                style={{
                  strokeDasharray: `${revealed ? arc.length : 0} ${CIRCUMFERENCE}`,
                  strokeDashoffset: -arc.start,
                  strokeWidth: activeKey === arc.key ? STROKE + 2 : STROKE,
                  opacity: activeKey && activeKey !== arc.key ? 0.55 : 1,
                  transitionDelay: revealed && !activeKey ? `${index * 70}ms` : "0ms",
                }}
                onMouseEnter={() => setActiveKey(arc.key)}
                onMouseLeave={() => setActiveKey(null)}
              />
            ))}
          </svg>
          <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
            <div className="max-w-[78px]">
              <p className="text-[20px] leading-none font-bold tracking-[-0.03em] text-[#102342] tabular-nums">
                <CountUp value={centerValue} />
              </p>
              <p className="mt-1 text-[9px] leading-tight text-[#7a899e]">{centerLabel}</p>
            </div>
          </div>
          {activeArc ? (
            <div
              className="donut-tooltip"
              role="tooltip"
              style={{ left: `${activeArc.x}%`, top: `${activeArc.y}%` }}
            >
              <span className="flex items-center gap-1.5 font-semibold">
                <span aria-hidden="true" className="h-2 w-2 rounded-[2px]" style={{ backgroundColor: activeArc.color }} />
                {activeArc.label}
              </span>
              <span className="mt-0.5 block text-[#c9d6ea] tabular-nums">
                {formatEuro(activeArc.amount)} · {formatPercent(total === 0 ? 0 : activeArc.amount / total)}
              </span>
            </div>
          ) : null}
        </div>

        <ul className="grid min-w-0 gap-0.5">
          {segments.map((segment) => (
            <li
              className={`soft-row grid h-6 grid-cols-[auto_minmax(0,1fr)_auto_auto] items-center gap-x-2 rounded-[6px] px-2 text-[10px] ${
                activeKey === segment.key ? "bg-[#edf3fb]" : ""
              }`}
              key={segment.key}
              onMouseEnter={() => setActiveKey(segment.key)}
              onMouseLeave={() => setActiveKey(null)}
            >
              <LegendDot color={segment.color} />
              <span className="min-w-0 truncate font-medium text-[#24334c]" title={segment.label}>
                {segment.label}
              </span>
              <span className="text-[9px] text-[#7a899e] tabular-nums">
                {formatPercent(total === 0 ? 0 : segment.amount / total)}
              </span>
              <span className="font-semibold whitespace-nowrap text-[#13284a] tabular-nums">
                {formatEuro(segment.amount)}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
