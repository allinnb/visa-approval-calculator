'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { regionConfigs, allRegions } from '@/lib/scoring/regions';
import type { Region } from '@/lib/types';
import { Globe, ChevronRight, FileText, Shield, Zap } from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const [selectedRegion, setSelectedRegion] = useState<Region | null>(null);
  const [selectedVisa, setSelectedVisa] = useState<string | null>(null);

  const handleStartAssessment = () => {
    if (selectedRegion && selectedVisa) {
      router.push(`/questionnaire/${selectedRegion}?visa=${selectedVisa}`);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-slate-900">签证出签率自测</h1>
              <p className="text-xs text-slate-500">Visa Approval Calculator</p>
            </div>
          </div>
          <div className="text-sm text-slate-500">免费 · 匿名 · 即时出结果</div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="gradient-text">科学评估</span>您的签证出签概率
          </h2>
          <p className="text-lg text-slate-600 mb-8">
            基于六大维度综合评分，结合各国官方公开数据，助您提前了解申请优势与短板
          </p>

          {/* Feature Pills */}
          <div className="flex flex-wrap justify-center gap-4 mb-12">
            <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm border border-slate-100">
              <Shield className="w-4 h-4 text-blue-500" />
              <span className="text-sm font-medium text-slate-700">数据隐私保护</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm border border-slate-100">
              <Zap className="w-4 h-4 text-amber-500" />
              <span className="text-sm font-medium text-slate-700">3分钟完成评估</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm border border-slate-100">
              <FileText className="w-4 h-4 text-green-500" />
              <span className="text-sm font-medium text-slate-700">PDF报告导出</span>
            </div>
          </div>
        </div>
      </section>

      {/* Region Selection */}
      <section className="py-8 px-4 flex-1">
        <div className="max-w-5xl mx-auto">
          <h3 className="text-xl font-semibold text-slate-900 mb-6 flex items-center gap-2">
            <Globe className="w-5 h-5 text-blue-500" />
            选择目标国家/地区
          </h3>

          {/* Region Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {allRegions.map((regionId) => {
              const config = regionConfigs[regionId];
              const isSelected = selectedRegion === regionId;

              return (
                <button
                  key={regionId}
                  onClick={() => {
                    setSelectedRegion(regionId);
                    setSelectedVisa(null);
                  }}
                  className={`text-left p-5 rounded-2xl border-2 transition-all duration-200 card-hover ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50 shadow-lg shadow-blue-100'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <span className="text-3xl">{config.flag}</span>
                    {isSelected && (
                      <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
                        <ChevronRight className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </div>
                  <h4 className="font-semibold text-slate-900 mb-1">{config.name}</h4>
                  <p className="text-sm text-slate-500">
                    基础批准率约 {Math.round(config.baseApprovalRate * 100)}%
                  </p>
                </button>
              );
            })}
          </div>

          {/* Visa Type Selection */}
          {selectedRegion && (
            <div className="animate-fade-in">
              <h3 className="text-xl font-semibold text-slate-900 mb-4">
                选择签证类型
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-8">
                {regionConfigs[selectedRegion].visaTypes.map((visa) => {
                  const isSelected = selectedVisa === visa.id;
                  return (
                    <button
                      key={visa.id}
                      onClick={() => setSelectedVisa(visa.id)}
                      className={`text-left p-4 rounded-xl border-2 transition-all ${
                        isSelected
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h5 className="font-medium text-slate-900">{visa.name}</h5>
                          <p className="text-sm text-slate-500 mt-1">{visa.description}</p>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-semibold text-green-600">
                            {Math.round(visa.baseApprovalRate * 100)}%
                          </span>
                          <p className="text-xs text-slate-400">批准率</p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Start Button */}
          {selectedRegion && selectedVisa && (
            <div className="flex justify-center mb-16">
              <button
                onClick={handleStartAssessment}
                className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-full shadow-lg shadow-blue-200 hover:shadow-xl hover:shadow-blue-300 transition-all hover:scale-105 flex items-center gap-2"
              >
                开始自测
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 mt-auto">
        <div className="max-w-5xl mx-auto px-4 text-center text-sm text-slate-500">
          <p>本工具仅供参考，不能替代官方正式签证申请。实际结果取决于多种因素。</p>
          <p className="mt-2">数据来源：各国移民局官方年报 + 第三方统计平台（2024年度）</p>
        </div>
      </footer>
    </div>
  );
}
