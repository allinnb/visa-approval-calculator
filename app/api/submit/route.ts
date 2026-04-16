import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { saveAssessment, ADVISOR_EMAIL } from '@/lib/submit';
import { regionConfigs } from '@/lib/scoring/regions';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { result, userName, region, visaId } = body;

    if (!result || !region || !visaId) {
      return NextResponse.json(
        { error: '缺少必要参数' },
        { status: 400 }
      );
    }

    // 保存评估结果
    const code = saveAssessment({ result, userName, region, visaId });
    const shareUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/share/${code}`;

    // 获取地区和签证名称
    const regionConfig = regionConfigs[region as keyof typeof regionConfigs];
    const visaType = regionConfig?.visaTypes.find((v) => v.id === visaId);

    // 邮件通知顾问
    if (ADVISOR_EMAIL && resend) {
      const gradeEmoji = result.grade === 'green' ? '🟢' : result.grade === 'yellow' ? '🟡' : '🔴';
      const gradeText = result.grade === 'green' ? '出签前景良好' : result.grade === 'yellow' ? '出签概率中等' : '出签风险较高';

      try {
        await resend.emails.send({
          from: '签证评估系统 <onboarding@resend.dev>',
          to: ADVISOR_EMAIL,
          subject: `新客户评估完成 ${gradeEmoji} ${userName} - ${regionConfig?.name} ${visaType?.name}`,
          html: `
            <h2>有新客户完成签证评估</h2>
            <table style="border-collapse: collapse; width: 100%;">
              <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 8px 0; color: #666;">客户姓名</td>
                <td style="padding: 8px 0; font-weight: bold;">${userName}</td>
              </tr>
              <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 8px 0; color: #666;">目标地区</td>
                <td style="padding: 8px 0;">${regionConfig?.flag} ${regionConfig?.name}</td>
              </tr>
              <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 8px 0; color: #666;">签证类型</td>
                <td style="padding: 8px 0;">${visaType?.name}</td>
              </tr>
              <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 8px 0; color: #666;">评估结果</td>
                <td style="padding: 8px 0;">
                  <span style="font-size: 24px; font-weight: bold; color: ${
                    result.grade === 'green' ? '#16a34a' : result.grade === 'yellow' ? '#ca8a04' : '#dc2626'
                  };">${result.totalScore}%</span>
                  <span style="margin-left: 8px;">${gradeText}</span>
                </td>
              </tr>
            </table>

            <div style="margin-top: 24px;">
              <a href="${shareUrl}" style="display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">
                查看完整评估报告 →
              </a>
            </div>

            <p style="margin-top: 24px; color: #666; font-size: 12px;">
              此邮件由签证评估系统自动发送
            </p>
          `,
        });
      } catch (emailError) {
        console.error('Failed to send email:', emailError);
        // 邮件发送失败不影响返回结果
      }
    }

    return NextResponse.json({
      success: true,
      code,
      shareUrl,
    });
  } catch (error) {
    console.error('Submit error:', error);
    return NextResponse.json(
      { error: '提交失败，请重试' },
      { status: 500 }
    );
  }
}
