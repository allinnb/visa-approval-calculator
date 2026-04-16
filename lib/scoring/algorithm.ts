import { UserAnswers, ScoringResult, DimensionScore, ScoringDimension, Region } from '../types';
import { dimensionConfigs, dimensionOrder, getDimensionConfig } from './weights';
import { getRegionConfig, getVisaType } from './regions';

// 计算个人基础条件维度得分
function calcPersonalScore(answers: UserAnswers): { score: number; suggestions: string[] } {
  let score = 0;
  const suggestions: string[] = [];

  // 年龄得分（18-45岁最佳）
  if (answers.age >= 25 && answers.age <= 50) {
    score += 30;
  } else if (answers.age >= 18 && answers.age < 25) {
    score += 20;
  } else if (answers.age > 50 && answers.age <= 65) {
    score += 20;
  } else {
    score += 10;
    suggestions.push('年龄因素可能在审核中受到关注，建议准备充分的出行说明');
  }

  // 学历得分
  const eduScores: Record<string, number> = {
    phd: 25,
    master: 22,
    bachelor: 18,
    high_school: 10,
    other: 8,
  };
  score += eduScores[answers.education] || 0;

  // 出境记录得分
  if (answers.previousTravel >= 5) {
    score += 25;
  } else if (answers.previousTravel >= 3) {
    score += 20;
  } else if (answers.previousTravel >= 1) {
    score += 12;
  } else {
    score += 5;
    suggestions.push('建议积累更多出境记录，发达国家出入境章有助于提升信誉');
  }

  // 拒签记录
  if (answers.previousVisaDenial) {
    score = Math.max(0, score - 20);
    suggestions.push('有拒签记录，建议在申请中如实说明，并提供更充分的材料');
  }

  return { score: Math.min(100, score), suggestions };
}

// 计算财务状况维度得分
function calcFinancialScore(answers: UserAnswers): { score: number; suggestions: string[] } {
  let score = 0;
  const suggestions: string[] = [];

  // 年收入得分
  if (answers.annualIncome >= 50) {
    score += 35;
  } else if (answers.annualIncome >= 30) {
    score += 28;
  } else if (answers.annualIncome >= 20) {
    score += 22;
  } else if (answers.annualIncome >= 10) {
    score += 15;
  } else {
    score += 8;
    suggestions.push('收入水平偏低，建议提供更多资产证明作为补充');
  }

  // 存款得分
  if (answers.savings >= 50) {
    score += 35;
  } else if (answers.savings >= 30) {
    score += 28;
  } else if (answers.savings >= 15) {
    score += 22;
  } else if (answers.savings >= 5) {
    score += 15;
  } else {
    score += 8;
    suggestions.push('存款证明不足，建议提供更多资金证明');
  }

  // 资产加成
  if (answers.hasProperty) score += 15;
  if (answers.hasVehicle) score += 15;

  return { score: Math.min(100, score), suggestions };
}

// 计算出行目的维度得分
function calcPurposeScore(answers: UserAnswers): { score: number; suggestions: string[] } {
  let score = 0;
  const suggestions: string[] = [];

  // 目的真实性（留学/工作目的明确，更容易获批）
  const purposeScores: Record<string, number> = {
    study: 35,
    work: 35,
    business: 30,
    visit_family: 25,
    tourism: 22,
  };
  score += purposeScores[answers.purpose] || 20;

  // 邀请函加成
  if (answers.hasInvitation) {
    score += 30;
  } else {
    suggestions.push('有邀请函可大幅提升出签率，建议联系邀请方提供邀请函');
  }

  // 详细行程
  if (answers.hasDetailedPlan) {
    score += 20;
  } else {
    suggestions.push('建议提供详细的行程计划，包括机票、酒店预订');
  }

  return { score: Math.min(100, score), suggestions };
}

// 计算材料完整性维度得分
function calcDocumentsScore(answers: UserAnswers): { score: number; suggestions: string[] } {
  let score = 0;
  const suggestions: string[] = [];

  // 护照有效期
  if (answers.passportValid >= 12) {
    score += 30;
  } else if (answers.passportValid >= 6) {
    score += 20;
  } else {
    score += 8;
    suggestions.push('护照有效期不足，建议更新护照');
  }

  // 旅行保险
  if (answers.hasTravelInsurance) {
    score += 25;
  } else {
    suggestions.push('建议购买旅行保险，特别是申根地区这是强制要求');
  }

  // 机票预订
  if (answers.hasFlightBooking) {
    score += 25;
  } else {
    suggestions.push('建议提供机票预订单（可退改签的预订单）');
  }

  // 酒店预订
  if (answers.hasHotelBooking) {
    score += 20;
  } else {
    suggestions.push('建议提供酒店预订确认单');
  }

  return { score: Math.min(100, score), suggestions };
}

// 计算约束力维度得分
function calcTiesScore(answers: UserAnswers): { score: number; suggestions: string[] } {
  let score = 0;
  const suggestions: string[] = [];

  // 稳定工作
  if (answers.hasStableJob) {
    score += 35;
  } else {
    suggestions.push('稳定的工作是重要的约束力证明，建议提供在职证明');
  }

  // 营业执照/生意
  if (answers.hasBusiness) {
    score += 25;
  }

  // 家庭纽带
  if (answers.hasFamilyInChina) {
    score += 30;
  } else {
    suggestions.push('在国内有直系亲属是重要的回国约束力证明');
  }

  // 房产
  if (answers.hasHouseProperty) {
    score += 10;
  }

  return { score: Math.min(100, score), suggestions };
}

// 计算敏感度维度得分
function calcSensitivityScore(answers: UserAnswers): { score: number; suggestions: string[] } {
  let score = 50; // 基础分
  const suggestions: string[] = [];

  // 敏感地区
  if (answers.isSensitiveRegion) {
    score -= 25;
    suggestions.push('敏感地区户籍建议准备更充分的材料，包括详细的行程说明');
  } else {
    score += 30;
  }

  // 官方护照
  if (answers.hasOfficialPassport) {
    score += 20;
  }

  return { score: Math.max(0, Math.min(100, score)), suggestions };
}

// 计算综合评分
export function calculateScore(
  answers: UserAnswers,
  region: Region,
  visaTypeId: string
): ScoringResult {
  const dimensionResults: Record<ScoringDimension, { score: number; suggestions: string[] }> = {
    personal: calcPersonalScore(answers),
    financial: calcFinancialScore(answers),
    purpose: calcPurposeScore(answers),
    documents: calcDocumentsScore(answers),
    ties: calcTiesScore(answers),
    sensitivity: calcSensitivityScore(answers),
  };

  // 计算加权总分
  let weightedSum = 0;
  const dimensionScores: DimensionScore[] = [];

  for (const dimId of dimensionOrder) {
    const config = getDimensionConfig(dimId)!;
    const result = dimensionResults[dimId];
    const weightedScore = result.score * config.weight;
    weightedSum += weightedScore;

    dimensionScores.push({
      dimension: dimId,
      score: result.score,
      maxScore: 100,
      suggestions: result.suggestions,
    });
  }

  // 获取地区和签证类型系数
  const regionConfig = getRegionConfig(region);
  const visaType = getVisaType(region, visaTypeId);
  const visaCoeff = visaType?.baseApprovalRate ?? 0.8;

  // 综合出签率 = 加权分数 × 地区系数 × 签证类型系数
  const overallRate = Math.min(
    0.99,
    (weightedSum / 100) * regionConfig.coefficient * (visaCoeff * 1.2 + 0.1)
  );

  // 转换为 0-100 的总分
  const totalScore = Math.round(overallRate * 100);

  // 评级
  let grade: 'red' | 'yellow' | 'green';
  if (totalScore < 40) {
    grade = 'red';
  } else if (totalScore < 70) {
    grade = 'yellow';
  } else {
    grade = 'green';
  }

  return {
    totalScore,
    grade,
    dimensionScores,
    region,
    visaType: visaTypeId,
    overallRate,
  };
}

// 生成改善建议
export function generateSuggestions(result: ScoringResult): string[] {
  const suggestions: string[] = [];

  for (const dimScore of result.dimensionScores) {
    if (dimScore.score < 70) {
      suggestions.push(...dimScore.suggestions);
    }
  }

  return suggestions;
}
