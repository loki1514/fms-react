// lib/ai/resolver.ts - Hybrid classification resolver (Rule Engine + AI)
import { classifyTicket, ClassificationResult } from './groq';

export interface ResolutionResult extends ClassificationResult {
  decisionSource: 'rule' | 'llm' | 'hybrid';
  llmResult?: ClassificationResult;
  ruleResult?: ClassificationResult;
  issue_code?: string;
}

// Keyword-based rules for quick classification
const RULES: Array<{
  keywords: string[];
  category: string;
  skill_group: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  risk_flag: boolean;
  confidence: number;
}> = [
  // Critical - Safety
  {
    keywords: ['fire', 'smoke', 'alarm triggered', 'sprinkler', 'gas leak'],
    category: 'technical',
    skill_group: 'fire_safety',
    priority: 'critical',
    risk_flag: true,
    confidence: 95,
  },
  {
    keywords: ['elevator stuck', 'trapped in elevator', 'lift stuck'],
    category: 'vendor',
    skill_group: 'elevator_emergency',
    priority: 'critical',
    risk_flag: true,
    confidence: 98,
  },
  // High Priority
  {
    keywords: ['power outage', 'no electricity', 'lights not working', 'circuit breaker'],
    category: 'technical',
    skill_group: 'electrical',
    priority: 'high',
    risk_flag: false,
    confidence: 90,
  },
  {
    keywords: ['water leak', 'pipe burst', 'flooding', 'major leak'],
    category: 'plumbing',
    skill_group: 'plumbing_emergency',
    priority: 'high',
    risk_flag: true,
    confidence: 92,
  },
  {
    keywords: ['ac not working', 'heating broken', 'temperature issue', 'hvac'],
    category: 'technical',
    skill_group: 'hvac',
    priority: 'medium',
    risk_flag: false,
    confidence: 85,
  },
  // Medium Priority
  {
    keywords: ['door lock', 'keycard not working', 'access denied', 'lock broken'],
    category: 'technical',
    skill_group: 'access_control',
    priority: 'medium',
    risk_flag: false,
    confidence: 88,
  },
  {
    keywords: ['wifi', 'internet down', 'network issue', 'printer not working'],
    category: 'technical',
    skill_group: 'it_support',
    priority: 'medium',
    risk_flag: false,
    confidence: 85,
  },
  // Low Priority
  {
    keywords: ['clean', 'trash', 'garbage', 'spill', 'mess'],
    category: 'soft_services',
    skill_group: 'cleaning',
    priority: 'low',
    risk_flag: false,
    confidence: 90,
  },
  {
    keywords: ['light bulb', 'replace bulb', 'flickering light'],
    category: 'technical',
    skill_group: 'electrical',
    priority: 'low',
    risk_flag: false,
    confidence: 80,
  },
  {
    keywords: ['paint', 'wall mark', 'scratch', 'cosmetic'],
    category: 'soft_services',
    skill_group: 'maintenance',
    priority: 'low',
    risk_flag: false,
    confidence: 75,
  },
];

// Force AI classification for certain complex scenarios
const FORCE_AI_PATTERNS = [
  /multiple issues/i,
  /and.*also/i,
  /as well as/i,
  /urgent.*but/i,
  /complicated/i,
  /unclear/i,
];

export async function resolveClassification(
  description: string,
  title?: string
): Promise<ClassificationResult & { reasoning?: string }> {
  const text = `${title || ''} ${description}`.toLowerCase().trim();
  
  // Step 1: Try rule-based classification
  const ruleResult = applyRules(text);
  
  // Step 2: Check if we should force AI
  const shouldForceAI = FORCE_AI_PATTERNS.some(pattern => pattern.test(text)) ||
    ruleResult.confidence < 70;
  
  // Step 3: If rule confidence is high enough, use it
  if (!shouldForceAI && ruleResult.confidence >= 80) {
    return {
      ...ruleResult,
      decisionSource: 'rule',
      ruleResult,
      issue_code: generateIssueCode(ruleResult),
    };
  }
  
  // Step 4: Call LLM for classification
  try {
    const llmResult = await classifyTicket(description, title);
    
    // Step 5: Hybrid decision - merge results
    const finalResult = mergeResults(ruleResult, llmResult);
    
    return {
      ...finalResult,
      decisionSource: ruleResult.confidence > 50 ? 'hybrid' : 'llm',
      ruleResult,
      llmResult,
      issue_code: generateIssueCode(finalResult),
    };
  } catch (error) {
    console.error('AI classification failed, falling back to rules:', error);
    return {
      ...ruleResult,
      decisionSource: 'rule',
      ruleResult,
      issue_code: generateIssueCode(ruleResult),
    };
  }
}

function applyRules(text: string): ClassificationResult {
  let bestMatch: ClassificationResult | null = null;
  let highestConfidence = 0;
  
  for (const rule of RULES) {
    const matches = rule.keywords.filter(keyword => text.includes(keyword));
    if (matches.length > 0) {
      // Boost confidence based on number of keyword matches
      const matchBoost = matches.length * 5;
      const adjustedConfidence = Math.min(100, rule.confidence + matchBoost);
      
      if (adjustedConfidence > highestConfidence) {
        highestConfidence = adjustedConfidence;
        bestMatch = {
          category: rule.category,
          skill_group: rule.skill_group,
          priority: rule.priority,
          risk_flag: rule.risk_flag,
          confidence: adjustedConfidence,
          reasoning: `Matched keywords: ${matches.join(', ')}`,
        };
      }
    }
  }
  
  // Default fallback
  if (!bestMatch) {
    return {
      category: 'soft_services',
      skill_group: 'general',
      priority: 'medium',
      risk_flag: false,
      confidence: 40,
      reasoning: 'No rule matches found',
    };
  }
  
  return bestMatch;
}

function mergeResults(rule: ClassificationResult, llm: ClassificationResult): ClassificationResult {
  // If LLM has high confidence, prefer it
  if (llm.confidence >= 85) {
    return llm;
  }
  
  // If rule has high confidence and LLM is uncertain, prefer rule
  if (rule.confidence >= 80 && llm.confidence < 70) {
    return rule;
  }
  
  // Hybrid: take priority from whichever is higher
  const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
  const finalPriority = priorityOrder[rule.priority] >= priorityOrder[llm.priority] 
    ? rule.priority 
    : llm.priority;
  
  // Risk flag: if either says it's risky, it is
  const finalRisk = rule.risk_flag || llm.risk_flag;
  
  return {
    category: llm.category, // Prefer LLM category (more nuanced)
    skill_group: llm.skill_group || rule.skill_group,
    priority: finalPriority,
    risk_flag: finalRisk,
    confidence: Math.round((rule.confidence + llm.confidence) / 2),
    reasoning: `Hybrid: ${llm.reasoning} (Rule: ${rule.reasoning})`,
  };
}

function generateIssueCode(result: ClassificationResult): string {
  const prefix = result.category.substring(0, 3).toUpperCase();
  const type = result.priority === 'critical' ? 'CRIT' : 
               result.priority === 'high' ? 'HIGH' : 
               result.priority === 'medium' ? 'MED' : 'LOW';
  const timestamp = Date.now().toString(36).toUpperCase().slice(-4);
  return `${prefix}-${type}-${timestamp}`;
}

// Export for use in ticket creation
export { ClassificationResult };
export type { ResolutionResult };
