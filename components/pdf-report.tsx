'use client';

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  PDFDownloadLink,
} from '@react-pdf/renderer';
import { ScoringResult } from '@/lib/types';
import { regionConfigs } from '@/lib/scoring/regions';
import { dimensionConfigs, dimensionOrder } from '@/lib/scoring/weights';

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    color: '#1e293b',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingBottom: 16,
  },
  headerLeft: {
    flexDirection: 'column',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 10,
    color: '#64748b',
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  region: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#334155',
  },
  visaType: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 2,
  },
  scoreSection: {
    marginBottom: 24,
  },
  scoreCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 20,
    borderRadius: 8,
    marginBottom: 16,
  },
  scoreBig: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#3b82f6',
    marginRight: 16,
  },
  scoreLabel: {
    fontSize: 12,
    color: '#64748b',
  },
  gradeLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 4,
  },
  gradeGreen: { color: '#16a34a' },
  gradeYellow: { color: '#ca8a04' },
  gradeRed: { color: '#dc2626' },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#334155',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingBottom: 6,
  },
  dimensionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dimensionItem: {
    width: '30%',
    padding: 10,
    backgroundColor: '#f8fafc',
    borderRadius: 6,
    marginBottom: 4,
  },
  dimensionName: {
    fontSize: 8,
    color: '#64748b',
    marginBottom: 4,
  },
  dimensionScore: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  dimensionLow: {
    color: '#dc2626',
  },
  dimensionMedium: {
    color: '#ca8a04',
  },
  dimensionHigh: {
    color: '#16a34a',
  },
  suggestions: {
    backgroundColor: '#fef3c7',
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#f59e0b',
  },
  suggestionTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#92400e',
    marginBottom: 8,
  },
  suggestionItem: {
    fontSize: 9,
    color: '#78350f',
    marginBottom: 4,
    flexDirection: 'row',
  },
  suggestionBullet: {
    width: 12,
    color: '#f59e0b',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerText: {
    fontSize: 8,
    color: '#94a3b8',
  },
  disclaimer: {
    marginTop: 24,
    padding: 12,
    backgroundColor: '#f1f5f9',
    borderRadius: 6,
  },
  disclaimerText: {
    fontSize: 8,
    color: '#64748b',
    lineHeight: 1.4,
  },
  nameField: {
    fontSize: 10,
    color: '#64748b',
    marginBottom: 16,
  },
});

function getGradeColor(grade: string) {
  switch (grade) {
    case 'green':
      return styles.gradeGreen;
    case 'yellow':
      return styles.gradeYellow;
    case 'red':
      return styles.gradeRed;
    default:
      return styles.gradeGreen;
  }
}

function getScoreColor(score: number) {
  if (score < 50) return styles.dimensionLow;
  if (score < 70) return styles.dimensionMedium;
  return styles.dimensionHigh;
}

function getGradeLabel(grade: string) {
  switch (grade) {
    case 'green':
      return '出签前景良好';
    case 'yellow':
      return '出签概率中等';
    case 'red':
      return '出签风险较高';
    default:
      return '';
  }
}

interface PDFDocumentProps {
  result: ScoringResult;
  userName: string;
}

const VisaReportPDF = ({ result, userName }: PDFDocumentProps) => {
  const regionConfig = regionConfigs[result.region];
  const visaType = regionConfig.visaTypes.find((v) => v.id === result.visaType) || regionConfig.visaTypes[0];

  return (
    <Document>
      <Page size="A4" style={styles.page}>
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
                    <Text style={styles.suggestionBullet}>• </Text>
                    <Text>{s}</Text>
                  </View>
                ))}
            </View>
          </View>
        )}

        <View style={styles.disclaimer}>
          <Text style={styles.disclaimerText}>
            免责声明：本报告仅供参考，不能替代官方正式签证申请。实际出签结果取决于签证官个案审核、
            当前政策、申请季节等多种因素。本工具基于各国官方公开数据和行业通用评估模型，
            不保证评估结果的100%准确性。
          </Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>生成时间：{new Date().toLocaleDateString('zh-CN')}</Text>
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

export default function PDFDownloadButton({ result, userName }: PDFDownloadButtonProps) {
  const regionConfig = regionConfigs[result.region];
  const fileName = `签证评估报告_${regionConfig.name}_${new Date().toISOString().split('T')[0]}.pdf`;

  return (
    <PDFDownloadLink
      document={<VisaReportPDF result={result} userName={userName} />}
      fileName={fileName}
      className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full font-medium hover:shadow-lg transition"
    >
      {({ loading }) =>
        loading ? '生成中...' : (
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
