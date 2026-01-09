/**
 * Modification Analyzer Node - Intelligently detects which files need modification
 * 
 * When user requests a change like "Add a new Gallery page", this node:
 * 1. Analyzes the request
 * 2. Determines ALL files that need to change (not just the new page)
 * 3. Creates a modification plan
 * 
 * Example: "Add a new Gallery page" would identify:
 * - CREATE: src/pages/GalleryPage.tsx
 * - MODIFY: src/App.tsx (add route)
 * - MODIFY: src/components/layout/Navbar.tsx (add nav link)
 */

import { WebsiteState, GeneratedFile } from '../graph-state';
import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: process.env.gemini2,
    baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/"
});

interface ModificationChange {
    file: string;
    action: 'create' | 'modify' | 'delete';
    description: string;
}

interface ModificationPlan {
    summary: string;
    changes: ModificationChange[];
}

/**
 * Build file structure context for LLM
 */
function buildFileStructureContext(files: Map<string, GeneratedFile>): string {
    const structure: string[] = ['CURRENT PROJECT FILES:'];

    const sortedPaths = Array.from(files.keys()).sort();

    // Group by directory
    const grouped: Record<string, string[]> = {};
    sortedPaths.forEach(path => {
        const dir = path.split('/').slice(0, -1).join('/') || 'root';
        if (!grouped[dir]) grouped[dir] = [];
        grouped[dir].push(path.split('/').pop() || path);
    });

    Object.entries(grouped).forEach(([dir, fileNames]) => {
        structure.push(`\n${dir}/`);
        fileNames.forEach(f => structure.push(`  └── ${f}`));
    });

    return structure.join('\n');
}

/**
 * Modification Analyzer Node
 */
export async function modificationAnalyzerNode(state: WebsiteState): Promise<Partial<WebsiteState>> {
    console.log('\n ═══════════════════════════════════════════════════');
    console.log(' MODIFICATION ANALYZER - Detecting Required Changes');
    console.log(' ═══════════════════════════════════════════════════\n');

    const userRequest = state.userPrompt;
    const fileStructure = buildFileStructureContext(state.files);

    // Get current App.tsx content for reference
    const appTsx = state.files.get('src/App.tsx');
    const navbarTsx = state.files.get('src/components/layout/Navbar.tsx') ||
        state.files.get('src/components/layout/Header.tsx');

    const prompt = `You are an expert web developer. Analyze this modification request and determine ALL files that need to be changed.

USER REQUEST: "${userRequest}"

${fileStructure}

CURRENT App.tsx ROUTES (if exists):
${appTsx?.content?.slice(0, 2000) || 'Not available'}

CURRENT NAVBAR/HEADER (if exists):
${navbarTsx?.content?.slice(0, 1500) || 'Not available'}

TASK: Determine ALL files that need to be created or modified to fulfill this request.

IMPORTANT RULES:
1. If adding a new page → Also modify:
   - src/App.tsx (add route)
   - Navbar or Header component (add navigation link)
   
2. If adding a new component → Consider:
   - Where it will be used (which page/component imports it?)
   - Update parent file to import and use the new component

3. If adding a new section to a page → Only modify that page

4. If changing navigation → Update both Navbar AND Header if they exist

Return a JSON object with this EXACT structure:
{
    "summary": "Brief description of what will be done",
    "changes": [
        {
            "file": "src/pages/NewPage.tsx",
            "action": "create",
            "description": "Create new page component"
        },
        {
            "file": "src/App.tsx",
            "action": "modify",
            "description": "Add route for /new-page"
        }
    ]
}

Return ONLY valid JSON, no markdown formatting.`;

    try {
        const response = await openai.chat.completions.create({
            model: "gemini-2.5-flash-lite-preview-09-2025",
            messages: [
                {
                    role: "system",
                    content: "You are a code analyzer that determines which files need modification. Return only valid JSON."
                },
                { role: "user", content: prompt }
            ],
            temperature: 0.3
        });

        const content = response.choices[0].message.content || '{}';

        // Extract JSON from response
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error('No JSON found in response');
        }

        const plan: ModificationPlan = JSON.parse(jsonMatch[0]);

        console.log(`    Modification Plan: ${plan.summary}`);
        console.log(`    Files to change: ${plan.changes.length}`);
        plan.changes.forEach(change => {
            const icon = change.action === 'create' ? '➕' : change.action === 'delete' ? '❌' : '✏️';
            console.log(`      ${icon} ${change.action.toUpperCase()}: ${change.file}`);
        });

        // Separate creates and modifies
        const filesToCreate = plan.changes
            .filter(c => c.action === 'create')
            .map(c => c.file);

        const filesToModify = plan.changes
            .filter(c => c.action === 'modify')
            .map(c => c.file);

        return {
            modificationPlan: plan,
            filesToCreate,
            filesToModify,
            messages: [`🔍 Analyzed request: ${plan.summary}`, `📁 ${plan.changes.length} files will be affected`]
        };

    } catch (error: any) {
        console.error('    Modification analysis failed:', error.message);

        // Fallback: Basic detection
        const userLower = userRequest.toLowerCase();
        const filesToCreate: string[] = [];
        const filesToModify: string[] = [];

        // Detect page creation
        if (userLower.includes('add') && userLower.includes('page')) {
            const pageMatch = userRequest.match(/add.*?(\w+)\s*page/i);
            if (pageMatch) {
                const pageName = pageMatch[1].charAt(0).toUpperCase() + pageMatch[1].slice(1);
                filesToCreate.push(`src/pages/${pageName}Page.tsx`);
                filesToModify.push('src/App.tsx');

                // Check if Navbar exists
                if (state.files.has('src/components/layout/Navbar.tsx')) {
                    filesToModify.push('src/components/layout/Navbar.tsx');
                }
            }
        }

        // Detect section/component addition
        if (userLower.includes('add') && (userLower.includes('section') || userLower.includes('component'))) {
            // Find the target page
            const pageMatch = userRequest.match(/(?:to|in|on)\s+(?:the\s+)?(\w+)(?:\s*page)?/i);
            if (pageMatch) {
                const pageName = pageMatch[1].charAt(0).toUpperCase() + pageMatch[1].slice(1);
                const targetPage = Array.from(state.files.keys()).find(p =>
                    p.toLowerCase().includes(pageName.toLowerCase()) && p.includes('/pages/')
                );
                if (targetPage) {
                    filesToModify.push(targetPage);
                }
            }
        }

        return {
            modificationPlan: {
                summary: 'Fallback modification plan',
                changes: [
                    ...filesToCreate.map(f => ({ file: f, action: 'create' as const, description: 'Create new file' })),
                    ...filesToModify.map(f => ({ file: f, action: 'modify' as const, description: 'Update existing file' }))
                ]
            },
            filesToCreate,
            filesToModify,
            messages: [`🔍 Detected ${filesToCreate.length + filesToModify.length} files to change`]
        };
    }
}
