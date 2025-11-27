export type ProviderType = 'claude' | 'codex' | 'gemini' | 'cursor';

export type SystemPromptMode = 'append' | 'replace';

export type AgentSource = 'imported' | 'custom' | 'builtin';

export interface AgentDefinition {
    id: string; // Unique identifier
    name: string; // Display name
    description: string; // When to invoke
    tools: string[]; // Tool permissions
    systemPrompt: string; // Agent instructions
    source: AgentSource; // Where it came from
    provider: ProviderType | 'all'; // Which provider(s) it works with
    category?: string; // Optional category for organization
    createdAt: number; // Timestamp when created
    updatedAt: number; // Timestamp when last updated
}

export interface ProviderSystemPromptConfig {
    mode: SystemPromptMode; // 'append' or 'replace'
    content: string; // The system prompt text
    enabled: boolean; // Whether this config is active
}

export interface ProviderConfig {
    systemPrompt?: ProviderSystemPromptConfig; // System prompt configuration
    defaultAgentId?: string | null; // Default agent to use for this provider
    enabledAgents: string[]; // List of enabled agent IDs
}

export interface ProviderSettings {
    // Global defaults
    global: {
        systemPrompt?: ProviderSystemPromptConfig;
        defaultAgentId?: string | null;
    };
    // Per-provider overrides
    providers: {
        claude?: ProviderConfig;
        codex?: ProviderConfig;
        gemini?: ProviderConfig;
        cursor?: ProviderConfig;
    };
    // All agents (shared across providers)
    agents: Record<string, AgentDefinition>;
}


