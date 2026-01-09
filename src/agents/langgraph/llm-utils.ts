/**
 * LLM Utility - Google Gemini integration for LangGraph nodes
 * Using gemini-2.5-flash model with API key rotation
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

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
const MODEL = 'gemini-3-flash-preview';

console.log(` LangGraph using ${apiKeys.length} Gemini API keys`);
console.log(` Model: ${MODEL}`);

if (apiKeys.length === 0) {
    console.warn(' No Gemini API keys set!');
}

function getCurrentApiKey(): string {
    return apiKeys[currentKeyIndex] || '';
}

function rotateApiKey(): void {
    if (apiKeys.length > 1) {
        currentKeyIndex = (currentKeyIndex + 1) % apiKeys.length;
        console.log(` Rotated to key ${currentKeyIndex + 1}/${apiKeys.length}`);
    }
}

function createClient(): GoogleGenerativeAI {
    return new GoogleGenerativeAI(getCurrentApiKey());
}

export async function invokeLLM(
    systemPrompt: string,
    userPrompt: string,
    temperature: number = 0.7,
    maxRetries: number = 5
): Promise<string> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            console.log(` LLM attempt ${attempt}/${maxRetries} (Key ${currentKeyIndex + 1}/${apiKeys.length})...`);

            const genAI = createClient();
            const model = genAI.getGenerativeModel({
                model: MODEL,
                generationConfig: { temperature: Math.min(temperature + (attempt * 0.03), 1.0) }
            });

            const result = await model.generateContent([{ text: `${systemPrompt}\n\n${userPrompt}` }]);
            const content = result.response.text() || '';

            if (content.length === 0) {
                console.log(` Empty response`);
                rotateApiKey();
                await delay(2000);
                continue;
            }

            console.log(` Received ${content.length} chars`);
            return content;

        } catch (error: any) {
            lastError = error;
            console.error(` Error:`, error.message?.substring(0, 100) || error.message);

            if (error.message?.includes('429') || error.message?.includes('quota') || error.message?.includes('RESOURCE_EXHAUSTED')) {
                console.log(` Rate limited, rotating key...`);
                rotateApiKey();
                await delay(3000 + (attempt * 1000));
                continue;
            }

            if (error.message?.includes('RECITATION') || error.message?.includes('safety')) {
                rotateApiKey();
                await delay(2000);
                continue;
            }

            if (error.message?.includes('503') || error.message?.includes('overloaded')) {
                rotateApiKey();
                await delay(5000);
                continue;
            }

            rotateApiKey();
            await delay(2000);
        }
    }

    throw new Error(`LLM failed after ${maxRetries} attempts: ${lastError?.message}`);
}

function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export function parseChirActions(response: string): { path: string; content: string }[] {
    const files: { path: string; content: string }[] = [];

    console.log(`    Preview: ${response.substring(0, 300).replace(/\n/g, '\\n')}`);

    const patterns = [
        /<chirAction\s+type="file"\s+filePath="([^"]+)">([\s\S]*?)<\/chirAction>/g,
        /<chirAction\s+filePath="([^"]+)"\s+type="file">([\s\S]*?)<\/chirAction>/g,
        /<chirAction[^>]*filePath="([^"]+)"[^>]*>([\s\S]*?)<\/chirAction>/g,
    ];

    for (const pattern of patterns) {
        for (const match of response.matchAll(pattern)) {
            let filePath = match[1].trim();
            let content = match[2].replace(/^```\w*\s*/gm, '').replace(/```\s*$/gm, '').trim();

            if (!filePath.startsWith('src/') && filePath.includes('/')) {
                filePath = 'src/' + filePath;
            }

            if (content.length > 0 && !files.some(f => f.path === filePath)) {
                console.log(`    ${filePath} (${content.length} chars)`);
                files.push({ path: filePath, content });
            }
        }
        if (files.length > 0) break;
    }

    console.log(` Parsed ${files.length} files`);
    return files;
}

export function extractExports(content: string): string[] {
    const exports: string[] = [];
    for (const m of content.matchAll(/export\s+(?:const|function|class|type|interface)\s+(\w+)/g)) exports.push(m[1]);
    for (const m of content.matchAll(/export\s*\{\s*([^}]+)\s*\}/g)) exports.push(...m[1].split(',').map(n => n.trim().split(' ')[0]));
    if (content.match(/export\s+default/)) exports.push('default');
    return exports;
}

export function extractImports(content: string): string[] {
    const imports: string[] = [];
    for (const m of content.matchAll(/from\s+['"](@\/[^'"]+)['"]/g)) imports.push(m[1].replace('@/', 'src/'));
    return imports;
}
