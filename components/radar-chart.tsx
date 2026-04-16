'use client';

import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts';
import { DimensionScore } from '@/lib/types';
import { dimensionOrder } from '@/lib/scoring/weights';

interface RadarChartProps {
  data: DimensionScore[];
}

const dimensionNames: Record<string, string> = {
  personal: '个人条件',
  financial: '财务状况',
  purpose: '出行目的',
  documents: '材料完整',
  ties: '国内约束',
  sensitivity: '户籍敏感',
};

export default function ScoreRadarChart({ data }: RadarChartProps) {
  const chartData = dimensionOrder.map((dimId) => {
    const score = data.find((d) => d.dimension === dimId);
    return {
      dimension: dimensionNames[dimId],
      score: score?.score ?? 0,
      fullMark: 100,
    };
  });

  return (
    <ResponsiveContainer width="100%" height={300}>
      <RadarChart data={chartData}>
        <PolarGrid stroke="#e2e8f0" />
        <PolarAngleAxis
          dataKey="dimension"
          tick={{ fill: '#64748b', fontSize: 12 }}
        />
        <Radar
          name="评分"
          dataKey="score"
          stroke="#3b82f6"
          fill="#3b82f6"
          fillOpacity={0.3}
          strokeWidth={2}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}
