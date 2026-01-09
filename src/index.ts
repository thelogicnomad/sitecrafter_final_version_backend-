import dotenv from "dotenv";
import express, { Application, Request, Response } from "express";
import mongoose from "mongoose";
import cors from "cors";
import session from 'express-session';
import passport from 'passport';
import { getSystemPrompt, BASE_PROMPT } from './prompts';
import { reactprompt } from "./deafult/react";
import { COMPLETE_REACT_TEMPLATE } from "./deafult/react-complete";
import { nodeprompt } from "./deafult/node";
import { QUALITY_REQUIREMENTS, FRONTEND_QUALITY_CHECKLIST, BACKEND_QUALITY_CHECKLIST } from './prompts/quality-enforcement';
import { parseBackendCode, generateAPISpecification } from './utils/backend-parser';
import { OpenAI } from "openai";
import { storeBackendKnowledge, retrieveBackendKnowledge, formatBackendInfoForMem0 } from './services/mem0.service';
import authRoutes from './routes/auth';
import googleAuthRoutes from './routes/googleAuth';
import './config/passport';
import { PlanningService } from './services/planning-fixed.service';
import axios, { AxiosInstance } from "axios";
import { generateIntegratedFullstack } from './endpoints/fullstack-integrated';
import { generateCompleteFullstack } from './endpoints/fullstack-complete';
import { PRODUCTION_FRONTEND_PROMPT, PRODUCTION_GENERATION_INSTRUCTIONS } from './prompts/production-frontend';
import { PACKAGE_VERIFICATION_PROMPT, PACKAGE_GENERATION_RULES } from './prompts/package-verification';
import { UI_UX_DESIGN_PROMPT, DESIGN_IMPLEMENTATION_RULES } from './prompts/ui-design';
import { generateWebsite, GeneratedFile } from './agents/langgraph';
import { fixCodeError, analyzeCode } from './agents/langgraph/services/error-fixer.service';
import Project from './models/project';
import { analyzeModificationRequest, applyModifications } from './services/modification.service';
import multer from 'multer';
import AdmZip from 'adm-zip';
dotenv.config();

// Configure multer for file uploads (memory storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

const app: Application = express();

const client = new OpenAI({
  baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
  apiKey: process.env.gemini3
});

const openrouter = new OpenAI({
  baseURL: "https://api.openrouter.ai/v1",
  apiKey: process.env.OPENROUTER_API_KEY
})

// Enhanced CORS configuration
app.use(cors({
  origin: true,
  credentials: true
}));

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*'); // Allow all origins
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Cross-Origin-Embedder-Policy', 'credentialless'); // Less restrictive
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups'); // Allows authentication flows
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
});

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Session and Passport middleware
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'your_secret_key',
    resave: false,
    saveUninitialized: true,
  })
);

app.use(passport.initialize());
app.use(passport.session());

// Auth routes
app.use('/auth', authRoutes);
app.use('/auth', googleAuthRoutes);

// Gemini AI setup
const { GoogleGenerativeAI } = require("@google/generative-ai");
const systemPrompt = getSystemPrompt();

// const genAI = new GoogleGenerativeAI(process.env.gemini);
// const model = genAI.getGenerativeModel({
//   model: "gemini-2.5-flash",
//   systemInstruction: getSystemPrompt(),
// });

// Template endpoint - uses projectType from frontend (no keyword detection)
app.post("/template", async (req: any, res: any) => {
  const { prompt, projectType } = req.body;

  if (!prompt) {
    res.status(400).json({
      error: 'Prompt is required'
    });
    return;
  }

  // Use projectType from frontend, fallback to 'frontend' if not provided
  const finalProjectType: 'frontend' | 'backend' | 'fullstack' = projectType || 'frontend';

  console.log(`[Template] Project type from frontend: ${finalProjectType}`);
  console.log(`[Template] Prompt: "${prompt.substring(0, 50)}..."`);

  // Return appropriate production-ready template based on frontend selection
  if (finalProjectType === 'backend') {
    res.json({
      prompts: [BASE_PROMPT, `Here is an artifact that contains all files of the project visible to you.\nConsider the contents of ALL files in the project.\n\n${nodeprompt}\n\nHere is a list of files that exist on the file system but are not being shown to you:\n\n  - .gitignore\n  - package-lock.json\n`],
      uiPrompts: [nodeprompt]
    });
    return;
  }

  // For frontend and fullstack, return production-ready React template with quality requirements
  res.json({
    prompts: [BASE_PROMPT, `Here is an artifact that contains all files of the project visible to you.\nConsider the contents of ALL files in the project.\n\n${COMPLETE_REACT_TEMPLATE}\n\n${QUALITY_REQUIREMENTS}\n\n${FRONTEND_QUALITY_CHECKLIST}\n\nThis is the base template. You MUST include ALL these config files plus any additional files needed for the project.`],
    uiPrompts: [COMPLETE_REACT_TEMPLATE]
  });
  return;
});

// Planning endpoint
app.post("/planning", async (req, res) => {
  try {
    const { requirements, projectType } = req.body;

    if (!requirements) {
      res.status(400).json({
        success: false,
        error: 'Requirements are required'
      });
      return;
    }

    console.log(`[Planning] Project type from frontend: ${projectType || 'not provided'}`);
    const result = await PlanningService.generateBlueprint(requirements, 0, projectType);
    res.json(result);

  } catch (error: any) {
    console.error('Planning route error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Chat endpoint - Now with robust frontend generation
app.post("/chat", async (req, res) => {
  try {
    interface Message {
      role: string;
      content: string;
    }

    const messages = req.body.messages;

    console.log('\n /CHAT ENDPOINT CALLED');
    console.log(` Received ${messages.length} messages from frontend`);

    // Log each message to see if detailedContext (with UI components) is included
    messages.forEach((msg: Message, index: number) => {
      console.log(`\n Message ${index + 1}:`);
      console.log(`   Role: ${msg.role}`);
      console.log(`   Content length: ${msg.content?.length || 0} chars`);

      // Check if this message contains UI components
      if (msg.content && msg.content.includes('COMPULSORY USE ALL THESE UI COMPONENTS')) {
        console.log('    CONTAINS UI COMPONENTS!');
        console.log('    Last 500 chars of this message:');
        console.log('   ' + '─'.repeat(76));
        console.log('   ' + String(msg.content).slice(-500).split('\n').join('\n   '));
        console.log('   ' + '─'.repeat(76));
      }
    });

    // Build system prompt with production-level frontend generation instructions
    const systemPrompt = `${getSystemPrompt()}

${UI_UX_DESIGN_PROMPT}

${DESIGN_IMPLEMENTATION_RULES}

${PACKAGE_VERIFICATION_PROMPT}

${PACKAGE_GENERATION_RULES}

${PRODUCTION_FRONTEND_PROMPT}

${PRODUCTION_GENERATION_INSTRUCTIONS}`;

    const chatMessages = [
      { role: "system", content: systemPrompt },
      ...messages.map((msg: Message) => ({
        role: msg.role,
        content: msg.content,
      })),
    ];

    console.log(`\n Sending ${chatMessages.length} messages to LLM with PRODUCTION-LEVEL FRONTEND PROMPT...\n`);

    const response = await client.chat.completions.create({
      model: "gemini-2.5-pro",
      messages: chatMessages,
    });

    const responseContent = response.choices[0].message.content;
    console.log(responseContent);

    res.json({ response: responseContent });
  } catch (error) {
    console.error("Error processing chat request:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});


// ═══════════════════════════════════════════════════════════════════════════
// LangGraph-based Generation Endpoint
// Uses stateful graph with proper context passing and repair loops
// ═══════════════════════════════════════════════════════════════════════════

app.post("/chat/langgraph", async (req: Request, res: Response) => {
  try {
    const { prompt, projectType = 'frontend' } = req.body;

    if (!prompt) {
      res.status(400).json({ error: 'Prompt is required' });
      return;
    }

    console.log('\n ═══════════════════════════════════════════════════');
    console.log(' LANGGRAPH GENERATION ENDPOINT CALLED');
    console.log(' ═══════════════════════════════════════════════════');
    console.log(` Prompt: ${prompt}`);
    console.log(` Project Type: ${projectType}`);

    const result = await generateWebsite(prompt, projectType);

    // Convert files to chirAction XML format for frontend
    // IMPORTANT: Must wrap in <chirArtifact> for frontend parseXml to work
    const projectName = result.files.get('package.json')?.content
      ? JSON.parse(result.files.get('package.json')!.content).name || 'generated-project'
      : 'generated-project';

    let xmlContent = '';
    result.files.forEach((file, path) => {
      xmlContent += `<chirAction type="file" filePath="${path}">\n${file.content}\n</chirAction>\n\n`;
    });

    const xmlOutput = `<chirArtifact id="generated-project" title="${projectName}">\n${xmlContent}</chirArtifact>`;

    console.log(`\n LangGraph generation complete: ${result.files.size} files`);

    res.json({
      success: true,
      response: xmlOutput,
      stats: {
        filesGenerated: result.files.size,
        errorsRemaining: result.errors.length,
        messages: result.messages
      }
    });

  } catch (error: any) {
    console.error(' LangGraph generation error:', error);
    res.status(500).json({
      error: 'Generation failed',
      message: error.message
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// NEW SSE STREAMING ENDPOINT FOR REAL-TIME FILE UPDATES
// ═══════════════════════════════════════════════════════════════════════════
app.post("/chat/langgraph-stream", async (req: Request, res: Response) => {
  const { prompt, projectType = 'frontend' } = req.body;

  if (!prompt) {
    res.status(400).json({ error: 'Prompt is required' });
    return;
  }

  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.flushHeaders();

  // Helper function for phase messages
  function getPhaseMessage(phase: string): string {
    const messages: Record<string, string> = {
      'blueprint': 'Creating project blueprint...',
      'structure': 'Setting up project structure...',
      'core': 'Generating core files (main.tsx, App.tsx, layouts)...',
      'components': 'Building UI components...',
      'pages': 'Creating page components...',
      'validation': 'Validating generated code...',
      'repair': 'Fixing validation issues...'
    };
    return messages[phase] || `Processing ${phase}...`;
  }

  console.log('\n ═══════════════════════════════════════════════════');
  console.log('SSE STREAM: LangGraph Generation Started');
  console.log(' ═══════════════════════════════════════════════════');
  console.log(` Prompt: ${prompt}`);

  // Helper to send SSE events
  const sendEvent = (type: string, data: any) => {
    res.write(`data: ${JSON.stringify({ type, ...data })}\n\n`);
  };

  try {
    // Send initial message
    sendEvent('message', {
      content: "I'm analyzing your requirements and planning the website structure...",
      phase: 'thinking'
    });

    // Track files sent
    const sentFiles = new Set<string>();
    let currentPhase = 'blueprint';

    // Generate with callbacks for streaming
    const result = await generateWebsite(
      prompt,
      projectType,
      // Callback when a file is generated
      (file: GeneratedFile) => {
        if (!sentFiles.has(file.path)) {
          sentFiles.add(file.path);
          sendEvent('file', {
            path: file.path,
            content: file.content,
            phase: currentPhase
          });
          console.log(`    Streamed: ${file.path}`);
        }
      },
      // Callback when phase changes
      (phase: string) => {
        currentPhase = phase;
        sendEvent('phase', {
          phase,
          message: getPhaseMessage(phase)
        });
        console.log(`    Phase: ${phase}`);
      }
    );

    // Send completion
    sendEvent('complete', {
      totalFiles: result.files.size,
      errors: result.errors.length,
      message: `🎉 Generated ${result.files.size} files successfully!`
    });

    console.log(`\n SSE Stream complete: ${result.files.size} files sent`);
    res.end();

  } catch (error: any) {
    console.error(' SSE Stream error:', error);
    sendEvent('error', {
      message: error.message || 'Generation failed'
    });
    res.end();
  }
});

//testing mem0





const MEM0_API_KEY = process.env.mem0 || "";
const MEM0_API_URL = "https://api.mem0.ai/v1";

// Create axios client with types
const mem0Client: AxiosInstance = axios.create({
  baseURL: MEM0_API_URL,
  headers: {
    Authorization: `Token ${MEM0_API_KEY}`,
    "Content-Type": "application/json",
  },
});

app.post("/test/mem0", async (req: Request, res: Response) => {
  try {
    const messages = [
      { role: "user", content: "<user-message>" },
      { role: "assistant", content: "<assistant-response>" },
    ];

    const payload = {
      messages,
      user_id: "test-user",
      metadata: {
        project_id: "test-project",
        type: "test",
        created_at: new Date().toISOString(),
      },
    };

    const response = await mem0Client.post("/memories/", payload);

    res.status(200).json({
      success: true,
      mem0_response: response.data,
    });
  } catch (error: any) {
    console.error("Mem0 error:", error?.response?.data || error.message);

    res.status(500).json({
      success: false,
      error: error?.response?.data || error.message,
    });
  }
});







// ============================================================
// NEW: COMPLETE FULLSTACK GENERATION (BEST - WITH ANALYSIS)
// ============================================================
app.post("/build/fullstack-complete", generateCompleteFullstack);

// ============================================================
// NEW: INTEGRATED FULLSTACK GENERATION (RECOMMENDED)
// ============================================================
app.post("/build/fullstack-integrated", generateIntegratedFullstack);

// TEST: Separate Backend/Frontend Generation (No Context Sharing)
app.post("/build/separate", async (req: Request, res: Response) => {
  try {
    const { backendContext, frontendContext, projectId } = req.body;

    console.log('\n🧪 /BUILD/SEPARATE ENDPOINT CALLED (TEST MODE)');
    console.log(`📦 Backend context: ${backendContext?.length || 0} chars`);
    console.log(`🎨 Frontend context: ${frontendContext?.length || 0} chars`);
    console.log(`🆔 Project ID: ${projectId}`);

    // Step 1: Generate Backend Code (Independent)
    console.log('\n📦 STEP 1: Generating backend code (independent)...');

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
15. **MANDATORY**: Create a seed.js or seed.ts file that populates the database with sample data
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
    console.log(`✅ Backend code generated: ${backendCode.length} chars`);

    // Store backend knowledge in Mem0
    console.log('\n💾 STEP 1.5: Storing backend knowledge in Mem0...');
    const backendInfo = formatBackendInfoForMem0(backendCode);
    const memoryId = await storeBackendKnowledge(projectId, {
      endpoints: backendInfo.endpoints,
      authentication: backendInfo.authentication,
      features: backendInfo.features,
      dataModels: backendInfo.dataModels,
      baseURL: backendInfo.baseURL,
      apiPrefix: backendInfo.apiPrefix
    });
    console.log(`✅ Backend knowledge stored in Mem0 (Memory ID: ${memoryId})`);

    // Step 2: Generate Frontend Code (Using Mem0 Backend Knowledge)
    console.log('\n🎨 STEP 2: Generating frontend code (using Mem0 backend knowledge)...');

    // Retrieve backend knowledge from Mem0
    console.log('📚 Retrieving backend knowledge from Mem0...');
    const backendKnowledgeForFrontend = await retrieveBackendKnowledge(projectId);

    if (!backendKnowledgeForFrontend) {
      console.warn('⚠️ Warning: Backend knowledge not found in Mem0, using minimal context');
    }

    // Create frontend context with Mem0 knowledge (much smaller than full backend code)
    const frontendContextWithMem0 = `${QUALITY_REQUIREMENTS}

${FRONTEND_QUALITY_CHECKLIST}

${backendKnowledgeForFrontend ? `## BACKEND API SPECIFICATION (from Mem0)
${backendKnowledgeForFrontend}

` : ''}## USER REQUIREMENTS
${frontendContext}

CRITICAL INSTRUCTIONS:
1. Create a beautiful, modern React application
2. Use TypeScript with strict mode enabled
3. Use Tailwind CSS for styling
4. Create ALL config files (tsconfig.json, tsconfig.node.json, vite.config.ts, postcss.config.js, tailwind.config.js)
5. Include ALL dependencies in package.json
6. Implement ALL pages fully - NO placeholders
7. Use professional, web-safe color schemes
8. Make the UI responsive and accessible
9. Add loading states and error handling
10. NO README - DO NOT CREATE README.md FILES
11. NO ERRORS - code must work perfectly after npm install && npm run dev
12. Use reliable image URLs from Unsplash only
13. Integrate with backend API endpoints from the specification above
14. Create proper authentication pages (login, signup, logout)
15. Focus on beautiful UI and user experience
16. Match frontend features with backend capabilities`;

    const frontendMessages = [
      { role: "system" as const, content: getSystemPrompt() },
      { role: "user" as const, content: BASE_PROMPT },
      { role: "user" as const, content: `Here is an artifact that contains all files of the project visible to you.\nConsider the contents of ALL files in the project.\n\n${COMPLETE_REACT_TEMPLATE}\n\nThis is the base template. You MUST include ALL these config files plus any additional files needed for the project.` },
      { role: "user" as const, content: frontendContextWithMem0 }
    ];

    const frontendResponse = await client.chat.completions.create({
      model: "gemini-2.5-pro",
      messages: frontendMessages as any,
    });

    const frontendCode = frontendResponse.choices[0].message.content || '';
    console.log(`✅ Frontend code generated: ${frontendCode.length} chars`);

    // Debug: Check what we're actually returning
    if (!frontendCode || frontendCode.length === 0) {
      console.error('❌ WARNING: Frontend code is empty!');
      console.error('Frontend response structure:', JSON.stringify(frontendResponse, null, 2).substring(0, 1000));
    }

    console.log('\n✅ SEPARATE GENERATION COMPLETE!\n');
    console.log(`📦 Backend: ${backendCode.length} chars`);
    console.log(`🎨 Frontend: ${frontendCode.length} chars`);

    // Return both backend and frontend code
    res.json({
      backend: backendCode,
      frontend: frontendCode
    });

  } catch (error: any) {
    console.error("Error processing separate build:", error);
    res.status(500).json({ error: error.message || "Internal Server Error" });
  }
});

// Frontend Generation using Mem0 Backend Knowledge
app.post("/build/frontend-with-mem0", async (req: Request, res: Response) => {
  try {
    const { projectId, frontendContext } = req.body;

    console.log('\n /BUILD/FRONTEND-WITH-MEM0 ENDPOINT CALLED');
    console.log(`Project ID: ${projectId}`);
    console.log(` Frontend context: ${frontendContext?.length || 0} chars`);

    // Step 1: Retrieve backend knowledge from Mem0
    console.log('\n STEP 1: Retrieving backend knowledge from Mem0...');
    const backendKnowledge = await retrieveBackendKnowledge(projectId);

    if (!backendKnowledge) {
      console.warn(' No backend knowledge found in Mem0 for this project');
      res.status(400).json({
        error: 'Backend knowledge not found. Please generate backend first using /build/separate'
      });
      return;
    }

    console.log(` Retrieved backend knowledge (${backendKnowledge.length} chars)`);

    // Step 2: Generate Frontend with Mem0 Backend Knowledge
    console.log('\n STEP 2: Generating frontend with Mem0 backend knowledge...');

    const frontendContextWithMem0 = `${QUALITY_REQUIREMENTS}

${FRONTEND_QUALITY_CHECKLIST}

## BACKEND KNOWLEDGE (from Mem0)
${backendKnowledge}

## USER REQUIREMENTS
${frontendContext}

CRITICAL INSTRUCTIONS:
1. Create a beautiful, modern React application
2. Use TypeScript with strict mode enabled
3. Use Tailwind CSS for styling
4. Create ALL config files (tsconfig.json, tsconfig.node.json, vite.config.ts, postcss.config.js, tailwind.config.js)
5. Include ALL dependencies in package.json
6. Implement ALL pages fully - NO placeholders
7. Use professional, web-safe color schemes
8. Make the UI responsive and accessible
9. Add loading states and error handling
10. NO README - DO NOT CREATE README.md FILES
11. NO ERRORS - code must work perfectly after npm install && npm run dev
12. Use reliable image URLs from Unsplash only
13. **INTEGRATE WITH BACKEND**: Use the backend knowledge above to create API services
14. Create .env file with VITE_API_URL=http://localhost:5000
15. Focus on beautiful UI and user experience`;

    const frontendMessages = [
      { role: "system" as const, content: getSystemPrompt() },
      { role: "user" as const, content: BASE_PROMPT },
      { role: "user" as const, content: `Here is an artifact that contains all files of the project visible to you.\nConsider the contents of ALL files in the project.\n\n${COMPLETE_REACT_TEMPLATE}\n\nThis is the base template. You MUST include ALL these config files plus any additional files needed for the project.` },
      { role: "user" as const, content: frontendContextWithMem0 }
    ];

    const frontendResponse = await client.chat.completions.create({
      model: "gemini-2.5-pro",
      messages: frontendMessages as any,
    });

    const frontendCode = frontendResponse.choices[0].message.content || '';
    console.log(` Frontend code generated: ${frontendCode.length} chars`);

    // Debug: Check what we're actually returning
    if (!frontendCode || frontendCode.length === 0) {
      console.error(' WARNING: Frontend code is empty!');
      console.error('Frontend response structure:', JSON.stringify(frontendResponse, null, 2).substring(0, 1000));
    }

    console.log('\n FRONTEND GENERATION WITH MEM0 COMPLETE!\n');
    console.log(` Frontend: ${frontendCode.length} chars`);

    // Return frontend code
    res.json({
      frontend: frontendCode,
      projectId: projectId
    });

  } catch (error: any) {
    console.error("Error generating frontend with Mem0:", error);
    res.status(500).json({ error: error.message || "Internal Server Error" });
  }
});

// Fullstack Build endpoint - handles backend first, then frontend with direct context
app.post("/build/fullstack", async (req: Request, res: Response) => {
  try {
    const { backendContext, frontendContext, projectId } = req.body;

    console.log('\n /BUILD/FULLSTACK ENDPOINT CALLED');
    console.log(` Backend context: ${backendContext?.length || 0} chars`);
    console.log(` Frontend context: ${frontendContext?.length || 0} chars`);
    console.log(` Project ID: ${projectId}`);

    // Step 1: Generate Backend Code
    console.log('\n STEP 1: Generating backend code...');

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
15. **MANDATORY**: Create a seed.js or seed.ts file that populates the database with sample data
16. The seed file should include realistic, complete data for ALL models
17. Include at least 10-20 sample records for main entities
18. Seed file should be runnable with: node seed.js or npm run seed`;

    const backendMessages = [
      { role: "system" as const, content: getSystemPrompt() },
      { role: "user" as const, content: BASE_PROMPT },
      { role: "user" as const, content: `Here is an artifact that contains all files of the project visible to you.\nConsider the contents of ALL files in the project.\n\n${nodeprompt}\n\nThis is the base Node.js/Express template.` },
      { role: "user" as const, content: enhancedBackendContext }
    ];

    const backendResponse = await client.chat.completions.create({
      model: "gemini-2.5-pro",
      messages: backendMessages as any,
    });

    const backendCode = backendResponse.choices[0].message.content || '';
    console.log(` Backend code generated: ${backendCode.length} chars`);

    // Step 2: Extract API information from backend code
    console.log('\n STEP 2: Extracting API context from backend code...');

    // Parse backend code into structured specification
    console.log('   - Parsing backend code into API specification...');
    const backendSpec = parseBackendCode(backendCode);
    const apiSpecification = generateAPISpecification(backendSpec);

    console.log(`   - Found ${backendSpec.endpoints.length} API endpoints`);
    console.log(`   - Found ${backendSpec.models.length} database models`);
    console.log(`   - Authentication: ${backendSpec.authentication.enabled ? 'Enabled' : 'Disabled'}`);
    console.log(`   - Features: ${backendSpec.features.join(', ')}`);

    // Step 3: Create enriched frontend context with backend knowledge
    console.log('\n STEP 3: Generating frontend with backend knowledge...');

    // Send structured API specification instead of raw code
    // This avoids Gemini's content filter while providing complete integration details
    const backendSummary = apiSpecification;

    const enrichedFrontendContext = `${QUALITY_REQUIREMENTS}

${FRONTEND_QUALITY_CHECKLIST}

${backendSummary}

USER REQUIREMENTS:
${frontendContext}

CRITICAL INSTRUCTIONS:
1. **MANDATORY BACKEND INTEGRATION** - You MUST use the backend APIs listed above
2. Create complete API service files for EVERY endpoint (src/api/*.ts)
3. NO MOCK DATA ALLOWED - Fetch everything from the backend
4. Create .env file with VITE_API_URL=http://localhost:5000
5. Implement ALL pages fully - NO placeholders or "coming soon" messages
6. Use professional, web-safe color schemes with good contrast
7. Ensure EVERY dependency is in package.json
8. Include ALL config files (tsconfig.json, tsconfig.node.json, vite.config.ts, postcss.config.js, tailwind.config.js)
9. Make the UI beautiful, modern, and responsive
10. Add loading states, error states, and empty states everywhere
11. Implement full authentication flow if backend has auth endpoints
12. NO ERRORS - code must work perfectly after npm install && npm run dev
13. NO README - DO NOT CREATE README.md FILES
14. Use reliable image URLs from Unsplash (https://images.unsplash.com/) - NO broken image links`;

    const frontendMessages = [
      { role: "system" as const, content: getSystemPrompt() },
      { role: "user" as const, content: BASE_PROMPT },
      { role: "user" as const, content: `Here is an artifact that contains all files of the project visible to you.\nConsider the contents of ALL files in the project.\n\n${COMPLETE_REACT_TEMPLATE}\n\nThis is the base template. You MUST include ALL these config files plus any additional files needed for the project.` },
      { role: "user" as const, content: enrichedFrontendContext }
    ];

    const frontendResponse = await client.chat.completions.create({
      model: "gemini-2.5-pro",
      messages: frontendMessages as any,
    });

    const frontendCode = frontendResponse.choices[0].message.content || '';
    console.log(` Frontend code generated: ${frontendCode.length} chars`);

    // Debug: Check what we're actually returning
    if (!frontendCode || frontendCode.length === 0) {
      console.error(' WARNING: Frontend code is empty!');
      console.error('Frontend response structure:', JSON.stringify(frontendResponse, null, 2).substring(0, 1000));
    }

    console.log('\n FULLSTACK GENERATION COMPLETE!\n');
    console.log(` Sending backend: ${backendCode.length} chars`);
    console.log(` Sending frontend: ${frontendCode.length} chars`);

    // Return both backend and frontend code
    res.json({
      backend: backendCode,
      frontend: frontendCode
    });

  } catch (error: any) {
    console.error("Error processing fullstack build:", error);
    res.status(500).json({ error: error.message || "Internal Server Error" });
  }
});

// Helper function to extract API routes from backend code
function extractAPIRoutes(code: string): string[] {
  const routes: string[] = [];

  // Match Express route definitions
  const routePatterns = [
    /router\.(get|post|put|delete|patch)\(['"]([^'"]+)['"]/gi,
    /app\.(get|post|put|delete|patch)\(['"]([^'"]+)['"]/gi,
  ];

  routePatterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(code)) !== null) {
      routes.push(`${match[1].toUpperCase()} ${match[2]}`);
    }
  });

  return routes.length > 0 ? routes : ['No explicit routes found - check backend code'];
}

// Helper function to extract database models from backend code
function extractDatabaseModels(code: string): string[] {
  const models: string[] = [];

  // Match Mongoose schema definitions
  const schemaPattern = /const\s+(\w+Schema)\s*=\s*new\s+mongoose\.Schema/gi;
  const modelPattern = /mongoose\.model\(['"](\w+)['"]/gi;

  let match;
  while ((match = schemaPattern.exec(code)) !== null) {
    models.push(`Schema: ${match[1]}`);
  }

  while ((match = modelPattern.exec(code)) !== null) {
    models.push(`Model: ${match[1]}`);
  }

  return models.length > 0 ? models : ['No explicit models found - check backend code'];
}

// Helper function to extract backend structure
function extractBackendStructure(code: string): string {
  const structure: string[] = [];

  // Check for authentication
  if (code.includes('jwt') || code.includes('JWT') || code.includes('jsonwebtoken')) {
    structure.push(' Authentication: JWT-based auth detected');
  }
  if (code.includes('bcrypt')) {
    structure.push(' Password Hashing: bcrypt detected');
  }

  // Check for validation
  if (code.includes('zod') || code.includes('Zod')) {
    structure.push(' Validation: Zod schema validation');
  }
  if (code.includes('joi') || code.includes('Joi')) {
    structure.push(' Validation: Joi schema validation');
  }

  // Check for architecture
  if (code.includes('controller') || code.includes('Controller')) {
    structure.push(' Architecture: MVC/Layered (controllers detected)');
  }
  if (code.includes('service') || code.includes('Service')) {
    structure.push(' Architecture: Service layer detected');
  }

  // Check for middleware
  if (code.includes('middleware') || code.includes('Middleware')) {
    structure.push(' Middleware: Custom middleware detected');
  }

  // Check for database
  if (code.includes('mongoose')) {
    structure.push(' Database: MongoDB with Mongoose');
  }

  return structure.length > 0 ? structure.join('\n') : 'Backend structure analysis pending...';
}

// ====================================
// ERROR FIXING ENDPOINTS (for WebContainer)
// ====================================

/**
 * POST /api/fix-error
 * Uses LLM to fix code errors from WebContainer
 */
app.post('/api/fix-error', async (req: Request, res: Response) => {
  try {
    const { error, filePath, fileContent } = req.body;

    if (!error || !filePath || !fileContent) {
      res.status(400).json({
        error: 'Missing required fields: error, filePath, fileContent'
      });
      return;
    }

    console.log(`\n🔧 ERROR FIX REQUEST`);
    console.log(`   File: ${filePath}`);
    console.log(`   Error: ${error.slice(0, 150)}...`);

    const result = await fixCodeError(error, filePath, fileContent);

    console.log(`    Fix generated successfully`);
    res.json(result);

  } catch (error: any) {
    console.error(' Error fix failed:', error.message);
    res.status(500).json({
      error: 'Failed to fix error',
      details: error.message
    });
  }
});

/**
 * POST /api/analyze-code
 * Analyzes code files for potential issues
 */
app.post('/api/analyze-code', async (req: Request, res: Response) => {
  try {
    const { files } = req.body;

    if (!files || !Array.isArray(files)) {
      res.status(400).json({
        error: 'Missing required field: files (array)'
      });
      return;
    }

    console.log(`\n CODE ANALYSIS REQUEST (${files.length} files)`);

    const issues = await analyzeCode(files);

    console.log(`   Found ${issues.length} issues`);
    res.json({ issues });

  } catch (error: any) {
    console.error(' Code analysis failed:', error.message);
    res.status(500).json({
      error: 'Failed to analyze code',
      details: error.message
    });
  }
});

// ====================================
// PROJECT STORAGE ENDPOINTS
// ====================================

/**
 * POST /api/projects
 * Save a new project or update existing one
 */
app.post('/api/projects', async (req: Request, res: Response) => {
  try {
    const { sessionId, userId, name, prompt, files, blueprint } = req.body;

    if (!prompt || !files) {
      res.status(400).json({ error: 'Missing required fields: prompt, files' });
      return;
    }

    // Generate name from prompt if not provided
    const projectName = name || prompt.slice(0, 50).replace(/[^a-zA-Z0-9\s]/g, '').trim() || 'Untitled Project';

    console.log(`\n SAVING PROJECT: ${projectName}`);
    console.log(`   Files: ${files.length}`);

    const project = new Project({
      userId,
      sessionId: sessionId || `session-${Date.now()}`,
      name: projectName,
      prompt,
      files,
      blueprint,
      status: 'complete',
      fileCount: files.length,
    });

    await project.save();

    console.log(`    Project saved with ID: ${project._id}`);

    res.json({
      success: true,
      projectId: project._id,
      name: projectName,
    });

  } catch (error: any) {
    console.error(' Failed to save project:', error.message);
    res.status(500).json({ error: 'Failed to save project', details: error.message });
  }
});

/**
 * GET /api/projects
 * Get all projects (filtered by sessionId or userId)
 */
app.get('/api/projects', async (req: Request, res: Response) => {
  try {
    const { sessionId, userId } = req.query;

    // Build query to match either sessionId OR userId
    const orConditions: any[] = [];
    if (sessionId) orConditions.push({ sessionId });
    if (userId) orConditions.push({ userId });

    const query = orConditions.length > 0 ? { $or: orConditions } : {};

    const projects = await Project.find(query)
      .select('_id name prompt fileCount status createdAt updatedAt')
      .sort({ createdAt: -1 })
      .limit(50);

    console.log(` Retrieved ${projects.length} projects`);

    res.json({ projects });

  } catch (error: any) {
    console.error(' Failed to get projects:', error.message);
    res.status(500).json({ error: 'Failed to get projects', details: error.message });
  }
});

/**
 * GET /api/projects/:projectId
 * Get a single project with all files
 */
app.get('/api/projects/:projectId', async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;

    const project = await Project.findById(projectId);

    if (!project) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    console.log(` Retrieved project: ${project.name} (${project.files.length} files)`);

    res.json({ project });

  } catch (error: any) {
    console.error(' Failed to get project:', error.message);
    res.status(500).json({ error: 'Failed to get project', details: error.message });
  }
});

/**
 * POST /api/projects/:projectId/chat
 * Intelligent chat endpoint - handles questions, modifications, or explanations
 * Detects intent and responds appropriately:
 * - Questions: Answer without modifying files
 * - Modifications: Analyze and apply changes
 * - Explanations: Explain project structure
 */
app.post('/api/projects/:projectId/chat', async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const { message } = req.body;

    if (!message) {
      res.status(400).json({ error: 'Missing message' });
      return;
    }

    const project = await Project.findById(projectId);
    if (!project) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    console.log(`\n INTELLIGENT CHAT REQUEST`);
    console.log(`   Project: ${project.name}`);
    console.log(`   Message: ${message.slice(0, 100)}...`);

    // Step 1: Detect intent
    const intentPrompt = `Analyze this user message and determine their intent.

USER MESSAGE: "${message}"

PROJECT CONTEXT:
- Project name: ${project.name}
- Files: ${project.files.length}
- Prompt: ${project.prompt?.slice(0, 200) || 'N/A'}

INTENTS:
1. "question" - User asks WHERE something is, or HOW something works
2. "explain" - User wants explanation of project/features
3. "modify" - User wants to ADD, CHANGE, UPDATE, or REMOVE something

IMPORTANT:
- "Where is X?" → question
- "Show me X" → question  
- "Explain the X" → explain
- "Add X" or "Create X" → modify
- "Change X" or "Update X" → modify

Respond with ONE WORD ONLY: question, explain, or modify`;

    const intentResponse = await client.chat.completions.create({
      model: "gemini-2.5-flash-lite-preview-09-2025",
      messages: [
        { role: "system", content: "You are an intent classifier. Respond with only one word." },
        { role: "user", content: intentPrompt }
      ],
      temperature: 0.1
    });

    const intent = intentResponse.choices[0].message.content?.toLowerCase().trim() || 'modify';
    console.log(`    Detected Intent: ${intent}`);

    // Handle based on intent
    if (intent === 'question' || intent === 'explain') {
      // Build project context for answering
      const fileList = project.files.map(f => `- ${f.path}`).join('\n');
      const componentFiles = project.files.filter(f => f.path.includes('/components/')).map(f => f.path);
      const pageFiles = project.files.filter(f => f.path.includes('/pages/')).map(f => f.path);

      const answerPrompt = `You are a helpful AI assistant that knows everything about this project.

USER QUESTION: "${message}"

PROJECT: ${project.name}
DESCRIPTION: ${project.prompt || 'Not specified'}

FILES IN PROJECT:
${fileList}

PAGES: ${pageFiles.join(', ')}
COMPONENTS: ${componentFiles.join(', ')}

Answer the user's question specifically:
- If they ask WHERE something is, tell them the exact file path
- If they ask about a feature, explain where it's implemented
- Be specific and helpful
- If something doesn't exist, say so clearly`;

      const answerResponse = await client.chat.completions.create({
        model: "gemini-2.5-flash-lite-preview-09-2025",
        messages: [
          { role: "system", content: "You answer questions about web projects. Be specific about file locations." },
          { role: "user", content: answerPrompt }
        ],
        temperature: 0.7
      });

      const answer = answerResponse.choices[0].message.content || "I couldn't find that information.";

      res.json({
        success: true,
        intent,
        response: answer,
        modifiedFiles: [] // No files modified for questions
      });
      return;
    }

    // Intent is 'modify' - redirect to modification logic
    console.log(`   → Routing to modification handler`);

    // Analyze which files need modification
    const plan = await analyzeModificationRequest(message, project.files);

    if (plan.filesToModify.length === 0) {
      res.json({
        success: true,
        intent: 'modify',
        response: 'I analyzed your request but no file modifications are needed.',
        modifiedFiles: [],
        summary: 'No modifications needed'
      });
      return;
    }

    // Apply modifications
    const modifiedFiles = await applyModifications(message, plan, project.files);

    // Update project in database
    for (const modified of modifiedFiles) {
      const fileIndex = project.files.findIndex(f =>
        f.path === modified.path || f.path.endsWith(modified.path.split('/').pop() || '')
      );

      if (fileIndex >= 0) {
        project.files[fileIndex].content = modified.content;
      } else if (modified.action === 'created') {
        project.files.push({ path: modified.path, content: modified.content });
      }
    }

    project.fileCount = project.files.length;
    await project.save();

    console.log(`    Applied ${modifiedFiles.length} modifications`);

    res.json({
      success: true,
      intent: 'modify',
      response: `I've made ${modifiedFiles.length} change(s): ${plan.summary}`,
      modifiedFiles,
      summary: plan.summary,
      updatedFileCount: project.files.length,
    });

  } catch (error: any) {
    console.error(' Chat failed:', error.message);
    res.status(500).json({ error: 'Chat failed', details: error.message });
  }
});

/**
 * POST /api/projects/:projectId/modify
 * Apply follow-up modifications to a project
 */
app.post('/api/projects/:projectId/modify', async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const { modificationRequest } = req.body;

    if (!modificationRequest) {
      res.status(400).json({ error: 'Missing modificationRequest' });
      return;
    }

    const project = await Project.findById(projectId);
    if (!project) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    console.log(`\n MODIFICATION REQUEST`);
    console.log(`   Project: ${project.name}`);
    console.log(`   Request: ${modificationRequest.slice(0, 100)}...`);

    // Step 1: Analyze which files need modification
    const plan = await analyzeModificationRequest(modificationRequest, project.files);

    if (plan.filesToModify.length === 0) {
      res.json({
        success: true,
        modifiedFiles: [],
        summary: 'No modifications needed'
      });
      return;
    }

    // Step 2: Apply modifications
    const modifiedFiles = await applyModifications(modificationRequest, plan, project.files);

    // Step 3: Update project in database
    for (const modified of modifiedFiles) {
      const fileIndex = project.files.findIndex(f =>
        f.path === modified.path || f.path.endsWith(modified.path.split('/').pop() || '')
      );

      if (fileIndex >= 0) {
        project.files[fileIndex].content = modified.content;
      } else if (modified.action === 'created') {
        project.files.push({ path: modified.path, content: modified.content });
      }
    }

    project.fileCount = project.files.length;
    await project.save();

    console.log(`    Applied ${modifiedFiles.length} modifications`);

    res.json({
      success: true,
      modifiedFiles,
      summary: plan.summary,
      updatedFileCount: project.files.length,
    });

  } catch (error: any) {
    console.error(' Modification failed:', error.message);
    res.status(500).json({ error: 'Modification failed', details: error.message });
  }
});

/**
 * PATCH /api/projects/:projectId/files
 * Update one or more files in a project
 */
app.patch('/api/projects/:projectId/files', async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const { files: updatedFiles } = req.body;

    if (!updatedFiles || !Array.isArray(updatedFiles)) {
      res.status(400).json({ error: 'Missing files array' });
      return;
    }

    const project = await Project.findById(projectId);
    if (!project) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    // Update each file
    let updatedCount = 0;
    for (const update of updatedFiles) {
      const { path, content } = update;
      const normalizedPath = path.startsWith('/') ? path : '/' + path;

      const fileIndex = project.files.findIndex(f =>
        f.path === normalizedPath || f.path === path ||
        '/' + f.path === normalizedPath
      );

      if (fileIndex >= 0) {
        project.files[fileIndex].content = content;
        updatedCount++;
      } else {
        // Add new file
        project.files.push({ path: normalizedPath, content });
        updatedCount++;
      }
    }

    project.fileCount = project.files.length;
    await project.save();

    console.log(` Updated ${updatedCount} file(s) in project: ${project.name}`);
    res.json({ success: true, updatedCount });

  } catch (error: any) {
    console.error(' Failed to update files:', error.message);
    res.status(500).json({ error: 'Failed to update files', details: error.message });
  }
});

/**
 * DELETE /api/projects/:projectId
 * Delete a project
 */
app.delete('/api/projects/:projectId', async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;

    const result = await Project.findByIdAndDelete(projectId);

    if (!result) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    console.log(` Deleted project: ${result.name}`);
    res.json({ success: true });

  } catch (error: any) {
    console.error(' Failed to delete project:', error.message);
    res.status(500).json({ error: 'Failed to delete project', details: error.message });
  }
});

/**
 * POST /api/projects/upload
 * Upload a zip file and import as a project
 */
app.post('/api/projects/upload', upload.single('zipFile'), async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;

    if (!req.file) {
      res.status(400).json({ error: 'No zip file uploaded' });
      return;
    }

    console.log(`\n ZIP UPLOAD: ${req.file.originalname} (${(req.file.size / 1024).toFixed(1)} KB)`);

    // Extract zip contents
    const zip = new AdmZip(req.file.buffer);
    const zipEntries = zip.getEntries();

    const files: { path: string; content: string }[] = [];
    let packageJson: any = null;

    // Text file extensions to extract
    const textExtensions = ['.tsx', '.ts', '.jsx', '.js', '.css', '.html', '.json', '.md', '.txt', '.svg', '.xml', '.yaml', '.yml', '.env', '.gitignore'];

    for (const entry of zipEntries) {
      if (entry.isDirectory) continue;

      let entryName = entry.entryName;

      // Remove root folder if exists (e.g., "project-name/src/..." -> "src/...")
      const parts = entryName.split('/');
      if (parts.length > 1) {
        // Check if first part looks like a root folder
        const firstPart = parts[0];
        if (!firstPart.includes('.') && parts.length > 1) {
          entryName = parts.slice(1).join('/');
        }
      }

      // Skip empty paths or hidden files
      if (!entryName || entryName.startsWith('.')) continue;

      // Check if it's a text file
      const ext = '.' + entryName.split('.').pop()?.toLowerCase();
      if (!textExtensions.includes(ext)) continue;

      try {
        const content = entry.getData().toString('utf8');

        // Normalize path
        const normalizedPath = '/' + entryName.replace(/\\/g, '/');
        files.push({ path: normalizedPath, content });

        // Capture package.json for name and description
        if (entryName === 'package.json' || entryName.endsWith('/package.json')) {
          try {
            packageJson = JSON.parse(content);
          } catch { }
        }
      } catch (err) {
        // Skip binary files that fail to decode
      }
    }

    if (files.length === 0) {
      res.status(400).json({ error: 'No valid files found in zip' });
      return;
    }

    // Get project name and description from package.json
    const projectName = packageJson?.name || req.file.originalname.replace('.zip', '') || 'Imported Project';
    const projectDescription = packageJson?.description || `Imported from ${req.file.originalname}`;

    // Create project in MongoDB
    const project = new Project({
      userId: userId || undefined,
      sessionId: `import-${Date.now()}`,
      name: projectName,
      prompt: projectDescription,
      files,
      status: 'complete',
      fileCount: files.length,
    });

    await project.save();

    console.log(`    Imported "${projectName}" with ${files.length} files`);

    res.json({
      success: true,
      projectId: project._id,
      name: projectName,
      description: projectDescription,
      fileCount: files.length,
    });

  } catch (error: any) {
    console.error(' Upload failed:', error.message);
    res.status(500).json({ error: 'Upload failed', details: error.message });
  }
});

// MongoDB Connection
const mongoUri = process.env.MONGODB_URI;
if (!mongoUri) {
  console.error('MONGODB_URI is not defined in .env file.');
  process.exit(1);
}

mongoose
  .connect(mongoUri)
  .then(() => {
    app.listen(3000, () => {
      console.log(` Server running on http://localhost:3000`);
    });
  })
  .catch((err) => {
    console.error(' MongoDB connection error:', err);
    process.exit(1);
  });
