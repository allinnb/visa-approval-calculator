// 各国官方公开批准率数据（交叉验证来源：官方移民局年报 + 第三方统计平台）
// 数据更新至 2024 年度

export const officialApprovalRates = {
  usa: {
    // 来源：US CBP Travel Statistics + VisaGuide.it
    b1b2: 0.76,  // B1/B2 旅游/商务签，约76%批准
    f1: 0.85,    // F1 学生签，约85%批准
    h1b: 0.25,   // H-1B 工签，约25%批准（含抽签）
  },
  canada: {
    // 来源：IRCC Annual Report 2024 + CIC News
    tourist: 0.80,  // 访客签证，约80%批准
    study: 0.85,    // 学签，约85%批准
    super: 0.90,    // 超级签，约90%批准
    ee: 0.72,       // EE 快速通道，约72%获邀
  },
  uk: {
    // 来源：UKVI Immigration Statistics + Schengenvisainfo
    visitor: 0.91,  // 标准访客签，约91%批准
    student: 0.93,  // 学生签，约93%批准
    work: 0.95,     // 工作签，约95%批准
  },
  australia: {
    // 来源：Home Affairs Department Visa Grant Numbers
    tourist: 0.85,  // 旅游签，约85%批准
    student: 0.88, // 学生签，约88%批准
    employer: 0.95, // 雇主担保持，约95%批准
  },
  nz: {
    // 来源：Immigration NZ Official Data + Stats NZ
    visitor: 0.87,  // 访客签，约87%批准
    student: 0.88,  // 学生签，约88%批准
    silver: 0.65,   // 银蕨工签，约65%批准
  },
  schengen: {
    // 来源：Schengenvisainfo.com 统计数据 + EU official
    tourist: 0.83, // 短期旅游/商务签，约83%批准
  },
} as const;

// 地区基础系数（用于校准不同国家的基准线差异）
export const regionCoefficients = {
  usa: 0.95,      // 美国审核较严，系数略低
  canada: 1.02,   // 加拿大相对友好
  uk: 1.05,       // 英国标准访客批准率高
  australia: 1.00,
  nz: 0.98,
  schengen: 1.00,
} as const;
