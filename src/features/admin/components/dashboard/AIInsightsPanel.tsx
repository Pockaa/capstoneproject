import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { useTheme } from '../../../../context/ThemeContext';
import supabase from '../../../../config/supabaseClient';
import {
  predictProject,
  analyzePortfolio,
  type ProjectData,
  type ProjectPrediction,
  type PortfolioSummary,
} from '../../../../utils/ai/projectPrediction';
import {
  analyzeScheduleRisks,
  type ScheduleData,
  type ScheduleSummary,
} from '../../../../utils/ai/schedulePrediction';

export function AIInsightsPanel() {
  const { isDark } = useTheme();
  const styles = getStyles(isDark);

  const [loading, setLoading] = useState(true);
  const [predictions, setPredictions] = useState<ProjectPrediction[]>([]);
  const [portfolio, setPortfolio] = useState<PortfolioSummary | null>(null);
  const [scheduleRisks, setScheduleRisks] = useState<ScheduleSummary | null>(null);
  const [expandedProject, setExpandedProject] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'projects' | 'schedule'>('overview');

  useEffect(() => {
    fetchAndAnalyze();
  }, []);

  const fetchAndAnalyze = async () => {
    setLoading(true);
    try {
      // Fetch projects
      const { data: projectsData } = await supabase
        .from('projects')
        .select('*, users!manager_id(name)');

      // Fetch schedules
      const { data: schedulesData } = await supabase
        .from('schedules')
        .select('*, projects(name)')
        .order('date', { ascending: true });

      if (projectsData) {
        const projects: ProjectData[] = projectsData.map((p: any) => ({
          id: p.id,
          name: p.name,
          status: p.status,
          progress: p.progress || 0,
          startDate: p.start_date,
          endDate: p.end_date,
          budget: p.budget || '',
          manager: p.users?.name || 'Unknown',
          location: p.location || '',
        }));

        const preds = projects.map(predictProject);
        const portfolioAnalysis = analyzePortfolio(projects);
        setPredictions(preds);
        setPortfolio(portfolioAnalysis);
      }

      if (schedulesData) {
        const schedules: ScheduleData[] = schedulesData.map((s: any) => ({
          id: s.id,
          task_name: s.task_name || 'Unnamed Task',
          date: s.date,
          time: s.time || '',
          status: s.status,
          project_id: s.project_id,
          projectName: s.projects?.name || 'Unknown',
        }));

        const schedAnalysis = analyzeScheduleRisks(schedules);
        setScheduleRisks(schedAnalysis);
      }
    } catch (err) {
      console.error('AI Analysis error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <View style={styles.aiIconBadge}>
            <MaterialCommunityIcons name="brain" size={18} color="#fff" />
          </View>
          <Text style={styles.panelTitle}>AI Intelligence</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8b5cf6" />
          <Text style={styles.loadingText}>Analyzing project data...</Text>
        </View>
      </View>
    );
  }

  const activeProjects = predictions.filter(
    p => p.status !== 'Completed' && p.status !== 'Not Started'
  );
  const riskyProjects = predictions.filter(
    p => p.status === 'At Risk' || p.status === 'Behind Schedule' || p.status === 'Critical'
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View style={styles.aiIconBadge}>
          <MaterialCommunityIcons name="brain" size={18} color="#fff" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.panelTitle}>AI Intelligence</Text>
          <Text style={styles.panelSubtitle}>Predictive analytics powered by on-device AI</Text>
        </View>
        <TouchableOpacity onPress={fetchAndAnalyze} style={styles.refreshBtn}>
          <Feather name="refresh-cw" size={16} color={isDark ? '#94a3b8' : '#64748b'} />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabRow}>
        {(['overview', 'projects', 'schedule'] as const).map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab === 'overview' ? 'Overview' : tab === 'projects' ? 'Projects' : 'Schedule'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Tab Content */}
      {activeTab === 'overview' && portfolio && (
        <View style={styles.tabContent}>
          {/* Health Score */}
          <View style={styles.healthScoreCard}>
            <View style={styles.healthScoreCircle}>
              <Text style={[styles.healthScoreValue, { 
                color: portfolio.averageHealth >= 70 ? '#22c55e' 
                     : portfolio.averageHealth >= 40 ? '#f59e0b' 
                     : '#ef4444' 
              }]}>
                {portfolio.averageHealth}
              </Text>
              <Text style={styles.healthScoreLabel}>Health</Text>
            </View>
            <View style={styles.healthScoreDetails}>
              <Text style={styles.healthTitle}>Portfolio Health Score</Text>
              <Text style={styles.healthDescription}>
                {portfolio.averageHealth >= 70
                  ? 'Your projects are in good shape overall.'
                  : portfolio.averageHealth >= 40
                  ? 'Some projects need attention. Review the details below.'
                  : 'Multiple projects at risk. Immediate action recommended.'}
              </Text>
            </View>
          </View>

          {/* Status Distribution */}
          <View style={styles.statusGrid}>
            <View style={[styles.statusItem, { borderLeftColor: '#22c55e' }]}>
              <Text style={[styles.statusCount, { color: '#22c55e' }]}>{portfolio.onTrack}</Text>
              <Text style={styles.statusLabel}>On Track</Text>
            </View>
            <View style={[styles.statusItem, { borderLeftColor: '#f59e0b' }]}>
              <Text style={[styles.statusCount, { color: '#f59e0b' }]}>{portfolio.atRisk}</Text>
              <Text style={styles.statusLabel}>At Risk</Text>
            </View>
            <View style={[styles.statusItem, { borderLeftColor: '#ef4444' }]}>
              <Text style={[styles.statusCount, { color: '#ef4444' }]}>{portfolio.behind + portfolio.critical}</Text>
              <Text style={styles.statusLabel}>Behind</Text>
            </View>
            <View style={[styles.statusItem, { borderLeftColor: '#3b82f6' }]}>
              <Text style={[styles.statusCount, { color: '#3b82f6' }]}>{portfolio.completed}</Text>
              <Text style={styles.statusLabel}>Done</Text>
            </View>
          </View>

          {/* Top Risks */}
          {portfolio.topRisks.length > 0 && (
            <View style={styles.risksSection}>
              <Text style={styles.sectionTitle}>🔴 Top Risks</Text>
              {portfolio.topRisks.map((risk, i) => (
                <View key={i} style={styles.riskItem}>
                  <Text style={styles.riskProject}>{risk.project}</Text>
                  <Text style={styles.riskIssue}>{risk.issue}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Recommendations */}
          {portfolio.recommendations.length > 0 && (
            <View style={styles.recommendationsSection}>
              <Text style={styles.sectionTitle}>💡 AI Recommendations</Text>
              {portfolio.recommendations.map((rec, i) => (
                <View key={i} style={styles.recItem}>
                  <MaterialCommunityIcons name="lightbulb-outline" size={16} color="#f59e0b" />
                  <Text style={styles.recText}>{rec}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      )}

      {activeTab === 'projects' && (
        <View style={styles.tabContent}>
          {activeProjects.length === 0 ? (
            <Text style={styles.emptyText}>No active projects to analyze.</Text>
          ) : (
            activeProjects
              .sort((a, b) => {
                const order = { 'Critical': 0, 'Behind Schedule': 1, 'At Risk': 2, 'On Track': 3, 'Ahead': 4 };
                return (order[a.status as keyof typeof order] ?? 5) - (order[b.status as keyof typeof order] ?? 5);
              })
              .map(pred => (
                <TouchableOpacity
                  key={pred.projectId}
                  style={styles.predictionCard}
                  onPress={() =>
                    setExpandedProject(expandedProject === pred.projectId ? null : pred.projectId)
                  }
                  activeOpacity={0.7}
                >
                  {/* Card Header */}
                  <View style={styles.predHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.predProjectName}>{pred.projectName}</Text>
                      <View style={styles.predProgressRow}>
                        <View style={styles.predProgressTrack}>
                          <View
                            style={[
                              styles.predProgressFill,
                              { width: `${pred.currentProgress}%`, backgroundColor: pred.statusColor },
                            ]}
                          />
                        </View>
                        <Text style={styles.predProgressText}>{pred.currentProgress}%</Text>
                      </View>
                    </View>
                    <View style={[styles.predBadge, { backgroundColor: pred.statusColor + '20' }]}>
                      <View style={[styles.predBadgeDot, { backgroundColor: pred.statusColor }]} />
                      <Text style={[styles.predBadgeText, { color: pred.statusColor }]}>
                        {pred.status}
                      </Text>
                    </View>
                  </View>

                  {/* Key Metrics */}
                  <View style={styles.predMetrics}>
                    <View style={styles.predMetric}>
                      <MaterialCommunityIcons name="calendar-clock" size={14} color={isDark ? '#94a3b8' : '#6b7280'} />
                      <Text style={styles.predMetricText}>
                        {pred.predictedEndDate
                          ? `Est. ${pred.predictedEndDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
                          : 'No estimate'}
                      </Text>
                    </View>
                    {pred.daysVariance !== 0 && (
                      <View style={styles.predMetric}>
                        <MaterialCommunityIcons
                          name={pred.daysVariance > 0 ? 'arrow-down' : 'arrow-up'}
                          size={14}
                          color={pred.daysVariance > 0 ? '#ef4444' : '#22c55e'}
                        />
                        <Text
                          style={[
                            styles.predMetricText,
                            { color: pred.daysVariance > 0 ? '#ef4444' : '#22c55e' },
                          ]}
                        >
                          {pred.daysVariance > 0 ? `${pred.daysVariance}d late` : `${Math.abs(pred.daysVariance)}d early`}
                        </Text>
                      </View>
                    )}
                    <View style={styles.predMetric}>
                      <MaterialCommunityIcons name="shield-check" size={14} color={isDark ? '#94a3b8' : '#6b7280'} />
                      <Text style={styles.predMetricText}>{pred.confidence}% conf.</Text>
                    </View>
                  </View>

                  {/* Expanded Details */}
                  {expandedProject === pred.projectId && (
                    <View style={styles.expandedSection}>
                      <View style={styles.divider} />

                      {/* AI Recommendation */}
                      <View style={styles.recCard}>
                        <MaterialCommunityIcons name="robot" size={16} color="#8b5cf6" />
                        <Text style={styles.recCardText}>{pred.recommendation}</Text>
                      </View>

                      {/* Budget Analysis */}
                      {pred.budgetAnalysis && (
                        <View style={styles.budgetSection}>
                          <Text style={styles.expandedLabel}>Budget Analysis</Text>
                          <View style={styles.budgetRow}>
                            <Text style={styles.budgetItem}>
                              Estimated Spent: ₱{(pred.budgetAnalysis.estimatedSpent / 1_000_000).toFixed(1)}M
                            </Text>
                            <Text style={[
                              styles.budgetItem,
                              { color: pred.budgetAnalysis.status === 'Over Budget' ? '#ef4444' : '#22c55e' }
                            ]}>
                              {pred.budgetAnalysis.status} ({pred.budgetAnalysis.overBudgetPercent > 0 ? '+' : ''}
                              {pred.budgetAnalysis.overBudgetPercent}%)
                            </Text>
                          </View>
                        </View>
                      )}

                      {/* Risk Factors */}
                      {pred.riskFactors.length > 0 && (
                        <View style={styles.factorsSection}>
                          <Text style={styles.expandedLabel}>Risk Factors</Text>
                          {pred.riskFactors.map((factor, i) => (
                            <View key={i} style={styles.factorItem}>
                              <View style={styles.factorDot} />
                              <Text style={styles.factorText}>{factor}</Text>
                            </View>
                          ))}
                        </View>
                      )}

                      {/* Progress Comparison */}
                      <View style={styles.comparisonSection}>
                        <Text style={styles.expandedLabel}>Progress vs Expected</Text>
                        <View style={styles.comparisonRow}>
                          <View style={styles.comparisonItem}>
                            <Text style={styles.comparisonValue}>{pred.currentProgress}%</Text>
                            <Text style={styles.comparisonLabel}>Actual</Text>
                          </View>
                          <View style={styles.comparisonItem}>
                            <Text style={styles.comparisonValue}>{pred.expectedProgress}%</Text>
                            <Text style={styles.comparisonLabel}>Expected</Text>
                          </View>
                          <View style={styles.comparisonItem}>
                            <Text style={[
                              styles.comparisonValue,
                              { color: pred.progressDeviation >= 0 ? '#22c55e' : '#ef4444' }
                            ]}>
                              {pred.progressDeviation > 0 ? '+' : ''}{pred.progressDeviation}%
                            </Text>
                            <Text style={styles.comparisonLabel}>Deviation</Text>
                          </View>
                        </View>
                      </View>
                    </View>
                  )}

                  {/* Expand indicator */}
                  <View style={styles.expandIndicator}>
                    <Feather
                      name={expandedProject === pred.projectId ? 'chevron-up' : 'chevron-down'}
                      size={16}
                      color={isDark ? '#64748b' : '#9ca3af'}
                    />
                  </View>
                </TouchableOpacity>
              ))
          )}
        </View>
      )}

      {activeTab === 'schedule' && scheduleRisks && (
        <View style={styles.tabContent}>
          {/* Schedule Risk Summary */}
          <View style={styles.scheduleRiskGrid}>
            <View style={[styles.schedRiskItem, { backgroundColor: isDark ? '#064e3b20' : '#ecfdf5' }]}>
              <Text style={[styles.schedRiskCount, { color: '#10b981' }]}>{scheduleRisks.lowRisk}</Text>
              <Text style={styles.schedRiskLabel}>Low Risk</Text>
            </View>
            <View style={[styles.schedRiskItem, { backgroundColor: isDark ? '#78350f20' : '#fffbeb' }]}>
              <Text style={[styles.schedRiskCount, { color: '#f59e0b' }]}>{scheduleRisks.mediumRisk}</Text>
              <Text style={styles.schedRiskLabel}>Medium</Text>
            </View>
            <View style={[styles.schedRiskItem, { backgroundColor: isDark ? '#7f1d1d20' : '#fef2f2' }]}>
              <Text style={[styles.schedRiskCount, { color: '#ef4444' }]}>{scheduleRisks.highRisk + scheduleRisks.criticalRisk}</Text>
              <Text style={styles.schedRiskLabel}>High/Critical</Text>
            </View>
          </View>

          {/* Upcoming Deadlines */}
          {scheduleRisks.upcomingDeadlines.length > 0 && (
            <View style={styles.risksSection}>
              <Text style={styles.sectionTitle}>⏰ Upcoming Deadlines</Text>
              {scheduleRisks.upcomingDeadlines.map((dl, i) => (
                <View key={i} style={styles.deadlineItem}>
                  <View style={[
                    styles.deadlineDot,
                    { backgroundColor: dl.risk === 'Critical' ? '#dc2626' : dl.risk === 'High' ? '#ef4444' : dl.risk === 'Medium' ? '#f59e0b' : '#10b981' }
                  ]} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.deadlineTask}>{dl.task}</Text>
                    <Text style={styles.deadlineMeta}>
                      {dl.daysUntil < 0
                        ? `${Math.abs(dl.daysUntil)}d overdue`
                        : dl.daysUntil === 0
                        ? 'Due today'
                        : `${dl.daysUntil}d remaining`}
                    </Text>
                  </View>
                  <View style={[
                    styles.riskBadge,
                    { backgroundColor: dl.risk === 'Critical' || dl.risk === 'High' ? '#fef2f2' : dl.risk === 'Medium' ? '#fffbeb' : '#ecfdf5' }
                  ]}>
                    <Text style={[
                      styles.riskBadgeText,
                      { color: dl.risk === 'Critical' || dl.risk === 'High' ? '#ef4444' : dl.risk === 'Medium' ? '#f59e0b' : '#10b981' }
                    ]}>{dl.risk}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Schedule Insights */}
          {scheduleRisks.insights.length > 0 && (
            <View style={styles.recommendationsSection}>
              <Text style={styles.sectionTitle}>📊 Schedule Insights</Text>
              {scheduleRisks.insights.map((insight, i) => (
                <View key={i} style={styles.recItem}>
                  <MaterialCommunityIcons name="information-outline" size={16} color="#3b82f6" />
                  <Text style={styles.recText}>{insight}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const getStyles = (isDark: boolean) =>
  StyleSheet.create({
    container: {
      backgroundColor: isDark ? '#1e293b' : '#ffffff',
      borderRadius: 16,
      borderWidth: 1,
      borderColor: isDark ? '#334155' : '#e2e8f0',
      overflow: 'hidden',
      ...Platform.select({
        web: { boxShadow: '0 4px 6px -1px rgba(0,0,0,0.07), 0 2px 4px -1px rgba(0,0,0,0.04)' },
        default: { elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8 },
      }),
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      padding: 20,
      paddingBottom: 16,
    },
    aiIconBadge: {
      width: 36,
      height: 36,
      borderRadius: 10,
      backgroundColor: '#8b5cf6',
      alignItems: 'center',
      justifyContent: 'center',
    },
    panelTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: isDark ? '#f8fafc' : '#0f172a',
    },
    panelSubtitle: {
      fontSize: 12,
      color: isDark ? '#64748b' : '#94a3b8',
      marginTop: 2,
    },
    refreshBtn: {
      padding: 8,
      borderRadius: 8,
      backgroundColor: isDark ? '#334155' : '#f1f5f9',
    },
    loadingContainer: {
      alignItems: 'center',
      padding: 40,
      gap: 16,
    },
    loadingText: {
      color: isDark ? '#94a3b8' : '#64748b',
      fontSize: 14,
    },

    // Tabs
    tabRow: {
      flexDirection: 'row',
      paddingHorizontal: 20,
      gap: 4,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#334155' : '#f1f5f9',
    },
    tab: {
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderBottomWidth: 2,
      borderBottomColor: 'transparent',
    },
    tabActive: {
      borderBottomColor: '#8b5cf6',
    },
    tabText: {
      fontSize: 13,
      fontWeight: '600',
      color: isDark ? '#64748b' : '#94a3b8',
    },
    tabTextActive: {
      color: '#8b5cf6',
    },
    tabContent: {
      padding: 20,
    },

    // Health Score
    healthScoreCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 20,
      backgroundColor: isDark ? '#0f172a' : '#f8fafc',
      borderRadius: 12,
      padding: 20,
      marginBottom: 16,
    },
    healthScoreCircle: {
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: isDark ? '#1e293b' : '#ffffff',
      borderWidth: 3,
      borderColor: isDark ? '#334155' : '#e2e8f0',
      alignItems: 'center',
      justifyContent: 'center',
    },
    healthScoreValue: {
      fontSize: 24,
      fontWeight: '800',
    },
    healthScoreLabel: {
      fontSize: 9,
      fontWeight: '600',
      color: isDark ? '#64748b' : '#94a3b8',
      textTransform: 'uppercase',
      marginTop: -2,
    },
    healthScoreDetails: {
      flex: 1,
    },
    healthTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: isDark ? '#f8fafc' : '#0f172a',
      marginBottom: 4,
    },
    healthDescription: {
      fontSize: 13,
      color: isDark ? '#94a3b8' : '#64748b',
      lineHeight: 18,
    },

    // Status Grid
    statusGrid: {
      flexDirection: 'row',
      gap: 8,
      marginBottom: 20,
    },
    statusItem: {
      flex: 1,
      backgroundColor: isDark ? '#0f172a' : '#f8fafc',
      borderRadius: 10,
      padding: 12,
      alignItems: 'center',
      borderLeftWidth: 3,
    },
    statusCount: {
      fontSize: 22,
      fontWeight: '800',
    },
    statusLabel: {
      fontSize: 10,
      fontWeight: '600',
      color: isDark ? '#64748b' : '#94a3b8',
      marginTop: 2,
      textTransform: 'uppercase',
    },

    // Risks Section
    risksSection: {
      marginBottom: 16,
    },
    sectionTitle: {
      fontSize: 14,
      fontWeight: '700',
      color: isDark ? '#f8fafc' : '#0f172a',
      marginBottom: 10,
    },
    riskItem: {
      backgroundColor: isDark ? '#0f172a' : '#fef2f2',
      borderRadius: 8,
      padding: 12,
      marginBottom: 6,
      borderLeftWidth: 3,
      borderLeftColor: '#ef4444',
    },
    riskProject: {
      fontSize: 13,
      fontWeight: '700',
      color: isDark ? '#f8fafc' : '#0f172a',
    },
    riskIssue: {
      fontSize: 12,
      color: isDark ? '#94a3b8' : '#64748b',
      marginTop: 2,
    },

    // Recommendations
    recommendationsSection: {
      marginBottom: 8,
    },
    recItem: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 10,
      paddingVertical: 8,
      paddingHorizontal: 12,
      backgroundColor: isDark ? '#0f172a' : '#fffbeb',
      borderRadius: 8,
      marginBottom: 6,
    },
    recText: {
      flex: 1,
      fontSize: 13,
      color: isDark ? '#e2e8f0' : '#334155',
      lineHeight: 18,
    },

    // Prediction Cards
    predictionCard: {
      backgroundColor: isDark ? '#0f172a' : '#f8fafc',
      borderRadius: 12,
      padding: 16,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: isDark ? '#334155' : '#e2e8f0',
    },
    predHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 12,
    },
    predProjectName: {
      fontSize: 15,
      fontWeight: '700',
      color: isDark ? '#f8fafc' : '#0f172a',
      marginBottom: 8,
    },
    predProgressRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    predProgressTrack: {
      flex: 1,
      height: 6,
      backgroundColor: isDark ? '#334155' : '#e2e8f0',
      borderRadius: 3,
      overflow: 'hidden',
    },
    predProgressFill: {
      height: '100%',
      borderRadius: 3,
    },
    predProgressText: {
      fontSize: 12,
      fontWeight: '700',
      color: isDark ? '#94a3b8' : '#64748b',
      width: 36,
      textAlign: 'right',
    },
    predBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
    },
    predBadgeDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
    },
    predBadgeText: {
      fontSize: 10,
      fontWeight: '700',
      textTransform: 'uppercase',
    },
    predMetrics: {
      flexDirection: 'row',
      gap: 16,
      marginTop: 12,
      flexWrap: 'wrap',
    },
    predMetric: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    predMetricText: {
      fontSize: 12,
      color: isDark ? '#94a3b8' : '#64748b',
      fontWeight: '500',
    },

    // Expanded Section
    expandedSection: {
      marginTop: 12,
    },
    divider: {
      height: 1,
      backgroundColor: isDark ? '#334155' : '#e2e8f0',
      marginBottom: 12,
    },
    recCard: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 8,
      backgroundColor: isDark ? '#1e293b' : '#faf5ff',
      borderRadius: 8,
      padding: 12,
      marginBottom: 12,
      borderLeftWidth: 3,
      borderLeftColor: '#8b5cf6',
    },
    recCardText: {
      flex: 1,
      fontSize: 13,
      color: isDark ? '#e2e8f0' : '#334155',
      lineHeight: 18,
    },
    expandedLabel: {
      fontSize: 12,
      fontWeight: '700',
      color: isDark ? '#94a3b8' : '#64748b',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: 8,
    },
    budgetSection: {
      marginBottom: 12,
    },
    budgetRow: {
      gap: 4,
    },
    budgetItem: {
      fontSize: 13,
      color: isDark ? '#e2e8f0' : '#334155',
    },
    factorsSection: {
      marginBottom: 12,
    },
    factorItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 4,
    },
    factorDot: {
      width: 4,
      height: 4,
      borderRadius: 2,
      backgroundColor: '#ef4444',
    },
    factorText: {
      fontSize: 12,
      color: isDark ? '#cbd5e1' : '#475569',
    },
    comparisonSection: {
      marginBottom: 4,
    },
    comparisonRow: {
      flexDirection: 'row',
      gap: 12,
    },
    comparisonItem: {
      flex: 1,
      backgroundColor: isDark ? '#1e293b' : '#ffffff',
      borderRadius: 8,
      padding: 10,
      alignItems: 'center',
    },
    comparisonValue: {
      fontSize: 18,
      fontWeight: '800',
      color: isDark ? '#f8fafc' : '#0f172a',
    },
    comparisonLabel: {
      fontSize: 10,
      fontWeight: '600',
      color: isDark ? '#64748b' : '#94a3b8',
      textTransform: 'uppercase',
      marginTop: 2,
    },

    // Expand indicator
    expandIndicator: {
      alignItems: 'center',
      marginTop: 8,
    },

    // Schedule Risk
    scheduleRiskGrid: {
      flexDirection: 'row',
      gap: 8,
      marginBottom: 20,
    },
    schedRiskItem: {
      flex: 1,
      borderRadius: 10,
      padding: 14,
      alignItems: 'center',
    },
    schedRiskCount: {
      fontSize: 22,
      fontWeight: '800',
    },
    schedRiskLabel: {
      fontSize: 10,
      fontWeight: '600',
      color: isDark ? '#64748b' : '#94a3b8',
      marginTop: 2,
    },

    // Deadlines
    deadlineItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#334155' : '#f1f5f9',
    },
    deadlineDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    deadlineTask: {
      fontSize: 13,
      fontWeight: '600',
      color: isDark ? '#f8fafc' : '#0f172a',
    },
    deadlineMeta: {
      fontSize: 11,
      color: isDark ? '#64748b' : '#94a3b8',
      marginTop: 1,
    },
    riskBadge: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
    },
    riskBadgeText: {
      fontSize: 10,
      fontWeight: '700',
      textTransform: 'uppercase',
    },

    emptyText: {
      textAlign: 'center',
      color: isDark ? '#64748b' : '#94a3b8',
      fontSize: 14,
      padding: 20,
    },
  });
