import OpenAI from "openai";
import { chatCompletionWithRetry } from "../utils/openaiRetry";
import { text } from '../ui/components';

// Multiple API keys for rotation (same pattern as llm-utils.ts)
const apiKeys = [
  process.env.gemini8,
  process.env.gemini9,
  process.env.gemini10,
  process.env.gemini11,
  process.env.gemini,
  process.env.gemini3,
  process.env.gemini4,
  process.env.gemini7,
  process.env.gemini6,
  process.env.gemini5,
  process.env.gemini2,
].filter(key => key && key.length > 0) as string[];

let currentKeyIndex = 0;

console.log(`[UIService] Using ${apiKeys.length} Gemini API keys`);

if (apiKeys.length === 0) {
  console.warn('[UIService] No Gemini API keys set!');
}

function getClient(): OpenAI {
  const apiKey = apiKeys[currentKeyIndex] || process.env.gemini3;
  return new OpenAI({
    baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
    apiKey: apiKey
  });
}

function rotateApiKey(): void {
  if (apiKeys.length > 1) {
    currentKeyIndex = (currentKeyIndex + 1) % apiKeys.length;
    console.log(`[UIService] Rotated to key ${currentKeyIndex + 1}/${apiKeys.length}`);
  }
}

const UI_SELECTION_MODEL = "gemini-2.5-flash-lite-preview-09-2025";

interface UIComponent {
  name: string;
  description: string;
  codesnippet: string;
  dependencies: string;
}

interface UISelectionResult {
  selectedComponents: UIComponent[];
  formattedForPrompt: string;
}

const selectionCache: Map<string, UISelectionResult> = new Map();

export class UIService {
  // Format all available components for AI understanding
  private static formatComponentsForAI(): string {
    const formatted = Object.entries(text).map(([name, details]) => ({
      name,
      description: details.description,
      category: this.categorizeComponent(name, details.description)
    }));
    return JSON.stringify(formatted, null, 2);
  }

  // Categorize components based on their name and description
  private static categorizeComponent(name: string, description: string): string {
    const nameLower = name.toLowerCase();
    const descLower = description.toLowerCase();

    if (nameLower.includes('text') || descLower.includes('text animation')) {
      return 'text-effect';
    } else if (nameLower.includes('cursor') || descLower.includes('cursor')) {
      return 'cursor-effect';
    } else if (nameLower.includes('background') || descLower.includes('background') ||
      nameLower.includes('aurora') || nameLower.includes('plasma') ||
      nameLower.includes('galaxy') || nameLower.includes('particles')) {
      return 'background';
    } else if (nameLower.includes('card') || nameLower.includes('profile')) {
      return 'card';
    } else if (nameLower.includes('gallery') || nameLower.includes('image')) {
      return 'gallery';
    } else if (nameLower.includes('nav') || nameLower.includes('navigation')) {
      return 'navigation';
    } else if (descLower.includes('animation') || descLower.includes('motion')) {
      return 'animation';
    }
    return 'other';
  }

  // Analyze requirement and select 3-6 relevant components
  static async selectComponents(requirements: string): Promise<UISelectionResult> {
    const cacheKey = requirements.trim();
    console.log(`[UIService] selectComponents called. key length: ${cacheKey.length}`);
    if (selectionCache.has(cacheKey)) {
      console.log('[UIService]  Using cached UI selection');
      return selectionCache.get(cacheKey)!;
    }

    const maxRetries = 3;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`[UIService] Selecting UI components (attempt ${attempt}/${maxRetries}, key ${currentKeyIndex + 1}/${apiKeys.length})...`);

        const analysisPrompt = `You are an elite UI/UX design expert selecting components for a PRODUCTION-LEVEL, PREMIUM web application.

 MISSION: Select 4-8 UI components that will make this project STAND OUT as professional, modern, and visually stunning.

AVAILABLE UI COMPONENTS:
${this.formatComponentsForAI()}

USER REQUIREMENT:
${requirements}

PRODUCTION-LEVEL SELECTION CRITERIA:

1. **Theme Alignment**: Choose components that perfectly match the project's purpose and industry
2. **Visual Impact**: Prioritize components that create a "WOW" factor - premium, polished, memorable
3. **Diversity**: Mix different categories (text effects, backgrounds, cards, animations, interactions)
4. **Modern Aesthetics**: Select contemporary, cutting-edge UI patterns
5. **User Experience**: Balance visual appeal with usability and accessibility
6. **Unique Identity**: Avoid generic combinations - make THIS project feel special

 INTELLIGENT DECISIONS:
- For corporate/business: Professional cards, subtle animations, clean layouts
- For creative/portfolio: Bold text effects, dynamic backgrounds, unique interactions
- For e-commerce: Attractive cards, hover effects, engaging galleries
- For tech/SaaS: Modern gradients, smooth animations, sleek components
- For blogs/content: Typography effects, reading-focused layouts, subtle accents

 COMPLEXITY RULE: Since this is PRODUCTION-LEVEL, select 4-8 components (more is better for richness)

OUTPUT FORMAT (JSON only, no markdown, no explanations):
{
  "selectedComponents": ["Component Name 1", "Component Name 2", "Component Name 3", "Component Name 4"]
}

CRITICAL REQUIREMENTS:
- Return ONLY valid JSON (no markdown code blocks)
- Component names must EXACTLY match names in the available list
- Select 4-8 components for a production-level experience
- Think like a senior designer building for a premium client`;

        const client = getClient();
        const response: any = await chatCompletionWithRetry(client, {
          model: UI_SELECTION_MODEL,
          messages: [{ role: "user", content: analysisPrompt }],
          temperature: 0.8, // Higher temperature for more creative selections
        });

        let content = response.choices[0]?.message?.content || '{"selectedComponents": []}';

        // Strip markdown code blocks if present
        content = content.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();

        console.log('[UIService] LLM Selection Response:', content);

        const parsed = JSON.parse(content);
        const selectedComponentNames = parsed.selectedComponents || [];

        // Get full component details
        const selectedComponents = this.getComponentDetails(selectedComponentNames);

        console.log(`[UIService] Selected ${selectedComponents.length} components:`, selectedComponents.map(c => c.name));

        // Format for prompt injection
        const formattedForPrompt = this.formatSelectedComponentsForPrompt(selectedComponents);

        console.log('\n[UIService] FORMATTED UI COMPONENTS OUTPUT (to be appended to detailedContext):');
        console.log('='.repeat(80));
        console.log(formattedForPrompt);
        console.log('='.repeat(80));
        console.log(`[UIService] Total length of UI components string: ${formattedForPrompt.length} chars\n`);

        const result = {
          selectedComponents,
          formattedForPrompt
        } as UISelectionResult;
        selectionCache.set(cacheKey, result);
        return result;

      } catch (error: any) {
        lastError = error;
        console.error(`[UIService] Error (attempt ${attempt}): ${error?.status || ''} ${error?.message || error}`);

        // Rotate key on rate limits or quota errors
        if (error?.message?.includes('429') ||
          error?.message?.includes('quota') ||
          error?.message?.includes('RESOURCE_EXHAUSTED') ||
          error?.message?.includes('overloaded')) {
          console.log('[UIService] Rate limited or quota exceeded, rotating key...');
          rotateApiKey();
          await new Promise(resolve => setTimeout(resolve, 2000 + (attempt * 1000)));
          continue;
        }

        // For other errors, also rotate and retry
        rotateApiKey();
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    // All retries exhausted
    console.error(`[UIService] All ${maxRetries} attempts failed: ${lastError?.message}`);
    return {
      selectedComponents: [],
      formattedForPrompt: ''
    };
  }

  // Get full details for selected component names
  private static getComponentDetails(componentNames: string[]): UIComponent[] {
    return componentNames
      .map((name) => {
        const component = text[name as keyof typeof text];
        if (!component) {
          console.warn(` Component "${name}" not found in components.ts`);
          return null;
        }
        return {
          name,
          description: component.description,
          codesnippet: component.codesnippet,
          dependencies: component.dependencies
        };
      })
      .filter((c): c is UIComponent => c !== null);
  }

  // Format selected components for prompt injection
  private static formatSelectedComponentsForPrompt(components: UIComponent[]): string {
    if (components.length === 0) {
      return '';
    }

    // Simple clean format with all component details
    const componentsData = components.map(comp => ({
      name: comp.name,
      description: comp.description,
      codesnippet: comp.codesnippet,
      dependencies: comp.dependencies
    }));

    const formatted = `

COMPULSORY USE ALL THESE UI COMPONENTS IN YOUR IMPLEMENTATION:

${JSON.stringify(componentsData, null, 2)}
`;

    return formatted;
  }
}
