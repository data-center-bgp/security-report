"use client";

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  type TooltipProps,
} from "recharts";

interface DataKey {
  key: string;
  color: string;
  label: string;
}

interface ActivityChartProps {
  data: Array<Record<string, any>>;
  type: "line" | "bar" | "area";
  dataKeys: DataKey[];
  xAxisKey?: string;
  height?: number;
  /** Horizontal bar layout (categories on the Y axis). */
  horizontal?: boolean;
  valueFormatter?: (v: number) => string;
}

const AXIS = "var(--chart-axis)";
const GRID = "var(--chart-grid)";

function ChartTooltip({
  active,
  payload,
  label,
  valueFormatter,
}: TooltipProps<number, string> & { valueFormatter?: (v: number) => string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-popover px-3 py-2 shadow-md">
      <p className="text-xs font-medium text-foreground mb-1.5">{label}</p>
      <div className="space-y-1">
        {payload.map((p) => (
          <div key={p.dataKey} className="flex items-center gap-2 text-xs">
            <span
              className="h-2 w-2 rounded-full shrink-0"
              style={{ background: p.color }}
            />
            <span className="text-muted-foreground">{p.name}</span>
            <span className="ml-auto pl-4 font-semibold tabular-nums text-foreground">
              {valueFormatter
                ? valueFormatter(Number(p.value))
                : Number(p.value).toLocaleString("id-ID")}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

const tickStyle = { fontSize: 11, fill: AXIS } as const;

export function ActivityChart({
  data,
  type,
  dataKeys,
  xAxisKey = "tanggal",
  height = 280,
  horizontal = false,
  valueFormatter,
}: ActivityChartProps) {
  const margin = { top: 8, right: 12, left: 0, bottom: 0 };
  const tooltip = (
    <Tooltip
      cursor={{ fill: "var(--chart-grid)", fillOpacity: 0.35 }}
      content={<ChartTooltip valueFormatter={valueFormatter} />}
    />
  );

  if (type === "area") {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data} margin={margin}>
          <defs>
            {dataKeys.map(({ key, color }) => (
              <linearGradient
                key={key}
                id={`grad-${key}`}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="0%" stopColor={color} stopOpacity={0.28} />
                <stop offset="100%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid vertical={false} stroke={GRID} strokeWidth={1} />
          <XAxis
            dataKey={xAxisKey}
            tick={tickStyle}
            axisLine={false}
            tickLine={false}
            dy={6}
          />
          <YAxis
            tick={tickStyle}
            axisLine={false}
            tickLine={false}
            width={36}
            allowDecimals={false}
          />
          {tooltip}
          {dataKeys.map(({ key, color, label }) => (
            <Area
              key={key}
              type="monotone"
              dataKey={key}
              name={label}
              stroke={color}
              strokeWidth={2}
              fill={`url(#grad-${key})`}
              activeDot={{ r: 4, strokeWidth: 0 }}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    );
  }

  if (type === "line") {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data} margin={margin}>
          <CartesianGrid vertical={false} stroke={GRID} strokeWidth={1} />
          <XAxis
            dataKey={xAxisKey}
            tick={tickStyle}
            axisLine={false}
            tickLine={false}
            dy={6}
          />
          <YAxis
            tick={tickStyle}
            axisLine={false}
            tickLine={false}
            width={36}
            allowDecimals={false}
          />
          {tooltip}
          {dataKeys.map(({ key, color, label }) => (
            <Line
              key={key}
              type="monotone"
              dataKey={key}
              name={label}
              stroke={color}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 0 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    );
  }

  // bar
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={data}
        margin={margin}
        layout={horizontal ? "vertical" : "horizontal"}
        barCategoryGap={horizontal ? "22%" : "28%"}
        barGap={4}
      >
        <CartesianGrid
          vertical={horizontal}
          horizontal={!horizontal}
          stroke={GRID}
          strokeWidth={1}
        />
        {/* XAxis/YAxis must be DIRECT children — recharts ignores any wrapped
            in a Fragment, so props are set conditionally, not the elements. */}
        <XAxis
          {...(horizontal
            ? { type: "number" as const, allowDecimals: false }
            : { dataKey: xAxisKey, dy: 6 })}
          tick={tickStyle}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          {...(horizontal
            ? {
                type: "category" as const,
                dataKey: xAxisKey,
                width: 116,
              }
            : { width: 36, allowDecimals: false })}
          tick={tickStyle}
          axisLine={false}
          tickLine={false}
        />
        {tooltip}
        {dataKeys.map(({ key, color, label }) => (
          <Bar
            key={key}
            dataKey={key}
            name={label}
            fill={color}
            radius={horizontal ? [0, 6, 6, 0] : [6, 6, 0, 0]}
            maxBarSize={horizontal ? 22 : 34}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
