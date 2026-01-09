import axios from 'axios';

/**
 * Mem0 Service - Store and retrieve backend knowledge
 * Avoids content filter by storing backend info separately
 */

interface BackendKnowledge {
  projectId: string;
  endpoints: string;
  authentication: string;
  features: string;
  dataModels: string;
  baseURL: string;
  apiPrefix: string;
}

const MEM0_API_KEY = process.env.mem0 || 'm0-EBjkPh1TnU0KtjWtunxAeYU9EtslrGfiqm0TymPa';
const MEM0_API_URL = 'https://api.mem0.ai/v1';

const mem0Client = axios.create({
  baseURL: MEM0_API_URL,
  headers: {
    'Authorization': `Token ${MEM0_API_KEY}`,
    'Content-Type': 'application/json'
  }
});

/**
 * Store backend knowledge in Mem0
 */
export async function storeBackendKnowledge(
  projectId: string,
  backendInfo: {
    endpoints: string;
    authentication: string;
    features: string;
    dataModels: string;
    baseURL: string;
    apiPrefix: string;
  }
): Promise<string> {
  try {
    if (!MEM0_API_KEY) {
      console.warn(' MEM0_API_KEY not set - skipping Mem0 storage');
      return '';
    }

    const memoryContent = `
PROJECT: ${projectId}

## API ENDPOINTS
${backendInfo.endpoints}

## AUTHENTICATION
${backendInfo.authentication}

## FEATURES
${backendInfo.features}

## DATA MODELS
${backendInfo.dataModels}

## BASE CONFIGURATION
- Base URL: ${backendInfo.baseURL}
- API Prefix: ${backendInfo.apiPrefix}
`;

    console.log(` Storing backend knowledge in Mem0 for project: ${projectId}`);

    const response = await mem0Client.post('/memories/', {
      messages: [
        {
          role: 'user',
          content: memoryContent
        }
      ],
      user_id: projectId,
      metadata: {
        project_id: projectId,
        type: 'backend_knowledge',
        created_at: new Date().toISOString()
      }
    });

    const memoryId = response.data?.memory_id || response.data?.id || '';
    console.log(` Backend knowledge stored in Mem0 with ID: ${memoryId}`);
    return memoryId;

  } catch (error: any) {
    console.error(' Error storing backend knowledge in Mem0:', error.message);
    return '';
  }
}

/**
 * Retrieve backend knowledge from Mem0
 */
export async function retrieveBackendKnowledge(projectId: string): Promise<string> {
  try {
    if (!MEM0_API_KEY) {
      console.warn(' MEM0_API_KEY not set - cannot retrieve from Mem0');
      return '';
    }

    console.log(` Retrieving backend knowledge from Mem0 for project: ${projectId}`);

    // Search for memories related to this project
    const response = await mem0Client.get('/memories/', {
      params: {
        user_id: projectId,
        query: 'API endpoints authentication features data models'
      }
    });

    const memories = response.data?.memories || response.data?.results || [];

    if (memories.length === 0) {
      console.warn(` No backend knowledge found in Mem0 for project: ${projectId}`);
      return '';
    }

    // Combine all relevant memories
    const combinedKnowledge = memories
      .map((m: any) => m.memory || m.content || '')
      .filter((m: string) => m.length > 0)
      .join('\n\n---\n\n');

    console.log(` Retrieved backend knowledge from Mem0 (${combinedKnowledge.length} chars)`);
    return combinedKnowledge;

  } catch (error: any) {
    console.error(' Error retrieving backend knowledge from Mem0:', error.message);
    return '';
  }
}

/**
 * Search backend knowledge in Mem0
 */
export async function searchBackendKnowledge(
  projectId: string,
  query: string
): Promise<string> {
  try {
    if (!MEM0_API_KEY) {
      console.warn(' MEM0_API_KEY not set - cannot search Mem0');
      return '';
    }

    console.log(` Searching backend knowledge in Mem0: "${query}"`);

    const response = await mem0Client.get('/memories/search/', {
      params: {
        user_id: projectId,
        query: query
      }
    });

    const results = response.data?.memories || response.data?.results || [];

    if (results.length === 0) {
      console.warn(` No search results found for: "${query}"`);
      return '';
    }

    const combinedResults = results
      .map((r: any) => r.memory || r.content || '')
      .filter((r: string) => r.length > 0)
      .join('\n\n---\n\n');

    console.log(` Found ${results.length} relevant memories (${combinedResults.length} chars)`);
    return combinedResults;

  } catch (error: any) {
    console.error(' Error searching backend knowledge in Mem0:', error.message);
    return '';
  }
}

/**
 * Delete backend knowledge from Mem0
 */
export async function deleteBackendKnowledge(projectId: string): Promise<boolean> {
  try {
    if (!MEM0_API_KEY) {
      console.warn(' MEM0_API_KEY not set - cannot delete from Mem0');
      return false;
    }

    console.log(` Deleting backend knowledge from Mem0 for project: ${projectId}`);

    // First, get all memories for this user
    const getResponse = await mem0Client.get('/memories/', {
      params: {
        user_id: projectId
      }
    });

    const memories = getResponse.data?.memories || getResponse.data?.results || [];

    // Delete each memory
    for (const memory of memories) {
      const memoryId = memory.id || memory.memory_id;
      if (memoryId) {
        await mem0Client.delete(`/memories/${memoryId}/`, {
          params: { user_id: projectId }
        });
      }
    }

    console.log(` Deleted ${memories.length} memories from Mem0`);
    return true;

  } catch (error: any) {
    console.error(' Error deleting backend knowledge from Mem0:', error.message);
    return false;
  }
}

/**
 * Format backend info for Mem0 storage
 */
export function formatBackendInfoForMem0(backendCode: string): BackendKnowledge {
  // Extract API endpoints
  const endpointMatches = backendCode.match(/(?:router|app)\.(get|post|put|delete|patch)\s*\(\s*['"]([^'"]+)['"]/gi) || [];
  const endpoints = endpointMatches
    .map(m => m.replace(/['"`]/g, ''))
    .slice(0, 20) // Limit to first 20
    .join('\n');

  // Extract authentication info
  const hasJWT = backendCode.includes('jwt') || backendCode.includes('JWT');
  const hasBcrypt = backendCode.includes('bcrypt');
  const authentication = `
- JWT Authentication: ${hasJWT ? 'YES' : 'NO'}
- Password Hashing: ${hasBcrypt ? 'YES' : 'NO'}
- Token Location: localStorage
- Header Format: Authorization: Bearer <token>
`;

  // Extract features
  const features = [
    backendCode.includes('jwt') && 'JWT Authentication',
    backendCode.includes('bcrypt') && 'Password Hashing',
    backendCode.includes('zod') && 'Zod Validation',
    backendCode.includes('joi') && 'Joi Validation',
    backendCode.includes('cors') && 'CORS Enabled',
    backendCode.includes('helmet') && 'Security Headers',
    backendCode.includes('rate-limit') && 'Rate Limiting',
    backendCode.includes('multer') && 'File Upload',
    backendCode.includes('socket.io') && 'WebSocket'
  ]
    .filter(Boolean)
    .join(', ');

  // Extract data models
  const modelMatches = backendCode.match(/(?:const|interface)\s+(\w+)(?:Schema|Model|Interface)/gi) || [];
  const dataModels = modelMatches
    .map(m => m.replace(/(?:const|interface|Schema|Model|Interface)/gi, '').trim())
    .slice(0, 10)
    .join(', ');

  return {
    projectId: `project_${Date.now()}`,
    endpoints: endpoints || 'No endpoints found',
    authentication,
    features: features || 'No features detected',
    dataModels: dataModels || 'No models found',
    baseURL: 'http://localhost:5000',
    apiPrefix: '/api/v1'
  };
}
