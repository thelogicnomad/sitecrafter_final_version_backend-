export interface WorkflowNode {
  id: string;
  type: 'client' | 'server' | 'database' | 'api' | 'service' | 'integration' | 'auth' | 'page' | 'component';
  label: string;
  category: 'Frontend' | 'Backend' | 'Database' | 'Integration' | 'Auth';
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  label: string;
  type?: 'http' | 'websocket' | 'database' | 'event';
}

export interface DetailedContext {
  projectOverview: string;
  implementationPrompt: string;
  architectureExplanation?: string;
  nodeDetails?: Record<string, {
    fullName: string;
    purpose: string;
    responsibilities: string[];
    implementation: string;
    dependencies: string[];
    apis?: string[];
    dataFlow: string;
  }>;
  edgeDetails?: Record<string, {
    description: string;
    dataFormat: string;
    protocol: string;
    errorHandling: string;
  }>;
  fileStructure?: any;
  databaseSchema?: any;
  apiSpecification?: any;
  componentSpecification?: any;
  integrations?: any[];
  authentication?: any;
  deployment?: any;
}

export interface PlanningPhase {
  phase: string;
  tasks: string[];
  reasoning: string;
  dependencies?: string[];
  duration?: string;
}

export interface ProjectBlueprint {
  projectName: string;
  description: string;
  projectType: 'frontend' | 'backend' | 'fullstack';
  techStack: {
    frontend: string[];
    backend: string[];
    database: string[];
    external: string[];
  };
  features: string[];
  workflow: {
    nodes: WorkflowNode[];
    edges: WorkflowEdge[];
  };
  detailedContext: string; // For frontend/backend only projects
  backendContext?: string; // For fullstack projects - backend generation
  frontendContext?: string; // For fullstack projects - frontend generation  
  phases?: PlanningPhase[];
}

export interface PlanningResponse {
  success: boolean;
  data?: {
    blueprint: ProjectBlueprint;
    rawOutput: string;
  };
  error?: string;
}
