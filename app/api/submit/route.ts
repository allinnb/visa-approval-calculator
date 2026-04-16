import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { saveAssessment, ADVISOR_EMAIL } from '@/lib/submit';
import { regionConfigs } from '@/lib/scoring/regions';

const resendApiKey = process.env.RESEND_API_KEY;
const advisorEmail = process.env.ADVISOR_EMAIL;
const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

// 仅当 API key 和顾问邮箱都存在时才创建 Resend 实例
const resend = resendApiKey && advisorEmail ? new Resend(resendApiKey) : null;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { result, userName, region, visaId } = body;

    // 参数校验
    if (!result || !region || !visaId) {
      return NextResponse.json(
        { error: '缺少必要参数', received: { result: !!result, region: !!region, visaId: !!visaId } },
        { status: 400 }
      );
    }

    // 保存评估结果
    const code = saveAssessment({ result, userName, region, visaId });
    const shareUrl = `${baseUrl}/share/${code}`;

    // 获取地区和签证名称
    const regionConfig = regionConfigs[region as keyof typeof regionConfigs];
    const visaType = regionConfig?.visaTypes.find((v) => v.id === visaId);

    // 邮件通知顾问（仅当配置完整时）
    const emailStatus: Record<string, unknown> = { configured: !!resend };

    if (resend && advisorEmail) {
      const gradeEmoji = result.grade === 'green' ? '🟢' : result.grade === 'yellow' ? '🟡' : '🔴';
      const gradeText = result.grade === 'green' ? '出签前景良好' : result.grade === 'yellow' ? '出签概率中等' : '出签风险较高';

      try {
        const { data, error } = await resend.emails.send({
          from: '签证评估系统 <onboarding@resend.dev>',
          to: advisorEmail,
          subject: `新客户评估 ${gradeEmoji} ${userName} - ${regionConfig?.flag} ${regionConfig?.name} ${visaType?.name}`,
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: linear-gradient(135deg, #3b82f6, #8b5cf6); padding: 24px; border-radius: 12px 12px 0 0;">
                <h1 style="color: white; margin: 0; font-size: 20px;">有新客户完成签证评估</h1>
                <p style="color: rgba(255,255,255,0.8); margin: 4px 0 0 0; font-size: 14px;">${new Date().toLocaleString('zh-CN')}</p>
              </div>
              <div style="padding: 24px; background: #f8fafc; border-radius: 0 0 12px 12px; border: 1px solid #e2e8f0;">
                <table style="width: 100%; border-collapse: collapse;">
                  <tr style="border-bottom: 1px solid #e2e8f0;">
                    <td style="padding: 10px 0; color: #64748b; font-size: 14px;">客户姓名</td>
                    <td style="padding: 10px 0; font-weight: bold; font-size: 14px; text-align: right;">${userName}</td>
                  </tr>
                  <tr style="border-bottom: 1px solid #e2e8f0;">
                    <td style="padding: 10px 0; color: #64748b; font-size: 14px;">目标地区</td>
                    <td style="padding: 10px 0; font-size: 14px; text-align: right;">${regionConfig?.flag} ${regionConfig?.name}</td>
                  </tr>
                  <tr style="border-bottom: 1px solid #e2e8f0;">
                    <td style="padding: 10px 0; color: #64748b; font-size: 14px;">签证类型</td>
                    <td style="padding: 10px 0; font-size: 14px; text-align: right;">${visaType?.name}</td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 0; color: #64748b; font-size: 14px;">评估结果</td>
                    <td style="padding: 10px 0; text-align: right;">
                      <span style="font-size: 28px; font-weight: bold; color: ${
                        result.grade === 'green' ? '#16a34a' : result.grade === 'yellow' ? '#ca8a04' : '#dc2626'
                      };">${result.totalScore}%</span>
                      <span style="margin-left: 8px; font-size: 14px;">${gradeText}</span>
                    </td>
                  </tr>
                </table>

                <div style="margin-top: 24px; text-align: center;">
                  <a href="${shareUrl}" style="display: inline-block; background: #3b82f6; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 15px;">
                    查看完整评估报告 →
                  </a>
                </div>

                <p style="margin-top: 20px; color: #94a3b8; font-size: 12px; text-align: center;">
                  此邮件由签证出签率自测系统自动发送
                </p>
              </div>
            </div>
          `,
        });

        if (error) {
          emailStatus.result = 'error';
          emailStatus.error = error;
          console.error('[Submit API] Email send error:', JSON.stringify(error));
        } else {
          emailStatus.result = 'sent';
          emailStatus.emailId = data?.id;
          console.log(`[Submit API] Email sent successfully to ${advisorEmail}, ID: ${data?.id}`);
        }
      } catch (emailError) {
        emailStatus.result = 'exception';
        emailStatus.error = String(emailError);
        console.error('[Submit API] Email exception:', emailError);
      }
    } else {
      emailStatus.result = 'not_configured';
      emailStatus.reason = !resendApiKey ? 'RESEND_API_KEY not set' : 'ADVISOR_EMAIL not set';
      console.warn(`[Submit API] Email not sent - RESEND_API_KEY: ${!!resendApiKey}, ADVISOR_EMAIL: ${!!advisorEmail}`);
    }

    return NextResponse.json({
      success: true,
      code,
      shareUrl,
      emailStatus,
    });
  } catch (error) {
    console.error('[Submit API] Submit error:', error);
    return NextResponse.json(
      { error: '提交失败，请重试', detail: String(error) },
      { status: 500 }
    );
  }
}
