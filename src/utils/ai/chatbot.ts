/**
 * AI Chatbot Engine (Feature C)
 * 
 * Builds context from Supabase data and sends intelligent queries
 * to OpenRouter. The chatbot understands projects, schedules,
 * inventory, reports, and employees.
 */

import { chatCompletion, isAIConfigured, type ChatMessage } from '../../services/openrouter';
import supabase from '../../config/supabaseClient';
import { predictProject, analyzePortfolio, type ProjectData } from './projectPrediction';
import { analyzeScheduleRisks, type ScheduleData } from './schedulePrediction';

export interface ChatResponse {
  message: string;
  success: boolean;
  error?: string;
  context?: string;
}

const SYSTEM_PROMPT = `You are SiteTrack AI, an intelligent assistant for a construction site management application. You help admin managers understand their projects, schedules, inventory, and worker reports.

You have access to REAL project data from the system. When answering questions:
- Be concise but thorough
- Use specific numbers and names from the data
- Provide actionable recommendations when appropriate
- If you detect risks or issues, proactively mention them
- Format responses clearly with bullet points where helpful
- Use emojis sparingly for visual clarity (🔴 🟡 🟢 📊 📋)

You are speaking to a construction site admin/manager. Be professional but friendly.
If asked something outside your data, say so honestly.`;

/**
 * Build a context string from current Supabase data.
 */
async function buildDataContext(): Promise<string> {
  const parts: string[] = [];

  try {
    // Fetch projects
    const { data: projects } = await supabase
      .from('projects')
      .select('*, users!manager_id(name)');

    if (projects && projects.length > 0) {
      const projectData: ProjectData[] = projects.map((p: any) => ({
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

      const portfolio = analyzePortfolio(projectData);
      const predictions = projectData.map(predictProject);

      parts.push(`=== PROJECTS (${projects.length} total) ===`);
      parts.push(`Portfolio Health: ${portfolio.averageHealth}/100`);
      parts.push(`Status: ${portfolio.onTrack} on track, ${portfolio.atRisk} at risk, ${portfolio.behind + portfolio.critical} behind, ${portfolio.completed} completed`);

      predictions.forEach(pred => {
        let line = `- ${pred.projectName}: ${pred.currentProgress}% progress, Status: ${pred.status}`;
        if (pred.predictedEndDate) {
          line += `, Est. completion: ${pred.predictedEndDate.toLocaleDateString()}`;
        }
        if (pred.daysVariance > 0) line += ` (${pred.daysVariance} days late)`;
        if (pred.daysVariance < 0) line += ` (${Math.abs(pred.daysVariance)} days early)`;
        if (pred.budgetAnalysis) {
          line += `, Budget: ${pred.budgetAnalysis.status}`;
          if (pred.budgetAnalysis.overBudgetPercent > 0) {
            line += ` (+${pred.budgetAnalysis.overBudgetPercent}%)`;
          }
        }
        if (pred.recommendation) line += `\n  Recommendation: ${pred.recommendation}`;
        parts.push(line);
      });
    }

    // Fetch schedules
    const { data: schedules } = await supabase
      .from('schedules')
      .select('*, projects(name)')
      .order('date', { ascending: true });

    if (schedules && schedules.length > 0) {
      const schedData: ScheduleData[] = schedules.map((s: any) => ({
        id: s.id,
        task_name: s.task_name || 'Unnamed Task',
        date: s.date,
        time: s.time || '',
        status: s.status,
        project_id: s.project_id,
        projectName: s.projects?.name || 'Unknown',
      }));

      const schedAnalysis = analyzeScheduleRisks(schedData);
      parts.push(`\n=== SCHEDULES (${schedules.length} tasks) ===`);
      parts.push(`Risk: ${schedAnalysis.lowRisk} low, ${schedAnalysis.mediumRisk} medium, ${schedAnalysis.highRisk} high, ${schedAnalysis.criticalRisk} critical`);

      // Only show upcoming/active tasks
      const now = new Date();
      const relevant = schedData
        .filter(s => new Date(s.date) >= new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000))
        .slice(0, 10);

      relevant.forEach(s => {
        parts.push(`- ${s.task_name} (${s.projectName}): ${s.status}, Date: ${s.date}`);
      });
    }

    // Fetch recent reports
    const { data: reports } = await supabase
      .from('reports')
      .select('*, projects(name), users!user_id(name)')
      .order('created_at', { ascending: false })
      .limit(10);

    if (reports && reports.length > 0) {
      parts.push(`\n=== RECENT REPORTS (latest ${reports.length}) ===`);
      reports.forEach((r: any) => {
        const project = r.projects?.name || 'Unknown';
        const worker = r.users?.name || 'Unknown';
        const date = r.date || r.created_at?.split('T')[0] || 'N/A';
        parts.push(`- ${project} by ${worker} (${date}): Status: ${r.status || 'Unknown'}, Type: ${r.type || 'Daily Log'}`);
        if (r.task_done) parts.push(`  Tasks: ${r.task_done.substring(0, 100)}`);
      });
    }

    // Fetch employees
    const { data: users } = await supabase.from('users').select('*');

    if (users && users.length > 0) {
      const active = users.filter((u: any) => u.status === 'Active');
      parts.push(`\n=== TEAM (${users.length} total, ${active.length} active) ===`);
      users.forEach((u: any) => {
        parts.push(`- ${u.name}: ${u.role || 'Worker'}, Status: ${u.status || 'Unknown'}`);
      });
    }

  } catch (err) {
    console.error('Error building chat context:', err);
    parts.push('Note: Some data could not be loaded.');
  }

  return parts.join('\n');
}

// Cache the data context to avoid refetching on every message
let cachedContext: string | null = null;
let contextTimestamp = 0;
const CONTEXT_TTL = 2 * 60 * 1000; // Refresh context every 2 minutes

/**
 * Send a message to the AI chatbot with full project context.
 */
export async function sendChatMessage(
  userMessage: string,
  conversationHistory: ChatMessage[] = [],
): Promise<ChatResponse> {
  if (!isAIConfigured()) {
    return {
      success: false,
      message: '',
      error: 'AI not configured. Please add your OpenRouter API key to the .env file as EXPO_PUBLIC_OPENROUTER_API_KEY.',
    };
  }

  try {
    // Refresh context if stale
    if (!cachedContext || Date.now() - contextTimestamp > CONTEXT_TTL) {
      cachedContext = await buildDataContext();
      contextTimestamp = Date.now();
    }

    const systemMessage = `${SYSTEM_PROMPT}\n\nCurrent system data:\n${cachedContext}`;

    const messages: ChatMessage[] = [
      { role: 'system', content: systemMessage },
      ...conversationHistory.slice(-6), // Keep last 6 messages for context window
      { role: 'user', content: userMessage },
    ];

    const result = await chatCompletion({
      messages,
      temperature: 0.4,
      maxTokens: 1200,
    });

    if (!result.success) {
      return {
        success: false,
        message: '',
        error: result.error || 'Failed to get AI response.',
      };
    }

    return {
      success: true,
      message: result.content,
      context: `Model: ${result.model}${result.usage ? ` | Tokens: ${result.usage.totalTokens}` : ''}`,
    };
  } catch (err: any) {
    return {
      success: false,
      message: '',
      error: err?.message || 'An unexpected error occurred.',
    };
  }
}

/**
 * Force refresh the data context on next message.
 */
export function refreshChatContext(): void {
  cachedContext = null;
  contextTimestamp = 0;
}
