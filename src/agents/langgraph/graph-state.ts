/**
 * LangGraph Website Generator - Graph State
 * Central state that flows through all nodes
 */

import { Annotation } from '@langchain/langgraph';

// Image interface (matching image microservice)
export interface UnsplashImage {
    keyword: string;
    description: string;
    imageUrl: string;
    unsplashLink: string;
    photographer: string;
}

// Type definitions
export interface ProjectBlueprint {
    projectName: string;
    description: string;
    features: FeatureSpec[];
    pages: PageSpec[];
    components: ComponentSpec[];
    designSystem: DesignSystem;
    dependencies: Record<string, string>;
}

export interface FeatureSpec {
    name: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
}

export interface PageSpec {
    name: string;
    route: string;
    description: string;
    sections: string[];
    components: string[];
}

export interface ComponentSpec {
    name: string;
    type: 'ui' | 'feature' | 'layout';
    props?: string[];
    description?: string;
}

export interface DesignSystem {
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    style: string;
    fonts: string[];
}

export interface GeneratedFile {
    path: string;
    content: string;
    phase: string;
    exports: string[];
    imports: string[];
}

export interface FileRegistryEntry {
    path: string;
    type: 'component' | 'page' | 'util' | 'config' | 'style' | 'layout';
    exports: string[];
    defaultExport?: string;
    usedBy: string[];
    description: string;
}

export interface ValidationError {
    type: 'missing_import' | 'missing_export' | 'syntax' | 'type_error' | 'router_duplicate' | 'unused_component' | 'missing_package';
    file: string;
    message: string;
    severity: 'error' | 'warning';
    suggestedFix?: string;
}

// Graph State Annotation - defines how state is merged between nodes
export const WebsiteStateAnnotation = Annotation.Root({
    // Input
    userPrompt: Annotation<string>(),
    projectType: Annotation<'frontend' | 'backend' | 'fullstack'>(),

    // Project ID for Mem0 memory tracking
    projectId: Annotation<string>({
        reducer: (existing, newVal) => newVal || existing,
        default: () => `proj-${Date.now()}`
    }),

    // Blueprint
    blueprint: Annotation<ProjectBlueprint | null>({
        reducer: (_, newVal) => newVal, // Replace
        default: () => null
    }),

    // Generated Files - accumulate
    files: Annotation<Map<string, GeneratedFile>>({
        reducer: (existing, newFiles) => {
            const merged = new Map(existing);
            newFiles.forEach((file, path) => merged.set(path, file));
            return merged;
        },
        default: () => new Map()
    }),

    // File Registry - tracks exports/imports
    fileRegistry: Annotation<Map<string, FileRegistryEntry>>({
        reducer: (existing, newEntries) => {
            const merged = new Map(existing);
            newEntries.forEach((entry, path) => merged.set(path, entry));
            return merged;
        },
        default: () => new Map()
    }),

    // Validation errors - replace each validation cycle
    errors: Annotation<ValidationError[]>({
        reducer: (_, newVal) => newVal,
        default: () => []
    }),

    // Iteration tracking
    iterationCount: Annotation<number>({
        reducer: (existing, increment) => existing + increment,
        default: () => 0
    }),

    // Current phase for logging
    currentPhase: Annotation<string>({
        reducer: (_, newVal) => newVal,
        default: () => 'init'
    }),

    // Completion flag
    isComplete: Annotation<boolean>({
        reducer: (_, newVal) => newVal,
        default: () => false
    }),

    // Messages for context
    messages: Annotation<string[]>({
        reducer: (existing, newMsgs) => [...existing, ...newMsgs],
        default: () => []
    }),

    // Available images from the image microservice
    availableImages: Annotation<UnsplashImage[]>({
        reducer: (_, newVal) => newVal,
        default: () => []
    }),

    // Detailed context from PlanningService (8000+ word specs)
    detailedContext: Annotation<string>({
        reducer: (_, newVal) => newVal,
        default: () => ''
    }),

    // Workflow nodes for architecture visualization
    workflowNodes: Annotation<any[]>({
        reducer: (_, newVal) => newVal,
        default: () => []
    }),

    // Workflow edges for architecture visualization
    workflowEdges: Annotation<any[]>({
        reducer: (_, newVal) => newVal,
        default: () => []
    }),

    // Dynamic design theme for unique project styling
    dynamicTheme: Annotation<{
        id: string;
        palette: { name: string; primary: string; secondary: string; accent: string; background: string; surface: string; style: string };
        fonts: { heading: string; body: string; mono: string };
        layout: { name: string; hero: string; sections: string; cards: string };
        animation: { name: string; entrance: string; hover: string; scroll: string; timing: string };
        trends: string[];
        extendedPackages: Record<string, string>;
    } | null>({
        reducer: (_, newVal) => newVal,
        default: () => null
    }),

    // ═══════════════════════════════════════════════════════════════
    // INTELLIGENT ROUTING & MODIFICATION STATE (NEW)
    // ═══════════════════════════════════════════════════════════════

    // Request intent: 'create' | 'modify' | 'question' | 'explain'
    requestIntent: Annotation<'create' | 'modify' | 'question' | 'explain'>({
        reducer: (_, newVal) => newVal,
        default: () => 'create'
    }),

    // Is this a modification request (vs new creation)?
    isModification: Annotation<boolean>({
        reducer: (_, newVal) => newVal,
        default: () => false
    }),

    // Files to modify (detected by analyzer)
    filesToModify: Annotation<string[]>({
        reducer: (_, newVal) => newVal,
        default: () => []
    }),

    // Files to create (detected by analyzer)
    filesToCreate: Annotation<string[]>({
        reducer: (_, newVal) => newVal,
        default: () => []
    }),

    // Modification plan from analyzer
    modificationPlan: Annotation<{
        summary: string;
        changes: Array<{
            file: string;
            action: 'create' | 'modify' | 'delete';
            description: string;
        }>;
    } | null>({
        reducer: (_, newVal) => newVal,
        default: () => null
    }),

    // Chat response (for question/explain intents)
    chatResponse: Annotation<string>({
        reducer: (_, newVal) => newVal,
        default: () => ''
    }),

    // Full project context stored for intelligent responses
    projectContext: Annotation<{
        description: string;
        pages: Array<{ name: string; route: string; purpose: string }>;
        components: Array<{ name: string; location: string; purpose: string }>;
        features: string[];
        fileStructure: string[];
    } | null>({
        reducer: (_, newVal) => newVal,
        default: () => null
    })
});

export type WebsiteState = typeof WebsiteStateAnnotation.State;

// Helper to create file registry entry from generated file
export function createRegistryEntry(file: GeneratedFile): FileRegistryEntry {
    // Determine type
    let type: FileRegistryEntry['type'] = 'util';
    if (file.path.includes('/pages/')) type = 'page';
    else if (file.path.includes('/components/layout/')) type = 'layout';
    else if (file.path.includes('/components/')) type = 'component';
    else if (file.path.match(/\.(css|scss)$/)) type = 'style';
    else if (file.path.match(/(config|vite\.config|tsconfig)/)) type = 'config';

    return {
        path: file.path,
        type,
        exports: file.exports,
        defaultExport: file.exports.find(e => e === 'default') ? file.path.split('/').pop()?.replace(/\.tsx?$/, '') : undefined,
        usedBy: [],
        description: `${type}: ${file.path.split('/').pop()}`
    };
}

// Helper to generate context for LLM prompts
export function generateFileContext(registry: Map<string, FileRegistryEntry>): string {
    const sections: string[] = [];

    const byType: Record<string, FileRegistryEntry[]> = {};
    registry.forEach(entry => {
        if (!byType[entry.type]) byType[entry.type] = [];
        byType[entry.type].push(entry);
    });

    if (byType['component']?.length) {
        sections.push('AVAILABLE COMPONENTS (YOU MUST USE THESE):');
        byType['component'].forEach(f => {
            sections.push(`  - ${f.path} → exports: { ${f.exports.join(', ') || 'default'} }`);
        });
    }

    if (byType['layout']?.length) {
        sections.push('\nLAYOUT COMPONENTS:');
        byType['layout'].forEach(f => {
            sections.push(`  - ${f.path} → exports: { ${f.exports.join(', ') || 'default'} }`);
        });
    }

    if (byType['util']?.length) {
        sections.push('\nUTILITY FILES:');
        byType['util'].forEach(f => {
            sections.push(`  - ${f.path} → exports: { ${f.exports.join(', ') || 'default'} }`);
        });
    }

    if (byType['page']?.length) {
        sections.push('\nEXISTING PAGES:');
        byType['page'].forEach(f => {
            sections.push(`  - ${f.path}`);
        });
    }

    return sections.length > 0 ? sections.join('\n') : 'No files generated yet.';
}
