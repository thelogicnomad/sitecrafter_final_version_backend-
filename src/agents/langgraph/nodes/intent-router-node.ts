/**
 * Intent Router Node - Detects user intent and routes to appropriate handler
 * 
 * Intents:
 * - 'create': New project creation (full pipeline)
 * - 'modify': Modify existing project (smart modification)
 * - 'question': Ask about the project (chat response)
 * - 'explain': Explain features/structure (chat response)
 */

import { WebsiteState } from '../graph-state';
import OpenAI from 'openai';

// Multiple API keys for rotation
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

function getClient(): OpenAI {
    return new OpenAI({
        apiKey: apiKeys[currentKeyIndex] || process.env.gemini2,
        baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/"
    });
}

function rotateApiKey(): void {
    if (apiKeys.length > 1) {
        currentKeyIndex = (currentKeyIndex + 1) % apiKeys.length;
        console.log(`[IntentRouter] Rotated to key ${currentKeyIndex + 1}/${apiKeys.length}`);
    }
}

// Keywords that indicate different intents
const MODIFY_KEYWORDS = [
    'add', 'change', 'update', 'modify', 'edit', 'remove', 'delete',
    'fix', 'improve', 'enhance', 'create new', 'add new', 'include',
    'put', 'place', 'insert', 'make', 'build'
];

const QUESTION_KEYWORDS = [
    'where is', 'where are', 'where can i find', 'how do i',
    'what is', 'what are', 'which', 'explain', 'show me',
    'tell me', 'describe', 'help me understand', 'can you explain'
];

/**
 * Intent Router Node - Analyzes user input and determines intent
 */
export async function intentRouterNode(state: WebsiteState): Promise<Partial<WebsiteState>> {
    console.log('\n ═══════════════════════════════════════════════════');
    console.log(' INTENT ROUTER - Analyzing User Request');
    console.log(' ═══════════════════════════════════════════════════\n');

    const userPrompt = state.userPrompt.toLowerCase();
    const hasExistingFiles = state.files.size > 0;
    const hasBlueprint = state.blueprint !== null;

    // Quick keyword check first
    const hasModifyKeywords = MODIFY_KEYWORDS.some(kw => userPrompt.includes(kw));
    const hasQuestionKeywords = QUESTION_KEYWORDS.some(kw => userPrompt.includes(kw));

    // If no files exist, it's always a create
    if (!hasExistingFiles && !hasBlueprint) {
        console.log(' No existing project → Intent: CREATE');
        return {
            requestIntent: 'create',
            isModification: false
        };
    }

    // Use LLM for more accurate intent detection
    const prompt = `Analyze this user request and determine their intent.

USER REQUEST: "${state.userPrompt}"

CONTEXT:
- Project exists: ${hasExistingFiles ? 'Yes' : 'No'}
- Number of files: ${state.files.size}
- Blueprint exists: ${hasBlueprint ? 'Yes' : 'No'}

POSSIBLE INTENTS:
1. "create" - User wants to create a new project from scratch
2. "modify" - User wants to add/change/remove something in the existing project
3. "question" - User is asking a question about where something is or how to find it
4. "explain" - User wants explanation of the project structure or features

IMPORTANT RULES:
- If user asks "where is X?" or "show me X" → question
- If user says "add X" or "create a new X section" → modify
- If user describes a whole new website → create
- If user asks to explain something → explain

Respond with ONLY ONE WORD: create, modify, question, or explain`;

    const maxRetries = 3;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const response = await getClient().chat.completions.create({
                model: "gemini-2.5-flash-lite-preview-09-2025",
                messages: [
                    { role: "system", content: "You are an intent classifier. Respond with only one word." },
                    { role: "user", content: prompt }
                ],
                temperature: 0.1
            });

            const intentRaw = response.choices[0].message.content?.toLowerCase().trim() || 'modify';
            const intent = ['create', 'modify', 'question', 'explain'].includes(intentRaw)
                ? intentRaw as 'create' | 'modify' | 'question' | 'explain'
                : hasQuestionKeywords ? 'question' : 'modify';

            console.log(` Detected Intent: ${intent.toUpperCase()}`);
            console.log(` Has existing files: ${hasExistingFiles}`);
            console.log(` Modify keywords found: ${hasModifyKeywords}`);
            console.log(` Question keywords found: ${hasQuestionKeywords}`);

            return {
                requestIntent: intent,
                isModification: intent === 'modify'
            };

        } catch (error: any) {
            console.error(`[IntentRouter] Attempt ${attempt} failed:`, error.message);
            rotateApiKey();
            if (attempt < maxRetries) {
                await new Promise(r => setTimeout(r, 1000 * attempt));
                continue;
            }
            console.error('    Intent detection failed:', error.message);

            // Fallback to keyword-based detection
            let fallbackIntent: 'create' | 'modify' | 'question' | 'explain' = 'modify';

            if (!hasExistingFiles) {
                fallbackIntent = 'create';
            } else if (hasQuestionKeywords) {
                fallbackIntent = 'question';
            } else if (hasModifyKeywords) {
                fallbackIntent = 'modify';
            }

            console.log(`    Fallback Intent: ${fallbackIntent}`);

            return {
                requestIntent: fallbackIntent,
                isModification: fallbackIntent === 'modify'
            };
        }
    }

    // Fallback after all retries exhausted
    const fallbackIntent: 'create' | 'modify' | 'question' | 'explain' = hasQuestionKeywords ? 'question' : 'modify';
    console.log(`    Final Fallback Intent: ${fallbackIntent}`);
    return {
        requestIntent: fallbackIntent,
        isModification: fallbackIntent === 'modify'
    };
}
