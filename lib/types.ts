// 地区枚举
export type Region = 'usa' | 'canada' | 'uk' | 'australia' | 'nz' | 'schengen';

// 签证类型
export interface VisaType {
  id: string;
  name: string;
  nameEn: string;
  description: string;
  baseApprovalRate: number; // 基础批准率 (0-1)
}

// 评分维度
export type ScoringDimension =
  | 'personal'
  | 'financial'
  | 'purpose'
  | 'documents'
  | 'ties'
  | 'sensitivity';

// 维度配置
export interface DimensionConfig {
  id: ScoringDimension;
  name: string;
  nameEn: string;
  weight: number; // 权重 (0-1)
  description: string;
}

// 地区配置
export interface RegionConfig {
  id: Region;
  name: string;
  flag: string;
  visaTypes: VisaType[];
  baseApprovalRate: number;
  coefficient: number; // 地区整体系数
}

// 用户答案
export interface UserAnswers {
  // 个人基础条件
  age: number; // 年龄
  education: 'high_school' | 'bachelor' | 'master' | 'phd' | 'other';
  previousTravel: number; // 之前出境国家数量
  previousVisaDenial: boolean; // 是否有拒签史

  // 财务状况
  annualIncome: number; // 年收入（万人民币）
  savings: number; // 存款（万人民币）
  hasProperty: boolean; // 是否有房产
  hasVehicle: boolean; // 是否有车

  // 出行目的
  purpose: 'tourism' | 'business' | 'visit_family' | 'study' | 'work';
  hasInvitation: boolean; // 是否有邀请函
  hasDetailedPlan: boolean; // 是否有详细行程

  // 材料完整性
  passportValid: number; // 护照有效期（月）
  hasTravelInsurance: boolean;
  hasFlightBooking: boolean;
  hasHotelBooking: boolean;

  // 约束力
  hasStableJob: boolean;
  hasBusiness: boolean;
  hasFamilyInChina: boolean;
  hasHouseProperty: boolean;

  // 敏感度
  isSensitiveRegion: boolean;
  hasOfficialPassport: boolean;
}

// 维度得分
export interface DimensionScore {
  dimension: ScoringDimension;
  score: number; // 0-100
  maxScore: number;
  suggestions: string[];
}

// 评分结果
export interface ScoringResult {
  totalScore: number; // 0-100
  grade: 'red' | 'yellow' | 'green';
  dimensionScores: DimensionScore[];
  region: Region;
  visaType: string;
  overallRate: number; // 综合出签率
}
