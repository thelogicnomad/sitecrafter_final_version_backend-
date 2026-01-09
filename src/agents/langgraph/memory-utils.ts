/**
 * Mem0 Memory Integration for LangGraph
 * Provides persistent context between LLM calls
 */

import MemoryClient from 'mem0ai';

// Initialize Mem0 client
const apiKey = process.env.mem0 || process.env.MEM0_API_KEY;

if (!apiKey) {
    console.warn(' Mem0 API key not found (mem0 or MEM0_API_KEY)');
}

const memory = apiKey ? new MemoryClient({ apiKey }) : null;

export interface FileMemory {
    path: string;
    exports: string[];
    imports: string[];
    type: 'component' | 'page' | 'layout' | 'util' | 'config';
    phase: string;
    contentPreview?: string;
}

/**
 * Store generated file info in Mem0
 */
export async function storeFileMemory(
    projectId: string,
    file: FileMemory
): Promise<void> {
    if (!memory) {
        console.log('    Mem0 not available, skipping memory store');
        return;
    }

    try {
        const message = `Generated ${file.type} file: ${file.path}
Exports: ${file.exports.join(', ') || 'default export'}
Imports from: ${file.imports.join(', ') || 'none'}
Phase: ${file.phase}
${file.contentPreview ? `Preview: ${file.contentPreview}` : ''}`;

        await memory.add([
            { role: 'assistant', content: message }
        ], {
            user_id: projectId,
            metadata: {
                type: 'file',
                path: file.path,
                fileType: file.type,
                exports: file.exports,
                phase: file.phase
            }
        });

        console.log(`    Stored in Mem0: ${file.path}`);
    } catch (error: any) {
        console.error(`    Mem0 store error:`, error.message?.substring(0, 100));
    }
}

/**
 * Store blueprint in Mem0
 */
export async function storeBlueprintMemory(
    projectId: string,
    blueprint: any
): Promise<void> {
    if (!memory) return;

    try {
        const message = `Project Blueprint: ${blueprint.projectName}
Description: ${blueprint.description}
Pages: ${blueprint.pages.map((p: any) => `${p.name} (${p.route})`).join(', ')}
Components: ${blueprint.components.map((c: any) => c.name).join(', ')}
Design: ${blueprint.designSystem.style} style with ${blueprint.designSystem.primaryColor} primary color`;

        await memory.add([
            { role: 'user', content: `Create a website: ${blueprint.description}` },
            { role: 'assistant', content: message }
        ], {
            user_id: projectId,
            metadata: { type: 'blueprint', projectName: blueprint.projectName }
        });

        console.log(`    Blueprint stored in Mem0`);
    } catch (error: any) {
        console.error(`    Mem0 blueprint error:`, error.message?.substring(0, 100));
    }
}

/**
 * Retrieve relevant context from Mem0 for a specific phase
 */
export async function retrieveContext(
    projectId: string,
    query: string,
    limit: number = 20
): Promise<string> {
    if (!memory) {
        console.log('    Mem0 not available');
        return '';
    }

    try {
        const results = await memory.search(query, {
            user_id: projectId,
            limit
        });

        if (!results || results.length === 0) {
            return '';
        }

        console.log(`    Retrieved ${results.length} memories from Mem0`);

        // Format memories as context
        const context = results.map((r: any) => r.memory).join('\n\n');
        return context;
    } catch (error: any) {
        console.error(`    Mem0 search error:`, error.message?.substring(0, 100));
        return '';
    }
}

/**
 * Get all file memories for a project
 */
export async function getAllFileMemories(projectId: string): Promise<string> {
    if (!memory) return '';

    try {
        const results = await memory.getAll({
            user_id: projectId
        });

        if (!results || results.length === 0) {
            return 'No previous files generated.';
        }

        // Group by type
        const grouped: Record<string, string[]> = {};
        for (const r of results) {
            const type = r.metadata?.fileType || 'other';
            if (!grouped[type]) grouped[type] = [];
            if (r.memory) grouped[type].push(r.memory);
        }

        let context = '=== PROJECT CONTEXT FROM MEMORY ===\n\n';

        if (grouped['layout']) {
            context += 'LAYOUT COMPONENTS:\n' + grouped['layout'].join('\n') + '\n\n';
        }
        if (grouped['component']) {
            context += 'UI COMPONENTS:\n' + grouped['component'].join('\n') + '\n\n';
        }
        if (grouped['util']) {
            context += 'UTILITIES:\n' + grouped['util'].join('\n') + '\n\n';
        }
        if (grouped['page']) {
            context += 'PAGES:\n' + grouped['page'].join('\n') + '\n\n';
        }

        console.log(`    Loaded ${results.length} memories from Mem0`);
        return context;
    } catch (error: any) {
        console.error(`    Mem0 getAll error:`, error.message?.substring(0, 100));
        return '';
    }
}

/**
 * Clear project memory (for new generation)
 */
export async function clearProjectMemory(projectId: string): Promise<void> {
    if (!memory) return;

    try {
        await memory.deleteAll({ user_id: projectId });
        console.log(`    Cleared Mem0 memory for project: ${projectId}`);
    } catch (error: any) {
        console.error(`    Mem0 clear error:`, error.message?.substring(0, 100));
    }
}

/**
 * Generate a unique project ID for memory tracking
 */
export function generateProjectId(projectName: string): string {
    const timestamp = Date.now();
    const sanitized = projectName.toLowerCase().replace(/[^a-z0-9]/g, '-');
    return `proj-${sanitized}-${timestamp}`;
}

export { memory };
