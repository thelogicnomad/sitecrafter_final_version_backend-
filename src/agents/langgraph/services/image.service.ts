/**
 * Image Service - Direct Unsplash Integration
 * Generates image keywords using existing LLM utils and fetches from Unsplash API
 * NO SEPARATE MICROSERVICE NEEDED - runs within the backend
 */

import { invokeLLM } from '../llm-utils';
import { memory } from '../memory-utils';

// Unsplash API configuration
const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY || '';

// Interface definitions
export interface ImageKeyword {
    keyword: string;
    description: string;
}

export interface UnsplashImage {
    keyword: string;
    description: string;
    imageUrl: string;
    unsplashLink: string;
    photographer: string;
}

/**
 * Generate 15 image keywords using LLM based on project description
 */
async function generateKeywords(description: string): Promise<ImageKeyword[]> {
    const systemPrompt = `You are an image keyword generator. Generate exactly 15 image keywords DIRECTLY related to the user's specific topic.

CRITICAL: ALL keywords must be specific to the user's business/topic. NO generic or abstract images.
- For "cake selling website" → chocolate cake, birthday cake, wedding cake, cupcakes, bakery, frosting
- For "car dealership" → sports car, sedan, SUV, showroom, car keys
- For "restaurant" → food plates, chef, dining table, menu, dishes

Return ONLY valid JSON array:
[{"keyword": "chocolate cake", "description": "Product photo"}]`;

    const userPrompt = `Generate 15 image keywords for: "${description}"

IMPORTANT: Every keyword must be about "${description}" - NO generic images like aurora, geometric, abstract.
Return ONLY the JSON array.`;

    try {
        const response = await invokeLLM(systemPrompt, userPrompt, 0.7);

        // Clean up the response - remove markdown code blocks if present
        let cleanContent = response.trim();
        if (cleanContent.startsWith("```json")) {
            cleanContent = cleanContent.slice(7);
        }
        if (cleanContent.startsWith("```")) {
            cleanContent = cleanContent.slice(3);
        }
        if (cleanContent.endsWith("```")) {
            cleanContent = cleanContent.slice(0, -3);
        }
        cleanContent = cleanContent.trim();

        // Try to extract JSON array if wrapped in other text
        const jsonMatch = cleanContent.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
            cleanContent = jsonMatch[0];
        }

        return JSON.parse(cleanContent) as ImageKeyword[];
    } catch (error: any) {
        console.error(' Failed to generate keywords:', error.message);
        return [];
    }
}

/**
 * Fetch a single image from Unsplash API
 */
async function fetchUnsplashImage(keyword: string): Promise<{ url: string; link: string; photographer: string } | null> {
    if (!UNSPLASH_ACCESS_KEY) {
        return null;
    }

    try {
        const response = await fetch(
            `https://api.unsplash.com/search/photos?query=${encodeURIComponent(keyword)}&per_page=1`,
            {
                headers: {
                    'Authorization': `Client-ID ${UNSPLASH_ACCESS_KEY}`
                }
            }
        );

        if (!response.ok) {
            console.error(`    Unsplash API error for "${keyword}": ${response.status}`);
            return null;
        }

        const data = await response.json() as {
            results?: Array<{
                urls: { regular: string };
                links: { html: string };
                user: { name: string };
            }>;
        };

        if (data.results && data.results.length > 0) {
            const photo = data.results[0];
            return {
                url: photo.urls.regular,
                link: photo.links.html,
                photographer: photo.user.name
            };
        }

        return null;
    } catch (error: any) {
        console.error(`    Error fetching image for "${keyword}":`, error.message);
        return null;
    }
}

/**
 * Fetch 15 images for a project description
 * This runs directly in the backend - no separate service needed
 */
export async function fetchProjectImages(description: string): Promise<UnsplashImage[]> {
    console.log(`  Generating images for: "${description}"`);

    // Check if Unsplash key is configured
    if (!UNSPLASH_ACCESS_KEY) {
        console.warn(' UNSPLASH_ACCESS_KEY not set in .env - will use gradient placeholders');
        return [];
    }

    try {
        // Step 1: Generate keywords using LLM
        console.log('    Generating image keywords with LLM...');
        const keywords = await generateKeywords(description);

        if (keywords.length === 0) {
            console.warn(' No keywords generated - will use gradient placeholders');
            return [];
        }

        console.log(`    Generated ${keywords.length} keywords`);

        // Step 2: Fetch images from Unsplash
        console.log('    Fetching images from Unsplash...');
        const images: UnsplashImage[] = [];

        for (let i = 0; i < keywords.length; i++) {
            const kw = keywords[i];
            console.log(`   [${i + 1}/${keywords.length}] ${kw.keyword}`);

            const unsplashData = await fetchUnsplashImage(kw.keyword);

            if (unsplashData) {
                images.push({
                    keyword: kw.keyword,
                    description: kw.description,
                    imageUrl: unsplashData.url,
                    unsplashLink: unsplashData.link,
                    photographer: unsplashData.photographer
                });
            }

            // Small delay to respect Unsplash rate limits (50 req/hour on free tier)
            await new Promise(resolve => setTimeout(resolve, 200));
        }

        console.log(`    Fetched ${images.length} images successfully`);
        return images;

    } catch (error: any) {
        console.error(`    Failed to fetch images: ${error.message}`);
        return [];
    }
}

/**
 * Store images in Mem0 for the project
 */
export async function storeImagesInMemory(projectId: string, images: UnsplashImage[]): Promise<void> {
    if (!memory) {
        console.log(' Mem0 not available, skipping image storage');
        return;
    }

    try {
        const imageList = images.map((img, i) =>
            `${i + 1}. "${img.keyword}" - ${img.imageUrl}`
        ).join('\n');

        await memory.add([
            { role: 'assistant', content: `PROJECT IMAGES (${images.length} total):\n${imageList}` }
        ], {
            user_id: projectId,
            metadata: { type: 'images', count: images.length }
        });

        console.log(`    Stored ${images.length} images in Mem0`);
    } catch (error: any) {
        console.error(` Failed to store images in memory: ${error.message}`);
    }
}

/**
 * Format images for LLM prompt injection
 */
export function formatImagesForPrompt(images: UnsplashImage[]): string {
    if (!images.length) {
        return `
═══════════════════════════════════════════════════════════════════════════════
 NO IMAGES AVAILABLE - USE GRADIENT PLACEHOLDERS
═══════════════════════════════════════════════════════════════════════════════

Use beautiful gradient backgrounds instead of images:
<div className="h-48 bg-gradient-to-br from-indigo-500 to-purple-600" />

Available gradient colors:
- from-indigo-500 to-purple-600
- from-rose-500 to-orange-500
- from-emerald-500 to-teal-500
- from-blue-500 to-cyan-500
`;
    }

    const imageList = images.map((img, i) =>
        `  ${i + 1}. "${img.keyword}" → ${img.imageUrl}`
    ).join('\n');

    return `
═══════════════════════════════════════════════════════════════════════════════
 AVAILABLE IMAGES - USE THESE EXACT URLS (NO CORS ISSUES!)
═══════════════════════════════════════════════════════════════════════════════

The following ${images.length} images are available. Use these EXACT URLs:

${imageList}

USAGE INSTRUCTIONS:
1. Match image keywords to your component needs
2. Use the exact imageUrl provided (Unsplash URLs work without CORS issues)
3. Always include meaningful alt text
4. Example usage:
   <img 
     src="${images[0]?.imageUrl}" 
     alt="${images[0]?.keyword}"
     className="w-full h-48 object-cover"
   />
`;
}

/**
 * Find image by keyword (exact or partial match)
 */
export function getImageByKeyword(images: UnsplashImage[], keyword: string): UnsplashImage | undefined {
    const exact = images.find(img =>
        img.keyword.toLowerCase() === keyword.toLowerCase()
    );
    if (exact) return exact;

    const partial = images.find(img =>
        img.keyword.toLowerCase().includes(keyword.toLowerCase()) ||
        keyword.toLowerCase().includes(img.keyword.toLowerCase())
    );
    return partial;
}

/**
 * Get image URL by index (with wraparound)
 */
export function getImageUrl(images: UnsplashImage[], index: number): string {
    if (!images.length) return '';
    return images[index % images.length].imageUrl;
}
