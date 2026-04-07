/**
 * Project Prediction Engine
 * 
 * Uses linear extrapolation and trend analysis to predict:
 * - Project completion dates
 * - Budget overrun risk
 * - Status classification (On Track / At Risk / Behind Schedule)
 * - Actionable recommendations
 * 
 * Algorithm: Progress Rate Extrapolation with Confidence Scaling
 * All computation runs on-device — no API calls needed.
 */

export interface ProjectData {
  id: string;
  name: string;
  status: string;
  progress: number;        // 0-100
  startDate: string | null;
  endDate: string | null;
  budget: string;
  manager: string;
  location: string;
}

export interface BudgetAnalysis {
  totalBudget: number;
  estimatedSpent: number;
  dailyBurnRate: number;
  projectedTotal: number;
  overBudgetPercent: number;
  status: 'Under Budget' | 'On Budget' | 'Over Budget';
}

export interface ProjectPrediction {
  projectId: string;
  projectName: string;
  currentProgress: number;
  daysSinceStart: number;
  totalPlannedDays: number;
  expectedProgress: number;      // where progress SHOULD be (%)
  progressDeviation: number;     // actual - expected (negative = behind)
  progressRate: number;          // % per day
  estimatedTotalDays: number;
  predictedEndDate: Date | null;
  plannedEndDate: Date | null;
  daysVariance: number;          // positive = late
  status: 'On Track' | 'Ahead' | 'At Risk' | 'Behind Schedule' | 'Critical' | 'Completed' | 'Not Started';
  statusColor: string;
  confidence: number;            // 0-100
  budgetAnalysis: BudgetAnalysis | null;
  recommendation: string;
  riskFactors: string[];
}

export interface PortfolioSummary {
  totalProjects: number;
  onTrack: number;
  atRisk: number;
  behind: number;
  critical: number;
  completed: number;
  averageHealth: number;         // 0-100 portfolio health score
  topRisks: { project: string; issue: string }[];
  recommendations: string[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseBudget(budget: string): number {
  if (!budget) return 0;
  // Handle formats: "₱15M", "₱1.5M", "$500K", "15000000", "₱15,000,000"
  const cleaned = budget.replace(/[₱$,\s]/g, '');
  const match = cleaned.match(/^([\d.]+)\s*([MmKk]?)$/);
  if (!match) return parseFloat(cleaned) || 0;
  const num = parseFloat(match[1]);
  const suffix = match[2].toUpperCase();
  if (suffix === 'M') return num * 1_000_000;
  if (suffix === 'K') return num * 1_000;
  return num;
}

function daysBetween(date1: Date, date2: Date): number {
  return Math.floor((date2.getTime() - date1.getTime()) / (1000 * 60 * 60 * 24));
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// ─── Core Prediction ──────────────────────────────────────────────────────────

export function predictProject(project: ProjectData): ProjectPrediction {
  const now = new Date();
  const startDate = project.startDate ? new Date(project.startDate) : null;
  const endDate = project.endDate ? new Date(project.endDate) : null;
  const progress = clamp(project.progress || 0, 0, 100);

  // Handle completed projects
  if (project.status === 'Completed' || progress >= 100) {
    return {
      projectId: project.id,
      projectName: project.name,
      currentProgress: 100,
      daysSinceStart: startDate ? daysBetween(startDate, now) : 0,
      totalPlannedDays: startDate && endDate ? daysBetween(startDate, endDate) : 0,
      expectedProgress: 100,
      progressDeviation: 0,
      progressRate: 0,
      estimatedTotalDays: startDate && endDate ? daysBetween(startDate, endDate) : 0,
      predictedEndDate: endDate,
      plannedEndDate: endDate,
      daysVariance: 0,
      status: 'Completed',
      statusColor: '#22c55e',
      confidence: 100,
      budgetAnalysis: null,
      recommendation: 'Project completed successfully.',
      riskFactors: [],
    };
  }

  // Handle not-started projects
  if (!startDate || project.status === 'Planning') {
    return {
      projectId: project.id,
      projectName: project.name,
      currentProgress: progress,
      daysSinceStart: 0,
      totalPlannedDays: startDate && endDate ? daysBetween(startDate, endDate) : 0,
      expectedProgress: 0,
      progressDeviation: 0,
      progressRate: 0,
      estimatedTotalDays: 0,
      predictedEndDate: endDate,
      plannedEndDate: endDate,
      daysVariance: 0,
      status: 'Not Started',
      statusColor: '#6366f1',
      confidence: 0,
      budgetAnalysis: null,
      recommendation: 'Project is in planning phase. Set a start date to enable predictions.',
      riskFactors: [],
    };
  }

  // ── Calculate progress metrics ──
  const daysSinceStart = Math.max(daysBetween(startDate, now), 1);
  const totalPlannedDays = endDate ? Math.max(daysBetween(startDate, endDate), 1) : daysSinceStart * 2;
  
  // Expected progress based on elapsed time
  const expectedProgress = clamp((daysSinceStart / totalPlannedDays) * 100, 0, 100);
  const progressDeviation = progress - expectedProgress;
  
  // Progress rate (% per day)
  const progressRate = progress / daysSinceStart;
  
  // Estimated total days to reach 100%
  const estimatedTotalDays = progressRate > 0 ? Math.ceil(100 / progressRate) : totalPlannedDays * 2;
  
  // Predicted end date
  const predictedEndDate = new Date(startDate.getTime());
  predictedEndDate.setDate(predictedEndDate.getDate() + estimatedTotalDays);
  
  // Days variance (positive = late)
  const daysVariance = endDate ? daysBetween(endDate, predictedEndDate) : 0;

  // ── Status classification ──
  let status: ProjectPrediction['status'];
  let statusColor: string;
  
  if (progressDeviation >= 5) {
    status = 'Ahead';
    statusColor = '#22c55e';
  } else if (progressDeviation >= -5 && daysVariance <= 3) {
    status = 'On Track';
    statusColor = '#10b981';
  } else if (progressDeviation >= -15 && daysVariance <= 14) {
    status = 'At Risk';
    statusColor = '#f59e0b';
  } else if (progressDeviation >= -30 && daysVariance <= 30) {
    status = 'Behind Schedule';
    statusColor = '#ef4444';
  } else {
    status = 'Critical';
    statusColor = '#dc2626';
  }

  // On Hold projects
  if (project.status === 'On Hold') {
    status = 'At Risk';
    statusColor = '#f59e0b';
  }

  // ── Confidence score ──
  // Increases with more progress data (more data = more reliable prediction)
  const confidence = clamp(
    Math.round(30 + (progress * 0.5) + (daysSinceStart > 14 ? 15 : daysSinceStart)),
    20,
    95
  );

  // ── Budget analysis ──
  let budgetAnalysis: BudgetAnalysis | null = null;
  const totalBudget = parseBudget(project.budget);
  
  if (totalBudget > 0) {
    const dailyBurnRate = totalBudget / totalPlannedDays;
    const estimatedSpent = dailyBurnRate * daysSinceStart;
    
    // Project total spend based on actual progress rate
    const projectedTotal = progress > 0 
      ? (estimatedSpent / progress) * 100 
      : totalBudget;
    
    const overBudgetPercent = ((projectedTotal - totalBudget) / totalBudget) * 100;
    
    budgetAnalysis = {
      totalBudget,
      estimatedSpent: Math.round(estimatedSpent),
      dailyBurnRate: Math.round(dailyBurnRate),
      projectedTotal: Math.round(projectedTotal),
      overBudgetPercent: Math.round(overBudgetPercent * 10) / 10,
      status: overBudgetPercent <= -5 ? 'Under Budget' 
             : overBudgetPercent <= 5 ? 'On Budget' 
             : 'Over Budget',
    };
  }

  // ── Risk factors ──
  const riskFactors: string[] = [];
  
  if (progressDeviation < -10) {
    riskFactors.push(`Progress is ${Math.abs(Math.round(progressDeviation))}% behind expected`);
  }
  if (daysVariance > 7) {
    riskFactors.push(`Projected ${daysVariance} days late`);
  }
  if (budgetAnalysis && budgetAnalysis.overBudgetPercent > 5) {
    riskFactors.push(`Budget projected ${budgetAnalysis.overBudgetPercent}% over`);
  }
  if (project.status === 'On Hold') {
    riskFactors.push('Project is currently on hold');
  }
  if (progressRate < 0.3 && progress < 50) {
    riskFactors.push('Very slow progress rate detected');
  }

  // ── Recommendation ──
  const recommendation = generateRecommendation(
    status, daysVariance, progressDeviation, progressRate, budgetAnalysis, project
  );

  return {
    projectId: project.id,
    projectName: project.name,
    currentProgress: progress,
    daysSinceStart,
    totalPlannedDays,
    expectedProgress: Math.round(expectedProgress * 10) / 10,
    progressDeviation: Math.round(progressDeviation * 10) / 10,
    progressRate: Math.round(progressRate * 100) / 100,
    estimatedTotalDays,
    predictedEndDate,
    plannedEndDate: endDate,
    daysVariance,
    status,
    statusColor,
    confidence,
    budgetAnalysis,
    recommendation,
    riskFactors,
  };
}

function generateRecommendation(
  status: ProjectPrediction['status'],
  daysVariance: number,
  progressDeviation: number,
  progressRate: number,
  budget: BudgetAnalysis | null,
  project: ProjectData,
): string {
  if (status === 'Ahead') {
    return 'Project is ahead of schedule. Consider reallocating surplus resources to at-risk projects.';
  }
  
  if (status === 'On Track') {
    return 'Project is progressing as planned. Maintain current resource allocation.';
  }

  const parts: string[] = [];

  if (status === 'Critical' || status === 'Behind Schedule') {
    const neededRate = progressRate * (1 + Math.abs(progressDeviation) / 50);
    const crewIncrease = Math.ceil((neededRate / Math.max(progressRate, 0.1) - 1) * 3);
    parts.push(`Increase crew size by ${clamp(crewIncrease, 1, 10)} to recover ~${Math.abs(Math.min(daysVariance, 30))} days.`);
  }

  if (status === 'At Risk') {
    parts.push(`Monitor closely — ${Math.abs(Math.round(progressDeviation))}% deviation from plan.`);
    if (daysVariance > 0) {
      parts.push(`Consider adding resources to recover ${daysVariance} days.`);
    }
  }

  if (project.status === 'On Hold') {
    parts.push('Resume project activities to prevent further delays.');
  }

  if (budget && budget.overBudgetPercent > 10) {
    parts.push(`Review spending — projected ${budget.overBudgetPercent}% over budget.`);
  }

  return parts.join(' ') || 'Continue monitoring project progress.';
}

// ─── Portfolio Analysis ───────────────────────────────────────────────────────

export function analyzePortfolio(projects: ProjectData[]): PortfolioSummary {
  const predictions = projects.map(predictProject);
  
  const onTrack = predictions.filter(p => p.status === 'On Track' || p.status === 'Ahead').length;
  const atRisk = predictions.filter(p => p.status === 'At Risk').length;
  const behind = predictions.filter(p => p.status === 'Behind Schedule').length;
  const critical = predictions.filter(p => p.status === 'Critical').length;
  const completed = predictions.filter(p => p.status === 'Completed').length;

  // Portfolio health score (0-100)
  const activeProjects = predictions.filter(p => p.status !== 'Completed' && p.status !== 'Not Started');
  const healthScores = activeProjects.map(p => {
    if (p.status === 'Ahead') return 100;
    if (p.status === 'On Track') return 85;
    if (p.status === 'At Risk') return 55;
    if (p.status === 'Behind Schedule') return 30;
    if (p.status === 'Critical') return 10;
    return 50;
  });
  const averageHealth = healthScores.length > 0
    ? Math.round(healthScores.reduce((a, b) => a + b, 0) / healthScores.length)
    : 100;

  // Top risks
  const topRisks = predictions
    .filter(p => p.riskFactors.length > 0)
    .sort((a, b) => b.riskFactors.length - a.riskFactors.length)
    .slice(0, 3)
    .map(p => ({
      project: p.projectName,
      issue: p.riskFactors[0],
    }));

  // Portfolio recommendations
  const recommendations: string[] = [];
  
  if (critical > 0) {
    recommendations.push(`${critical} project${critical > 1 ? 's' : ''} in critical state — immediate attention required.`);
  }
  if (behind > 0) {
    recommendations.push(`${behind} project${behind > 1 ? 's are' : ' is'} behind schedule. Consider resource reallocation.`);
  }
  if (averageHealth >= 80) {
    recommendations.push('Portfolio is healthy overall. Maintain current management approach.');
  }
  
  const overBudgetProjects = predictions.filter(
    p => p.budgetAnalysis && p.budgetAnalysis.overBudgetPercent > 10
  );
  if (overBudgetProjects.length > 0) {
    recommendations.push(`${overBudgetProjects.length} project${overBudgetProjects.length > 1 ? 's' : ''} projected over budget. Review spending.`);
  }

  return {
    totalProjects: projects.length,
    onTrack,
    atRisk,
    behind,
    critical,
    completed,
    averageHealth,
    topRisks,
    recommendations,
  };
}

// ─── Utility Exports ──────────────────────────────────────────────────────────

export { formatDate, parseBudget, daysBetween };
