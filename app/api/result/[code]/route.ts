import { NextRequest, NextResponse } from 'next/server';
import { getAssessment } from '@/lib/submit';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;

  if (!code) {
    return NextResponse.json({ error: '缺少短码' }, { status: 400 });
  }

  const record = getAssessment(code);

  if (!record) {
    return NextResponse.json({ error: '评估结果不存在或已过期' }, { status: 404 });
  }

  return NextResponse.json(record);
}
