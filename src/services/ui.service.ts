import OpenAI from "openai";
import { chatCompletionWithRetry } from "../utils/openaiRetry";
import { text } from '../ui/components';

const client = new OpenAI({
  baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
  apiKey: process.env.gemini3
});

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
    try {
      console.log(' Selecting UI components based on requirements...');

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

      const response: any = await chatCompletionWithRetry(client, {
        model: UI_SELECTION_MODEL,
        messages: [{ role: "user", content: analysisPrompt }],
        temperature: 0.8, // Higher temperature for more creative selections
      });

      let content = response.choices[0]?.message?.content || '{"selectedComponents": []}';

      // Strip markdown code blocks if present
      content = content.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();

      console.log(' LLM Selection Response:', content);

      const parsed = JSON.parse(content);
      const selectedComponentNames = parsed.selectedComponents || [];

      // Get full component details
      const selectedComponents = this.getComponentDetails(selectedComponentNames);

      console.log(` Selected ${selectedComponents.length} components:`, selectedComponents.map(c => c.name));

      // Format for prompt injection
      const formattedForPrompt = this.formatSelectedComponentsForPrompt(selectedComponents);

      console.log('\n FORMATTED UI COMPONENTS OUTPUT (to be appended to detailedContext):');
      console.log('='.repeat(80));
      console.log(formattedForPrompt);
      console.log('='.repeat(80));
      console.log(` Total length of UI components string: ${formattedForPrompt.length} chars\n`);

      const result = {
        selectedComponents,
        formattedForPrompt
      } as UISelectionResult;
      selectionCache.set(cacheKey, result);
      return result;

    } catch (error: any) {
      console.error(` Error selecting UI components: ${error?.status || ''} ${error?.message || error}`);
      // Return empty selection on error to not break the flow
      return {
        selectedComponents: [],
        formattedForPrompt: ''
      };
    }
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
