'use client';

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  PDFDownloadLink,
  Image,
  Font,
} from '@react-pdf/renderer';
import { useEffect, useState } from 'react';
import { ScoringResult } from '@/lib/types';
import { regionConfigs } from '@/lib/scoring/regions';
import { dimensionConfigs, dimensionOrder } from '@/lib/scoring/weights';
import { getDocumentChecklist } from '@/lib/scoring/documents';

// 注册中文字体（Noto Sans SC，本地 public/fonts 目录）
Font.register({
  family: 'NotoSansSC',
  fonts: [
    { src: '/fonts/NotoSansSC-Regular.otf', fontWeight: 400 },
    { src: '/fonts/NotoSansSC-Bold.otf', fontWeight: 700 },
  ],
});

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: 'NotoSansSC',
    color: '#1e293b',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingBottom: 14,
  },
  headerLeft: { flexDirection: 'column' },
  title: { fontSize: 20, fontWeight: 700, color: '#0f172a', marginBottom: 4 },
  subtitle: { fontSize: 9, color: '#64748b' },
  headerRight: { alignItems: 'flex-end' },
  region: { fontSize: 14, fontWeight: 700, color: '#334155' },
  visaType: { fontSize: 9, color: '#64748b', marginTop: 2 },
  scoreSection: { marginBottom: 20 },
  scoreCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#f8fafc', padding: 18, borderRadius: 8, marginBottom: 14,
  },
  scoreBig: { fontSize: 34, fontWeight: 700, color: '#3b82f6', marginRight: 14 },
  scoreLabel: { fontSize: 11, color: '#64748b' },
  gradeLabel: { fontSize: 13, fontWeight: 700, marginTop: 3 },
  gradeGreen: { color: '#16a34a' },
  gradeYellow: { color: '#ca8a04' },
  gradeRed: { color: '#dc2626' },
  section: { marginBottom: 18 },
  sectionTitle: {
    fontSize: 11, fontWeight: 700, color: '#334155',
    marginBottom: 10, borderBottomWidth: 1, borderBottomColor: '#e2e8f0', paddingBottom: 5,
  },
  dimensionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  dimensionItem: {
    width: '30%', padding: 8, backgroundColor: '#f8fafc', borderRadius: 6, marginBottom: 3,
  },
  dimensionName: { fontSize: 8, color: '#64748b', marginBottom: 3 },
  dimensionScore: { fontSize: 15, fontWeight: 700 },
  dimensionLow: { color: '#dc2626' },
  dimensionMedium: { color: '#ca8a04' },
  dimensionHigh: { color: '#16a34a' },
  suggestions: {
    backgroundColor: '#fef3c7', padding: 14, borderRadius: 8,
    borderLeftWidth: 3, borderLeftColor: '#f59e0b',
  },
  suggestionTitle: { fontSize: 10, fontWeight: 700, color: '#92400e', marginBottom: 7 },
  suggestionItem: { fontSize: 9, color: '#78350f', marginBottom: 4, flexDirection: 'row' },
  suggestionBullet: { width: 12, color: '#f59e0b' },
  // 材料清单样式
  docSection: { marginBottom: 16 },
  docHeader: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#eff6ff', padding: 8, borderRadius: 6, marginBottom: 8,
  },
  docHeaderText: { fontSize: 10, fontWeight: 700, color: '#1d4ed8', marginLeft: 6 },
  docItem: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 5 },
  docBadgeRequired: {
    backgroundColor: '#dc2626', color: '#fff', fontSize: 7,
    paddingHorizontal: 4, paddingVertical: 1, borderRadius: 3, marginRight: 6,
  },
  docBadgeOptional: {
    backgroundColor: '#94a3b8', color: '#fff', fontSize: 7,
    paddingHorizontal: 4, paddingVertical: 1, borderRadius: 3, marginRight: 6,
  },
  docName: { fontSize: 9, color: '#334155', flex: 1 },
  docNote: { fontSize: 8, color: '#94a3b8', marginTop: 1 },
  bottomSection: { flexDirection: 'row', gap: 16, marginTop: 10 },
  disclaimer: { flex: 1, padding: 12, backgroundColor: '#f1f5f9', borderRadius: 6 },
  disclaimerText: { fontSize: 8, color: '#64748b', lineHeight: 1.4 },
  qrSection: {
    alignItems: 'center', justifyContent: 'center',
    padding: 10, backgroundColor: '#f8fafc', borderRadius: 6, width: 120,
  },
  qrLabel: { fontSize: 8, color: '#64748b', textAlign: 'center', marginTop: 4 },
  footer: {
    position: 'absolute', bottom: 28, left: 40, right: 40,
    borderTopWidth: 1, borderTopColor: '#e2e8f0', paddingTop: 10,
    flexDirection: 'row', justifyContent: 'space-between',
  },
  footerText: { fontSize: 8, color: '#94a3b8' },
  nameField: { fontSize: 10, color: '#64748b', marginBottom: 14 },
});

function getGradeColor(grade: string) {
  switch (grade) {
    case 'green': return styles.gradeGreen;
    case 'yellow': return styles.gradeYellow;
    case 'red': return styles.gradeRed;
    default: return styles.gradeGreen;
  }
}
function getScoreColor(score: number) {
  if (score < 50) return styles.dimensionLow;
  if (score < 70) return styles.dimensionMedium;
  return styles.dimensionHigh;
}
function getGradeLabel(grade: string) {
  switch (grade) {
    case 'green': return '出签前景良好';
    case 'yellow': return '出签概率中等';
    case 'red': return '出签风险较高';
    default: return '';
  }
}

interface PDFDocumentProps {
  result: ScoringResult;
  userName: string;
  qrCodeBase64?: string;
}

const VisaReportPDF = ({ result, userName, qrCodeBase64 }: PDFDocumentProps) => {
  const regionConfig = regionConfigs[result.region];
  const visaType =
    regionConfig.visaTypes.find((v) => v.id === result.visaType) ||
    regionConfig.visaTypes[0];
  const documents = getDocumentChecklist(result.region, result.visaType);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* 页眉 */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.title}>签证出签率评估报告</Text>
            <Text style={styles.subtitle}>Visa Approval Assessment Report</Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.region}>{regionConfig.flag} {regionConfig.name}</Text>
            <Text style={styles.visaType}>{visaType.name}</Text>
          </View>
        </View>

        <Text style={styles.nameField}>评估对象：{userName}</Text>

        {/* 综合评分 */}
        <View style={styles.scoreSection}>
          <View style={styles.scoreCard}>
            <Text style={styles.scoreBig}>{result.totalScore}%</Text>
            <View>
              <Text style={styles.scoreLabel}>综合出签概率</Text>
              <Text style={[styles.gradeLabel, getGradeColor(result.grade)]}>
                {getGradeLabel(result.grade)}
              </Text>
            </View>
          </View>
        </View>

        {/* 六维度 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>六维度评分详情</Text>
          <View style={styles.dimensionGrid}>
            {dimensionOrder.map((dimId) => {
              const dimScore = result.dimensionScores.find((d) => d.dimension === dimId)!;
              const config = dimensionConfigs.find((c) => c.id === dimId)!;
              return (
                <View key={dimId} style={styles.dimensionItem}>
                  <Text style={styles.dimensionName}>{config.name}</Text>
                  <Text style={[styles.dimensionScore, getScoreColor(dimScore.score)]}>
                    {dimScore.score}分
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* 改善建议 */}
        {result.dimensionScores.some((d) => d.suggestions.length > 0) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>改善建议</Text>
            <View style={styles.suggestions}>
              <Text style={styles.suggestionTitle}>建议您在以下方面进行改善：</Text>
              {result.dimensionScores
                .filter((d) => d.suggestions.length > 0)
                .flatMap((d) => d.suggestions)
                .slice(0, 5)
                .map((s, i) => (
                  <View key={i} style={styles.suggestionItem}>
                    <Text style={styles.suggestionBullet}>* </Text>
                    <Text>{s}</Text>
                  </View>
                ))}
            </View>
          </View>
        )}

        {/* 材料准备清单 */}
        {documents.length > 0 && (
          <View style={styles.docSection}>
            <Text style={styles.sectionTitle}>材料准备清单（{visaType.name}）</Text>
            <View style={styles.docHeader}>
              <Text style={styles.docHeaderText}>请根据您的申请类型准备以下材料</Text>
            </View>
            {documents.map((doc, i) => (
              <View key={i} style={styles.docItem}>
                <Text style={doc.required ? styles.docBadgeRequired : styles.docBadgeOptional}>
                  {doc.required ? '必交' : '选交'}
                </Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.docName}>{doc.name}</Text>
                  {doc.note && <Text style={styles.docNote}>{doc.note}</Text>}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* 底部：免责声明 + 二维码 */}
        <View style={styles.bottomSection}>
          <View style={styles.disclaimer}>
            <Text style={styles.disclaimerText}>
              免责声明：本报告仅供参考，不能替代官方正式签证申请。实际出签结果取决于签证官个案审核、
              当前政策、申请季节等多种因素。本工具基于各国官方公开数据和行业通用评估模型，
              不保证评估结果的100%准确性。
            </Text>
          </View>

          {qrCodeBase64 && (
            <View style={styles.qrSection}>
              <Image
                src={`data:image/jpeg;base64,${qrCodeBase64}`}
                style={{ width: 80, height: 80 }}
              />
              <Text style={styles.qrLabel}>扫码获取专业指导</Text>
            </View>
          )}
        </View>

        {/* 页脚 */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            生成时间：{new Date().toLocaleDateString('zh-CN')}
          </Text>
          <Text style={styles.footerText}>数据来源：各国移民局官方年报（2024）</Text>
        </View>
      </Page>
    </Document>
  );
};

interface PDFDownloadButtonProps {
  result: ScoringResult;
  userName: string;
}

async function fetchQRCodeBase64(): Promise<string> {
  try {
    const res = await fetch('/qr-code.jpg');
    const blob = await res.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = (reader.result as string).split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch {
    return '';
  }
}

export default function PDFDownloadButton({ result, userName }: PDFDownloadButtonProps) {
  const [qrCodeBase64, setQrCodeBase64] = useState<string>('');

  useEffect(() => {
    fetchQRCodeBase64().then(setQrCodeBase64);
  }, []);

  const regionConfig = regionConfigs[result.region];
  const fileName = `签证评估报告_${regionConfig.name}_${new Date().toISOString().split('T')[0]}.pdf`;

  return (
    <PDFDownloadLink
      document={<VisaReportPDF result={result} userName={userName} qrCodeBase64={qrCodeBase64} />}
      fileName={fileName}
      className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full font-medium hover:shadow-lg transition"
    >
      {({ loading }) =>
        loading ? (
          '生成中...'
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            导出PDF报告
          </>
        )
      }
    </PDFDownloadLink>
  );
}
