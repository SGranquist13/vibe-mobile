import * as React from 'react';
import { Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { View, ScrollView } from 'react-native';
import { Item } from '@/components/Item';
import { ItemGroup } from '@/components/ItemGroup';
import { ItemList } from '@/components/ItemList';
import { Ionicons } from '@expo/vector-icons';
import { SystemPromptEditor } from '@/components/SystemPromptEditor';
import { AgentList } from '@/components/AgentList';
import { AgentEditor } from '@/components/AgentEditor';
import { loadProviderSettings, saveProviderSettings } from '@/sync/persistence';
import {
    getProviderConfig,
    getSystemPromptConfig,
    getAgentsForProvider,
    applyProviderSettings,
    addAgent,
    updateAgent,
    deleteAgent,
    providerSettingsDefaults,
} from '@/sync/providerSettings';
import { Modal } from '@/modal';
import { t } from '@/text';
import type { ProviderType, SystemPromptMode, AgentDefinition } from '@/types/providerSettings';
import { useUnistyles } from 'react-native-unistyles';

const PROVIDER_INFO: Record<ProviderType, { name: string; icon: string }> = {
    claude: { name: 'Claude', icon: 'sparkles-outline' },
    codex: { name: 'Codex', icon: 'code-outline' },
    gemini: { name: 'Gemini', icon: 'diamond-outline' },
    cursor: { name: 'Cursor', icon: 'code-working-outline' },
};

export default function ProviderDetailScreen() {
    const { theme } = useUnistyles();
    const router = useRouter();
    const { provider: providerParam } = useLocalSearchParams<{ provider: string }>();
    const provider = (providerParam as ProviderType) || 'claude';
    
    const [settings, setSettings] = React.useState(() => loadProviderSettings());
    const [editingAgent, setEditingAgent] = React.useState<AgentDefinition | null>(null);
    const [showAgentEditor, setShowAgentEditor] = React.useState(false);

    const providerInfo = PROVIDER_INFO[provider];
    const config = getProviderConfig(settings, provider);
    const systemPromptConfig = getSystemPromptConfig(settings, provider);
    const agents = getAgentsForProvider(settings, provider);

    const handleSystemPromptChange = React.useCallback((
        mode: SystemPromptMode,
        content: string,
        enabled: boolean
    ) => {
        const updatedSettings = applyProviderSettings(settings, {
            providers: {
                [provider]: {
                    ...config,
                    systemPrompt: {
                        mode,
                        content,
                        enabled,
                    },
                },
            },
        });
        setSettings(updatedSettings);
        saveProviderSettings(updatedSettings);
    }, [settings, provider, config]);

    const handleAgentPress = React.useCallback((agent: AgentDefinition) => {
        setEditingAgent(agent);
        setShowAgentEditor(true);
    }, []);

    const handleAgentDelete = React.useCallback((agent: AgentDefinition) => {
        Modal.confirm(
            t('providerSettings.deleteAgent'),
            t('providerSettings.deleteAgentConfirm', { name: agent.name }),
            [
                {
                    text: t('common.cancel'),
                    style: 'cancel',
                },
                {
                    text: t('common.delete'),
                    style: 'destructive',
                    onPress: () => {
                        const updatedSettings = deleteAgent(settings, agent.id);
                        setSettings(updatedSettings);
                        saveProviderSettings(updatedSettings);
                    },
                },
            ]
        );
    }, [settings]);

    const handleAgentSave = React.useCallback((agentData: Omit<AgentDefinition, 'id' | 'createdAt' | 'updatedAt'>) => {
        let updatedSettings;
        
        if (editingAgent) {
            // Update existing agent
            updatedSettings = updateAgent(settings, editingAgent.id, agentData);
        } else {
            // Add new agent
            updatedSettings = addAgent(settings, agentData);
            
            // Add to provider's enabled agents if it matches
            if (agentData.provider === provider || agentData.provider === 'all') {
                const providerConfig = getProviderConfig(updatedSettings, provider);
                updatedSettings = applyProviderSettings(updatedSettings, {
                    providers: {
                        [provider]: {
                            ...providerConfig,
                            enabledAgents: [...(providerConfig.enabledAgents || []), updatedSettings.agents[Object.keys(updatedSettings.agents).pop()!].id],
                        },
                    },
                });
            }
        }
        
        setSettings(updatedSettings);
        saveProviderSettings(updatedSettings);
        setShowAgentEditor(false);
        setEditingAgent(null);
    }, [settings, editingAgent, provider]);

    const handleCreateAgent = React.useCallback(() => {
        setEditingAgent(null);
        setShowAgentEditor(true);
    }, []);

    const handleImportAgent = React.useCallback(() => {
        router.push('/settings/providers/import');
    }, [router]);

    if (showAgentEditor) {
        return (
            <AgentEditor
                agent={editingAgent}
                onSave={handleAgentSave}
                onCancel={() => {
                    setShowAgentEditor(false);
                    setEditingAgent(null);
                }}
            />
        );
    }

    return (
        <ItemList>
            <SystemPromptEditor
                mode={systemPromptConfig?.mode || 'append'}
                content={systemPromptConfig?.content || ''}
                enabled={systemPromptConfig?.enabled || false}
                onModeChange={(mode) => {
                    handleSystemPromptChange(mode, systemPromptConfig?.content || '', systemPromptConfig?.enabled || false);
                }}
                onContentChange={(content) => {
                    handleSystemPromptChange(systemPromptConfig?.mode || 'append', content, systemPromptConfig?.enabled || false);
                }}
                onEnabledChange={(enabled) => {
                    handleSystemPromptChange(systemPromptConfig?.mode || 'append', systemPromptConfig?.content || '', enabled);
                }}
            />

            <ItemGroup title={t('providerSettings.agents')} elevated={false} headerStyle={{ paddingTop: Platform.select({ ios: 12, default: 8 }) }} containerStyle={{ borderRadius: Platform.select({ ios: 8, default: 10 }) }}>
                <Item
                    title={t('providerSettings.createAgent')}
                    subtitle={t('providerSettings.createAgentSubtitle')}
                    icon={<Ionicons name="add-circle-outline" size={29} color={theme.colors.text} />}
                    onPress={handleCreateAgent}
                    showChevron
                />
                <Item
                    title={t('providerSettings.importAgent')}
                    subtitle={t('providerSettings.importAgentSubtitle')}
                    icon={<Ionicons name="download-outline" size={29} color={theme.colors.text} />}
                    onPress={handleImportAgent}
                    showChevron
                />
            </ItemGroup>

            {agents.length > 0 && (
                <AgentList
                    agents={agents}
                    onAgentPress={handleAgentPress}
                    onAgentDelete={handleAgentDelete}
                    provider={provider}
                />
            )}
        </ItemList>
    );
}

