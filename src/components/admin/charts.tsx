"use client";

import { AnimatePresence, m } from "framer-motion";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Lightweight, dependency-free charts for the admin demo. Single-series
 * charts use one hue (the primary token, validated for both themes), text
 * stays in text tokens, and every chart offers a table view.
 */

function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    if (!ref.current) return;
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  return [ref, width] as const;
}

const compact = (n: number) => (n >= 10000 ? `${Math.round(n / 1000)}K` : n >= 1000 ? `${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}K` : String(n));
const full = (n: number) => n.toLocaleString("en-US");

function niceMax(value: number): number {
  const magnitude = Math.pow(10, Math.floor(Math.log10(value)));
  const steps = [1, 2, 2.5, 5, 10];
  for (const s of steps) if (s * magnitude >= value) return s * magnitude;
  return 10 * magnitude;
}

/** Chart card with a Chart/Table switch. */
export function ChartFrame({
  title,
  subtitle,
  table,
  children,
  badge,
}: {
  title: string;
  subtitle?: string;
  table: { columns: [string, string]; rows: [string, number][] };
  children: ReactNode;
  badge?: ReactNode;
}) {
  const [view, setView] = useState<"chart" | "table">("chart");
  return (
    <section className="rounded-[var(--radius-card)] border border-border bg-surface shadow-soft">
      <header className="flex flex-wrap items-start justify-between gap-3 px-5 pt-5">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-semibold text-foreground">{title}</h2>
            {badge}
          </div>
          {subtitle && <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>}
        </div>
        <div role="tablist" aria-label={`${title} view`} className="flex rounded-lg border border-border p-0.5 text-xs">
          {(["chart", "table"] as const).map((v) => (
            <button
              key={v}
              type="button"
              role="tab"
              aria-selected={view === v}
              onClick={() => setView(v)}
              className={cn("rounded-md px-2.5 py-1 capitalize transition-colors", view === v ? "bg-surface-muted font-medium text-foreground" : "text-muted-foreground hover:text-foreground")}
            >
              {v}
            </button>
          ))}
        </div>
      </header>
      <div className="p-5">
        {view === "chart" ? (
          children
        ) : (
          <div className="max-h-80 overflow-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th scope="col" className="py-2 font-semibold">{table.columns[0]}</th>
                  <th scope="col" className="py-2 text-right font-semibold">{table.columns[1]}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {table.rows.map(([label, value]) => (
                  <tr key={label}>
                    <td className="py-2 text-foreground">{label}</td>
                    <td className="py-2 text-right tabular-nums text-foreground">{full(value)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}

/** Single-series line chart with area wash, end label and crosshair tooltip. */
export function LineChart({ data, valueLabel }: { data: { label: string; value: number }[]; valueLabel: string }) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);
  const height = 260;
  const margin = { top: 16, right: 56, bottom: 28, left: 44 };
  const innerW = Math.max(0, width - margin.left - margin.right);
  const innerH = height - margin.top - margin.bottom;
  const max = niceMax(Math.max(...data.map((d) => d.value)));
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => Math.round(max * t));
  const x = (i: number) => margin.left + (data.length === 1 ? innerW / 2 : (i / (data.length - 1)) * innerW);
  const y = (v: number) => margin.top + innerH - (v / max) * innerH;
  const line = data.map((d, i) => `${i ? "L" : "M"}${x(i)},${y(d.value)}`).join(" ");
  const area = `${line} L${x(data.length - 1)},${y(0)} L${x(0)},${y(0)} Z`;
  const last = data[data.length - 1];

  const onMove = (clientX: number, rect: DOMRect) => {
    const rel = clientX - rect.left - margin.left;
    const i = Math.round((rel / innerW) * (data.length - 1));
    setHover(Math.max(0, Math.min(data.length - 1, i)));
  };

  return (
    <div ref={ref} className="relative w-full" style={{ height }}>
      {width > 0 && (
        <svg
          width={width}
          height={height}
          role="img"
          aria-label={`${valueLabel} over ${data.length} weeks, from ${full(data[0].value)} to ${full(last.value)}`}
          onMouseMove={(e) => onMove(e.clientX, e.currentTarget.getBoundingClientRect())}
          onMouseLeave={() => setHover(null)}
          onTouchStart={(e) => onMove(e.touches[0].clientX, e.currentTarget.getBoundingClientRect())}
          onTouchMove={(e) => onMove(e.touches[0].clientX, e.currentTarget.getBoundingClientRect())}
          className="overflow-visible"
        >
          {ticks.map((t) => (
            <g key={t}>
              <line x1={margin.left} x2={margin.left + innerW} y1={y(t)} y2={y(t)} stroke="var(--border)" strokeWidth={1} />
              <text x={margin.left - 8} y={y(t)} dy="0.32em" textAnchor="end" className="fill-muted-foreground text-[11px] tabular-nums">
                {compact(t)}
              </text>
            </g>
          ))}
          {data.map((d, i) =>
            i % 2 === 0 || i === data.length - 1 ? (
              <text key={d.label} x={x(i)} y={height - 8} textAnchor="middle" className="fill-muted-foreground text-[11px]">
                {d.label}
              </text>
            ) : null,
          )}
          <m.path d={area} fill="var(--primary)" fillOpacity={0.1} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8, delay: 0.3 }} />
          <m.path
            d={line}
            fill="none"
            stroke="var(--primary)"
            strokeWidth={2}
            strokeLinejoin="round"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
          />
          <circle cx={x(data.length - 1)} cy={y(last.value)} r={4} fill="var(--primary)" stroke="var(--surface)" strokeWidth={2} />
          <text x={x(data.length - 1) + 10} y={y(last.value)} dy="0.32em" className="fill-foreground text-[12px] font-semibold tabular-nums">
            {compact(last.value)}
          </text>
          {hover !== null && (
            <g pointerEvents="none">
              <line x1={x(hover)} x2={x(hover)} y1={margin.top} y2={margin.top + innerH} stroke="var(--border-strong)" strokeWidth={1} />
              <circle cx={x(hover)} cy={y(data[hover].value)} r={5} fill="var(--primary)" stroke="var(--surface)" strokeWidth={2} />
            </g>
          )}
        </svg>
      )}
      <AnimatePresence>
        {hover !== null && width > 0 && (
          <m.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12 }}
            className="pointer-events-none absolute z-10 rounded-lg border border-border bg-surface-elevated px-3 py-2 text-xs shadow-lift"
            style={{ left: Math.min(Math.max(x(hover) - 60, 0), width - 130), top: Math.max(0, y(data[hover].value) - 64) }}
          >
            <p className="text-muted-foreground">Week of {data[hover].label}</p>
            <p className="mt-0.5 font-semibold tabular-nums text-foreground">
              {full(data[hover].value)} {valueLabel.toLowerCase()}
            </p>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/** Horizontal single-series bar chart (HTML) — bars ≤ 24px, rounded data end, value at tip. */
export function BarList({ data, valueLabel }: { data: { label: string; value: number }[]; valueLabel: string }) {
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(...data.map((d) => d.value));
  const total = data.reduce((s, d) => s + d.value, 0);
  return (
    <ul className="space-y-3" aria-label={`${valueLabel} by item`}>
      {data.map((d, i) => (
        <li
          key={d.label}
          className="relative grid grid-cols-[minmax(0,9rem)_1fr] items-center gap-3 sm:grid-cols-[minmax(0,12rem)_1fr]"
          onMouseEnter={() => setHover(i)}
          onMouseLeave={() => setHover(null)}
        >
          <span className="truncate text-sm text-foreground" title={d.label}>
            {d.label}
          </span>
          <span className="flex items-center gap-2">
            <m.span
              initial={{ width: 0 }}
              whileInView={{ width: `${(d.value / max) * 82}%` }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: i * 0.04 }}
              className={cn("block h-5 rounded-r-[4px] bg-primary transition-opacity", hover !== null && hover !== i && "opacity-50")}
            />
            <span className="shrink-0 text-xs font-medium tabular-nums text-muted-foreground">{compact(d.value)}</span>
          </span>
          <AnimatePresence>
            {hover === i && (
              <m.span
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.12 }}
                className="pointer-events-none absolute -top-12 left-1/3 z-10 rounded-lg border border-border bg-surface-elevated px-3 py-2 text-xs shadow-lift"
              >
                <span className="block text-muted-foreground">{d.label}</span>
                <span className="font-semibold tabular-nums text-foreground">
                  {full(d.value)} {valueLabel.toLowerCase()} · {((d.value / total) * 100).toFixed(1)}%
                </span>
              </m.span>
            )}
          </AnimatePresence>
        </li>
      ))}
    </ul>
  );
}
