'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { regionConfigs } from '@/lib/scoring/regions';
import type { Region, ScoringResult } from '@/lib/types';
import ScoreRadarChart from '@/components/radar-chart';
import { dimensionOrder, dimensionConfigs } from '@/lib/scoring/weights';
import PDFDownloadButton from '@/components/pdf-report';
import {
  ArrowLeft,
  AlertCircle,
  CheckCircle,
  XCircle,
  Lightbulb,
  Home,
  Share2,
  Copy,
  Check,
} from 'lucide-react';

interface AssessmentData {
  result: ScoringResult;
  userName: string;
  region: string;
  visaId: string;
  createdAt: string;
}

export default function ShareResultPage() {
  const params = useParams();
  const code = params.code as string;

  const [data, setData] = useState<AssessmentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch(`/api/result/${code}`)
      .then((res) => {
        if (!res.ok) throw new Error('结果不存在');
        return res.json();
      })
      .then((data) => {
        setData(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [code]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-blue-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-500">正在加载评估结果...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-blue-50">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-xl font-semibold text-slate-900 mb-2">结果不存在</h1>
          <p className="text-slate-500 mb-6">
            此链接可能已过期或不存在，请联系您的顾问获取正确的评估链接。
          </p>
          <a
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-full font-medium hover:bg-blue-600 transition"
          >
            <Home className="w-4 h-4" />
            返回首页
          </a>
        </div>
      </div>
    );
  }

  const regionConfig = regionConfigs[data.region as Region];
  const visaType = regionConfig?.visaTypes.find((v) => v.id === data.visaId) || regionConfig?.visaTypes[0];
  const { result, userName } = data;

  const gradeConfig = {
    red: {
      label: '出签风险较高',
      color: 'text-red-600',
      bg: 'bg-red-50',
      border: 'border-red-200',
      icon: XCircle,
      description: '建议在申请前充分准备材料，或考虑咨询专业顾问',
    },
    yellow: {
      label: '出签概率中等',
      color: 'text-amber-600',
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      icon: AlertCircle,
      description: '您的材料基本合格，建议关注评分较低的维度',
    },
    green: {
      label: '出签前景良好',
      color: 'text-green-600',
      bg: 'bg-green-50',
      border: 'border-green-200',
      icon: CheckCircle,
      description: '您的条件较为优秀，保持现有优势并完善材料',
    },
  };

  const currentGrade = gradeConfig[result.grade] || gradeConfig.yellow;
  const GradeIcon = currentGrade.icon;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{regionConfig?.flag}</span>
            <div>
              <h1 className="font-semibold text-slate-900">签证评估报告</h1>
              <p className="text-xs text-slate-500">{regionConfig?.name} · {visaType?.name}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleCopyLink}
              className="flex items-center gap-1.5 px-3 py-2 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-full transition"
            >
              {copied ? <Check className="w-4 h-4 text-green-500" /> : <Share2 className="w-4 h-4" />}
              {copied ? '已复制' : '分享'}
            </button>
            <a
              href="/"
              className="flex items-center gap-1.5 px-3 py-2 text-sm text-slate-600 hover:text-slate-900"
            >
              <Home className="w-4 h-4" />
              首页
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        {/* Score Card */}
        <div className={`${currentGrade.bg} border-2 ${currentGrade.border} rounded-2xl p-6 mb-6`}>
          <div className="flex items-center gap-4 mb-4">
            <div className={`w-14 h-14 rounded-full ${currentGrade.bg} border-2 ${currentGrade.border} flex items-center justify-center`}>
              <GradeIcon className={`w-7 h-7 ${currentGrade.color}`} />
            </div>
            <div>
              <p className="text-sm text-slate-500">综合出签概率</p>
              <p className="text-4xl font-bold text-slate-900">{result.totalScore}%</p>
            </div>
            <div className="ml-auto text-right">
              <p className={`text-lg font-semibold ${currentGrade.color}`}>{currentGrade.label}</p>
              <p className="text-sm text-slate-500">{userName}</p>
              <p className="text-xs text-slate-400 mt-1">
                评估时间：{new Date(data.createdAt).toLocaleDateString('zh-CN')}
              </p>
            </div>
          </div>
          <p className="text-slate-600">{currentGrade.description}</p>
        </div>

        {/* Radar Chart */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-6">
          <h3 className="font-semibold text-slate-900 mb-4">六维度评分详情</h3>
          <ScoreRadarChart data={result.dimensionScores} />

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-6">
            {dimensionOrder.map((dimId) => {
              const dimScore = result.dimensionScores.find((d) => d.dimension === dimId)!;
              const config = dimensionConfigs.find((c) => c.id === dimId)!;
              const isLow = dimScore.score < 60;

              return (
                <div
                  key={dimId}
                  className={`p-3 rounded-xl border ${
                    isLow ? 'border-amber-200 bg-amber-50' : 'border-slate-100 bg-slate-50'
                  }`}
                >
                  <p className="text-sm text-slate-500">{config.name}</p>
                  <p className={`text-xl font-bold ${isLow ? 'text-amber-600' : 'text-green-600'}`}>
                    {dimScore.score}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Suggestions */}
        {result.dimensionScores.some((d) => d.suggestions?.length > 0) && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-6">
            <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-amber-500" />
              改善建议
            </h3>
            <ul className="space-y-3">
              {result.dimensionScores
                .flatMap((d) => d.suggestions || [])
                .slice(0, 6)
                .map((suggestion, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-slate-600">
                    <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center flex-shrink-0 text-sm mt-0.5">
                      {idx + 1}
                    </span>
                    {suggestion}
                  </li>
                ))}
            </ul>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4">
          <a
            href="/"
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 border border-slate-200 rounded-full text-slate-700 hover:bg-slate-50 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            我也要评估
          </a>
          <PDFDownloadButton result={result} userName={userName} />
        </div>

        {/* Advisor Contact */}
        <div className="mt-8 p-4 bg-blue-50 rounded-xl border border-blue-200">
          <p className="text-sm text-blue-800">
            <strong>需要专业指导？</strong> 如果您对评估结果有疑问，或希望获得更详细的申请策略建议，请联系您的签证顾问。
          </p>
        </div>

        {/* Disclaimer */}
        <div className="mt-6 p-4 bg-slate-100 rounded-xl text-sm text-slate-500">
          <p className="font-medium text-slate-700 mb-2">免责声明</p>
          <p>
            本评估工具仅供参考，不能替代官方正式签证申请。实际出签结果取决于签证官的个案审核、
            当前政策、申请季节等多种因素。
          </p>
        </div>
      </main>
    </div>
  );
}
