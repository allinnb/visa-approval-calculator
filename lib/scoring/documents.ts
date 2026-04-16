// 各地区/签证类型对应的材料准备清单
export interface DocumentItem {
  name: string;
  required: boolean;
  note?: string;
}

export interface DocumentChecklist {
  [visaKey: string]: DocumentItem[]; // key: "region-visaId"
}

export const documentChecklists: DocumentChecklist = {
  // ---------- 美国 ----------
  'usa-b1b2': [
    { name: '有效护照（有效期6个月以上）', required: true },
    { name: 'DS-160 确认页', required: true, note: '在线填写后打印' },
    { name: '签证照片（5.1×5.1cm，白底）', required: true, note: '近6个月内拍摄' },
    { name: '面谈确认信', required: true },
    { name: '资产证明（银行流水/房产证）', required: true },
    { name: '在职证明/营业执照', required: true },
    { name: '往返机票预订单', required: false, note: '建议提供' },
    { name: '酒店预订单', required: false },
    { name: '行程计划单', required: false },
    { name: '邀请函（如适用）', required: false },
    { name: '美方联系人信息', required: false },
  ],
  'usa-f1': [
    { name: '有效护照（有效期6个月以上）', required: true },
    { name: 'DS-160 确认页', required: true },
    { name: 'I-20 表格', required: true, note: '由美国学校提供' },
    { name: 'SEVIS I-901 缴费收据', required: true, note: '在 SEVIS 系统缴纳' },
    { name: '签证照片（5.1×5.1cm）', required: true },
    { name: '面谈确认信', required: true },
    { name: '录取通知书', required: true },
    { name: 'SEVIS 费收据', required: true },
    { name: '资产证明（覆盖第一年学费+生活费）', required: true },
    { name: '成绩单/学历证明', required: true },
    { name: '英语水平证明（托福/雅思）', required: false },
    { name: '学习计划', required: false },
  ],
  'usa-h1b': [
    { name: '有效护照（有效期6个月以上）', required: true },
    { name: 'DS-160 确认页', required: true },
    { name: 'I-797 批准通知', required: true, note: 'H-1B 申请批准函' },
    { name: ' LCA 劳工条件申请', required: true },
    { name: '签证照片', required: true },
    { name: '雇主信件', required: true },
    { name: '学历/专业证书', required: true },
    { name: '简历', required: false },
    { name: '劳动合同', required: false },
  ],

  // ---------- 加拿大 ----------
  'canada-tourist': [
    { name: '有效护照（有效期6个月以上）', required: true },
    { name: '临时居民访问签证申请表（IMM 5257）', required: true },
    { name: '家庭信息表（IMM 5707）', required: true },
    { name: '签证照片（3.5×4.5cm）', required: true },
    { name: '资产证明（6个月银行流水）', required: true },
    { name: '在职证明/在读证明', required: true },
    { name: '旅行历史证明（旧护照/签证页）', required: false, note: '有助于出签' },
    { name: '往返机票预订单', required: false },
    { name: '邀请人邀请函（如适用）', required: false },
    { name: '邀请人身份证明（枫叶卡/学签/工签复印件）', required: false },
    { name: '关系证明（户口本/结婚证）', required: false },
  ],
  'canada-study': [
    { name: '有效护照（有效期6个月以上）', required: true },
    { name: '学习许可申请表（IMM 1294）', required: true },
    { name: '家庭信息表（IMM 5707）', required: true },
    { name: '签证照片（3.5×4.5cm）', required: true },
    { name: '录取通知书（LOA）', required: true },
    { name: '缴费收据（第一年学费）', required: true },
    { name: 'GIC（担保证明）', required: true, note: '加拿大银行$10,000加元' },
    { name: '资产证明', required: true },
    { name: '体检证明', required: true, note: '加拿大指定体检机构' },
    { name: '无犯罪记录证明', required: false },
    { name: '学历/成绩单公证', required: false },
    { name: '语言成绩（雅思/法语TEF）', required: false },
  ],
  'canada-super': [
    { name: '有效护照', required: true },
    { name: '超级签证申请表（IMM 5257）', required: true },
    { name: '家庭信息表', required: true },
    { name: '签证照片', required: true },
    { name: '加方子女/孙辈的邀请函', required: true },
    { name: '子女/孙辈的身份证明（枫叶卡复印件）', required: true },
    { name: '子女/孙辈的收入证明', required: true, note: '满足最低收入要求' },
    { name: '父母/祖父母与子女关系证明', required: true },
    { name: '资产证明', required: true },
    { name: '加拿大医疗保险证明（至少1年）', required: true },
    { name: '体检证明', required: true },
  ],
  'canada-ee': [
    { name: '有效护照', required: true },
    { name: 'EE 档案号', required: true },
    { name: '语言成绩（雅思G类/TEF）', required: true },
    { name: '学历认证报告（WES/ECA）', required: true },
    { name: '工作证明信', required: true },
    { name: '无犯罪记录证明', required: true },
    { name: '资产证明', required: true },
    { name: '体检证明', required: true },
    { name: '出生公证', required: false },
    { name: '婚姻状况公证', required: false },
  ],

  // ---------- 英国 ----------
  'uk-visitor': [
    { name: '有效护照（有效期6个月以上）', required: true },
    { name: '签证申请表（在线填写）', required: true },
    { name: '签证照片（4.5×3.5cm，白底）', required: true },
    { name: '资产证明（6个月银行流水）', required: true },
    { name: '在职证明/在读证明', required: true },
    { name: '往返机票预订单', required: false, note: '建议提供' },
    { name: '酒店预订单', required: false },
    { name: '旅行保险', required: false },
    { name: '邀请函（如适用）', required: false },
    { name: '护照旧签证页', required: false, note: '有助于出签' },
  ],
  'uk-student': [
    { name: '有效护照', required: true },
    { name: '签证申请表（CAS 号）', required: true },
    { name: 'CAS（录取确认函）', required: true, note: '由英国学校提供' },
    { name: '签证照片', required: true },
    { name: '资产证明（学费+9个月生活费）', required: true },
    { name: '雅思成绩单', required: true },
    { name: '学历/成绩单', required: true },
    { name: '肺结核检测证明', required: true, note: '英国指定机构' },
    { name: 'ATAS 证书（部分专业）', required: false },
  ],
  'uk-work': [
    { name: '有效护照', required: true },
    { name: '签证申请表', required: true },
    { name: 'CoS（担保证书）', required: true, note: '由英国雇主提供' },
    { name: '签证照片', required: true },
    { name: '学历证书', required: true },
    { name: '无犯罪记录证明', required: false },
    { name: '肺结核检测证明', required: true },
  ],

  // ---------- 澳大利亚 ----------
  'australia-tourist': [
    { name: '有效护照（有效期6个月以上）', required: true },
    { name: '访客签证申请表（Form 1419）', required: true },
    { name: '签证照片', required: true },
    { name: '资产证明（银行流水）', required: true },
    { name: '在职证明/在读证明', required: true },
    { name: '旅行历史证明', required: false, note: '旧护照或签证页' },
    { name: '往返机票预订单', required: false },
    { name: '邀请人材料（如适用）', required: false },
    { name: '行程计划', required: false },
  ],
  'australia-student': [
    { name: '有效护照', required: true },
    { name: '学生签证申请表（Form 500）', required: true },
    { name: 'CoE（入学确认书）', required: true, note: '由澳洲学校提供' },
    { name: '签证照片', required: true },
    { name: '资产证明（学费+生活费）', required: true },
    { name: 'GTE（真实短期入境声明）', required: true },
    { name: '语言成绩（雅思/托福/PTE）', required: false, note: '视学校要求' },
    { name: '学历/成绩单', required: false },
    { name: '海外学生健康保险（OSHC）', required: true },
    { name: '体检证明', required: false, note: '部分申请人需体检' },
  ],
  'australia-employer': [
    { name: '有效护照', required: true },
    { name: '雇主担保工签申请表（Form 1216）', required: true },
    { name: '签证照片', required: true },
    { name: '雇主提名确认函', required: true },
    { name: '学历/专业证书', required: true },
    { name: '工作证明信', required: true },
    { name: '无犯罪记录证明', required: true },
    { name: '语言成绩（雅思4个5分以上）', required: true },
    { name: '职业评估报告', required: true, note: '相关职业评估机构' },
  ],

  // ---------- 新西兰 ----------
  'nz-visitor': [
    { name: '有效护照（有效期6个月以上）', required: true },
    { name: '访客签证申请表（INZ 1185）', required: true },
    { name: '签证照片', required: true },
    { name: '资产证明（6个月银行流水）', required: true },
    { name: '在职证明/在读证明', required: true },
    { name: '往返机票预订单', required: false },
    { name: '旅行保险', required: false },
    { name: '邀请函（如适用）', required: false },
  ],
  'nz-student': [
    { name: '有效护照', required: true },
    { name: '学生签证申请表（INZ 1012）', required: true },
    { name: 'CoE（入学确认书）', required: true },
    { name: '签证照片', required: true },
    { name: '资产证明（学费+生活费）', required: true },
    { name: 'GNSW（新西兰学历声明）', required: true },
    { name: '语言成绩（雅思等）', required: false, note: '视学校要求' },
    { name: '海外学生健康保险（OSHC）', required: true },
    { name: '体检证明', required: true, note: '胸片/X光' },
    { name: '无犯罪记录证明', required: true },
  ],
  'nz-silver': [
    { name: '有效护照', required: true },
    { name: '银蕨求职签证申请表', required: true },
    { name: '签证照片', required: true },
    { name: '学历/职业评估报告', required: true },
    { name: '技术工作Offer或简历', required: true },
    { name: '资产证明', required: true },
    { name: '无犯罪记录证明', required: true },
    { name: '语言成绩（雅思6.5分以上）', required: true },
    { name: '体检证明', required: true },
  ],

  // ---------- 申根 ----------
  'schengen-tourist': [
    { name: '有效护照（有效期3个月以上，2页空白）', required: true },
    { name: '申根签证申请表', required: true },
    { name: '签证照片（3.5×4.5cm，白底）', required: true },
    { name: '往返机票预订单', required: true },
    { name: '行程计划单（酒店预订单）', required: true },
    { name: '旅行保险（保额3万欧元以上）', required: true, note: '覆盖全程' },
    { name: '资产证明（6个月银行流水）', required: true },
    { name: '在职证明/在读证明', required: true },
    { name: '申根区医疗保险', required: true },
    { name: '邀请函（如适用）', required: false },
    { name: '户口本公证（部分领区）', required: false },
    { name: '旧申根签证页（如有）', required: false, note: '有助于出签' },
  ],
};

// 获取材料清单
export function getDocumentChecklist(region: string, visaId: string): DocumentItem[] {
  return documentChecklists[`${region}-${visaId}`] || [];
}
