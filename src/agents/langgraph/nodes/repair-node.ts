/**
 * Repair Node - Fixes errors found during validation
 * OPTIMIZED for 8000 token limit - fixes ONE file at a time
 */

import { WebsiteState, GeneratedFile, createRegistryEntry } from '../graph-state';
import { invokeLLM, parseChirActions, extractExports, extractImports } from '../llm-utils';
import { notifyFileCreated, notifyPhaseChange } from '../website-graph';

// Concise system prompt
const SYSTEM_PROMPT = `Fix the React/TypeScript code errors. Return complete fixed file.

OUTPUT FORMAT:
<chirAction type="file" filePath="src/path/File.tsx">
// complete fixed code
</chirAction>

Use <chirAction> tags. No markdown.`;

export async function repairNode(state: WebsiteState): Promise<Partial<WebsiteState>> {
    console.log('\n🔧 ═══════════════════════════════════════════');
    console.log('🔧 NODE: REPAIR');
    console.log(`🔧 Iteration: ${state.iterationCount}/3`);
    console.log('🔧 ═══════════════════════════════════════════\n');

    // Notify phase change for streaming
    notifyPhaseChange('repair');

    const errors = state.errors;
    if (errors.length === 0) {
        console.log('    No errors to fix!');
        return { currentPhase: 'repair' };
    }

    // Check iteration limit
    if (state.iterationCount >= 3) {
        console.log('    Max iterations reached');
        return {
            isComplete: true,
            currentPhase: 'repair',
            messages: [`Repair stopped: max iterations. ${errors.length} errors remain.`]
        };
    }

    const files = new Map(state.files);
    const registry = new Map(state.fileRegistry);

    // Handle Router duplication specially (no LLM needed)
    const routerError = errors.find(e => e.type === 'router_duplicate');
    if (routerError) {
        console.log('    Fixing Router duplication...');
        const appFile = files.get('src/App.tsx');
        if (appFile && appFile.content.includes('BrowserRouter')) {
            let fixed = appFile.content
                .replace(/import\s*{\s*BrowserRouter\s*,?\s*/g, "import { ")
                .replace(/,?\s*BrowserRouter\s*}/g, " }")
                .replace(/<BrowserRouter>/g, '')
                .replace(/<\/BrowserRouter>/g, '');

            files.set('src/App.tsx', { ...appFile, content: fixed });
            console.log('    Removed BrowserRouter from App.tsx');
        }
    }

    // Group errors by file
    const errorsByFile = new Map<string, typeof errors>();
    for (const error of errors) {
        if (!error.file.includes(',')) {
            if (!errorsByFile.has(error.file)) {
                errorsByFile.set(error.file, []);
            }
            errorsByFile.get(error.file)!.push(error);
        }
    }

    // Fix ONE file at a time to stay within token limit
    let fixedCount = 0;
    for (const [path, fileErrors] of errorsByFile) {
        const file = files.get(path);
        if (!file || fixedCount >= 3) break; // Max 3 files per iteration

        console.log(`   🔧 Fixing: ${path}`);

        // Truncate content to ~1000 chars for prompt
        const truncatedContent = file.content.substring(0, 1500);

        const prompt = `Fix this file: ${path}

Errors:
${fileErrors.map(e => `- ${e.message}`).join('\n')}

Current code:
${truncatedContent}${file.content.length > 1500 ? '\n...(truncated)' : ''}

Return COMPLETE fixed file.`;

        try {
            const response = await invokeLLM(SYSTEM_PROMPT, prompt, 0.5);
            const parsedFiles = parseChirActions(response);

            for (const { path: fixedPath, content } of parsedFiles) {
                if (fixedPath === path || fixedPath.endsWith(path.split('/').pop()!)) {
                    const exports = extractExports(content);
                    const imports = extractImports(content);

                    const repairedFile = { path, content, phase: 'repair', exports, imports };
                    files.set(path, repairedFile);
                    registry.set(path, createRegistryEntry(repairedFile));

                    // Stream repaired file to frontend
                    notifyFileCreated(repairedFile);

                    console.log(`    Fixed: ${path}`);
                    fixedCount++;
                }
            }
        } catch (error: any) {
            console.error(`    Failed to fix ${path}:`, error.message?.substring(0, 80));
        }

        await delay(1000);
    }

    return {
        files,
        fileRegistry: registry,
        errors: [], // Clear for re-validation
        currentPhase: 'repair',
        messages: [`Repair: fixed ${fixedCount} files`]
    };
}

function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}
