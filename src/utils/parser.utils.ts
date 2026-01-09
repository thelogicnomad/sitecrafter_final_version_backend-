import type { ProjectBlueprint } from '../types/planning.types';

export class OutputParser {
  static extractProjectBlueprint(text: string): ProjectBlueprint | null {
    console.log('🔍 Starting smart extraction (regex-based)...');
    
    try {
      // Use regex to extract components separately - more reliable!
      const blueprint: any = {};
      
      // Extract basic fields
      blueprint.projectName = this.extractField(text, 'projectName') || 'Generated Project';
      blueprint.description = this.extractField(text, 'description') || 'Generated application';
      
      // Extract tech stack
      blueprint.techStack = this.extractTechStack(text);
      
      // Extract features array
      blueprint.features = this.extractFeatures(text);
      
      // Extract workflow (nodes and edges) - CRITICAL
      blueprint.workflow = this.extractWorkflow(text);
      
      if (!blueprint.workflow || !blueprint.workflow.nodes || blueprint.workflow.nodes.length === 0) {
        console.error('❌ Failed to extract workflow nodes');
        return null;
      }
      
      // Extract detailedContext - NO PARSING, just extract the string as-is
      blueprint.detailedContext = this.extractDetailedContext(text);
      
      console.log('✅ Successfully extracted blueprint using regex');
      console.log(`   - Nodes: ${blueprint.workflow.nodes.length}`);
      console.log(`   - Edges: ${blueprint.workflow.edges.length}`);
      console.log(`   - detailedContext length: ${blueprint.detailedContext.length} chars`);
      
      return blueprint as ProjectBlueprint;
      
    } catch (error: any) {
      console.error('❌ Regex extraction failed:', error.message);
      
      // Fallback to old JSON parsing
      return this.fallbackJSONParse(text);
    }
  }
  
  private static extractField(text: string, fieldName: string): string | null {
    const regex = new RegExp(`"${fieldName}"\\s*:\\s*"([^"]*)"`, 'i');
    const match = text.match(regex);
    return match ? match[1] : null;
  }
  
  private static extractTechStack(text: string): any {
    const techStack: any = {
      frontend: [],
      backend: [],
      database: [],
      external: []
    };
    
    // Extract frontend array
    const frontendMatch = text.match(/"frontend"\s*:\s*\[([\s\S]*?)\]/);
    if (frontendMatch) {
      techStack.frontend = this.parseStringArray(frontendMatch[1]);
    }
    
    // Extract backend array
    const backendMatch = text.match(/"backend"\s*:\s*\[([\s\S]*?)\]/);
    if (backendMatch) {
      techStack.backend = this.parseStringArray(backendMatch[1]);
    }
    
    // Extract database array
    const databaseMatch = text.match(/"database"\s*:\s*\[([\s\S]*?)\]/);
    if (databaseMatch) {
      techStack.database = this.parseStringArray(databaseMatch[1]);
    }
    
    return techStack;
  }
  
  private static extractFeatures(text: string): string[] {
    const match = text.match(/"features"\s*:\s*\[([\s\S]*?)\]/);
    if (!match) return [];
    return this.parseStringArray(match[1]);
  }
  
  private static parseStringArray(arrayContent: string): string[] {
    const items = arrayContent.match(/"([^"]*)"/g);
    if (!items) return [];
    return items.map(item => item.replace(/"/g, ''));
  }
  
  private static extractWorkflow(text: string): any {
    const workflow: any = {
      nodes: [],
      edges: []
    };
    
    // Extract nodes array
    const nodesMatch = text.match(/"nodes"\s*:\s*\[([\s\S]*?)\]/);
    if (nodesMatch) {
      workflow.nodes = this.extractNodes(nodesMatch[1]);
    }
    
    // Extract edges array
    const edgesMatch = text.match(/"edges"\s*:\s*\[([\s\S]*?)\]/);
    if (edgesMatch) {
      workflow.edges = this.extractEdges(edgesMatch[1]);
    }
    
    return workflow;
  }
  
  private static extractNodes(nodesText: string): any[] {
    const nodes: any[] = [];
    // Match each node object
    const nodeRegex = /\{[^}]*"id"\s*:\s*"([^"]*)"[^}]*"type"\s*:\s*"([^"]*)"[^}]*"label"\s*:\s*"([^"]*)"[^}]*"category"\s*:\s*"([^"]*)"\s*\}/g;
    
    let match;
    while ((match = nodeRegex.exec(nodesText)) !== null) {
      nodes.push({
        id: match[1],
        type: match[2],
        label: match[3],
        category: match[4]
      });
    }
    
    return nodes;
  }
  
  private static extractEdges(edgesText: string): any[] {
    const edges: any[] = [];
    // Match each edge object
    const edgeRegex = /\{[^}]*"id"\s*:\s*"([^"]*)"[^}]*"source"\s*:\s*"([^"]*)"[^}]*"target"\s*:\s*"([^"]*)"[^}]*(?:"label"\s*:\s*"([^"]*)")?[^}]*(?:"type"\s*:\s*"([^"]*)")?\s*\}/g;
    
    let match;
    while ((match = edgeRegex.exec(edgesText)) !== null) {
      const edge: any = {
        id: match[1],
        source: match[2],
        target: match[3]
      };
      if (match[4]) edge.label = match[4];
      if (match[5]) edge.type = match[5];
      edges.push(edge);
    }
    
    return edges;
  }
  
  private static extractDetailedContext(text: string): string {
    // Find detailedContext using regex - extract everything between the quotes
    // This is lenient and won't fail on formatting issues
    const match = text.match(/"detailedContext"\s*:\s*"((?:[^"\\]|\\.)*)"/);
    
    if (match && match[1]) {
      // Unescape basic sequences but keep as-is otherwise
      return match[1]
        .replace(/\\n/g, ' ')
        .replace(/\\t/g, ' ')
        .replace(/\\"/g, '"')
        .replace(/\\\\/g, '\\')
        .trim();
    }
    
    // Fallback: try to find any long text that might be detailedContext
    const fallbackMatch = text.match(/"detailedContext"\s*:\s*"([^"]*)"/);
    if (fallbackMatch) {
      return fallbackMatch[1];
    }
    
    return 'No detailed context found - please regenerate blueprint';
  }
  
  private static fallbackJSONParse(text: string): ProjectBlueprint | null {
    console.log('⚠️ Trying fallback JSON parsing...');
    
    // Try direct parsing first
    let result = this.tryParse(text, 'raw text');
    if (result) return result;
    
    // Remove code blocks and try again
    let cleaned = this.removeCodeBlocks(text);
    result = this.tryParse(cleaned, 'after removing code blocks');
    if (result) return result;
    
    console.error('Fallback parsing also failed');
    return null;
  }

  private static removeCodeBlocks(text: string): string {
    let result = text.replace(/```json\s*/gi, '');
    result = result.replace(/```\s*/g, '');
    return result.trim();
  }

  private static extractJSONBoundary(text: string): string {
    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');
    
    if (firstBrace === -1 || lastBrace === -1 || firstBrace >= lastBrace) {
      return text;
    }
    
    return text.substring(firstBrace, lastBrace + 1);
  }

  // NEW: Critical method to fix line breaks in strings
  private static fixStringLineBreaks(text: string): string {
    // This regex finds strings with literal line breaks and fixes them
    // It handles both the opening quote and closing quote scenarios
    
    // First pass: fix obvious broken strings (word split across lines)
    text = text.replace(/(\w+)\s*\n\s*(\w+)/g, (match, word1, word2) => {
      // Check if this looks like a broken word (no punctuation between)
      if (match.includes(':') || match.includes(',') || match.includes('{') || match.includes('}')) {
        return match; // Don't fix structural elements
      }
      return `${word1}${word2}`; // Merge broken words
    });

    // Second pass: fix line breaks within quoted strings
    let inString = false;
    let result = '';
    let currentQuote = '';
    
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const prevChar = i > 0 ? text[i - 1] : '';
      
      // Track if we're inside a string
      if ((char === '"' || char === "'") && prevChar !== '\\') {
        if (!inString) {
          inString = true;
          currentQuote = char;
        } else if (char === currentQuote) {
          inString = false;
          currentQuote = '';
        }
      }
      
      // If we're in a string and hit a newline, replace with \n
      if (inString && char === '\n') {
        result += '\\n';
      } else if (inString && char === '\r') {
        // Skip carriage returns
        continue;
      } else if (inString && char === '\t') {
        result += '\\t';
      } else {
        result += char;
      }
    }
    
    return result;
  }

  private static aggressiveClean(text: string): string {
    // First fix line breaks in strings
    text = this.fixStringLineBreaks(text);
    
    return text
      .replace(/\/\/.*$/gm, '') // Remove comments
      .replace(/\/\*[\s\S]*?\*\//g, '') // Remove block comments
      .replace(/,(\s*[}\]])/g, '$1') // Remove trailing commas
      .replace(/(['"])?([a-zA-Z0-9_]+)(['"])?:/g, '"$2":') // Fix unquoted keys
      .trim();
  }

  private static fixCommonErrors(text: string): string {
    // Fix line breaks first
    text = this.fixStringLineBreaks(text);
    
    return text
      .replace(/,(\s*[}\]])/g, '$1') // Trailing commas
      .replace(/'/g, '"') // Single to double quotes
      .replace(/\/\/.*$/gm, '') // Comments
      .replace(/\/\*[\s\S]*?\*\//g, '') // Block comments
      .replace(/}\s*{/g, '},{') // Missing commas between objects
      .replace(/]\s*\[/g, '],[') // Missing commas between arrays
      .replace(/[\x00-\x1F\x7F]/g, '') // Control characters (except \n which is now \\n)
      .trim();
  }

  private static repairJSON(text: string): string {
    let json = this.extractJSONBoundary(text);
    json = this.fixStringLineBreaks(json);
    json = this.fixCommonErrors(json);
    
    // Balance braces
    const openBraces = (json.match(/{/g) || []).length;
    const closeBraces = (json.match(/}/g) || []).length;
    
    if (openBraces > closeBraces) {
      json += '}'.repeat(openBraces - closeBraces);
    }
    
    // Balance brackets
    const openBrackets = (json.match(/\[/g) || []).length;
    const closeBrackets = (json.match(/]/g) || []).length;
    
    if (openBrackets > closeBrackets) {
      json += ']'.repeat(openBrackets - closeBrackets);
    }
    
    return json;
  }

  private static tryParse(jsonString: string, strategy: string): ProjectBlueprint | null {
    try {
      const parsed = JSON.parse(jsonString);
      
      if (this.validateBlueprint(parsed)) {
        console.log(`✅ Successfully parsed ${strategy}`);
        return parsed as ProjectBlueprint;
      } else {
        console.warn(`⚠️ Parsed ${strategy} but validation failed`);
        return null;
      }
    } catch (error: any) {
      console.warn(`❌ Failed to parse ${strategy}:`, error.message);
      return null;
    }
  }

  private static sanitizeDetailedContext(text: string): string {
    // Remove any literal newlines, tabs, and control characters
    // Keep only the escaped versions that are valid in JSON strings
    return text
      .replace(/\r\n/g, ' ') // Replace Windows line breaks with space
      .replace(/\n/g, ' ')   // Replace Unix line breaks with space  
      .replace(/\r/g, ' ')   // Replace carriage returns with space
      .replace(/\t/g, ' ')   // Replace tabs with space
      .replace(/[\x00-\x1F\x7F]/g, '') // Remove other control characters
      .replace(/\s+/g, ' ')  // Collapse multiple spaces
      .trim();
  }

  private static validateBlueprint(obj: any): boolean {
    if (!obj || typeof obj !== 'object') {
      console.warn('❌ Not an object');
      return false;
    }

    if (!obj.projectName || typeof obj.projectName !== 'string') {
      console.warn('❌ Missing or invalid projectName');
      return false;
    }

    if (!obj.workflow || typeof obj.workflow !== 'object') {
      console.warn('❌ Missing or invalid workflow');
      return false;
    }

    if (!obj.workflow.nodes || !Array.isArray(obj.workflow.nodes)) {
      console.warn('❌ Missing or invalid workflow.nodes');
      return false;
    }

    if (obj.workflow.nodes.length === 0) {
      console.warn('❌ Empty workflow.nodes array');
      return false;
    }

    if (!obj.workflow.edges || !Array.isArray(obj.workflow.edges)) {
      console.warn('❌ Missing or invalid workflow.edges');
      return false;
    }

    // Validate node structure
    const hasValidNodes = obj.workflow.nodes.every((node: any, index: number) => {
      const valid = node.id && node.type && node.label && node.category;
      if (!valid) {
        console.warn(`❌ Invalid node at index ${index}:`, JSON.stringify(node).slice(0, 100));
      }
      return valid;
    });

    if (!hasValidNodes) {
      console.warn('❌ Some nodes have invalid structure');
      return false;
    }

    // Validate edge structure
    const hasValidEdges = obj.workflow.edges.every((edge: any, index: number) => {
      const valid = edge.id && edge.source && edge.target;
      if (!valid) {
        console.warn(`❌ Invalid edge at index ${index}:`, JSON.stringify(edge).slice(0, 100));
      }
      return valid;
    });

    if (!hasValidEdges) {
      console.warn('❌ Some edges have invalid structure');
      return false;
    }

    // Ensure detailedContext exists as a string
    if (!obj.detailedContext || typeof obj.detailedContext !== 'string') {
      console.warn('⚠️ Missing or invalid detailedContext, creating default');
      obj.detailedContext = 'No detailed implementation context provided.';
    } else {
      // Sanitize detailedContext: ensure it doesn't have literal newlines that break JSON
      const originalLength = obj.detailedContext.length;
      obj.detailedContext = this.sanitizeDetailedContext(obj.detailedContext);
      if (obj.detailedContext.length !== originalLength) {
        console.log(`✅ Sanitized detailedContext (${originalLength} → ${obj.detailedContext.length} chars)`);
      }
    }
    
    // Validate that detailedContext is comprehensive (at least 500 chars)
    if (obj.detailedContext.length < 500) {
      console.warn('⚠️ detailedContext seems too short, might be incomplete');
    }

    console.log('✅ Blueprint structure validated successfully');
    console.log(`   - Nodes: ${obj.workflow.nodes.length}`);
    console.log(`   - Edges: ${obj.workflow.edges.length}`);
    return true;
  }
}