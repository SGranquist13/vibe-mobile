import * as z from 'zod';
import type { ProviderSettings, AgentDefinition, ProviderSystemPromptConfig, ProviderConfig, ProviderType, SystemPromptMode, AgentSource } from '@/types/providerSettings';

//
// Schema
//

const SystemPromptModeSchema = z.enum(['append', 'replace']);

const AgentSourceSchema = z.enum(['imported', 'custom', 'builtin']);

const ProviderTypeSchema = z.enum(['claude', 'codex', 'gemini', 'cursor']);

const ProviderSystemPromptConfigSchema = z.object({
    mode: SystemPromptModeSchema,
    content: z.string(),
    enabled: z.boolean(),
}).optional();

const AgentDefinitionSchema = z.object({
    id: z.string(),
    name: z.string(),
    description: z.string(),
    tools: z.array(z.string()),
    systemPrompt: z.string(),
    source: AgentSourceSchema,
    provider: z.union([ProviderTypeSchema, z.literal('all')]),
    category: z.string().optional(),
    createdAt: z.number(),
    updatedAt: z.number(),
});

const ProviderConfigSchema = z.object({
    systemPrompt: ProviderSystemPromptConfigSchema,
    defaultAgentId: z.string().nullable().optional(),
    enabledAgents: z.array(z.string()),
}).optional();

const ProviderSettingsSchema = z.object({
    global: z.object({
        systemPrompt: ProviderSystemPromptConfigSchema,
        defaultAgentId: z.string().nullable().optional(),
    }),
    providers: z.object({
        claude: ProviderConfigSchema,
        codex: ProviderConfigSchema,
        gemini: ProviderConfigSchema,
        cursor: ProviderConfigSchema,
    }),
    agents: z.record(z.string(), AgentDefinitionSchema),
});

const ProviderSettingsSchemaPartial = ProviderSettingsSchema.loose().partial();

export type ProviderSettingsType = z.infer<typeof ProviderSettingsSchema>;

//
// Defaults
//

export const providerSettingsDefaults: ProviderSettings = {
    global: {
        systemPrompt: undefined,
        defaultAgentId: null,
    },
    providers: {
        claude: undefined,
        codex: undefined,
        gemini: undefined,
        cursor: undefined,
    },
    agents: {},
};

Object.freeze(providerSettingsDefaults);

//
// Parsing
//

export function providerSettingsParse(settings: unknown): ProviderSettings {
    const parsed = ProviderSettingsSchemaPartial.safeParse(settings);
    if (!parsed.success) {
        console.error('Failed to parse provider settings:', parsed.error);
        return { ...providerSettingsDefaults };
    }
    
    // Merge with defaults, ensuring all required fields exist
    const result: ProviderSettings = {
        global: {
            ...providerSettingsDefaults.global,
            ...parsed.data.global,
        },
        providers: {
            ...providerSettingsDefaults.providers,
            ...parsed.data.providers,
        },
        agents: parsed.data.agents || {},
    };
    
    return result;
}

//
// Applying changes
//

export function applyProviderSettings(
    settings: ProviderSettings,
    delta: Partial<ProviderSettings>
): ProviderSettings {
    const merged: ProviderSettings = {
        global: {
            ...providerSettingsDefaults.global,
            ...settings.global,
            ...delta.global,
        },
        providers: {
            ...providerSettingsDefaults.providers,
            ...settings.providers,
            ...delta.providers,
        },
        agents: {
            ...settings.agents,
            ...(delta.agents || {}),
        },
    };
    
    return merged;
}

//
// Helper functions
//

export function getProviderConfig(
    settings: ProviderSettings,
    provider: ProviderType
): ProviderConfig {
    return settings.providers[provider] || {
        enabledAgents: [],
    };
}

export function getSystemPromptConfig(
    settings: ProviderSettings,
    provider: ProviderType
): ProviderSystemPromptConfig | undefined {
    // Check provider-specific config first, then global
    const providerConfig = getProviderConfig(settings, provider);
    if (providerConfig.systemPrompt) {
        return providerConfig.systemPrompt;
    }
    return settings.global.systemPrompt;
}

export function getAgentsForProvider(
    settings: ProviderSettings,
    provider: ProviderType
): AgentDefinition[] {
    const providerConfig = getProviderConfig(settings, provider);
    const enabledAgentIds = providerConfig.enabledAgents || [];
    
    return enabledAgentIds
        .map(id => settings.agents[id])
        .filter((agent): agent is AgentDefinition => {
            if (!agent) return false;
            return agent.provider === 'all' || agent.provider === provider;
        });
}

export function getAllAgents(settings: ProviderSettings): AgentDefinition[] {
    return Object.values(settings.agents);
}

export function getAgentById(
    settings: ProviderSettings,
    agentId: string
): AgentDefinition | undefined {
    return settings.agents[agentId];
}

export function addAgent(
    settings: ProviderSettings,
    agent: Omit<AgentDefinition, 'id' | 'createdAt' | 'updatedAt'>
): ProviderSettings {
    const id = `agent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = Date.now();
    
    const newAgent: AgentDefinition = {
        ...agent,
        id,
        createdAt: now,
        updatedAt: now,
    };
    
    return {
        ...settings,
        agents: {
            ...settings.agents,
            [id]: newAgent,
        },
    };
}

export function updateAgent(
    settings: ProviderSettings,
    agentId: string,
    updates: Partial<Omit<AgentDefinition, 'id' | 'createdAt'>> & { updatedAt?: number }
): ProviderSettings {
    const existing = settings.agents[agentId];
    if (!existing) {
        return settings;
    }
    
    return {
        ...settings,
        agents: {
            ...settings.agents,
            [agentId]: {
                ...existing,
                ...updates,
                updatedAt: updates.updatedAt ?? Date.now(),
            },
        },
    };
}

export function deleteAgent(
    settings: ProviderSettings,
    agentId: string
): ProviderSettings {
    const { [agentId]: removed, ...remainingAgents } = settings.agents;
    
    // Remove agent from all provider configs
    const updatedProviders: ProviderSettings['providers'] = {
        claude: removeAgentFromProvider(settings.providers.claude, agentId),
        codex: removeAgentFromProvider(settings.providers.codex, agentId),
        gemini: removeAgentFromProvider(settings.providers.gemini, agentId),
        cursor: removeAgentFromProvider(settings.providers.cursor, agentId),
    };
    
    // Clear default agent if it was deleted
    const updatedGlobal = {
        ...settings.global,
        defaultAgentId: settings.global.defaultAgentId === agentId ? null : settings.global.defaultAgentId,
    };
    
    return {
        ...settings,
        global: updatedGlobal,
        providers: updatedProviders,
        agents: remainingAgents,
    };
}

function removeAgentFromProvider(
    config: ProviderConfig | undefined,
    agentId: string
): ProviderConfig | undefined {
    if (!config) return undefined;
    
    const updatedConfig: ProviderConfig = {
        ...config,
        enabledAgents: config.enabledAgents.filter(id => id !== agentId),
        defaultAgentId: config.defaultAgentId === agentId ? null : config.defaultAgentId,
    };
    
    // Return undefined if config is empty
    if (!updatedConfig.systemPrompt && !updatedConfig.defaultAgentId && updatedConfig.enabledAgents.length === 0) {
        return undefined;
    }
    
    return updatedConfig;
}


