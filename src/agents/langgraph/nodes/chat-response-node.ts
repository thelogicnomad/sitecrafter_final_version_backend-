/**
 * Chat Response Node - Handles conversational queries about the project
 * 
 * This node is invoked when user asks questions like:
 * - "Where is the Featured Memories component?"
 * - "Explain the project structure"
 * - "What pages does this project have?"
 * 
 * It retrieves context from Mem0 and uses LLM to provide helpful answers.
 */

import { WebsiteState } from '../graph-state';
import OpenAI from 'openai';
import { retrieveContext } from '../memory-utils';

const openai = new OpenAI({
    apiKey: process.env.gemini2,
    baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/"
});

/**
 * Build project context from current state
 */
function buildProjectContext(state: WebsiteState): string {
    const sections: string[] = [];

    // Project info
    if (state.blueprint) {
        sections.push(`PROJECT: ${state.blueprint.projectName}`);
        sections.push(`DESCRIPTION: ${state.blueprint.description}`);
        sections.push('');
    }

    // Pages
    if (state.blueprint?.pages) {
        sections.push('PAGES:');
        state.blueprint.pages.forEach(page => {
            sections.push(`  • ${page.name} (${page.route}) - ${page.description}`);
        });
        sections.push('');
    }

    // Components from files
    const components: string[] = [];
    const pages: string[] = [];
    const features: string[] = [];

    state.files.forEach((file, path) => {
        if (path.includes('/components/features/')) {
            features.push(`  • ${path.split('/').pop()} - ${path}`);
        } else if (path.includes('/components/')) {
            components.push(`  • ${path.split('/').pop()} - ${path}`);
        } else if (path.includes('/pages/')) {
            pages.push(`  • ${path.split('/').pop()} - ${path}`);
        }
    });

    if (features.length > 0) {
        sections.push('FEATURE COMPONENTS:');
        sections.push(...features);
        sections.push('');
    }

    if (components.length > 0) {
        sections.push('UI COMPONENTS:');
        sections.push(...components);
        sections.push('');
    }

    // File structure
    sections.push('FILE STRUCTURE:');
    const sortedPaths = Array.from(state.files.keys()).sort();
    sortedPaths.forEach(path => {
        sections.push(`  ${path}`);
    });

    return sections.join('\n');
}

/**
 * Chat Response Node - Answer questions about the project
 */
export async function chatResponseNode(state: WebsiteState): Promise<Partial<WebsiteState>> {
    console.log('\n ═══════════════════════════════════════════════════');
    console.log(' CHAT RESPONSE - Answering User Question');
    console.log(' ═══════════════════════════════════════════════════\n');

    const userQuestion = state.userPrompt;

    // Build context from current state
    const projectContext = buildProjectContext(state);

    // Try to get additional context from Mem0
    let mem0Context = '';
    try {
        const memories = await retrieveContext(state.projectId, userQuestion, 5);
        if (memories && memories.length > 0) {
            mem0Context = '\n\nMEMORY CONTEXT:\n' + memories;
        }
    } catch (e) {
        console.log('   ℹ No Mem0 context available');
    }

    const prompt = `You are a helpful AI assistant that knows everything about this web project.
Answer the user's question based on the project context provided.

USER QUESTION: "${userQuestion}"

${projectContext}
${mem0Context}

INSTRUCTIONS:
1. Be specific - mention exact file paths when relevant
2. Be helpful - if they ask "where is X", tell them the exact location
3. Be concise - don't repeat the entire project structure
4. If asked about a feature that doesn't exist, say so clearly
5. Format your response nicely with bullet points or sections if needed

Respond naturally as a helpful assistant.`;

    try {
        const response = await openai.chat.completions.create({
            model: "gemini-2.5-flash-lite-preview-09-2025",
            messages: [
                {
                    role: "system",
                    content: "You are a helpful AI assistant that explains project structure and answers questions about web applications. Be specific and mention file paths when relevant."
                },
                { role: "user", content: prompt }
            ],
            temperature: 0.7
        });

        const answer = response.choices[0].message.content || "I couldn't find information about that in this project.";

        console.log(`    Generated response (${answer.length} chars)`);

        return {
            chatResponse: answer,
            messages: [` ${answer}`]
        };

    } catch (error: any) {
        console.error('    Chat response failed:', error.message);

        // Provide a basic fallback response
        let fallbackResponse = "I encountered an error while processing your question. ";

        if (state.files.size > 0) {
            fallbackResponse += `However, I can tell you that this project has ${state.files.size} files. `;

            if (state.blueprint) {
                fallbackResponse += `The project is called "${state.blueprint.projectName}" and has ${state.blueprint.pages?.length || 0} pages.`;
            }
        }

        return {
            chatResponse: fallbackResponse,
            messages: [` ${fallbackResponse}`]
        };
    }
}

/**
 * Store full project context in state for future reference
 */
export function buildAndStoreProjectContext(state: WebsiteState): Partial<WebsiteState> {
    const pages: Array<{ name: string; route: string; purpose: string }> = [];
    const components: Array<{ name: string; location: string; purpose: string }> = [];
    const features: string[] = [];
    const fileStructure: string[] = [];

    // Extract pages
    state.blueprint?.pages?.forEach(page => {
        pages.push({
            name: page.name,
            route: page.route,
            purpose: page.description
        });
    });

    // Extract components and features from files
    state.files.forEach((file, path) => {
        fileStructure.push(path);

        if (path.includes('/components/features/')) {
            const name = path.split('/').pop()?.replace('.tsx', '') || '';
            features.push(name);
            components.push({
                name,
                location: path,
                purpose: `Feature component: ${name}`
            });
        } else if (path.includes('/components/')) {
            const name = path.split('/').pop()?.replace('.tsx', '') || '';
            components.push({
                name,
                location: path,
                purpose: file.exports?.join(', ') || name
            });
        }
    });

    return {
        projectContext: {
            description: state.blueprint?.description || '',
            pages,
            components,
            features,
            fileStructure
        }
    };
}
