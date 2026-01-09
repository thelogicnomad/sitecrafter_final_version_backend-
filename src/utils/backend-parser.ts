/**
 * Advanced Backend Code Parser
 * Extracts comprehensive API specification from backend code
 * WITHOUT triggering content filters by sending raw code
 */

export interface APIEndpoint {
  method: string;
  path: string;
  authentication?: boolean;
  requestBody?: any;
  responseFormat?: any;
  validation?: string;
  description?: string;
}

export interface DatabaseModel {
  name: string;
  fields: ModelField[];
  indexes?: string[];
}

export interface ModelField {
  name: string;
  type: string;
  required?: boolean;
  default?: any;
  enum?: string[];
  min?: number;
  max?: number;
  minlength?: number;
  maxlength?: number;
  ref?: string;
}

export interface BackendSpec {
  apiPrefix: string;
  baseURL: string;
  endpoints: APIEndpoint[];
  models: DatabaseModel[];
  authentication: {
    enabled: boolean;
    type?: string;
    tokenLocation?: string;
    headerFormat?: string;
  };
  validation: {
    library?: string;
    schemas?: string[];
  };
  features: string[];
}

/**
 * Parse complete backend code and extract structured specification
 */
export function parseBackendCode(code: string): BackendSpec {
  const spec: BackendSpec = {
    apiPrefix: extractAPIPrefix(code),
    baseURL: 'http://localhost:5000',
    endpoints: extractEndpoints(code),
    models: extractModels(code),
    authentication: extractAuthInfo(code),
    validation: extractValidationInfo(code),
    features: extractFeatures(code)
  };
  
  return spec;
}

/**
 * Extract API prefix (/api, /api/v1, etc.)
 */
function extractAPIPrefix(code: string): string {
  const patterns = [
    /app\.use\(['"]([^'"]*\/api[^'"]*)['"]/i,
    /router\.use\(['"]([^'"]*\/api[^'"]*)['"]/i,
    /prefix:\s*['"]([^'"]*\/api[^'"]*)['"]/i,
  ];
  
  for (const pattern of patterns) {
    const match = code.match(pattern);
    if (match) return match[1];
  }
  
  return '/api/v1'; // Default
}

/**
 * Extract all API endpoints with details
 */
function extractEndpoints(code: string): APIEndpoint[] {
  const endpoints: APIEndpoint[] = [];
  
  // Pattern: router.method('path', middleware, controller)
  const routePattern = /(?:router|app)\.(get|post|put|patch|delete)\s*\(\s*['"]([^'"]+)['"]\s*(?:,\s*([^)]+))?\)/gi;
  
  let match;
  while ((match = routePattern.exec(code)) !== null) {
    const method = match[1].toUpperCase();
    const path = match[2];
    const middlewareAndController = match[3] || '';
    
    const endpoint: APIEndpoint = {
      method,
      path,
      authentication: middlewareAndController.includes('auth') || middlewareAndController.includes('protect'),
      validation: extractValidationForRoute(code, path),
    };
    
    // Try to extract request/response format
    endpoint.requestBody = extractRequestBodySchema(code, path, method);
    endpoint.responseFormat = extractResponseFormat(code, path);
    
    endpoints.push(endpoint);
  }
  
  return endpoints;
}

/**
 * Extract Mongoose models with complete schema details
 */
function extractModels(code: string): DatabaseModel[] {
  const models: DatabaseModel[] = [];
  
  // Find all schema definitions
  const schemaPattern = /const\s+(\w+)Schema\s*=\s*new\s+(?:mongoose\.)?Schema\s*\(\s*\{([^}]+)\}/gi;
  
  let match;
  while ((match = schemaPattern.exec(code)) !== null) {
    const schemaName = match[1];
    const modelName = schemaName.replace('Schema', '');
    const schemaBody = match[2];
    
    const fields = parseSchemaFields(schemaBody);
    
    models.push({
      name: modelName,
      fields
    });
  }
  
  return models;
}

/**
 * Parse Mongoose schema fields
 */
function parseSchemaFields(schemaBody: string): ModelField[] {
  const fields: ModelField[] = [];
  
  // Split by commas that are not inside brackets/braces
  const fieldLines = schemaBody.split(/,(?![^{]*})/);
  
  for (const line of fieldLines) {
    const fieldMatch = line.match(/(\w+)\s*:\s*(\{[^}]+\}|String|Number|Boolean|Date|ObjectId|Array|\[.*?\])/);
    if (!fieldMatch) continue;
    
    const fieldName = fieldMatch[1].trim();
    const fieldDef = fieldMatch[2];
    
    const field: ModelField = {
      name: fieldName,
      type: 'string'
    };
    
    // Parse field type
    if (fieldDef.includes('String')) field.type = 'string';
    else if (fieldDef.includes('Number')) field.type = 'number';
    else if (fieldDef.includes('Boolean')) field.type = 'boolean';
    else if (fieldDef.includes('Date')) field.type = 'Date';
    else if (fieldDef.includes('ObjectId')) {
      field.type = 'ObjectId';
      const refMatch = fieldDef.match(/ref:\s*['"](\w+)['"]/);
      if (refMatch) field.ref = refMatch[1];
    }
    else if (fieldDef.includes('[') || fieldDef.includes('Array')) field.type = 'array';
    
    // Parse constraints
    if (fieldDef.includes('required: true')) field.required = true;
    
    const defaultMatch = fieldDef.match(/default:\s*([^,}]+)/);
    if (defaultMatch) field.default = defaultMatch[1].trim();
    
    const minMatch = fieldDef.match(/min:\s*(\d+)/);
    if (minMatch) field.min = parseInt(minMatch[1]);
    
    const maxMatch = fieldDef.match(/max:\s*(\d+)/);
    if (maxMatch) field.max = parseInt(maxMatch[1]);
    
    const minlengthMatch = fieldDef.match(/minlength:\s*(\d+)/);
    if (minlengthMatch) field.minlength = parseInt(minlengthMatch[1]);
    
    const maxlengthMatch = fieldDef.match(/maxlength:\s*(\d+)/);
    if (maxlengthMatch) field.maxlength = parseInt(maxlengthMatch[1]);
    
    const enumMatch = fieldDef.match(/enum:\s*\[([^\]]+)\]/);
    if (enumMatch) {
      field.enum = enumMatch[1].split(',').map(v => v.trim().replace(/['"]/g, ''));
    }
    
    fields.push(field);
  }
  
  return fields;
}

/**
 * Extract authentication information
 */
function extractAuthInfo(code: string): BackendSpec['authentication'] {
  const hasAuth = code.includes('jwt') || code.includes('JWT') || code.includes('jsonwebtoken');
  const hasBcrypt = code.includes('bcrypt');
  
  let headerFormat = 'Bearer';
  const headerMatch = code.match(/authorization['"]\]?\.split\(['"](\w+)\s/i);
  if (headerMatch) headerFormat = headerMatch[1];
  
  return {
    enabled: hasAuth,
    type: hasAuth ? 'JWT' : undefined,
    tokenLocation: 'localStorage',
    headerFormat: `${headerFormat} <token>`
  };
}

/**
 * Extract validation library info
 */
function extractValidationInfo(code: string): BackendSpec['validation'] {
  let library;
  if (code.includes('zod') || code.includes('z.')) library = 'Zod';
  else if (code.includes('joi') || code.includes('Joi.')) library = 'Joi';
  
  return { library };
}

/**
 * Extract validation for specific route
 */
function extractValidationForRoute(code: string, path: string): string | undefined {
  // Look for validation schemas near the route definition
  const routeSection = code.substring(Math.max(0, code.indexOf(path) - 500), code.indexOf(path) + 500);
  
  if (routeSection.includes('z.object') || routeSection.includes('Joi.object')) {
    return 'Schema validation present';
  }
  
  return undefined;
}

/**
 * Extract request body schema for endpoint
 */
function extractRequestBodySchema(code: string, path: string, method: string): any {
  // This is a simplified version - could be enhanced
  if (method === 'POST' || method === 'PUT' || method === 'PATCH') {
    return { type: 'object', description: 'See backend validation schema' };
  }
  return undefined;
}

/**
 * Extract response format
 */
function extractResponseFormat(code: string, path: string): any {
  // Look for res.json patterns near the route
  const routeSection = code.substring(code.indexOf(path), code.indexOf(path) + 1000);
  
  if (routeSection.includes('res.json({ success:')) {
    return { success: 'boolean', data: 'any', message: 'string?' };
  }
  
  return { data: 'any' };
}

/**
 * Extract backend features
 */
function extractFeatures(code: string): string[] {
  const features: string[] = [];
  
  if (code.includes('jwt') || code.includes('JWT')) features.push('JWT Authentication');
  if (code.includes('bcrypt')) features.push('Password Hashing');
  if (code.includes('zod') || code.includes('Zod')) features.push('Zod Validation');
  if (code.includes('joi') || code.includes('Joi')) features.push('Joi Validation');
  if (code.includes('multer')) features.push('File Upload');
  if (code.includes('socket.io')) features.push('WebSocket/Socket.io');
  if (code.includes('nodemailer')) features.push('Email Sending');
  if (code.includes('stripe')) features.push('Stripe Payment');
  if (code.includes('cors')) features.push('CORS Enabled');
  if (code.includes('helmet')) features.push('Security Headers');
  if (code.includes('rate-limit') || code.includes('rateLimit')) features.push('Rate Limiting');
  
  return features;
}

/**
 * Generate human-readable API specification
 */
export function generateAPISpecification(spec: BackendSpec): string {
  let output = `
# 🔗 BACKEND API SPECIFICATION

## Base Configuration
- **Base URL**: ${spec.baseURL}
- **API Prefix**: ${spec.apiPrefix}
- **Full API URL**: ${spec.baseURL}${spec.apiPrefix}

## 🔐 Authentication
- **Enabled**: ${spec.authentication.enabled ? 'YES' : 'NO'}
${spec.authentication.enabled ? `- **Type**: ${spec.authentication.type}
- **Token Storage**: ${spec.authentication.tokenLocation}
- **Header Format**: \`Authorization: ${spec.authentication.headerFormat}\`` : ''}

## ✨ Features
${spec.features.map(f => `- ${f}`).join('\n')}

## 📊 Database Models

${spec.models.map(model => `
### ${model.name}

**TypeScript Interface:**
\`\`\`typescript
export interface ${model.name} {
  _id: string;
${model.fields.map(f => {
  let tsType = f.type;
  if (f.type === 'ObjectId' && f.ref) tsType = `${f.ref}['_id'] | ${f.ref}`;
  else if (f.type === 'Date') tsType = 'string | Date';
  else if (f.type === 'array') tsType = 'any[]';
  
  const optional = f.required ? '' : '?';
  const comment = [];
  if (f.required) comment.push('Required');
  if (f.min !== undefined) comment.push(`Min: ${f.min}`);
  if (f.max !== undefined) comment.push(`Max: ${f.max}`);
  if (f.minlength !== undefined) comment.push(`MinLength: ${f.minlength}`);
  if (f.maxlength !== undefined) comment.push(`MaxLength: ${f.maxlength}`);
  if (f.enum) comment.push(`Enum: ${f.enum.join(' | ')}`);
  if (f.default !== undefined) comment.push(`Default: ${f.default}`);
  
  const commentStr = comment.length > 0 ? ` // ${comment.join(', ')}` : '';
  return `  ${f.name}${optional}: ${tsType};${commentStr}`;
}).join('\n')}
  createdAt?: string | Date;
  updatedAt?: string | Date;
}
\`\`\`

**Model Fields:**
${model.fields.map(f => {
  const constraints = [];
  if (f.required) constraints.push('**Required**');
  if (f.default !== undefined) constraints.push(`Default: \`${f.default}\``);
  if (f.min !== undefined) constraints.push(`Min: ${f.min}`);
  if (f.max !== undefined) constraints.push(`Max: ${f.max}`);
  if (f.minlength !== undefined) constraints.push(`MinLength: ${f.minlength}`);
  if (f.maxlength !== undefined) constraints.push(`MaxLength: ${f.maxlength}`);
  if (f.enum) constraints.push(`Enum: \`${f.enum.join('` | `')}\``);
  if (f.ref) constraints.push(`Ref: \`${f.ref}\``);
  
  return `- **${f.name}**: \`${f.type}\` ${constraints.length > 0 ? '- ' + constraints.join(', ') : ''}`;
}).join('\n')}
`).join('\n')}

## 🛣️ API Endpoints

${spec.endpoints.map(ep => `
### ${ep.method} ${ep.path}

**Full URL**: \`${ep.method} ${spec.baseURL}${spec.apiPrefix}${ep.path}\`

${ep.authentication ? '**🔒 Authentication Required**: YES (Include JWT token in Authorization header)' : '**🔒 Authentication Required**: NO'}

${ep.validation ? `**✅ Validation**: ${ep.validation}` : ''}

**Request Example:**
\`\`\`typescript
// src/api/[resource].ts
export const ${generateFunctionName(ep.method, ep.path)} = ${generateFunctionSignature(ep)} => 
  apiClient.${ep.method.toLowerCase()}${generateAxiosCall(ep)};
\`\`\`

**Usage Example:**
\`\`\`typescript
const response = await ${generateFunctionName(ep.method, ep.path)}(${generateFunctionArgs(ep)});
console.log(response.data);
\`\`\`
`).join('\n')}

## 🎯 Complete Integration Example

### Step 1: Create API Client

\`\`\`typescript
// src/api/client.ts
import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '${spec.baseURL}${spec.apiPrefix}',
  headers: {
    'Content-Type': 'application/json'
  }
});

${spec.authentication.enabled ? `
// Add authentication interceptor
apiClient.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = \`${spec.authentication.headerFormat?.replace('<token>', '${token}')}\`;
  }
  return config;
});` : ''}

export default apiClient;
\`\`\`

### Step 2: Create API Services

Create a service file for each model with all CRUD operations.

### Step 3: Create TypeScript Interfaces

Copy the interfaces from the "Database Models" section above into \`src/types/index.ts\`.

### Step 4: Use in Components

Always use try/catch, loading states, and error handling when calling APIs.

---

## ⚠️ CRITICAL INTEGRATION RULES

1. **USE EXACT URLS**: \`${spec.baseURL}${spec.apiPrefix}\` + endpoint path
2. **MATCH TYPES**: Use the TypeScript interfaces provided above
3. **HANDLE AUTH**: ${spec.authentication.enabled ? `Add \`Authorization: ${spec.authentication.headerFormat}\` header for protected routes` : 'No auth required'}
4. **VALIDATE DATA**: Match the field constraints (required, min, max, etc.)
5. **NO MOCK DATA**: Fetch everything from backend
6. **ERROR HANDLING**: Always use try/catch and show errors to user
7. **LOADING STATES**: Show loading indicators while fetching
8. **ENV FILE**: Create \`.env\` with \`VITE_API_URL=${spec.baseURL}\`

`;

  return output;
}

function generateFunctionName(method: string, path: string): string {
  const parts = path.split('/').filter(p => p && !p.startsWith(':'));
  const resource = parts[parts.length - 1] || parts[parts.length - 2] || 'resource';
  
  if (method === 'GET' && path.includes(':')) return `get${capitalize(resource)}ById`;
  if (method === 'GET') return `get${capitalize(resource)}${path.endsWith('s') ? '' : 's'}`;
  if (method === 'POST') return `create${capitalize(resource)}`;
  if (method === 'PUT') return `update${capitalize(resource)}`;
  if (method === 'PATCH') return `update${capitalize(resource)}`;
  if (method === 'DELETE') return `delete${capitalize(resource)}`;
  
  return `${method.toLowerCase()}${capitalize(resource)}`;
}

function generateFunctionSignature(ep: APIEndpoint): string {
  if (ep.path.includes(':id')) {
    if (ep.method === 'GET' || ep.method === 'DELETE') {
      return '(id: string)';
    } else {
      return '(id: string, data: any)';
    }
  } else if (ep.method === 'POST' || ep.method === 'PUT' || ep.method === 'PATCH') {
    return '(data: any)';
  }
  return '()';
}

function generateAxiosCall(ep: APIEndpoint): string {
  const path = ep.path.replace(':id', '${id}');
  
  if (ep.path.includes(':id')) {
    if (ep.method === 'GET' || ep.method === 'DELETE') {
      return `<any>(\`${path}\`)`;
    } else {
      return `<any>(\`${path}\`, data)`;
    }
  } else if (ep.method === 'POST' || ep.method === 'PUT' || ep.method === 'PATCH') {
    return `<any>('${path}', data)`;
  }
  return `<any>('${path}')`;
}

function generateFunctionArgs(ep: APIEndpoint): string {
  if (ep.path.includes(':id')) {
    if (ep.method === 'GET' || ep.method === 'DELETE') {
      return "'123'";
    } else {
      return "'123', { /* data */ }";
    }
  } else if (ep.method === 'POST' || ep.method === 'PUT' || ep.method === 'PATCH') {
    return '{ /* data */ }';
  }
  return '';
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
