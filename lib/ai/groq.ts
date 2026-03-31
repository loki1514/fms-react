// lib/ai/groq.ts - Groq LLM Client for Hybrid Ticket Classification
// Ported from web implementation with Zod validation

// Input type (what we send to Groq)
export interface LLMInput {
  ticket_text: string;
  candidate_buckets: string[];
  rule_scores: Record<string, number>;
}

// Output type (what we expect from Groq)
export interface LLMOutput {
  primary_category: string;
  secondary_category: string | null;
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  risk_flag: string | null;
  reasoning: string;
}

export interface GroqResponse {
  success: boolean;
  result?: LLMOutput;
  error?: string;
  latencyMs: number;
  fallbackUsed: boolean;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// Legacy interface for backward compatibility
export interface ClassificationResult {
  category: string;
  skill_group: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  risk_flag: boolean;
  confidence: number;
  reasoning: string;
}

// Configuration
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'llama-3.3-70b-versatile';
const TIMEOUT_MS = 5000;

// Skill groups for mobile
export type SkillGroup = 'technical' | 'plumbing' | 'vendor' | 'soft_services';

/**
 * Build the system prompt for situational reasoning
 */
function buildSystemPrompt(): string {
  return `You are an expert facilities incident triage system.
Your job is to infer the primary cause, secondary contributing factors, correct priority, and safety risks of maintenance tickets.

Rules:
1. Reason about context, negation, time, and cause vs symptom.
2. Identify the PRIMARY category responsible (from the provided list).
3. Identify a SECONDARY category if relevant (from the provided list), otherwise null.
4. Assign priority: Low | Medium | High | Urgent.
5. Flag safety risks explicitly (e.g., "Fire risk", "Safety exposure").
6. Provide a concise one-line reasoning.

Respond ONLY in valid JSON format matching the requested schema.`;
}

/**
 * Build the user prompt with ticket context
 */
function buildUserPrompt(input: LLMInput): string {
  return `Target Categories: ${JSON.stringify(input.candidate_buckets)}

Ticket Description:
"${input.ticket_text}"

Rule Engine Context:
Scores: ${JSON.stringify(input.rule_scores)}

Analyze the situation and return structured JSON.`;
}

/**
 * Validate LLM output matches expected schema
 */
function validateOutput(data: any): LLMOutput | null {
  if (!data || typeof data !== 'object') return null;
  
  const validPriorities = ['Low', 'Medium', 'High', 'Urgent'];
  if (!validPriorities.includes(data.priority)) {
    data.priority = 'Medium';
  }
  
  return {
    primary_category: String(data.primary_category || ''),
    secondary_category: data.secondary_category || null,
    priority: data.priority,
    risk_flag: data.risk_flag || null,
    reasoning: String(data.reasoning || ''),
  };
}

/**
 * Call Groq API with timeout and error handling
 */
export async function classifyWithGroq(input: LLMInput): Promise<GroqResponse> {
  const startTime = Date.now();
  const apiKey = process.env.EXPO_PUBLIC_GROQ_API_KEY;

  if (!apiKey) {
    console.warn('[GroqClient] GROQ_API_KEY not configured');
    return {
      success: false,
      error: 'GROQ_API_KEY not configured',
      latencyMs: Date.now() - startTime,
      fallbackUsed: true,
    };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [
          { role: 'system', content: buildSystemPrompt() },
          { role: 'user', content: buildUserPrompt(input) },
        ],
        temperature: 0.1,
        max_tokens: 200,
        response_format: { type: 'json_object' },
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[GroqClient] API error:', response.status, errorText);
      return {
        success: false,
        error: `API error: ${response.status}`,
        latencyMs: Date.now() - startTime,
        fallbackUsed: true,
      };
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    const usage = data.usage ? {
      prompt_tokens: data.usage.prompt_tokens,
      completion_tokens: data.usage.completion_tokens,
      total_tokens: data.usage.total_tokens,
    } : undefined;

    if (!content) {
      return {
        success: false,
        error: 'Empty response from Groq',
        latencyMs: Date.now() - startTime,
        fallbackUsed: true,
        usage,
      };
    }

    // Parse and validate
    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch {
      console.error('[GroqClient] Failed to parse JSON:', content);
      return {
        success: false,
        error: 'Invalid JSON in response',
        latencyMs: Date.now() - startTime,
        fallbackUsed: true,
        usage,
      };
    }

    const result = validateOutput(parsed);
    if (!result) {
      return {
        success: false,
        error: 'Invalid output schema',
        latencyMs: Date.now() - startTime,
        fallbackUsed: true,
        usage,
      };
    }

    // Validate primary_category is in candidates
    if (!input.candidate_buckets.includes(result.primary_category)) {
      console.error('[GroqClient] LLM selected invalid bucket:', result.primary_category);
      return {
        success: false,
        error: `LLM selected bucket not in candidates`,
        latencyMs: Date.now() - startTime,
        fallbackUsed: true,
        usage,
      };
    }

    return {
      success: true,
      result,
      latencyMs: Date.now() - startTime,
      fallbackUsed: false,
      usage,
    };

  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof Error && error.name === 'AbortError') {
      console.warn('[GroqClient] Request timed out');
      return {
        success: false,
        error: 'Request timed out',
        latencyMs: Date.now() - startTime,
        fallbackUsed: true,
      };
    }

    console.error('[GroqClient] Unexpected error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      latencyMs: Date.now() - startTime,
      fallbackUsed: true,
    };
  }
}

/**
 * Legacy classifyTicket function - wraps classifyWithGroq for backward compatibility
 */
export async function classifyTicket(description: string, title?: string): Promise<ClassificationResult> {
  const input: LLMInput = {
    ticket_text: title ? `${title}: ${description}` : description,
    candidate_buckets: ['technical', 'plumbing', 'vendor', 'soft_services'],
    rule_scores: {}, // Rule scores not available in legacy mode
  };

  const response = await classifyWithGroq(input);

  if (response.success && response.result) {
    const result = response.result;
    return {
      category: result.primary_category,
      skill_group: result.primary_category,
      priority: mapPriority(result.priority),
      risk_flag: !!result.risk_flag,
      confidence: response.fallbackUsed ? 50 : 85,
      reasoning: result.reasoning,
    };
  }

  // Fallback to rule-based
  return getFallbackClassification(description);
}

function mapPriority(priority: string): 'low' | 'medium' | 'high' | 'critical' {
  const map: Record<string, 'low' | 'medium' | 'high' | 'critical'> = {
    'Low': 'low',
    'Medium': 'medium',
    'High': 'high',
    'Urgent': 'critical',
  };
  return map[priority] || 'medium';
}

function getFallbackClassification(description: string): ClassificationResult {
  const text = description.toLowerCase();
  
  if (text.includes('fire') || text.includes('smoke') || text.includes('alarm')) {
    return {
      category: 'technical',
      skill_group: 'technical',
      priority: 'critical',
      risk_flag: true,
      confidence: 95,
      reasoning: 'Fire safety related - flagged by rule engine',
    };
  }
  
  if (text.includes('leak') || text.includes('water') || text.includes('flood')) {
    return {
      category: 'plumbing',
      skill_group: 'plumbing',
      priority: text.includes('major') ? 'high' : 'medium',
      risk_flag: text.includes('electrical'),
      confidence: 85,
      reasoning: 'Water/plumbing issue detected',
    };
  }
  
  if (text.includes('elevator') || text.includes('lift')) {
    return {
      category: 'vendor',
      skill_group: 'vendor',
      priority: text.includes('stuck') ? 'critical' : 'medium',
      risk_flag: text.includes('stuck'),
      confidence: 90,
      reasoning: 'Elevator issue - requires vendor',
    };
  }
  
  if (text.includes('clean') || text.includes('trash')) {
    return {
      category: 'soft_services',
      skill_group: 'soft_services',
      priority: 'low',
      risk_flag: false,
      confidence: 80,
      reasoning: 'Cleaning request detected',
    };
  }
  
  return {
    category: 'soft_services',
    skill_group: 'soft_services',
    priority: 'medium',
    risk_flag: false,
    confidence: 50,
    reasoning: 'Default classification',
  };
}

/**
 * Convert skill group to display name
 */
export function skillGroupToDisplayName(sg: SkillGroup): string {
  const names: Record<SkillGroup, string> = {
    technical: 'Technical',
    plumbing: 'Plumbing',
    vendor: 'Vendor',
    soft_services: 'Soft Services',
  };
  return names[sg];
}
