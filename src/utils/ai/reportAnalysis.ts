/**
 * Report Analysis Engine (Feature A: NLP Report Intelligence)
 * 
 * Analyzes field worker reports using AI to:
 * - Auto-categorize report type
 * - Detect urgency/severity level
 * - Extract key entities (materials, equipment, locations)
 * - Flag safety concerns
 * - Generate executive summary
 * 
 * Uses OpenRouter API for NLP, with fallback to rule-based analysis.
 */

import { chatCompletion, isAIConfigured } from '../../services/openrouter';

export interface ReportAnalysis {
  categories: string[];
  urgency: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  urgencyColor: string;
  urgencyScore: number;        // 0-100
  materials: { name: string; quantity?: string; action: 'used' | 'needed' | 'mentioned' }[];
  equipment: { name: string; status: 'operational' | 'down' | 'mentioned' }[];
  safetyFlags: string[];
  issues: string[];
  summary: string;
  sentiment: 'positive' | 'neutral' | 'concerning' | 'negative';
  keyInsights: string[];
  analyzedAt: string;
  aiPowered: boolean;          // true if AI was used, false if rule-based fallback
}

interface ReportInput {
  taskDone: string;
  currentTask: string;
  materialUsed: string;
  materialRequest: string;
  projectName?: string;
  date?: string;
}

// ─── AI-Powered Analysis ──────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are an AI construction report analyzer for SiteTrack, a construction management app. Analyze the field worker's report and return a JSON response with the following structure:

{
  "categories": ["Progress Report", "Material Request", "Safety Concern", "Equipment Issue", "Delay Notice", "Weather Impact"],
  "urgency": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
  "urgencyScore": 0-100,
  "materials": [{"name": "material name", "quantity": "amount if mentioned", "action": "used|needed|mentioned"}],
  "equipment": [{"name": "equipment name", "status": "operational|down|mentioned"}],
  "safetyFlags": ["description of any safety concerns found"],
  "issues": ["description of any problems or blockers"],
  "summary": "1-2 sentence executive summary of the report",
  "sentiment": "positive|neutral|concerning|negative",
  "keyInsights": ["important observations for management"]
}

Guidelines:
- Be thorough in material/equipment extraction
- Flag ANY mention of injuries, hazards, structural issues, or safety violations
- urgencyScore: 0-25 = LOW, 26-50 = MEDIUM, 51-75 = HIGH, 76-100 = CRITICAL  
- Categories should include ALL applicable types
- Summary should be concise but actionable for a project manager
- Look for delays, blockers, risks, and positive progress

IMPORTANT: Return ONLY valid JSON, no markdown, no explanation.`;

export async function analyzeReport(report: ReportInput): Promise<ReportAnalysis> {
  const reportText = formatReportText(report);
  
  // Try AI-powered analysis first
  if (isAIConfigured()) {
    try {
      const aiResult = await analyzeWithAI(reportText, report);
      if (aiResult) return aiResult;
    } catch (err) {
      console.warn('AI analysis failed, falling back to rule-based:', err);
    }
  }
  
  // Fallback to rule-based analysis
  return analyzeWithRules(report);
}

function formatReportText(report: ReportInput): string {
  const parts: string[] = [];
  if (report.projectName) parts.push(`Project: ${report.projectName}`);
  if (report.date) parts.push(`Date: ${report.date}`);
  if (report.taskDone) parts.push(`Tasks Completed:\n${report.taskDone}`);
  if (report.currentTask) parts.push(`Current Task:\n${report.currentTask}`);
  if (report.materialUsed) parts.push(`Materials Used:\n${report.materialUsed}`);
  if (report.materialRequest) parts.push(`Material Requests:\n${report.materialRequest}`);
  return parts.join('\n\n');
}

async function analyzeWithAI(reportText: string, report: ReportInput): Promise<ReportAnalysis | null> {
  const result = await chatCompletion({
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: `Analyze this construction report:\n\n${reportText}` },
    ],
    temperature: 0.2,
    maxTokens: 800,
  });

  if (!result.success || !result.content) return null;

  try {
    // Clean and parse JSON response
    let jsonStr = result.content.trim();
    // Remove markdown code block if present
    if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    }
    
    const parsed = JSON.parse(jsonStr);
    
    return {
      categories: parsed.categories || ['General Report'],
      urgency: validateUrgency(parsed.urgency),
      urgencyColor: getUrgencyColor(parsed.urgency || 'LOW'),
      urgencyScore: Math.min(100, Math.max(0, parsed.urgencyScore || 0)),
      materials: (parsed.materials || []).map((m: any) => ({
        name: m.name || 'Unknown',
        quantity: m.quantity || undefined,
        action: m.action || 'mentioned',
      })),
      equipment: (parsed.equipment || []).map((e: any) => ({
        name: e.name || 'Unknown',
        status: e.status || 'mentioned',
      })),
      safetyFlags: parsed.safetyFlags || [],
      issues: parsed.issues || [],
      summary: parsed.summary || 'Report analyzed successfully.',
      sentiment: parsed.sentiment || 'neutral',
      keyInsights: parsed.keyInsights || [],
      analyzedAt: new Date().toISOString(),
      aiPowered: true,
    };
  } catch (parseErr) {
    console.warn('Failed to parse AI response:', parseErr);
    return null;
  }
}

// ─── Rule-Based Fallback Analysis ─────────────────────────────────────────────

function analyzeWithRules(report: ReportInput): ReportAnalysis {
  const allText = [
    report.taskDone, report.currentTask, 
    report.materialUsed, report.materialRequest,
  ].join(' ').toLowerCase();

  // Category detection
  const categories: string[] = [];
  if (report.taskDone && report.taskDone.trim().length > 0) categories.push('Progress Report');
  if (report.materialRequest && report.materialRequest.trim().length > 0) categories.push('Material Request');
  if (report.materialUsed && report.materialUsed.trim().length > 0) categories.push('Material Usage');
  if (matchesAny(allText, SAFETY_KEYWORDS)) categories.push('Safety Concern');
  if (matchesAny(allText, DELAY_KEYWORDS)) categories.push('Delay Notice');
  if (matchesAny(allText, EQUIPMENT_KEYWORDS)) categories.push('Equipment Issue');
  if (categories.length === 0) categories.push('General Report');

  // Safety flags
  const safetyFlags: string[] = [];
  SAFETY_PATTERNS.forEach(({ pattern, message }) => {
    if (pattern.test(allText)) safetyFlags.push(message);
  });

  // Issues detection
  const issues: string[] = [];
  ISSUE_PATTERNS.forEach(({ pattern, message }) => {
    if (pattern.test(allText)) issues.push(message);
  });

  // Material extraction
  const materials = extractMaterials(report);

  // Equipment extraction  
  const equipment = extractEquipment(allText);

  // Urgency scoring
  let urgencyScore = 10; // Base
  if (safetyFlags.length > 0) urgencyScore += 30 * safetyFlags.length;
  if (issues.length > 0) urgencyScore += 15 * issues.length;
  if (categories.includes('Delay Notice')) urgencyScore += 20;
  if (report.materialRequest && report.materialRequest.trim().length > 20) urgencyScore += 10;
  urgencyScore = Math.min(100, urgencyScore);

  const urgency = urgencyScore >= 76 ? 'CRITICAL'
    : urgencyScore >= 51 ? 'HIGH'
    : urgencyScore >= 26 ? 'MEDIUM'
    : 'LOW';

  // Sentiment
  let sentiment: ReportAnalysis['sentiment'] = 'neutral';
  if (safetyFlags.length > 0 || urgencyScore >= 60) sentiment = 'negative';
  else if (issues.length > 0) sentiment = 'concerning';
  else if (matchesAny(allText, POSITIVE_KEYWORDS)) sentiment = 'positive';

  // Summary generation
  const summary = generateRuleSummary(report, categories, safetyFlags, issues, materials);

  // Key insights
  const keyInsights: string[] = [];
  if (safetyFlags.length > 0) keyInsights.push(`${safetyFlags.length} safety concern(s) detected — requires review.`);
  if (materials.filter(m => m.action === 'needed').length > 0) {
    keyInsights.push('Materials requested — procurement action needed.');
  }
  if (categories.includes('Delay Notice')) {
    keyInsights.push('Possible delay detected in report. Check schedule impact.');
  }

  return {
    categories,
    urgency,
    urgencyColor: getUrgencyColor(urgency),
    urgencyScore,
    materials,
    equipment,
    safetyFlags,
    issues,
    summary,
    sentiment,
    keyInsights,
    analyzedAt: new Date().toISOString(),
    aiPowered: false,
  };
}

// ─── Keyword Dictionaries ─────────────────────────────────────────────────────

const SAFETY_KEYWORDS = [
  'injury', 'injured', 'accident', 'hazard', 'unsafe', 'danger', 'crack', 'collapse',
  'fall', 'fell', 'broken', 'fire', 'leak', 'gas', 'electric', 'shock', 'slip',
  'incident', 'emergency', 'damage', 'structural', 'unstable', 'violation',
];

const DELAY_KEYWORDS = [
  'delay', 'delayed', 'stopped', 'halted', 'paused', 'waiting', 'ran out', 
  'shortage', 'unavailable', 'cancelled', 'postponed', 'behind', 'slow',
  'unable', 'cannot proceed', 'blocked', 'on hold',
];

const EQUIPMENT_KEYWORDS = [
  'crane', 'excavator', 'bulldozer', 'concrete mixer', 'pump', 'generator',
  'scaffolding', 'forklift', 'drill', 'compressor', 'welder', 'truck',
  'backhoe', 'loader', 'equipment', 'machine', 'tool',
];

const POSITIVE_KEYWORDS = [
  'completed', 'finished', 'done', 'achieved', 'on schedule', 'ahead',
  'successful', 'smooth', 'progress', 'milestone', 'accomplished',
];

const MATERIAL_NAMES = [
  'cement', 'concrete', 'steel', 'rebar', 'lumber', 'wood', 'plywood',
  'paint', 'sand', 'gravel', 'brick', 'block', 'pipe', 'pvc', 'wire',
  'cable', 'nail', 'screw', 'bolt', 'glass', 'tile', 'insulation',
  'drywall', 'roofing', 'sealant', 'adhesive', 'aggregate', 'asphalt',
];

const SAFETY_PATTERNS = [
  { pattern: /crack|fracture/i, message: 'Structural integrity concern — cracks or fractures mentioned' },
  { pattern: /injur|accident|incident/i, message: 'Injury or safety incident reported' },
  { pattern: /collapse|unstable/i, message: 'Structural stability issue detected' },
  { pattern: /fire|electri|shock/i, message: 'Fire or electrical safety concern' },
  { pattern: /fall|fell|slip/i, message: 'Fall hazard or incident mentioned' },
  { pattern: /leak|gas/i, message: 'Leak or gas hazard mentioned' },
];

const ISSUE_PATTERNS = [
  { pattern: /ran out|shortage|not enough/i, message: 'Material shortage reported' },
  { pattern: /broke|broken|malfunction|down/i, message: 'Equipment or material failure' },
  { pattern: /delay|stopped|halted|cannot proceed/i, message: 'Work stoppage or delay' },
  { pattern: /weather|rain|storm/i, message: 'Weather-related impact' },
];

// ─── Extraction Helpers ───────────────────────────────────────────────────────

function extractMaterials(report: ReportInput): ReportAnalysis['materials'] {
  const materials: ReportAnalysis['materials'] = [];
  const usedText = (report.materialUsed || '').toLowerCase();
  const requestText = (report.materialRequest || '').toLowerCase();
  const allText = [report.taskDone, report.currentTask, usedText, requestText].join(' ').toLowerCase();

  MATERIAL_NAMES.forEach(mat => {
    if (usedText.includes(mat)) {
      const qty = extractQuantity(usedText, mat);
      materials.push({ name: capitalize(mat), quantity: qty || undefined, action: 'used' });
    } else if (requestText.includes(mat)) {
      const qty = extractQuantity(requestText, mat);
      materials.push({ name: capitalize(mat), quantity: qty || undefined, action: 'needed' });
    } else if (allText.includes(mat)) {
      materials.push({ name: capitalize(mat), action: 'mentioned' });
    }
  });

  return materials;
}

function extractEquipment(text: string): ReportAnalysis['equipment'] {
  const equipment: ReportAnalysis['equipment'] = [];
  EQUIPMENT_KEYWORDS.forEach(eq => {
    if (text.includes(eq)) {
      const isDown = /broke|broken|down|malfunction|repair|maintenance/.test(
        text.substring(Math.max(0, text.indexOf(eq) - 30), text.indexOf(eq) + eq.length + 30)
      );
      equipment.push({
        name: capitalize(eq),
        status: isDown ? 'down' : 'mentioned',
      });
    }
  });
  return equipment;
}

function extractQuantity(text: string, material: string): string | null {
  const idx = text.indexOf(material);
  if (idx === -1) return null;
  // Look for number patterns near the material name
  const nearby = text.substring(Math.max(0, idx - 40), idx + material.length + 40);
  const match = nearby.match(/(\d+[\d,]*(?:\.\d+)?)\s*(?:bags?|units?|pcs?|pieces?|tons?|kg|gallons?|rolls?|sheets?|boxes?|packs?)/i);
  return match ? match[0] : null;
}

// ─── Utility ──────────────────────────────────────────────────────────────────

function matchesAny(text: string, keywords: string[]): boolean {
  return keywords.some(kw => text.includes(kw));
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function validateUrgency(u: string): ReportAnalysis['urgency'] {
  const valid = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
  return valid.includes(u) ? u as ReportAnalysis['urgency'] : 'LOW';
}

function getUrgencyColor(urgency: string): string {
  switch (urgency) {
    case 'CRITICAL': return '#dc2626';
    case 'HIGH': return '#ef4444';
    case 'MEDIUM': return '#f59e0b';
    case 'LOW': return '#22c55e';
    default: return '#6b7280';
  }
}

function generateRuleSummary(
  report: ReportInput,
  categories: string[],
  safetyFlags: string[],
  issues: string[],
  materials: ReportAnalysis['materials'],
): string {
  const parts: string[] = [];

  if (report.taskDone && report.taskDone.trim().length > 0) {
    // Take first sentence-like portion
    const firstTask = report.taskDone.trim().split(/[.\n]/)[0].trim();
    if (firstTask.length <= 80) {
      parts.push(firstTask);
    } else {
      parts.push(firstTask.substring(0, 77) + '...');
    }
  }

  if (safetyFlags.length > 0) {
    parts.push(`⚠️ ${safetyFlags.length} safety concern(s) flagged.`);
  }
  if (issues.length > 0 && safetyFlags.length === 0) {
    parts.push(`${issues.length} issue(s) detected.`);
  }
  const neededMaterials = materials.filter(m => m.action === 'needed');
  if (neededMaterials.length > 0) {
    parts.push(`${neededMaterials.length} material(s) requested.`);
  }

  return parts.join(' ') || 'Report submitted. No significant issues detected.';
}
