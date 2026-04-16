import { DimensionConfig, ScoringDimension } from '../types';

// 六大维度权重配置
export const dimensionConfigs: DimensionConfig[] = [
  {
    id: 'personal',
    name: '个人基础条件',
    nameEn: 'Personal Profile',
    weight: 0.25,
    description: '年龄、学历、出境记录',
  },
  {
    id: 'financial',
    name: '财务状况',
    nameEn: 'Financial Status',
    weight: 0.25,
    description: '收入、存款、资产证明',
  },
  {
    id: 'purpose',
    name: '出行目的',
    nameEn: 'Travel Purpose',
    weight: 0.20,
    description: '出行目的真实性与合理性',
  },
  {
    id: 'documents',
    name: '材料完整性',
    nameEn: 'Document Completeness',
    weight: 0.15,
    description: '护照、行程单、住宿等材料',
  },
  {
    id: 'ties',
    name: '国内约束力',
    nameEn: 'Ties to Home Country',
    weight: 0.10,
    description: '工作、房产、家庭纽带',
  },
  {
    id: 'sensitivity',
    name: '户籍敏感度',
    nameEn: 'Regional Sensitivity',
    weight: 0.05,
    description: '地区敏感性因素',
  },
];

export const dimensionOrder: ScoringDimension[] = [
  'personal',
  'financial',
  'purpose',
  'documents',
  'ties',
  'sensitivity',
];

export function getDimensionConfig(id: ScoringDimension): DimensionConfig | undefined {
  return dimensionConfigs.find((d) => d.id === id);
}
