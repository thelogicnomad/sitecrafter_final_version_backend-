/**
 * Error Fixer Service
 * Uses gemini-2.5-flash-lite-preview-09-2025 for fixing code errors
 * Includes API key rotation for rate limit handling
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

// Error fix specific model - lighter and faster for quick fixes
const ERROR_FIX_MODEL = 'gemini-2.5-flash-lite-preview-09-2025';

// Multiple API keys for rotation
const apiKeys = [
    process.env.gemini8,
    process.env.gemini9,
    process.env.gemini10,
    process.env.gemini11,
    process.env.gemini7,
    process.env.gemini6,
    process.env.gemini5,
    process.env.gemini2,
    process.env.gemini,
    process.env.gemini3,
    process.env.gemini4,
].filter(key => key && key.length > 0) as string[];

let currentKeyIndex = 0;

console.log(` Error Fixer using ${apiKeys.length} API keys`);
console.log(` Error Fix Model: ${ERROR_FIX_MODEL}`);

function getCurrentApiKey(): string {
    return apiKeys[currentKeyIndex] || '';
}

function rotateApiKey(): void {
    if (apiKeys.length > 1) {
        currentKeyIndex = (currentKeyIndex + 1) % apiKeys.length;
        console.log(`    Error Fixer rotated to key ${currentKeyIndex + 1}/${apiKeys.length}`);
    }
}

/**
 * Fix code error using Gemini LLM
 */
export async function fixCodeError(
    error: string,
    filePath: string,
    fileContent: string,
    maxRetries: number = 5
): Promise<{ fixedCode: string; success: boolean }> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            const genAI = new GoogleGenerativeAI(getCurrentApiKey());
            const model = genAI.getGenerativeModel({ model: ERROR_FIX_MODEL });

            // Detect if this is a runtime error
            const isRuntimeError = error.includes('Runtime Error') ||
                error.includes('RUNTIME_ERROR') ||
                error.includes('error boundary') ||
                error.includes('The above error occurred');

            const prompt = isRuntimeError
                ? `You are an expert React/TypeScript developer. Fix the following RUNTIME ERROR in this code.

## Runtime Error Details:
\`\`\`
${error}
\`\`\`

## File: ${filePath}
\`\`\`tsx
${fileContent}
\`\`\`

## Instructions for Runtime Errors:
1. This is a RUNTIME error that occurred in the browser, not a build error
2. Common runtime errors include:
   - Accessing properties of undefined/null (cannot read property 'x' of undefined)
   - React component errors (hooks, render errors)
   - Unhandled promise rejections
   - Type errors (undefined is not a function)
3. Look for:
   - Missing null/undefined checks
   - Incorrect hook usage (hooks called conditionally)
   - Accessing array/object properties without validation
   - Missing optional chaining (?.)
   - Async errors without try-catch
4. Fix the code to prevent the runtime error
5. Add defensive programming (null checks, optional chaining, fallbacks)
6. Keep all existing functionality
7. Return ONLY the complete fixed code
8. Do NOT include markdown code fences or explanations
9. The response should be valid TypeScript/React code

## Fixed Code:`
                : `You are an expert React/TypeScript developer. Fix the following error in this code.

## Error Message:
\`\`\`
${error}
\`\`\`

## File: ${filePath}
\`\`\`tsx
${fileContent}
\`\`\`

## Instructions:
1. Analyze the error carefully
2. Fix the code to resolve the error
3. Keep all existing functionality
4. Return ONLY the complete fixed code
5. Do NOT include markdown code fences or explanations
6. The response should be valid TypeScript/React code that can be saved directly to a file

## Fixed Code:`;

            console.log(`    [Attempt ${attempt + 1}/${maxRetries}] Fixing ${filePath}...`);

            const result = await model.generateContent(prompt);
            const response = result.response;
            let fixedCode = response.text().trim();

            // Clean up response - remove markdown fences if present
            if (fixedCode.startsWith('```')) {
                const lines = fixedCode.split('\n');
                lines.shift(); // Remove opening fence
                if (lines[lines.length - 1] === '```') {
                    lines.pop(); // Remove closing fence
                }
                fixedCode = lines.join('\n');
            }

            console.log(`    Fixed ${filePath} (${fixedCode.length} chars)`);

            return { fixedCode, success: true };

        } catch (err: any) {
            lastError = err;
            console.error(`    Error fix attempt ${attempt + 1} failed:`, err.message?.slice(0, 100));

            // Check for rate limit error
            if (err.message?.includes('429') || err.message?.includes('quota') || err.message?.includes('rate')) {
                rotateApiKey();
                await new Promise(r => setTimeout(r, 1000 * (attempt + 1))); // Exponential backoff
            } else {
                throw err;
            }
        }
    }

    console.error(`    All ${maxRetries} attempts failed for ${filePath}`);
    throw lastError || new Error('Failed to fix code');
}

/**
 * Analyze code for potential issues
 */
export async function analyzeCode(
    files: Array<{ path: string; content: string }>
): Promise<Array<{ file: string; line: number; issue: string; severity: 'error' | 'warning' }>> {
    try {
        const genAI = new GoogleGenerativeAI(getCurrentApiKey());
        const model = genAI.getGenerativeModel({ model: ERROR_FIX_MODEL });

        const filesContent = files
            .slice(0, 10) // Limit to first 10 files
            .map(f => `### ${f.path}\n\`\`\`tsx\n${f.content}\n\`\`\``)
            .join('\n\n');

        const prompt = `You are an expert React/TypeScript developer. Analyze these files for potential issues.

${filesContent}

## Instructions:
1. Look for syntax errors, missing imports, type errors
2. Check for common React patterns issues
3. Return a JSON array of issues found, or empty array if none

## Response format (JSON only):
[
  { "file": "path/to/file.tsx", "line": 10, "issue": "Description of issue", "severity": "error" }
]`;

        const result = await model.generateContent(prompt);
        let responseText = result.response.text().trim();

        // Clean up JSON response
        if (responseText.startsWith('```')) {
            responseText = responseText.replace(/^```json?\n?/, '').replace(/\n?```$/, '');
        }

        return JSON.parse(responseText);
    } catch (err: any) {
        console.error('    Code analysis failed:', err.message);
        return [];
    }
}
