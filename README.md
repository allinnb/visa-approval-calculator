# 签证出签率自测系统

一款帮助用户评估签证申请通过概率的开源工具，支持美国、加拿大、英国、澳大利亚、新西兰、申根地区六大区域的签证评估。

![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)
![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)

## 功能特性

- **六国/地区支持** - 美国、加拿大、英国、澳大利亚、新西兰、申根地区
- **六维度评分模型** - 个人条件、财务状况、出行目的、材料完整性、国内约束力、户籍敏感度
- **可视化雷达图** - 直观展示各维度得分
- **PDF 报告导出** - 一键生成专业评估报告
- **响应式设计** - 完美适配桌面和移动设备
- **隐私友好** - 纯前端应用，数据不上传服务器

## 评分维度

| 维度 | 权重 | 说明 |
|------|------|------|
| 个人基础条件 | 25% | 年龄、学历、出境记录 |
| 财务状况 | 25% | 收入、存款、资产证明 |
| 出行目的 | 20% | 目的真实性、邀请函、行程计划 |
| 材料完整性 | 15% | 护照有效期、保险、机票酒店预订 |
| 国内约束力 | 10% | 工作、房产、家庭纽带 |
| 户籍敏感度 | 5% | 地区敏感性因素 |

## 数据来源

各国签证批准率数据来源于：

- 美国：CBP Travel Statistics / VisaGuide.it
- 加拿大：IRCC Annual Report 2024 / CIC News
- 英国：UKVI Immigration Statistics / Schengenvisainfo
- 澳大利亚：Home Affairs Department Visa Grant Numbers
- 新西兰：Immigration NZ Official Data / Stats NZ
- 申根区：Schengenvisainfo.com / EU Official Statistics

> **注意**：本工具仅供参考，不能替代官方正式签证申请。

## 快速开始

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

访问 http://localhost:3000

### 生产构建

```bash
npm run build
npm start
```

## 项目结构

```
visa-approval-calculator/
├── app/
│   ├── page.tsx              # 首页（地区选择）
│   ├── questionnaire/
│   │   └── [region]/page.tsx # 问卷表单页
│   └── result/
│       └── page.tsx         # 结果展示页
├── components/
│   ├── questionnaire-form.tsx # 分步问卷表单
│   ├── radar-chart.tsx       # 雷达图组件
│   └── pdf-report.tsx        # PDF 导出组件
├── lib/
│   ├── types.ts               # TypeScript 类型定义
│   ├── scoring/
│   │   ├── algorithm.ts       # 核心评分算法
│   │   ├── weights.ts        # 维度权重配置
│   │   └── regions.ts        # 地区配置
│   └── data/
│       └── official-rates.ts  # 官方批准率数据
└── public/
```

## 技术栈

- **框架**：Next.js 16 (App Router)
- **语言**：TypeScript
- **样式**：Tailwind CSS
- **图表**：Recharts
- **PDF**：`@react-pdf/renderer`
- **表单**：React Hook Form + Zod
- **图标**：Lucide React

## 贡献

欢迎提交 Issue 和 Pull Request！

## 开源协议

MIT License

---

*本工具仅供参考，实际签证结果取决于多种因素，请以官方信息为准。*
