'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { regionConfigs } from '@/lib/scoring/regions';
import type { Region, ScoringResult } from '@/lib/types';
import ScoreRadarChart from '@/components/radar-chart';
import { calculateScore, generateSuggestions } from '@/lib/scoring/algorithm';
import { dimensionOrder, dimensionConfigs } from '@/lib/scoring/weights';
import PDFDownloadButton from '@/components/pdf-report';
import {
  ArrowLeft,
  AlertCircle,
  CheckCircle,
  XCircle,
  Lightbulb,
  Home,
} from 'lucide-react';

function ResultContent() {
  const searchParams = useSearchParams();
  const region = searchParams.get('region') as Region;
  const visaId = searchParams.get('visa') || 'tourist';
  const score = parseInt(searchParams.get('score') || '50');
  const grade = (searchParams.get('grade') as 'red' | 'yellow' | 'green') || 'yellow';
  const name = searchParams.get('name') || '匿名用户';

  const [result, setResult] = useState<ScoringResult | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('visaAssessmentResult');
      if (saved) {
        try {
          const data = JSON.parse(saved);
          setResult(data.result);
        } catch (e) {
          console.error('Failed to load saved result');
        }
      }
    }
  }, []);

  const regionConfig = regionConfigs[region];
  const visaType = regionConfig.visaTypes.find((v) => v.id === visaId) || regionConfig.visaTypes[0];

  const displayResult = result || calculateScore(
    {
      age: 30,
      education: 'bachelor',
      previousTravel: 2,
      previousVisaDenial: false,
      annualIncome: 15,
      savings: 20,
      hasProperty: false,
      hasVehicle: false,
      purpose: 'tourism',
      hasInvitation: false,
      hasDetailedPlan: false,
      passportValid: 12,
      hasTravelInsurance: false,
      hasFlightBooking: false,
      hasHotelBooking: false,
      hasStableJob: true,
      hasBusiness: false,
      hasFamilyInChina: true,
      hasHouseProperty: false,
      isSensitiveRegion: false,
      hasOfficialPassport: false,
    },
    region,
    visaId
  );

  const suggestions = generateSuggestions(displayResult);

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

  const currentGrade = gradeConfig[grade] || gradeConfig.yellow;
  const GradeIcon = currentGrade.icon;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{regionConfig.flag}</span>
            <div>
              <h1 className="font-semibold text-slate-900">评估结果</h1>
              <p className="text-xs text-slate-500">{regionConfig.name} · {visaType.name}</p>
            </div>
          </div>
          <div className="flex gap-2">
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
              <p className="text-4xl font-bold text-slate-900">{score}%</p>
            </div>
            <div className="ml-auto text-right">
              <p className={`text-lg font-semibold ${currentGrade.color}`}>{currentGrade.label}</p>
              <p className="text-sm text-slate-500">{name}</p>
            </div>
          </div>
          <p className="text-slate-600">{currentGrade.description}</p>
        </div>

        {/* Radar Chart */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-6">
          <h3 className="font-semibold text-slate-900 mb-4">六维度评分详情</h3>
          <ScoreRadarChart data={displayResult.dimensionScores} />

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-6">
            {dimensionOrder.map((dimId) => {
              const dimScore = displayResult.dimensionScores.find((d) => d.dimension === dimId)!;
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
        {suggestions.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-6">
            <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-amber-500" />
              改善建议
            </h3>
            <ul className="space-y-3">
              {suggestions.slice(0, 6).map((suggestion, idx) => (
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
            重新评估
          </a>
          <PDFDownloadButton result={displayResult} userName={name} />
        </div>

        {/* QR Code Section */}
        <div className="mt-6 bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col sm:flex-row items-center gap-6">
          <img
            src="/qr-code.jpg"
            alt="签证顾问二维码"
            className="w-28 h-28 flex-shrink-0 rounded-xl"
          />
          <div>
            <h3 className="font-semibold text-slate-900 mb-2">获得签证顾问的专业指导</h3>
            <p className="text-sm text-slate-500 mb-3">
              扫码联系资深签证顾问，获取个性化申请方案、 材料清单优化及实时政策解读，
              提高您的出签率。
            </p>
            <div className="flex flex-wrap gap-3 text-xs">
              <span className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full">美国 B1/B2</span>
              <span className="px-3 py-1.5 bg-red-50 text-red-700 rounded-full">申根区</span>
              <span className="px-3 py-1.5 bg-amber-50 text-amber-700 rounded-full">英国</span>
              <span className="px-3 py-1.5 bg-green-50 text-green-700 rounded-full">更多国家...</span>
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="mt-8 p-4 bg-slate-100 rounded-xl text-sm text-slate-500">
          <p className="font-medium text-slate-700 mb-2">免责声明</p>
          <p>
            本评估工具仅供参考，不能替代官方正式签证申请。实际出签结果取决于签证官的个案审核、
            当前政策、申请季节等多种因素。本工具基于各国官方公开数据和行业通用评估模型，
            不保证评估结果的100%准确性。
          </p>
        </div>
      </main>
    </div>
  );
}

export default function ResultPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-slate-500">加载中...</p>
      </div>
    }>
      <ResultContent />
    </Suspense>
  );
}
