// 简单的内存存储（演示用）
// 生产环境请使用：Upstash Redis / Cloudflare D1 / Vercel Postgres
import { nanoid } from 'nanoid';

// 评估结果存储
interface AssessmentRecord {
  code: string;
  result: {
    totalScore: number;
    grade: 'red' | 'yellow' | 'green';
    dimensionScores: Array<{
      dimension: string;
      score: number;
      maxScore: number;
      suggestions: string[];
    }>;
    region: string;
    visaType: string;
  };
  userName: string;
  region: string;
  visaId: string;
  createdAt: string;
}

// 内存存储（Vercel serverless 下每次调用可能重置，仅演示用）
const store = new Map<string, AssessmentRecord>();

export function saveAssessment(data: {
  result: AssessmentRecord['result'];
  userName: string;
  region: string;
  visaId: string;
}): string {
  const code = nanoid(8); // 8位短码
  const record: AssessmentRecord = {
    result: data.result,
    userName: data.userName,
    region: data.region,
    visaId: data.visaId,
    code,
    createdAt: new Date().toISOString(),
  };
  store.set(code, record);
  return code;
}

export function getAssessment(code: string): AssessmentRecord | null {
  return store.get(code) || null;
}

// 顾问邮箱配置（从环境变量读取）
export const ADVISOR_EMAIL = process.env.ADVISOR_EMAIL || '';
