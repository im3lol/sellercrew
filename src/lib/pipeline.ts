// SellerCrew V2 - AI Agent Pipeline (LangGraph-style Flow)

export type AgentStatus = 'idle' | 'running' | 'completed' | 'failed' | 'skipped';

export interface PipelineStep {
  agentId: string;
  agentName: string;
  status: AgentStatus;
  input?: string;
  output?: string;
  startedAt?: Date;
  finishedAt?: Date;
  duration?: number;
  tokens?: number;
  cost?: number;
}

export interface PipelineRun {
  id: string;
  projectId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  steps: PipelineStep[];
  currentStep: number;
  startedAt?: Date;
  finishedAt?: Date;
  totalCost: number;
  totalTokens: number;
}

// The complete agent pipeline flow - Ali coordinates, then agents run in sequence
export const AGENT_PIPELINE = [
  { id: 'ali', name: 'Ali', role: 'Task Routing & Coordination', credits: 0 },
  { id: 'raed', name: 'Raed', role: 'Product Research', credits: 5 },
  { id: 'fares', name: 'Fares', role: 'Market Intelligence', credits: 10 },
  { id: 'noor', name: 'Noor', role: 'Vision Analysis', credits: 15 },
  { id: 'hakim', name: 'Hakim', role: 'Listing Strategy', credits: 10 },
  { id: 'saleem', name: 'Saleem', role: 'Compliance Check', credits: 5 },
  { id: 'bayan', name: 'Bayan', role: 'Copywriting', credits: 15 },
  { id: 'nadeem', name: 'Nadeem', role: 'SEO Optimization', credits: 10 },
  { id: 'rayan', name: 'Rayan', role: 'Creative Direction', credits: 10 },
  { id: 'adam', name: 'Adam', role: 'Prompt Engineering', credits: 10 },
  { id: 'badr', name: 'Badr', role: 'QA Review', credits: 5 },
  { id: 'ali', name: 'Ali', role: 'Final Assembly & Review', credits: 0 },
];

export function createPipelineRun(projectId: string): PipelineRun {
  return {
    id: `run-${Date.now()}`,
    projectId,
    status: 'pending',
    steps: AGENT_PIPELINE.map((agent) => ({
      agentId: agent.id,
      agentName: agent.name,
      status: 'idle' as AgentStatus,
      cost: agent.credits,
    })),
    currentStep: 0,
    totalCost: 0,
    totalTokens: 0,
  };
}

export function advancePipeline(run: PipelineRun): PipelineRun {
  const currentStep = run.steps[run.currentStep];
  if (!currentStep) return run;

  return {
    ...run,
    steps: run.steps.map((step, i) => {
      if (i === run.currentStep && step.status === 'idle') {
        return { ...step, status: 'running' as AgentStatus, startedAt: new Date() };
      }
      if (i === run.currentStep && step.status === 'running') {
        return {
          ...step,
          status: 'completed' as AgentStatus,
          finishedAt: new Date(),
          duration: Math.floor(Math.random() * 5000) + 1000,
          tokens: Math.floor(Math.random() * 2000) + 500,
        };
      }
      return step;
    }),
    totalCost: run.steps
      .filter((s) => s.status === 'completed')
      .reduce((acc, s) => acc + (s.cost ?? 0), 0),
    totalTokens: run.steps
      .filter((s) => s.status === 'completed')
      .reduce((acc, s) => acc + (s.tokens ?? 0), 0),
  };
}

export function getPipelineProgress(run: PipelineRun): number {
  const completed = run.steps.filter((s) => s.status === 'completed').length;
  return Math.round((completed / run.steps.length) * 100);
}
