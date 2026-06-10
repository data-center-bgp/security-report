"use client";

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface ActivityChartProps {
  data: Array<Record<string, any>>;
  type: "line" | "bar";
  dataKeys: Array<{ key: string; color: string; label: string }>;
  xAxisKey?: string;
}

export function ActivityChart({
  data,
  type,
  dataKeys,
  xAxisKey = "tanggal",
}: ActivityChartProps) {
  const commonProps = {
    data,
    margin: { top: 5, right: 30, left: 0, bottom: 5 },
  };

  return (
    <ResponsiveContainer width="100%" height={280}>
      {type === "line" ? (
        <LineChart {...commonProps}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
          <XAxis dataKey={xAxisKey} tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip />
          <Legend />
          {dataKeys.map(({ key, color, label }) => (
            <Line
              key={key}
              type="monotone"
              dataKey={key}
              stroke={color}
              name={label}
              strokeWidth={2}
              dot={false}
            />
          ))}
        </LineChart>
      ) : (
        <BarChart {...commonProps}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
          <XAxis dataKey={xAxisKey} tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip />
          <Legend />
          {dataKeys.map(({ key, color, label }) => (
            <Bar
              key={key}
              dataKey={key}
              fill={color}
              name={label}
              radius={[4, 4, 0, 0]}
            />
          ))}
        </BarChart>
      )}
    </ResponsiveContainer>
  );
}
