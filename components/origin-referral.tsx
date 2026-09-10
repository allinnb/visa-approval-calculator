'use client';

/**
 * Origin 官网回流入口（08.1）
 * 该 Vercel 计算器已停止功能迭代，仅作为旧链接（小红书等）的引流跳板。
 * 除本组件与页脚品牌署名外，不再在此仓库新增任何功能。
 */

export const ORIGIN_TOOL_URL =
  'https://originintl.cn/tools/approval/?utm_source=vercel&utm_medium=referral&utm_campaign=calculator_sunset';

export const ORIGIN_HOME_URL = 'https://originintl.cn/';

interface OriginReferralProps {
  /** 结果页用 result，其余用默认文案 */
  variant?: 'default' | 'result';
  /** 顶部横幅（默认）或底部卡片 */
  placement?: 'top' | 'bottom';
}

export default function OriginReferral({
  variant = 'default',
  placement = 'top',
}: OriginReferralProps) {
  const isResult = variant === 'result';

  return (
    <div
      className="w-full"
      style={{
        background: 'linear-gradient(90deg, #012169 0%, #0A3A7A 100%)',
        borderBottom: placement === 'top' ? '2px solid #D9B45B' : undefined,
        borderTop: placement === 'bottom' ? '2px solid #D9B45B' : undefined,
      }}
    >
      <div className="max-w-5xl mx-auto px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="text-center sm:text-left">
          <p className="text-white text-sm sm:text-base font-semibold leading-snug">
            {isResult
              ? '出结果了？到 Origin 官网做完整评估并领取材料清单'
              : '本工具已迁移至 Origin 官网，点击进入官方版'}
          </p>
          <p className="text-white/70 text-xs mt-0.5">
            Origin · 奥赢国际 · 签证与跨境出行准备
          </p>
        </div>
        <a
          href={ORIGIN_TOOL_URL}
          className="flex-shrink-0 inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full font-semibold text-sm transition hover:opacity-90 active:scale-[0.98]"
          style={{ background: '#D9B45B', color: '#012169' }}
        >
          进入官方自测
          <span aria-hidden="true">→</span>
        </a>
      </div>
    </div>
  );
}
