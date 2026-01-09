/**
 * Modification Service - Handles follow-up modifications to projects
 * Analyzes which files need changes and applies LLM-generated modifications
 */

import { invokeLLM } from '../agents/langgraph/llm-utils';
import { IProjectFile } from '../models/project';

interface FileModification {
    path: string;
    action: 'modify' | 'create' | 'delete';
    reason: string;
}

interface ModificationPlan {
    filesToModify: FileModification[];
    summary: string;
}

interface ModifiedFile {
    path: string;
    content: string;
    action: 'modified' | 'created';
}

/**
 * Analyze which files need to be modified based on user request
 */
export async function analyzeModificationRequest(
    modificationRequest: string,
    files: IProjectFile[]
): Promise<ModificationPlan> {
    console.log('\n🔍 MODIFICATION ANALYSIS');
    console.log(`   Request: ${modificationRequest.slice(0, 100)}...`);
    console.log(`   Files to analyze: ${files.length}`);

    const fileList = files.map(f => `- ${f.path}`).join('\n');

    const systemPrompt = `You are a code modification analyzer. Given a user's modification request and a list of project files, determine which files need to be modified.

Return ONLY a valid JSON object (no markdown, no explanation):
{
    "filesToModify": [
        {"path": "src/pages/HomePage.tsx", "action": "modify", "reason": "User wants to change hero section"},
        {"path": "src/components/NewComponent.tsx", "action": "create", "reason": "New component needed"}
    ],
    "summary": "Brief summary of changes"
}

Actions: "modify" (change existing file), "create" (new file), "delete" (remove file)`;

    const userPrompt = `User Request: "${modificationRequest}"

Project Files:
${fileList}

Which files need to be modified? Return JSON only.`;

    try {
        const response = await invokeLLM(systemPrompt, userPrompt, 0.3);

        let cleanContent = response.trim();
        if (cleanContent.startsWith("```json")) cleanContent = cleanContent.slice(7);
        if (cleanContent.startsWith("```")) cleanContent = cleanContent.slice(3);
        if (cleanContent.endsWith("```")) cleanContent = cleanContent.slice(0, -3);
        cleanContent = cleanContent.trim();

        const jsonMatch = cleanContent.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            cleanContent = jsonMatch[0];
        }

        const plan = JSON.parse(cleanContent) as ModificationPlan;
        console.log(`   📋 Files to modify: ${plan.filesToModify.length}`);
        return plan;
    } catch (error: any) {
        console.error('❌ Analysis failed:', error.message);
        return { filesToModify: [], summary: 'Analysis failed' };
    }
}

/**
 * Apply modifications to files using LLM
 */
export async function applyModifications(
    modificationRequest: string,
    plan: ModificationPlan,
    files: IProjectFile[]
): Promise<ModifiedFile[]> {
    console.log('\n🔧 APPLYING MODIFICATIONS');
    const modifiedFiles: ModifiedFile[] = [];

    for (const modification of plan.filesToModify) {
        console.log(`   📝 ${modification.action}: ${modification.path}`);

        if (modification.action === 'create') {
            // Create new file
            const content = await generateNewFile(modification.path, modificationRequest);
            if (content) {
                modifiedFiles.push({ path: modification.path, content, action: 'created' });
            }
        } else if (modification.action === 'modify') {
            // Modify existing file
            const existingFile = files.find(f => f.path === modification.path || f.path.endsWith(modification.path));
            if (existingFile) {
                const newContent = await modifyExistingFile(
                    existingFile.path,
                    existingFile.content,
                    modificationRequest,
                    modification.reason
                );
                if (newContent && newContent !== existingFile.content) {
                    modifiedFiles.push({ path: existingFile.path, content: newContent, action: 'modified' });
                }
            }
        }
    }

    console.log(`   ✅ Modified ${modifiedFiles.length} files`);
    return modifiedFiles;
}

/**
 * Generate a new file based on modification request
 */
async function generateNewFile(filePath: string, request: string): Promise<string | null> {
    const componentName = filePath.split('/').pop()?.replace(/\.(tsx?|jsx?)$/, '') || 'Component';

    const systemPrompt = `You are an expert React/TypeScript developer. Generate a complete, production-ready component.

Requirements:
- Use TypeScript with proper interfaces
- Use Tailwind CSS for styling
- Make it responsive and modern
- Include all necessary imports
- Export as default

Return ONLY the code, no markdown or explanations.`;

    const userPrompt = `Create a React component for: ${request}
File path: ${filePath}
Component name: ${componentName}

Generate the complete code.`;

    try {
        const response = await invokeLLM(systemPrompt, userPrompt, 0.7);
        let code = response.trim();

        // Remove markdown code blocks
        if (code.startsWith("```typescript") || code.startsWith("```tsx")) {
            code = code.split('\n').slice(1).join('\n');
        }
        if (code.endsWith("```")) {
            code = code.slice(0, -3).trim();
        }

        return code;
    } catch (error) {
        console.error(`Failed to generate ${filePath}:`, error);
        return null;
    }
}

/**
 * Modify an existing file based on modification request
 */
async function modifyExistingFile(
    filePath: string,
    currentContent: string,
    request: string,
    reason: string
): Promise<string | null> {
    const systemPrompt = `You are an expert code modifier. Modify the given code according to the user's request.

Rules:
- Preserve all existing functionality unless explicitly asked to remove
- Maintain consistent styling and patterns
- Keep all imports and exports working
- Return ONLY the complete modified code, no explanations

Return the COMPLETE file content after modifications.`;

    const userPrompt = `Modification Request: ${request}
Reason: ${reason}
File: ${filePath}

Current Code:
\`\`\`
${currentContent}
\`\`\`

Return the complete modified file.`;

    try {
        const response = await invokeLLM(systemPrompt, userPrompt, 0.5);
        let code = response.trim();

        // Remove markdown code blocks
        if (code.startsWith("```typescript") || code.startsWith("```tsx") || code.startsWith("```")) {
            code = code.split('\n').slice(1).join('\n');
        }
        if (code.endsWith("```")) {
            code = code.slice(0, -3).trim();
        }

        return code;
    } catch (error) {
        console.error(`Failed to modify ${filePath}:`, error);
        return null;
    }
}

export default {
    analyzeModificationRequest,
    applyModifications
};
