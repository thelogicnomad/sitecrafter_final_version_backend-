/**
 * Integrated Fullstack Generation Endpoint
 * Generates backend and frontend with COMPLETE integration
 * Frontend knows exactly what backend has
 */

import { Request, Response } from "express";
import { getSystemPrompt, BASE_PROMPT } from '../prompts';
import { QUALITY_REQUIREMENTS, BACKEND_QUALITY_CHECKLIST, FRONTEND_QUALITY_CHECKLIST } from '../prompts/quality-enforcement';
import { nodeprompt } from "../deafult/node";
import { COMPLETE_REACT_TEMPLATE } from "../deafult/react-complete";
import { parseBackendCode, generateAPISpecification } from '../utils/backend-parser';
import OpenAI from "openai";

const client = new OpenAI({
  baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
  apiKey: process.env.gemini3
});

/**
 * INTEGRATED FULLSTACK GENERATION
 * Generates backend and frontend with complete knowledge sharing
 */
export async function generateIntegratedFullstack(req: Request, res: Response) {
  try {
    const { backendContext, frontendContext, projectId } = req.body;

    console.log('\n\n╔════════════════════════════════════════════════════════════╗');
    console.log('║   🚀 INTEGRATED FULLSTACK GENERATION STARTED              ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    console.log(`📦 Backend Context: ${backendContext?.length || 0} chars`);
    console.log(`🎨 Frontend Context: ${frontendContext?.length || 0} chars`);
    console.log(`🆔 Project ID: ${projectId}\n`);

    // ============================================================
    // STEP 1: GENERATE BACKEND CODE
    // ============================================================
    console.log('═'.repeat(60));
    console.log('STEP 1: GENERATING BACKEND CODE');
    console.log('═'.repeat(60) + '\n');

    const enhancedBackendContext = `${QUALITY_REQUIREMENTS}

${BACKEND_QUALITY_CHECKLIST}

USER REQUIREMENTS:
${backendContext}

CRITICAL INSTRUCTIONS:
1. Use TypeScript with strict mode enabled
2. Implement proper error handling everywhere
3. Use Zod or Joi for input validation
4. Implement authentication with JWT
5. Hash passwords with bcrypt
6. Use mongoose for MongoDB with proper schemas and indexes
7. Follow layered architecture (routes -> controllers -> services -> models)
8. Include .env.example with ALL environment variables
9. NO README - DO NOT CREATE README.md FILES
10. NO ERRORS - code must compile and run perfectly
11. Use proper HTTP status codes
12. Implement rate limiting and security headers
13. Add proper logging
14. Follow RESTful API conventions
15. Create a seed.js or seed.ts file that populates the database with sample data
16. The seed file should include realistic, complete data for ALL models
17. Include at least 10-20 sample records for main entities
18. Seed file should be runnable with: node seed.js or npm run seed`;

    const backendMessages = [
      { role: "system" as const, content: getSystemPrompt() },
      { role: "user" as const, content: BASE_PROMPT },
      { role: "user" as const, content: `Here is an artifact that contains all files of the project visible to you.\nConsider the contents of ALL files in the project.\n\n${nodeprompt}\n\nThis is the base template. You MUST include ALL these files plus any additional files needed for the project.` },
      { role: "user" as const, content: enhancedBackendContext }
    ];

    const backendResponse = await client.chat.completions.create({
      model: "gemini-2.5-pro",
      messages: backendMessages as any,
    });

    const backendCode = backendResponse.choices[0].message.content || '';
    console.log(`✅ Backend code generated: ${backendCode.length} chars\n`);

    if (!backendCode || backendCode.length === 0) {
      throw new Error('Backend generation failed - no code returned');
    }

    // ============================================================
    // STEP 2: PARSE BACKEND CODE TO EXTRACT KNOWLEDGE
    // ============================================================
    console.log('═'.repeat(60));
    console.log('STEP 2: PARSING BACKEND CODE & EXTRACTING KNOWLEDGE');
    console.log('═'.repeat(60) + '\n');

    const backendSpec = parseBackendCode(backendCode);
    const apiSpecification = generateAPISpecification(backendSpec);

    console.log(`📊 Backend Analysis:`);
    console.log(`   • API Endpoints: ${backendSpec.endpoints.length}`);
    console.log(`   • Database Models: ${backendSpec.models.length}`);
    console.log(`   • Authentication: ${backendSpec.authentication.enabled ? 'YES' : 'NO'}`);
    console.log(`   • Features: ${backendSpec.features.join(', ')}`);
    console.log(`   • API Prefix: ${backendSpec.apiPrefix}`);
    console.log(`   • Base URL: ${backendSpec.baseURL}\n`);

    // Create detailed backend knowledge for frontend - SIMPLIFIED to avoid filter
    const backendKnowledgeForFrontend = `
=== BACKEND API SPECIFICATION ===

API Base URL: ${backendSpec.baseURL}
API Prefix: ${backendSpec.apiPrefix}

AUTHENTICATION:
${backendSpec.authentication.enabled ? `
- Type: ${backendSpec.authentication.type || 'JWT'}
- Token Location: ${backendSpec.authentication.tokenLocation || 'localStorage'}
- Header Format: ${backendSpec.authentication.headerFormat || 'Authorization: Bearer <token>'}
- Protected Routes: YES
` : '- No authentication required'}

AVAILABLE ENDPOINTS (${backendSpec.endpoints.length} total):
${backendSpec.endpoints.slice(0, 20).map((ep, i) => `${i + 1}. ${ep.method} ${ep.path}`).join('\n')}

DATABASE MODELS (${backendSpec.models.length} total):
${backendSpec.models.map((model, i) => `${i + 1}. ${model.name}`).join('\n')}

FEATURES: ${backendSpec.features.slice(0, 10).join(', ')}
`;

    console.log(`📝 Backend Knowledge Summary (${backendKnowledgeForFrontend.length} chars)\n`);

    // ============================================================
    // STEP 3: GENERATE FRONTEND WITH BACKEND KNOWLEDGE
    // ============================================================
    console.log('═'.repeat(60));
    console.log('STEP 3: GENERATING FRONTEND WITH BACKEND INTEGRATION');
    console.log('═'.repeat(60) + '\n');

    const frontendContextWithBackend = `${QUALITY_REQUIREMENTS}

${FRONTEND_QUALITY_CHECKLIST}

=== BACKEND CONTEXT (What the backend has) ===
${backendContext}

=== BACKEND API SPECIFICATION (Extracted from generated backend) ===
${backendKnowledgeForFrontend}

=== FRONTEND REQUIREMENTS (What user wants) ===
${frontendContext}

=== CRITICAL INTEGRATION INSTRUCTIONS ===

1. **UNDERSTAND THE BACKEND FIRST**:
   - Backend context above describes what backend does
   - Backend API spec shows all available endpoints
   - Frontend MUST use these exact endpoints
   - Frontend MUST match backend features

2. **Authentication Pages (IF BACKEND HAS AUTH)**:
   - Create Login page at /login with email/password form
   - Create Signup page at /signup with email/password/confirm password form
   - Create Logout functionality in header/menu
   - Store JWT token in localStorage after login
   - Include "Authorization: Bearer <token>" header in all API requests
   - Redirect unauthenticated users to /login

3. **API Integration (CRITICAL)**:
   - Use EXACTLY the endpoints listed in Backend API Specification above
   - Create API service/utility file for all HTTP requests
   - Use axios or fetch with proper error handling
   - Include loading, error, and success states for all API calls

4. **Feature Parity (MANDATORY)**:
   - Frontend MUST have pages/components for ALL backend features
   - If backend has user management → create user management pages
   - If backend has data models → create CRUD pages for each model
   - If backend has authentication → create auth pages
   - Match frontend features EXACTLY with backend capabilities

5. **Data Management**:
   - Create forms for creating/updating data matching backend models
   - Display lists of data from backend endpoints
   - Implement filtering, sorting, pagination where applicable

6. **Design & UX**:
   - Use professional, web-safe colors (HSL values)
   - Create consistent design system with semantic tokens
   - Make responsive for mobile, tablet, desktop
   - Add loading skeletons for data lists

7. **Security**:
   - Never expose API keys in frontend code
   - Validate all user inputs before sending to backend
   - Handle 401/403 errors by redirecting to login
   - Clear localStorage on logout

REMEMBER: The frontend MUST be fully integrated with the backend. Use the backend context and API spec above to understand exactly what to build.`;

    const frontendMessages = [
      { role: "system" as const, content: getSystemPrompt() },
      { role: "user" as const, content: BASE_PROMPT },
      { role: "user" as const, content: `Here is an artifact that contains all files of the project visible to you.\nConsider the contents of ALL files in the project.\n\n${COMPLETE_REACT_TEMPLATE}\n\nThis is the base template. You MUST include ALL these config files plus any additional files needed for the project.` },
      { role: "user" as const, content: frontendContextWithBackend }
    ];

    const frontendResponse = await client.chat.completions.create({
      model: "gemini-2.5-pro",
      messages: frontendMessages as any,
    });

    const frontendCode = frontendResponse.choices[0].message.content || '';
    const finishReason = frontendResponse.choices[0].finish_reason;
    
    console.log(`✅ Frontend code generated: ${frontendCode.length} chars`);
    console.log(`   Finish reason: ${finishReason}\n`);

    if (!frontendCode || frontendCode.length === 0) {
      if (finishReason && finishReason.toString().includes('content_filter')) {
        console.error('❌ RECITATION FILTER TRIGGERED!');
        console.error('   This means Gemini detected content it considers recitation.');
        console.error('   Retrying with simplified backend context...\n');
        
        // Retry with even simpler context
        const simplifiedBackendContext = `Backend has: ${backendSpec.models.length} models (${backendSpec.models.map(m => m.name).join(', ')}), ${backendSpec.endpoints.length} endpoints, Auth: ${backendSpec.authentication.enabled}`;
        
        const retryMessages = [
          { role: "system" as const, content: getSystemPrompt() },
          { role: "user" as const, content: BASE_PROMPT },
          { role: "user" as const, content: `Here is an artifact that contains all files of the project visible to you.\nConsider the contents of ALL files in the project.\n\n${COMPLETE_REACT_TEMPLATE}\n\nThis is the base template. You MUST include ALL these config files plus any additional files needed for the project.` },
          { role: "user" as const, content: `${QUALITY_REQUIREMENTS}\n\n${FRONTEND_QUALITY_CHECKLIST}\n\nBackend Info: ${simplifiedBackendContext}\n\nFrontend Requirements: ${frontendContext}\n\nCreate a React frontend that integrates with the backend. Include all necessary pages and components.` }
        ];
        
        const retryResponse = await client.chat.completions.create({
          model: "gemini-2.5-pro",
          messages: retryMessages as any,
        });
        
        const retryFrontendCode = retryResponse.choices[0].message.content || '';
        console.log(`✅ Frontend code generated (retry): ${retryFrontendCode.length} chars\n`);
        
        if (!retryFrontendCode || retryFrontendCode.length === 0) {
          throw new Error('Frontend generation failed after retry - RECITATION filter persists');
        }
        
        // Use retry code
        const finalFrontendCode = retryFrontendCode;
        
        console.log('═'.repeat(60));
        console.log('STEP 4: FULLSTACK GENERATION COMPLETE');
        console.log('═'.repeat(60) + '\n');

        console.log(`📦 Backend: ${backendCode.length} chars`);
        console.log(`🎨 Frontend: ${finalFrontendCode.length} chars`);
        console.log(`✅ Total: ${backendCode.length + finalFrontendCode.length} chars\n`);

        console.log('╔════════════════════════════════════════════════════════════╗');
        console.log('║   ✅ INTEGRATED FULLSTACK GENERATION COMPLETE             ║');
        console.log('╚════════════════════════════════════════════════════════════╝\n');

        res.json({
          success: true,
          backend: backendCode,
          frontend: finalFrontendCode,
          metadata: {
            projectId,
            backendSize: backendCode.length,
            frontendSize: finalFrontendCode.length,
            endpoints: backendSpec.endpoints.length,
            models: backendSpec.models.length,
            authenticated: backendSpec.authentication.enabled,
            features: backendSpec.features,
            note: 'Frontend generated with retry due to content filter'
          }
        });
        return;
      }
      
      console.error('❌ WARNING: Frontend code is empty!');
      console.error('Response:', JSON.stringify(frontendResponse, null, 2).substring(0, 500));
      throw new Error('Frontend generation failed - no code returned');
    }

    // ============================================================
    // STEP 4: RETURN INTEGRATED FULLSTACK
    // ============================================================
    console.log('═'.repeat(60));
    console.log('STEP 4: FULLSTACK GENERATION COMPLETE');
    console.log('═'.repeat(60) + '\n');

    console.log(`📦 Backend: ${backendCode.length} chars`);
    console.log(`🎨 Frontend: ${frontendCode.length} chars`);
    console.log(`✅ Total: ${backendCode.length + frontendCode.length} chars\n`);

    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║   ✅ INTEGRATED FULLSTACK GENERATION COMPLETE             ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    res.json({
      success: true,
      backend: backendCode,
      frontend: frontendCode,
      metadata: {
        projectId,
        backendSize: backendCode.length,
        frontendSize: frontendCode.length,
        endpoints: backendSpec.endpoints.length,
        models: backendSpec.models.length,
        authenticated: backendSpec.authentication.enabled,
        features: backendSpec.features
      }
    });

  } catch (error: any) {
    console.error('\n❌ ERROR:', error.message);
    res.status(500).json({
      success: false,
      error: error.message || "Fullstack generation failed"
    });
  }
}
