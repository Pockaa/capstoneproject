/**
 * Schedule Risk Prediction Engine
 * 
 * Analyzes schedule tasks and assigns risk scores based on:
 * - Proximity to deadline
 * - Current task status
 * - Project health context
 * - Historical delay patterns
 * 
 * Algorithm: Multi-Factor Weighted Risk Scoring
 * All computation runs on-device — no API calls needed.
 */

export interface ScheduleData {
  id: string;
  task_name: string;
  date: string;
  time: string;
  status: string;
  project_id?: string;
  projectName?: string;
}

export interface ScheduleRisk {
  scheduleId: string;
  taskName: string;
  projectName: string;
  date: string;
  status: string;
  riskScore: number;           // 0-100
  riskLevel: 'Low' | 'Medium' | 'High' | 'Critical';
  riskColor: string;
  factors: string[];
  suggestion: string;
}

export interface ScheduleSummary {
  totalTasks: number;
  lowRisk: number;
  mediumRisk: number;
  highRisk: number;
  criticalRisk: number;
  overallRiskScore: number;    // 0-100 average
  upcomingDeadlines: { task: string; daysUntil: number; risk: string }[];
  insights: string[];
}

// ─── Risk Scoring ─────────────────────────────────────────────────────────────

export function assessScheduleRisk(
  schedule: ScheduleData,
  allSchedules: ScheduleData[] = [],
): ScheduleRisk {
  let riskScore = 0;
  const factors: string[] = [];
  const now = new Date();
  const taskDate = new Date(schedule.date);
  const daysUntil = Math.floor((taskDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  // ── Factor 1: Status-Based Risk (0-35 points) ──
  const statusRisk: Record<string, number> = {
    'Delayed': 35,
    'Pending': 20,
    'In Progress': 10,
    'Scheduled': 5,
    'Upcoming': 5,
    'Completed': 0,
  };
  const statusScore = statusRisk[schedule.status] ?? 15;
  riskScore += statusScore;
  
  if (schedule.status === 'Delayed') {
    factors.push('Task is already delayed');
  }
  if (schedule.status === 'Pending' && daysUntil <= 3) {
    factors.push('Pending task with imminent deadline');
  }

  // ── Factor 2: Deadline Proximity (0-30 points) ──
  let deadlineScore = 0;
  if (daysUntil < 0) {
    // Overdue
    deadlineScore = 30;
    factors.push(`Task is ${Math.abs(daysUntil)} day${Math.abs(daysUntil) !== 1 ? 's' : ''} overdue`);
  } else if (daysUntil === 0) {
    deadlineScore = 25;
    factors.push('Task is due today');
  } else if (daysUntil <= 2) {
    deadlineScore = 20;
    factors.push(`Due in ${daysUntil} day${daysUntil !== 1 ? 's' : ''}`);
  } else if (daysUntil <= 7) {
    deadlineScore = 10;
    factors.push('Due within the week');
  } else if (daysUntil <= 14) {
    deadlineScore = 5;
  }
  // If status is not "In Progress" and deadline is close, extra risk
  if (daysUntil <= 3 && schedule.status !== 'In Progress' && schedule.status !== 'Completed') {
    deadlineScore += 10;
    factors.push('Not yet started but deadline is imminent');
  }
  riskScore += deadlineScore;

  // ── Factor 3: Project Congestion (0-15 points) ──
  // If many tasks from the same project are clustered together, higher risk
  if (schedule.project_id && allSchedules.length > 0) {
    const sameProjectTasks = allSchedules.filter(
      s => s.project_id === schedule.project_id && s.status !== 'Completed'
    );
    const nearbyTasks = sameProjectTasks.filter(s => {
      const d = new Date(s.date);
      const diff = Math.abs(Math.floor((d.getTime() - taskDate.getTime()) / (1000 * 60 * 60 * 24)));
      return diff <= 3 && s.id !== schedule.id;
    });
    
    if (nearbyTasks.length >= 3) {
      riskScore += 15;
      factors.push(`${nearbyTasks.length + 1} tasks clustered within 3 days on same project`);
    } else if (nearbyTasks.length >= 1) {
      riskScore += 7;
      factors.push('Multiple concurrent tasks on same project');
    }
  }

  // ── Factor 4: Day-of-Week Pattern (0-10 points) ──
  // Monday tasks tend to have higher delay risk (weekend gaps)
  const dayOfWeek = taskDate.getDay();
  if (dayOfWeek === 1) { // Monday
    riskScore += 5;
    factors.push('Monday tasks have historically higher delay rates');
  }
  if (dayOfWeek === 5) { // Friday
    riskScore += 3;
  }

  // ── Factor 5: Cascading Delay Detection (0-10 points) ──
  // If previous tasks from the same project are delayed, this one is at risk too
  if (schedule.project_id && allSchedules.length > 0) {
    const delayedSameProject = allSchedules.filter(
      s => s.project_id === schedule.project_id 
        && s.status === 'Delayed'
        && s.id !== schedule.id
    );
    if (delayedSameProject.length > 0) {
      riskScore += Math.min(delayedSameProject.length * 5, 10);
      factors.push(`${delayedSameProject.length} other task(s) in same project are delayed`);
    }
  }

  // ── Classify risk level ──
  riskScore = Math.min(riskScore, 100);
  
  let riskLevel: ScheduleRisk['riskLevel'];
  let riskColor: string;
  
  if (riskScore >= 70) {
    riskLevel = 'Critical';
    riskColor = '#dc2626';
  } else if (riskScore >= 45) {
    riskLevel = 'High';
    riskColor = '#ef4444';
  } else if (riskScore >= 25) {
    riskLevel = 'Medium';
    riskColor = '#f59e0b';
  } else {
    riskLevel = 'Low';
    riskColor = '#10b981';
  }

  // Completed tasks are always low risk
  if (schedule.status === 'Completed') {
    riskScore = 0;
    riskLevel = 'Low';
    riskColor = '#10b981';
    factors.length = 0;
  }

  // ── Generate suggestion ──
  const suggestion = generateSuggestion(riskLevel, factors, schedule, daysUntil);

  return {
    scheduleId: schedule.id,
    taskName: schedule.task_name,
    projectName: schedule.projectName || 'Unknown',
    date: schedule.date,
    status: schedule.status,
    riskScore,
    riskLevel,
    riskColor,
    factors,
    suggestion,
  };
}

function generateSuggestion(
  level: ScheduleRisk['riskLevel'],
  factors: string[],
  schedule: ScheduleData,
  daysUntil: number,
): string {
  if (schedule.status === 'Completed') return 'Task completed.';
  
  if (level === 'Critical') {
    if (daysUntil < 0) {
      return `Overdue by ${Math.abs(daysUntil)} days. Assign additional crew immediately or reschedule.`;
    }
    return 'Immediate attention needed. Consider reallocating resources to prevent delay.';
  }
  
  if (level === 'High') {
    return 'High delay risk. Review resource allocation and dependencies.';
  }
  
  if (level === 'Medium') {
    return 'Monitor progress closely. Prepare contingency plan.';
  }
  
  return 'On track. Continue as planned.';
}

// ─── Portfolio Schedule Analysis ──────────────────────────────────────────────

export function analyzeScheduleRisks(schedules: ScheduleData[]): ScheduleSummary {
  const risks = schedules.map(s => assessScheduleRisk(s, schedules));
  
  const lowRisk = risks.filter(r => r.riskLevel === 'Low').length;
  const mediumRisk = risks.filter(r => r.riskLevel === 'Medium').length;
  const highRisk = risks.filter(r => r.riskLevel === 'High').length;
  const criticalRisk = risks.filter(r => r.riskLevel === 'Critical').length;
  
  const overallRiskScore = risks.length > 0
    ? Math.round(risks.reduce((sum, r) => sum + r.riskScore, 0) / risks.length)
    : 0;

  // Upcoming deadlines (within 7 days, sorted by urgency)
  const now = new Date();
  const upcomingDeadlines = risks
    .filter(r => {
      const d = new Date(r.date);
      const diff = Math.floor((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return diff >= -3 && diff <= 7 && r.status !== 'Completed';
    })
    .sort((a, b) => b.riskScore - a.riskScore)
    .slice(0, 5)
    .map(r => ({
      task: r.taskName,
      daysUntil: Math.floor((new Date(r.date).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
      risk: r.riskLevel,
    }));

  // Generate insights
  const insights: string[] = [];
  
  if (criticalRisk > 0) {
    insights.push(`⚠️ ${criticalRisk} task${criticalRisk > 1 ? 's' : ''} at critical risk level requiring immediate attention.`);
  }
  if (highRisk > 0) {
    insights.push(`${highRisk} task${highRisk > 1 ? 's' : ''} at high risk. Review resource allocation.`);
  }
  
  const overdueCount = risks.filter(r => {
    const d = new Date(r.date);
    return d < now && r.status !== 'Completed';
  }).length;
  if (overdueCount > 0) {
    insights.push(`${overdueCount} overdue task${overdueCount > 1 ? 's' : ''} detected.`);
  }
  
  if (overallRiskScore <= 25) {
    insights.push('Schedule health is good. All tasks are progressing well.');
  } else if (overallRiskScore <= 50) {
    insights.push('Schedule health is moderate. Some tasks need attention.');
  } else {
    insights.push('Schedule health is poor. Multiple tasks require intervention.');
  }

  return {
    totalTasks: schedules.length,
    lowRisk,
    mediumRisk,
    highRisk,
    criticalRisk,
    overallRiskScore,
    upcomingDeadlines,
    insights,
  };
}
