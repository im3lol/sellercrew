// SellerCrew V2 - Credit System & Agent Pricing

export const AGENT_CREDITS: Record<string, number> = {
  ali: 0,     // Chief Commander - no cost (routing only)
  raed: 5,    // Product Research
  fares: 10,  // Market Intelligence
  noor: 15,   // Vision Agent
  hakim: 10,  // Listing Strategy
  saleem: 5,  // Compliance
  bayan: 15,  // Copywriter
  nadeem: 10, // SEO Specialist
  rayan: 10,  // Creative Director
  adam: 10,   // Prompt Engineer
  badr: 5,    // QA
};

export const FULL_GENERATION_COST = Object.values(AGENT_CREDITS).reduce((a, b) => a + b, 0); // 95

export const SUBSCRIPTION_PLANS = {
  starter: {
    name: 'Starter',
    price: 29,
    listings: 10,
    credits: 500,
    users: 1,
    features: [
      '10 Listings/month',
      '500 Credits',
      '1 User',
      'Basic AI Agents',
      'Email Support',
    ],
  },
  pro: {
    name: 'Pro',
    price: 79,
    listings: 100,
    credits: 5000,
    users: 5,
    features: [
      '100 Listings/month',
      '5,000 Credits',
      '5 Users',
      'All AI Agents',
      'Competitor Analysis',
      'Image Briefs',
      'Priority Support',
    ],
  },
  agency: {
    name: 'Agency',
    price: 199,
    listings: 500,
    credits: 25000,
    users: 20,
    features: [
      '500 Listings/month',
      '25,000 Credits',
      '20 Users',
      'All AI Agents',
      'Full Compliance Suite',
      'API Access',
      'Dedicated Support',
      'Custom Workflows',
    ],
  },
  enterprise: {
    name: 'Enterprise',
    price: 0, // custom
    listings: -1, // unlimited
    credits: -1,  // unlimited
    users: -1,    // unlimited
    features: [
      'Unlimited Listings',
      'Unlimited Credits',
      'Unlimited Users',
      'Custom Agent Training',
      'Multi-Marketplace',
      'SLA Guarantee',
      'Custom Integrations',
      'On-premise Option',
    ],
  },
} as const;

export type PlanKey = keyof typeof SUBSCRIPTION_PLANS;

export function formatCredits(credits: number): string {
  return credits.toLocaleString();
}

export function getAgentCost(agentId: string): number {
  return AGENT_CREDITS[agentId] ?? 0;
}

export function canAfford(balance: number, agentId: string): boolean {
  return balance >= getAgentCost(agentId);
}

export function canAffordFullGeneration(balance: number): boolean {
  return balance >= FULL_GENERATION_COST;
}
