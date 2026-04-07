import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { analyzeReport, type ReportAnalysis } from '../../../utils/ai/reportAnalysis';

interface ReportAIAnalysisProps {
  taskDone: string;
  currentTask: string;
  materialUsed: string;
  materialRequest: string;
  projectName?: string;
  date?: string;
  compact?: boolean;
}

export function ReportAIAnalysis({
  taskDone,
  currentTask,
  materialUsed,
  materialRequest,
  projectName,
  date,
  compact = false,
}: ReportAIAnalysisProps) {
  const [analysis, setAnalysis] = useState<ReportAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(!compact);

  useEffect(() => {
    runAnalysis();
  }, [taskDone, currentTask, materialUsed, materialRequest]);

  const runAnalysis = async () => {
    // Only analyze if there's actual content
    const hasContent = [taskDone, currentTask, materialUsed, materialRequest]
      .some(f => f && f.trim().length > 0);
    
    if (!hasContent) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const result = await analyzeReport({
        taskDone,
        currentTask,
        materialUsed,
        materialRequest,
        projectName,
        date,
      });
      setAnalysis(result);
    } catch (err: any) {
      setError(err?.message || 'Analysis failed');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingRow}>
          <ActivityIndicator size="small" color="#8b5cf6" />
          <Text style={styles.loadingText}>AI analyzing report...</Text>
        </View>
      </View>
    );
  }

  if (error || !analysis) {
    return null;
  }

  const urgencyIcons: Record<string, string> = {
    LOW: 'shield-check',
    MEDIUM: 'alert-circle-outline',
    HIGH: 'alert',
    CRITICAL: 'alert-octagon',
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <TouchableOpacity
        style={styles.header}
        onPress={() => setExpanded(!expanded)}
        activeOpacity={0.7}
      >
        <View style={styles.headerLeft}>
          <View style={styles.aiIconBadge}>
            <MaterialCommunityIcons name="brain" size={14} color="#fff" />
          </View>
          <Text style={styles.headerTitle}>AI Analysis</Text>
          {analysis.aiPowered && (
            <View style={styles.aiTag}>
              <Text style={styles.aiTagText}>AI</Text>
            </View>
          )}
          {!analysis.aiPowered && (
            <View style={[styles.aiTag, { backgroundColor: '#dbeafe' }]}>
              <Text style={[styles.aiTagText, { color: '#2563eb' }]}>Rule-Based</Text>
            </View>
          )}
        </View>
        <View style={styles.headerRight}>
          <View style={[styles.urgencyBadge, { backgroundColor: analysis.urgencyColor + '18' }]}>
            <MaterialCommunityIcons
              name={urgencyIcons[analysis.urgency] as any || 'information'}
              size={14}
              color={analysis.urgencyColor}
            />
            <Text style={[styles.urgencyText, { color: analysis.urgencyColor }]}>
              {analysis.urgency}
            </Text>
          </View>
          <Feather
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={16}
            color="#94a3b8"
          />
        </View>
      </TouchableOpacity>

      {expanded && (
        <View style={styles.body}>
          {/* Summary */}
          <View style={styles.summaryCard}>
            <MaterialCommunityIcons name="text-box-outline" size={16} color="#8b5cf6" />
            <Text style={styles.summaryText}>{analysis.summary}</Text>
          </View>

          {/* Categories */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Categories</Text>
            <View style={styles.tagsRow}>
              {analysis.categories.map((cat, i) => (
                <View key={i} style={styles.categoryTag}>
                  <Text style={styles.categoryTagText}>{cat}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Safety Flags */}
          {analysis.safetyFlags.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>⚠️ Safety Concerns</Text>
              {analysis.safetyFlags.map((flag, i) => (
                <View key={i} style={styles.safetyItem}>
                  <MaterialCommunityIcons name="alert-circle" size={14} color="#ef4444" />
                  <Text style={styles.safetyText}>{flag}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Materials */}
          {analysis.materials.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>📦 Materials Detected</Text>
              {analysis.materials.map((mat, i) => (
                <View key={i} style={styles.materialItem}>
                  <View style={[
                    styles.materialActionBadge,
                    mat.action === 'needed' ? { backgroundColor: '#fef3c7' }
                    : mat.action === 'used' ? { backgroundColor: '#dbeafe' }
                    : { backgroundColor: '#f1f5f9' }
                  ]}>
                    <Text style={[
                      styles.materialActionText,
                      mat.action === 'needed' ? { color: '#b45309' }
                      : mat.action === 'used' ? { color: '#2563eb' }
                      : { color: '#64748b' }
                    ]}>
                      {mat.action.toUpperCase()}
                    </Text>
                  </View>
                  <Text style={styles.materialName}>{mat.name}</Text>
                  {mat.quantity && (
                    <Text style={styles.materialQty}>{mat.quantity}</Text>
                  )}
                </View>
              ))}
            </View>
          )}

          {/* Equipment */}
          {analysis.equipment.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>🔧 Equipment</Text>
              {analysis.equipment.map((eq, i) => (
                <View key={i} style={styles.equipmentItem}>
                  <View style={[
                    styles.equipDot,
                    { backgroundColor: eq.status === 'down' ? '#ef4444' : '#10b981' }
                  ]} />
                  <Text style={styles.equipName}>{eq.name}</Text>
                  <Text style={[
                    styles.equipStatus,
                    { color: eq.status === 'down' ? '#ef4444' : '#64748b' }
                  ]}>
                    {eq.status === 'down' ? 'Out of Service' : eq.status === 'operational' ? 'Operational' : ''}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Issues */}
          {analysis.issues.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>🚧 Issues Detected</Text>
              {analysis.issues.map((issue, i) => (
                <View key={i} style={styles.issueItem}>
                  <Feather name="alert-triangle" size={13} color="#f59e0b" />
                  <Text style={styles.issueText}>{issue}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Key Insights */}
          {analysis.keyInsights.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>💡 Key Insights</Text>
              {analysis.keyInsights.map((insight, i) => (
                <View key={i} style={styles.insightItem}>
                  <MaterialCommunityIcons name="lightbulb-outline" size={14} color="#8b5cf6" />
                  <Text style={styles.insightText}>{insight}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Sentiment & Score Bar */}
          <View style={styles.footerRow}>
            <View style={styles.sentimentBadge}>
              <Text style={styles.sentimentLabel}>Sentiment: </Text>
              <Text style={[styles.sentimentValue, {
                color: analysis.sentiment === 'positive' ? '#22c55e'
                  : analysis.sentiment === 'negative' ? '#ef4444'
                  : analysis.sentiment === 'concerning' ? '#f59e0b'
                  : '#64748b'
              }]}>
                {analysis.sentiment.charAt(0).toUpperCase() + analysis.sentiment.slice(1)}
              </Text>
            </View>
            <View style={styles.scoreBar}>
              <View style={styles.scoreTrack}>
                <View style={[
                  styles.scoreFill,
                  { width: `${analysis.urgencyScore}%`, backgroundColor: analysis.urgencyColor }
                ]} />
              </View>
              <Text style={styles.scoreText}>{analysis.urgencyScore}/100</Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#faf5ff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ede9fe',
    overflow: 'hidden',
    marginVertical: 8,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
  },
  loadingText: {
    fontSize: 13,
    color: '#8b5cf6',
    fontWeight: '500',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  aiIconBadge: {
    width: 26,
    height: 26,
    borderRadius: 7,
    backgroundColor: '#8b5cf6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1e293b',
  },
  aiTag: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  aiTagText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#166534',
    letterSpacing: 0.5,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  urgencyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  urgencyText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  body: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    gap: 12,
  },
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#8b5cf6',
  },
  summaryText: {
    flex: 1,
    fontSize: 13,
    color: '#334155',
    lineHeight: 19,
    fontWeight: '500',
  },
  section: {
    gap: 6,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 2,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  categoryTag: {
    backgroundColor: '#e0e7ff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryTagText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#4338ca',
  },
  safetyItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#fef2f2',
    borderRadius: 8,
    padding: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#ef4444',
  },
  safetyText: {
    flex: 1,
    fontSize: 12,
    color: '#7f1d1d',
    lineHeight: 17,
  },
  materialItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  materialActionBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    minWidth: 50,
    alignItems: 'center',
  },
  materialActionText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  materialName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1e293b',
    flex: 1,
  },
  materialQty: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  equipmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 3,
  },
  equipDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  equipName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1e293b',
    flex: 1,
  },
  equipStatus: {
    fontSize: 11,
    fontWeight: '500',
  },
  issueItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#fffbeb',
    borderRadius: 8,
    padding: 10,
  },
  issueText: {
    flex: 1,
    fontSize: 12,
    color: '#78350f',
    lineHeight: 17,
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingVertical: 4,
  },
  insightText: {
    flex: 1,
    fontSize: 12,
    color: '#475569',
    lineHeight: 17,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#ede9fe',
  },
  sentimentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sentimentLabel: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '500',
  },
  sentimentValue: {
    fontSize: 11,
    fontWeight: '700',
  },
  scoreBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  scoreTrack: {
    width: 60,
    height: 4,
    backgroundColor: '#e2e8f0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  scoreFill: {
    height: '100%',
    borderRadius: 2,
  },
  scoreText: {
    fontSize: 10,
    color: '#94a3b8',
    fontWeight: '600',
  },
});
