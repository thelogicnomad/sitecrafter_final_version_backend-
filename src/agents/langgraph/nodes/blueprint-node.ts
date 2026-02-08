/**
 * Blueprint Node - Generates project blueprint using PlanningService
 * Uses autonomous multi-phase planning for dynamic feature ideation
 */

import { WebsiteState, ProjectBlueprint } from '../graph-state';
import { storeBlueprintMemory, clearProjectMemory, generateProjectId } from '../memory-utils';
import { fetchProjectImages, storeImagesInMemory, UnsplashImage } from '../services/image.service';
import { PlanningService } from '../../../services/planning-fixed.service';
import { generateDynamicTheme } from '../../../services/dynamic-trends.service';

// Complete list of dependencies
const STANDARD_DEPENDENCIES: Record<string, string> = {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^7.1.1",
    "framer-motion": "^11.14.4",
    "lucide-react": "^0.460.0",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "tailwind-merge": "^2.5.5",
    "react-hook-form": "^7.54.0",
    "@hookform/resolvers": "^3.9.1",
    "zod": "^3.24.1",
    "zustand": "^5.0.2",
    "@tanstack/react-query": "^5.62.2",
    "axios": "^1.7.9",
    "sonner": "^1.7.3",
    "date-fns": "^4.1.0",
    "gsap": "^3.12.5"
};

const DEV_DEPENDENCIES: Record<string, string> = {
    "@types/react": "^18.3.3",
    "@types/react-dom": "^18.3.0",
    "@types/node": "^22.10.2",
    "@vitejs/plugin-react": "^4.3.4",
    "autoprefixer": "^10.4.20",
    "postcss": "^8.4.49",
    "tailwindcss": "^3.4.17",
    "typescript": "^5.7.2",
    "vite": "^6.0.5",
    "eslint": "^9.16.0"
};

export async function blueprintNode(state: WebsiteState): Promise<Partial<WebsiteState>> {
    console.log('\n ═══════════════════════════════════════════');
    console.log(' NODE: BLUEPRINT (DYNAMIC PLANNING)');
    console.log(' ═══════════════════════════════════════════\n');

    try {
        console.log(' Starting autonomous planning...');
        console.log(`   User Request: "${state.userPrompt.slice(0, 100)}..."`);
        console.log(`   Project Type: ${state.projectType || 'frontend'}`);

        // Use PlanningService for autonomous multi-phase planning
        const planningResponse = await PlanningService.generateBlueprint(
            state.userPrompt,
            0, // retry count
            state.projectType || 'frontend'
        );

        if (!planningResponse.success || !planningResponse.data) {
            throw new Error(planningResponse.error || 'Planning failed');
        }

        const planBlueprint = planningResponse.data.blueprint;

        // Use LLM to dynamically generate project-specific pages
        console.log('    Generating unique pages with LLM...');
        const dynamicPages = await extractPagesWithLLM(
            state.userPrompt,
            planBlueprint.detailedContext,
            planBlueprint.features
        );

        // Convert PlanningService blueprint to LangGraph ProjectBlueprint format
        const blueprint: ProjectBlueprint = {
            projectName: planBlueprint.projectName,
            description: planBlueprint.description,
            features: planBlueprint.features.map(f => ({
                name: typeof f === 'string' ? f : f,
                description: typeof f === 'string' ? f : f,
                priority: 'high' as const
            })),
            pages: dynamicPages,
            components: extractComponentsFromContext(planBlueprint.detailedContext),
            designSystem: extractDesignSystem(planBlueprint.detailedContext),
            dependencies: { ...STANDARD_DEPENDENCIES }
        };

        // Ensure page names are valid
        blueprint.pages = blueprint.pages.map(page => ({
            ...page,
            name: page.name.replace(/\s+/g, '')
        }));

        console.log(`\n Dynamic Blueprint Created: ${blueprint.projectName}`);
        console.log(`    Pages: ${blueprint.pages.length} (dynamically determined)`);
        console.log(`    Components: ${blueprint.components.length}`);
        console.log(`    Features: ${blueprint.features.length}`);
        console.log(`    Workflow Nodes: ${planBlueprint.workflow?.nodes?.length || 0}`);

        // Log the pages for visibility
        blueprint.pages.forEach(p => console.log(`      → ${p.name} (${p.route})`));

        // Generate project ID for Mem0 tracking
        const projectId = generateProjectId(blueprint.projectName);
        console.log(`    Project ID: ${projectId}`);

        // Clear any previous memory for this project and store new blueprint
        await clearProjectMemory(projectId);
        await storeBlueprintMemory(projectId, blueprint);

        // Fetch images from the image microservice
        console.log('\n  Fetching project images...');
        let availableImages: UnsplashImage[] = [];
        try {
            availableImages = await fetchProjectImages(state.userPrompt);
            if (availableImages.length > 0) {
                await storeImagesInMemory(projectId, availableImages);
                console.log(` ${availableImages.length} images fetched and stored`);
            } else {
                console.log(' No images fetched - will use gradient placeholders');
            }
        } catch (imgError: any) {
            console.error(` Image fetching failed: ${imgError.message} - will use gradients`);
        }

        // Generate unique dynamic theme for this project
        const dynamicTheme = generateDynamicTheme(state.userPrompt);
        console.log(`\n Dynamic Theme Generated: ${dynamicTheme.palette.name}`);
        console.log(`    Layout: ${dynamicTheme.layout.name}`);
        console.log(`    Animation: ${dynamicTheme.animation.name}`);
        console.log(`    Extended Packages: ${Object.keys(dynamicTheme.extendedPackages).join(', ')}`);

        // Merge extended packages into blueprint dependencies
        blueprint.dependencies = {
            ...blueprint.dependencies,
            ...dynamicTheme.extendedPackages
        };

        return {
            blueprint,
            projectId,
            availableImages,
            dynamicTheme,  // Pass theme to other nodes
            detailedContext: planBlueprint.detailedContext || '',
            workflowNodes: planBlueprint.workflow?.nodes || [],
            workflowEdges: planBlueprint.workflow?.edges || [],
            currentPhase: 'blueprint',
            messages: [
                ` Autonomous Planning Complete: ${blueprint.projectName}`,
                ` Theme: ${dynamicTheme.palette.name} + ${dynamicTheme.layout.name}`,
                ` ${blueprint.pages.length} pages dynamically determined`,
                ` ${blueprint.features.length} features identified`,
                ` ${availableImages.length} images ready`
            ]
        };

    } catch (error: any) {
        console.error(' Blueprint generation failed:', error.message);
        throw error;
    }
}

/**
 * Extract pages using LLM - truly dynamic, project-specific page generation
 * This replaces the old keyword-based approach with intelligent LLM analysis
 */

// Multiple API keys for rotation in blueprint node
const blueprintApiKeys = [
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

let blueprintKeyIndex = 0;

function getBlueprintApiKey(): string {
    return blueprintApiKeys[blueprintKeyIndex] || process.env.gemini2 || '';
}

function rotateBlueprintKey(): void {
    if (blueprintApiKeys.length > 1) {
        blueprintKeyIndex = (blueprintKeyIndex + 1) % blueprintApiKeys.length;
        console.log(`[Blueprint] Rotated to key ${blueprintKeyIndex + 1}/${blueprintApiKeys.length}`);
    }
}

async function extractPagesWithLLM(userPrompt: string, detailedContext: string, features: any[]): Promise<any[]> {
    const OpenAI = (await import('openai')).default;

    const featureNames = features.map(f => typeof f === 'string' ? f : f.name || f).join(', ');

    const prompt = `You are an expert web architect. Based on the project requirements, determine the EXACT pages this SPECIFIC project needs.

PROJECT REQUIREMENT: "${userPrompt}"

IDENTIFIED FEATURES: ${featureNames}

DETAILED CONTEXT (excerpt):
${detailedContext.slice(0, 6000)}

===================================================================
CRITICAL RULES:
===================================================================

1. Pages must be UNIQUE to THIS specific project type
2. DO NOT use generic pages unless explicitly needed
3. Think about what makes THIS project special

EXAMPLES OF PROJECT-SPECIFIC PAGES:

For "ChatGPT-like AI chat bot":
- ChatPage (/chat) - Main chat interface
- ConversationHistoryPage (/history) - Past conversations
- ModelsPage (/models) - AI model selection
- APIDocsPage (/api-docs) - API documentation
- SettingsPage (/settings) - User preferences
 NOT: CartPage, BlogPage, ServicesPage

For "Artist portfolio website":
- GalleryPage (/gallery) - Art collection grid
- ArtworkDetailPage (/artwork/:id) - Single artwork view
- CommissionsPage (/commissions) - Commission requests
- ExhibitionsPage (/exhibitions) - Past/upcoming shows
- AboutArtistPage (/about) - Artist biography
 NOT: CartPage, DashboardPage, BlogPage

For "Cake selling bakery":
- CakesPage (/cakes) - Cake catalog
- CustomOrderPage (/custom-order) - Custom cake builder
- FlavorPage (/flavors) - Flavor options
- OrderStatusPage (/order-status) - Track orders
- GalleryPage (/gallery) - Past creations
 NOT: Generic ProductsPage, ServicesPage

For "Fitness tracking app":
- WorkoutsPage (/workouts) - Exercise library
- ProgressPage (/progress) - Stats and charts
- NutritionPage (/nutrition) - Meal tracking
- ChallengesPage (/challenges) - Fitness challenges
- ProfilePage (/profile) - User stats
 NOT: BlogPage, TestimonialsPage

===================================================================

Now, for the project "${userPrompt}", generate 5-8 UNIQUE pages.

Return ONLY a valid JSON array with this exact structure:
[
  {
    "name": "PageName",
    "route": "/route-path",
    "description": "Specific description for this project",
    "sections": ["Section1", "Section2", "Section3"],
    "components": ["Component1", "Component2"]
  }
]

IMPORTANT:
- First page should be HomePage with route "/"
- Last page should be NotFoundPage with route "*"
- All other pages should be UNIQUE to this project type
- Use descriptive, project-specific names (e.g., "ChatPage" not "MainPage")
- Include 5-8 pages total`;

    const maxRetries = 3;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const openai = new OpenAI({
                apiKey: getBlueprintApiKey(),
                baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/"
            });

            const response = await openai.chat.completions.create({
                model: "gemini-2.5-flash-lite-preview-09-2025",
                messages: [
                    {
                        role: "system",
                        content: "You are a web architect who creates unique, project-specific page structures. You NEVER use generic templates. Return ONLY valid JSON arrays."
                    },
                    { role: "user", content: prompt }
                ],
                temperature: 0.7
            });

            const content = response.choices[0].message.content || '[]';

            // Extract JSON from response
            const jsonMatch = content.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
                const pages = JSON.parse(jsonMatch[0]);
                console.log(`    LLM generated ${pages.length} unique pages for this project`);
                return pages;
            }
        } catch (error: any) {
            console.error(`[Blueprint] Attempt ${attempt} failed:`, error.message);
            rotateBlueprintKey();
            if (attempt < maxRetries) {
                await new Promise(r => setTimeout(r, 1000 * attempt));
                continue;
            }
        }
    }

    // Minimal fallback - ONLY if all retries fail
    console.log('    LLM page extraction failed, using minimal fallback pages');
    return [
        {
            name: 'HomePage',
            route: '/',
            description: 'Main landing page',
            sections: ['Hero', 'Features', 'CTA'],
            components: ['Hero', 'FeatureGrid']
        },
        {
            name: 'NotFoundPage',
            route: '*',
            description: '404 error page',
            sections: ['ErrorMessage'],
            components: ['ErrorDisplay']
        }
    ];
}

/**
 * Synchronous fallback for extractPagesFromContext - used when async not available
 * This is a minimal version that relies on LLM context parsing
 */
function extractPagesFromContext(context: string, features: any[]): any[] {
    // This function now just returns minimal pages
    // The real work is done by extractPagesWithLLM in blueprintNode
    const pages: any[] = [];

    // Always include HomePage
    pages.push({
        name: 'HomePage',
        route: '/',
        description: 'Main landing page with hero section',
        sections: ['Hero', 'Features', 'CTA'],
        components: ['Hero', 'FeatureGrid', 'CallToAction']
    });

    // Parse the context for explicit page mentions
    const contextLower = context.toLowerCase();

    // Look for PAGE_ARCHITECTURE section in context
    const pageArchMatch = context.match(/PAGE_ARCHITECTURE:([\s\S]*?)(?=\n\n|$)/i);
    if (pageArchMatch) {
        const pageLines = pageArchMatch[1].split('\n').filter(l => l.includes('/'));
        for (const line of pageLines) {
            const match = line.match(/(\w+Page)\s*\(["']?([^"')]+)["']?\)/i);
            if (match && match[1] !== 'HomePage') {
                pages.push({
                    name: match[1],
                    route: match[2],
                    description: line.split('-')[1]?.trim() || match[1],
                    sections: ['MainContent'],
                    components: []
                });
            }
        }
    }

    // Always add 404 page
    pages.push({
        name: 'NotFoundPage',
        route: '*',
        description: '404 error page',
        sections: ['ErrorMessage', 'BackButton'],
        components: ['ErrorDisplay']
    });

    return pages;
}

/**
 * Extract components from detailedContext
 */
function extractComponentsFromContext(context: string): any[] {
    // Base UI components that are always needed
    const baseComponents = [
        { name: 'Button', type: 'ui', props: ['children', 'variant', 'size', 'onClick', 'disabled', 'loading'] },
        { name: 'Card', type: 'ui', props: ['children', 'className', 'hover'] },
        { name: 'Input', type: 'ui', props: ['placeholder', 'value', 'onChange', 'type', 'error'] },
        { name: 'Modal', type: 'ui', props: ['isOpen', 'onClose', 'title', 'children'] },
        { name: 'Badge', type: 'ui', props: ['children', 'variant', 'size'] },
        { name: 'Avatar', type: 'ui', props: ['src', 'alt', 'size', 'fallback'] },
        { name: 'Skeleton', type: 'ui', props: ['width', 'height', 'className'] },
        { name: 'Spinner', type: 'ui', props: ['size', 'className'] },
        { name: 'Toast', type: 'ui', props: ['message', 'type', 'duration'] },
        { name: 'Tooltip', type: 'ui', props: ['content', 'children', 'position'] },
        { name: 'Tabs', type: 'ui', props: ['tabs', 'activeTab', 'onChange'] },
        { name: 'Accordion', type: 'ui', props: ['items', 'allowMultiple'] },
        { name: 'Dropdown', type: 'ui', props: ['trigger', 'items', 'onSelect'] },
    ];

    // Layout components
    const layoutComponents = [
        { name: 'Header', type: 'layout', props: ['logo', 'navItems', 'sticky'] },
        { name: 'Footer', type: 'layout', props: ['links', 'social', 'copyright'] },
        { name: 'Sidebar', type: 'layout', props: ['items', 'collapsed', 'onToggle'] },
        { name: 'Container', type: 'layout', props: ['children', 'maxWidth', 'className'] },
        { name: 'Section', type: 'layout', props: ['children', 'id', 'className', 'background'] },
    ];

    // Feature components based on context keywords
    const featureComponents: any[] = [];
    const contextLower = context.toLowerCase();

    if (contextLower.includes('product') || contextLower.includes('shop')) {
        featureComponents.push(
            { name: 'ProductCard', type: 'feature', props: ['product', 'onAddToCart'] },
            { name: 'ProductGrid', type: 'feature', props: ['products', 'columns'] },
            { name: 'FilterBar', type: 'feature', props: ['filters', 'onFilterChange'] },
            { name: 'CartItem', type: 'feature', props: ['item', 'onRemove', 'onQuantityChange'] }
        );
    }

    if (contextLower.includes('testimonial') || contextLower.includes('review')) {
        featureComponents.push(
            { name: 'TestimonialCard', type: 'feature', props: ['testimonial'] },
            { name: 'TestimonialSlider', type: 'feature', props: ['testimonials', 'autoPlay'] },
            { name: 'RatingStars', type: 'feature', props: ['rating', 'maxStars'] }
        );
    }

    if (contextLower.includes('pricing') || contextLower.includes('plan')) {
        featureComponents.push(
            { name: 'PricingCard', type: 'feature', props: ['plan', 'popular', 'onSelect'] },
            { name: 'PricingTable', type: 'feature', props: ['plans', 'features'] },
            { name: 'FeatureCheck', type: 'feature', props: ['feature', 'included'] }
        );
    }

    if (contextLower.includes('dashboard') || contextLower.includes('stat')) {
        featureComponents.push(
            { name: 'StatCard', type: 'feature', props: ['title', 'value', 'change', 'icon'] },
            { name: 'Chart', type: 'feature', props: ['data', 'type', 'options'] },
            { name: 'ActivityFeed', type: 'feature', props: ['activities', 'maxItems'] }
        );
    }

    if (contextLower.includes('blog') || contextLower.includes('article')) {
        featureComponents.push(
            { name: 'BlogCard', type: 'feature', props: ['post', 'compact'] },
            { name: 'BlogPost', type: 'feature', props: ['content', 'author', 'date'] },
            { name: 'AuthorCard', type: 'feature', props: ['author'] }
        );
    }

    if (contextLower.includes('contact') || contextLower.includes('form')) {
        featureComponents.push(
            { name: 'ContactForm', type: 'feature', props: ['onSubmit', 'fields'] },
            { name: 'NewsletterForm', type: 'feature', props: ['onSubscribe'] }
        );
    }

    if (contextLower.includes('team') || contextLower.includes('member')) {
        featureComponents.push(
            { name: 'TeamMember', type: 'feature', props: ['member'] },
            { name: 'TeamGrid', type: 'feature', props: ['members', 'columns'] }
        );
    }

    // Hero and CTA are always useful
    featureComponents.push(
        { name: 'Hero', type: 'feature', props: ['title', 'subtitle', 'cta', 'image'] },
        { name: 'CallToAction', type: 'feature', props: ['title', 'description', 'buttonText', 'onAction'] },
        { name: 'FeatureGrid', type: 'feature', props: ['features', 'columns'] },
        { name: 'FeatureCard', type: 'feature', props: ['icon', 'title', 'description'] }
    );

    return [...layoutComponents, ...baseComponents, ...featureComponents];
}

/**
 * Extract design system from detailedContext
 */
function extractDesignSystem(context: string): any {
    // Default modern design system
    const defaultDesign = {
        primaryColor: '#6366f1', // Indigo
        secondaryColor: '#8b5cf6', // Violet
        accentColor: '#10b981', // Emerald
        style: 'modern',
        fonts: ['Inter', 'system-ui', 'sans-serif']
    };

    // Try to extract colors from context
    const colorMatch = context.match(/(#[0-9A-Fa-f]{6})/g);
    if (colorMatch && colorMatch.length >= 2) {
        defaultDesign.primaryColor = colorMatch[0];
        defaultDesign.secondaryColor = colorMatch[1];
        if (colorMatch.length >= 3) {
            defaultDesign.accentColor = colorMatch[2];
        }
    }

    // Determine style from keywords
    const contextLower = context.toLowerCase();
    if (contextLower.includes('minimal') || contextLower.includes('clean')) {
        defaultDesign.style = 'minimal';
    } else if (contextLower.includes('playful') || contextLower.includes('fun') || contextLower.includes('colorful')) {
        defaultDesign.style = 'playful';
    } else if (contextLower.includes('corporate') || contextLower.includes('professional') || contextLower.includes('business')) {
        defaultDesign.style = 'corporate';
    } else if (contextLower.includes('dark') || contextLower.includes('modern')) {
        defaultDesign.style = 'modern';
    }

    return defaultDesign;
}

export { STANDARD_DEPENDENCIES, DEV_DEPENDENCIES };
