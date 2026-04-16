'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSearchParams } from 'next/navigation';
import { regionConfigs } from '@/lib/scoring/regions';
import type { Region, UserAnswers } from '@/lib/types';
import { calculateScore } from '@/lib/scoring/algorithm';
import { dimensionOrder } from '@/lib/scoring/weights';
import {
  User,
  CreditCard,
  Plane,
  FileText,
  Home,
  MapPin,
  ChevronRight,
  ChevronLeft,
  Check,
} from 'lucide-react';

const STEPS = [
  { id: 'personal', label: '个人条件', icon: User },
  { id: 'financial', label: '财务状况', icon: CreditCard },
  { id: 'purpose', label: '出行目的', icon: Plane },
  { id: 'documents', label: '材料准备', icon: FileText },
  { id: 'ties', label: '国内约束', icon: Home },
  { id: 'sensitivity', label: '补充信息', icon: MapPin },
];

const defaultAnswers: UserAnswers = {
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
};

export default function QuestionnairePage({
  params,
}: {
  params: Promise<{ region: string }>;
}) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<UserAnswers>(defaultAnswers);
  const [name, setName] = useState('');

  const region = (React.use(params) as { region: string }).region as Region;
  const visaId = searchParams.get('visa') || 'tourist';
  const regionConfig = regionConfigs[region];
  const visaType = regionConfig.visaTypes.find((v) => v.id === visaId) || regionConfig.visaTypes[0];

  const updateAnswer = <K extends keyof UserAnswers>(key: K, value: UserAnswers[K]) => {
    setAnswers((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    const result = calculateScore(answers, region, visaId);

    try {
      // 提交到 API，生成分享链接
      const response = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          result,
          userName: name || '匿名用户',
          region,
          visaId,
        }),
      });

      const data = await response.json();

      if (data.success && data.code) {
        // 跳转到分享页面
        router.push(`/share/${data.code}`);
      } else {
        // 如果 API 失败（比如没配置 RESEND_API_KEY），降级到本地结果页
        console.warn('API submit failed, falling back to local result');
        const params = new URLSearchParams({
          region,
          visa: visaId,
          score: result.totalScore.toString(),
          grade: result.grade,
          name: name || '匿名用户',
        });
        router.push(`/result?${params.toString()}`);
      }
    } catch (error) {
      console.error('Submit error:', error);
      // 网络错误也降级到本地结果页
      const params = new URLSearchParams({
        region,
        visa: visaId,
        score: result.totalScore.toString(),
        grade: result.grade,
        name: name || '匿名用户',
      });
      router.push(`/result?${params.toString()}`);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0:
        return answers.age >= 18 && answers.education !== undefined;
      case 1:
        return answers.annualIncome > 0 && answers.savings > 0;
      default:
        return true;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{regionConfig.flag}</span>
              <div>
                <h1 className="font-semibold text-slate-900">{regionConfig.name}</h1>
                <p className="text-xs text-slate-500">{visaType.name}</p>
              </div>
            </div>
            <div className="text-sm text-slate-500">
              第 {currentStep + 1} / {STEPS.length} 部分
            </div>
          </div>

          {/* Progress Bar */}
          <div className="flex gap-1">
            {STEPS.map((step, idx) => (
              <div
                key={step.id}
                className={`h-1.5 flex-1 rounded-full step-indicator ${
                  idx < currentStep
                    ? 'completed'
                    : idx === currentStep
                    ? 'active'
                    : 'pending'
                }`}
              />
            ))}
          </div>
        </div>
      </header>

      {/* Step Tabs */}
      <div className="bg-white border-b border-slate-200 overflow-x-auto">
        <div className="max-w-2xl mx-auto px-4 flex gap-1 py-2">
          {STEPS.map((step, idx) => {
            const Icon = step.icon;
            return (
              <button
                key={step.id}
                onClick={() => setCurrentStep(idx)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-all ${
                  idx === currentStep
                    ? 'bg-blue-100 text-blue-700 font-medium'
                    : idx < currentStep
                    ? 'bg-green-100 text-green-700'
                    : 'text-slate-500 hover:bg-slate-100'
                }`}
              >
                {idx < currentStep ? <Check className="w-3.5 h-3.5" /> : <Icon className="w-3.5 h-3.5" />}
                {step.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Form Content */}
      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          {/* Step 1: Personal Info */}
          {currentStep === 0 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  您的姓名（可选，用于报告）
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="留空则显示为匿名用户"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  年龄
                </label>
                <input
                  type="number"
                  min="18"
                  max="80"
                  value={answers.age}
                  onChange={(e) => updateAnswer('age', parseInt(e.target.value) || 18)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  最高学历
                </label>
                <select
                  value={answers.education}
                  onChange={(e) => updateAnswer('education', e.target.value as UserAnswers['education'])}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
                >
                  <option value="high_school">高中</option>
                  <option value="bachelor">本科</option>
                  <option value="master">硕士</option>
                  <option value="phd">博士</option>
                  <option value="other">其他</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  出境旅行过的国家数量
                </label>
                <input
                  type="number"
                  min="0"
                  max="50"
                  value={answers.previousTravel}
                  onChange={(e) => updateAnswer('previousTravel', parseInt(e.target.value) || 0)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
                />
                <p className="text-xs text-slate-500 mt-1">包括商务出差、旅游、留学等所有出境记录</p>
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                <div>
                  <p className="font-medium text-slate-700">是否有签证拒签记录？</p>
                  <p className="text-sm text-slate-500">如实填写有助于更准确的评估</p>
                </div>
                <button
                  onClick={() => updateAnswer('previousVisaDenial', !answers.previousVisaDenial)}
                  className={`px-4 py-2 rounded-full font-medium transition ${
                    answers.previousVisaDenial
                      ? 'bg-red-100 text-red-700'
                      : 'bg-green-100 text-green-700'
                  }`}
                >
                  {answers.previousVisaDenial ? '有' : '无'}
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Financial */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  年收入（万人民币）
                </label>
                <input
                  type="number"
                  min="0"
                  value={answers.annualIncome}
                  onChange={(e) => updateAnswer('annualIncome', parseInt(e.target.value) || 0)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  银行存款（万人民币）
                </label>
                <input
                  type="number"
                  min="0"
                  value={answers.savings}
                  onChange={(e) => updateAnswer('savings', parseInt(e.target.value) || 0)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div
                  onClick={() => updateAnswer('hasProperty', !answers.hasProperty)}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition ${
                    answers.hasProperty ? 'border-blue-500 bg-blue-50' : 'border-slate-200'
                  }`}
                >
                  <p className="font-medium text-slate-700">商业房产</p>
                  <p className="text-sm text-slate-500">如购买的商业地产</p>
                </div>
                <div
                  onClick={() => updateAnswer('hasVehicle', !answers.hasVehicle)}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition ${
                    answers.hasVehicle ? 'border-blue-500 bg-blue-50' : 'border-slate-200'
                  }`}
                >
                  <p className="font-medium text-slate-700">私家车</p>
                  <p className="text-sm text-slate-500">本人名下汽车</p>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Purpose */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  出行目的
                </label>
                <select
                  value={answers.purpose}
                  onChange={(e) => updateAnswer('purpose', e.target.value as UserAnswers['purpose'])}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
                >
                  <option value="tourism">旅游观光</option>
                  <option value="business">商务出差</option>
                  <option value="visit_family">探亲访友</option>
                  <option value="study">留学读书</option>
                  <option value="work">工作就业</option>
                </select>
              </div>

              <div
                onClick={() => updateAnswer('hasInvitation', !answers.hasInvitation)}
                className={`p-4 rounded-xl border-2 cursor-pointer transition ${
                  answers.hasInvitation ? 'border-blue-500 bg-blue-50' : 'border-slate-200'
                }`}
              >
                <p className="font-medium text-slate-700">是否有邀请函或担保信？</p>
                <p className="text-sm text-slate-500">邀请函可以显著提升出签率</p>
                <div className={`mt-2 text-sm font-medium ${answers.hasInvitation ? 'text-blue-600' : 'text-slate-400'}`}>
                  {answers.hasInvitation ? '✓ 有' : '✗ 无'}
                </div>
              </div>

              <div
                onClick={() => updateAnswer('hasDetailedPlan', !answers.hasDetailedPlan)}
                className={`p-4 rounded-xl border-2 cursor-pointer transition ${
                  answers.hasDetailedPlan ? 'border-blue-500 bg-blue-50' : 'border-slate-200'
                }`}
              >
                <p className="font-medium text-slate-700">是否有详细的行程计划？</p>
                <p className="text-sm text-slate-500">包括每日行程、景点预订等</p>
                <div className={`mt-2 text-sm font-medium ${answers.hasDetailedPlan ? 'text-blue-600' : 'text-slate-400'}`}>
                  {answers.hasDetailedPlan ? '✓ 有' : '✗ 无'}
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Documents */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  护照有效期（月）
                </label>
                <input
                  type="number"
                  min="1"
                  value={answers.passportValid}
                  onChange={(e) => updateAnswer('passportValid', parseInt(e.target.value) || 1)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
                />
                <p className="text-xs text-slate-500 mt-1">大多数国家要求护照有效期超过6个月</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { key: 'hasTravelInsurance', label: '旅行保险' },
                  { key: 'hasFlightBooking', label: '机票预订单' },
                  { key: 'hasHotelBooking', label: '酒店预订' },
                ].map(({ key, label }) => (
                  <div
                    key={key}
                    onClick={() => updateAnswer(key as 'hasTravelInsurance', !answers[key as 'hasTravelInsurance'])}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition ${
                      answers[key as 'hasTravelInsurance']
                        ? 'border-green-500 bg-green-50'
                        : 'border-slate-200'
                    }`}
                  >
                    <p className="font-medium text-slate-700">{label}</p>
                    <div className={`mt-2 text-sm font-medium ${
                      answers[key as 'hasTravelInsurance'] ? 'text-green-600' : 'text-slate-400'
                    }`}>
                      {answers[key as 'hasTravelInsurance'] ? '✓ 已准备' : '✗ 未准备'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 5: Ties */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <p className="text-slate-600 mb-4">
                国内约束力越强，表明您有足够的理由按时返回，对出签越有利。
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { key: 'hasStableJob', label: '稳定工作', desc: '正式劳动合同、在职证明' },
                  { key: 'hasBusiness', label: '自营业务/营业执照', desc: '本人名下的企业' },
                  { key: 'hasFamilyInChina', label: '直系亲属在中国', desc: '配偶、子女、父母等' },
                  { key: 'hasHouseProperty', label: '个人房产', desc: '本人或配偶名下住房' },
                ].map(({ key, label, desc }) => (
                  <div
                    key={key}
                    onClick={() => updateAnswer(key as 'hasStableJob', !answers[key as 'hasStableJob'])}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition ${
                      answers[key as 'hasStableJob']
                        ? 'border-green-500 bg-green-50'
                        : 'border-slate-200'
                    }`}
                  >
                    <p className="font-medium text-slate-700">{label}</p>
                    <p className="text-sm text-slate-500">{desc}</p>
                    <div className={`mt-2 text-sm font-medium ${
                      answers[key as 'hasStableJob'] ? 'text-green-600' : 'text-slate-400'
                    }`}>
                      {answers[key as 'hasStableJob'] ? '✓ 有' : '✗ 无'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 6: Sensitivity */}
          {currentStep === 5 && (
            <div className="space-y-6">
              <div
                onClick={() => updateAnswer('isSensitiveRegion', !answers.isSensitiveRegion)}
                className={`p-4 rounded-xl border-2 cursor-pointer transition ${
                  answers.isSensitiveRegion ? 'border-red-500 bg-red-50' : 'border-slate-200'
                }`}
              >
                <p className="font-medium text-slate-700">是否来自敏感地区/户籍？</p>
                <p className="text-sm text-slate-500">如福建、广东（部分）、辽宁（部分）等地区</p>
                <div className={`mt-2 text-sm font-medium ${
                  answers.isSensitiveRegion ? 'text-red-600' : 'text-green-600'
                }`}>
                  {answers.isSensitiveRegion ? '⚠ 是' : '✓ 否'}
                </div>
              </div>

              <div
                onClick={() => updateAnswer('hasOfficialPassport', !answers.hasOfficialPassport)}
                className={`p-4 rounded-xl border-2 cursor-pointer transition ${
                  answers.hasOfficialPassport ? 'border-blue-500 bg-blue-50' : 'border-slate-200'
                }`}
              >
                <p className="font-medium text-slate-700">是否持有因公普通护照（官员护照）？</p>
                <p className="text-sm text-slate-500">因公护照在某些国家有免签或优先处理</p>
                <div className={`mt-2 text-sm font-medium ${
                  answers.hasOfficialPassport ? 'text-blue-600' : 'text-slate-400'
                }`}>
                  {answers.hasOfficialPassport ? '✓ 是' : '✗ 否'}
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8 pt-6 border-t border-slate-100">
            {currentStep > 0 ? (
              <button
                onClick={() => setCurrentStep((s) => s - 1)}
                className="flex items-center gap-2 px-5 py-2.5 text-slate-600 hover:text-slate-900 font-medium"
              >
                <ChevronLeft className="w-4 h-4" />
                上一步
              </button>
            ) : (
              <div />
            )}

            {currentStep < STEPS.length - 1 ? (
              <button
                onClick={() => setCurrentStep((s) => s + 1)}
                disabled={!canProceed()}
                className="flex items-center gap-2 px-6 py-2.5 bg-blue-500 text-white font-medium rounded-full hover:bg-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                下一步
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                className="flex items-center gap-2 px-8 py-2.5 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-full hover:shadow-lg transition"
              >
                查看结果
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
