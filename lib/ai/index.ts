// lib/ai/index.ts - AI classification exports
export { 
  classifyTicket, 
  classifyWithGroq,
  skillGroupToDisplayName,
  type ClassificationResult,
  type LLMInput,
  type LLMOutput,
  type GroqResponse,
  type SkillGroup,
} from './groq';
export { resolveClassification, type ResolutionResult } from './resolver';
