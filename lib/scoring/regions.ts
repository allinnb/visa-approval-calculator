import { RegionConfig, Region, VisaType } from '../types';
import { regionCoefficients } from '../data/official-rates';

const usaVisas: VisaType[] = [
  {
    id: 'b1b2',
    name: 'B1/B2 旅游/商务签证',
    nameEn: 'B1/B2 Tourist/Business Visa',
    description: '适用于赴美旅游、探亲访友或短期商务活动',
    baseApprovalRate: 0.76,
  },
  {
    id: 'f1',
    name: 'F1 学生签证',
    nameEn: 'F1 Student Visa',
    description: '适用于赴美就读认可的教育机构',
    baseApprovalRate: 0.85,
  },
  {
    id: 'h1b',
    name: 'H-1B 工作签证',
    nameEn: 'H-1B Work Visa',
    description: '适用于专业职业的工作签证，需要雇主担保',
    baseApprovalRate: 0.25,
  },
];

const canadaVisas: VisaType[] = [
  {
    id: 'tourist',
    name: '访客签证（TRV）',
    nameEn: 'Temporary Resident Visa (TRV)',
    description: '适用于赴加拿大旅游、探亲访友',
    baseApprovalRate: 0.80,
  },
  {
    id: 'study',
    name: '学习许可（学签）',
    nameEn: 'Study Permit',
    description: '适用于赴加拿大指定院校学习',
    baseApprovalRate: 0.85,
  },
  {
    id: 'super',
    name: '超级签证',
    nameEn: 'Super Visa',
    description: '适用于父母/祖父母探亲，最长停留2年',
    baseApprovalRate: 0.90,
  },
  {
    id: 'ee',
    name: 'EE 快速通道',
    nameEn: 'Express Entry',
    description: '技术移民通道，综合评分制',
    baseApprovalRate: 0.72,
  },
];

const ukVisas: VisaType[] = [
  {
    id: 'visitor',
    name: '标准访客签证',
    nameEn: 'Standard Visitor Visa',
    description: '适用于赴英旅游、探亲访友或短期商务',
    baseApprovalRate: 0.91,
  },
  {
    id: 'student',
    name: '学生签证',
    nameEn: 'Student Visa',
    description: '适用于赴英国认可教育机构学习',
    baseApprovalRate: 0.93,
  },
  {
    id: 'work',
    name: '工作签证',
    nameEn: 'Work Visa',
    description: '适用于 Skilled Worker 路径',
    baseApprovalRate: 0.95,
  },
];

const australiaVisas: VisaType[] = [
  {
    id: 'tourist',
    name: '访客签证（600类）',
    nameEn: 'Tourist Visa (Subclass 600)',
    description: '适用于赴澳大利亚旅游、探亲访友',
    baseApprovalRate: 0.85,
  },
  {
    id: 'student',
    name: '学生签证（500类）',
    nameEn: 'Student Visa (Subclass 500)',
    description: '适用于赴澳大利亚学习',
    baseApprovalRate: 0.88,
  },
  {
    id: 'employer',
    name: '雇主担保签证（482类）',
    nameEn: 'Employer Sponsored Visa (Subclass 482)',
    description: '需要澳大利亚雇主担保',
    baseApprovalRate: 0.95,
  },
];

const nzVisas: VisaType[] = [
  {
    id: 'visitor',
    name: '访客签证',
    nameEn: 'Visitor Visa',
    description: '适用于赴新西兰旅游、探亲访友',
    baseApprovalRate: 0.87,
  },
  {
    id: 'student',
    name: '学生签证',
    nameEn: 'Student Visa',
    description: '适用于赴新西兰学习',
    baseApprovalRate: 0.88,
  },
  {
    id: 'silver',
    name: '银蕨工签（SFV）',
    nameEn: 'Silver Fern Visa (SFV)',
    description: '面向新西兰指定职业的技术工签',
    baseApprovalRate: 0.65,
  },
];

const schengenVisas: VisaType[] = [
  {
    id: 'tourist',
    name: '申根短期签证',
    nameEn: 'Schengen Short-Stay Visa',
    description: '适用于访问申根区26国，最长90天',
    baseApprovalRate: 0.83,
  },
];

export const regionConfigs: Record<Region, RegionConfig> = {
  usa: {
    id: 'usa',
    name: '美国',
    flag: '🇺🇸',
    visaTypes: usaVisas,
    baseApprovalRate: 0.76,
    coefficient: regionCoefficients.usa,
  },
  canada: {
    id: 'canada',
    name: '加拿大',
    flag: '🇨🇦',
    visaTypes: canadaVisas,
    baseApprovalRate: 0.80,
    coefficient: regionCoefficients.canada,
  },
  uk: {
    id: 'uk',
    name: '英国',
    flag: '🇬🇧',
    visaTypes: ukVisas,
    baseApprovalRate: 0.91,
    coefficient: regionCoefficients.uk,
  },
  australia: {
    id: 'australia',
    name: '澳大利亚',
    flag: '🇦🇺',
    visaTypes: australiaVisas,
    baseApprovalRate: 0.85,
    coefficient: regionCoefficients.australia,
  },
  nz: {
    id: 'nz',
    name: '新西兰',
    flag: '🇳🇿',
    visaTypes: nzVisas,
    baseApprovalRate: 0.87,
    coefficient: regionCoefficients.nz,
  },
  schengen: {
    id: 'schengen',
    name: '申根地区',
    flag: '🇪🇺',
    visaTypes: schengenVisas,
    baseApprovalRate: 0.83,
    coefficient: regionCoefficients.schengen,
  },
};

export const allRegions: Region[] = ['usa', 'canada', 'uk', 'australia', 'nz', 'schengen'];

export function getRegionConfig(region: Region): RegionConfig {
  return regionConfigs[region];
}

export function getVisaType(region: Region, visaId: string): VisaType | undefined {
  return regionConfigs[region].visaTypes.find((v) => v.id === visaId);
}
