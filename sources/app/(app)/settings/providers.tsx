import * as React from 'react';
import { useRouter } from 'expo-router';
import { Item } from '@/components/Item';
import { ItemGroup } from '@/components/ItemGroup';
import { ItemList } from '@/components/ItemList';
import { Ionicons } from '@expo/vector-icons';
import { loadProviderSettings, saveProviderSettings } from '@/sync/persistence';
import { getProviderConfig, getAgentsForProvider, getAllAgents } from '@/sync/providerSettings';
import { t } from '@/text';
import type { ProviderType } from '@/types/providerSettings';

const PROVIDERS: Array<{ type: ProviderType; name: string; icon: string; color: string }> = [
    { type: 'claude', name: 'Claude', icon: 'sparkles-outline', color: '#007AFF' },
    { type: 'codex', name: 'Codex', icon: 'code-outline', color: '#5856D6' },
    { type: 'gemini', name: 'Gemini', icon: 'diamond-outline', color: '#34C759' },
    { type: 'cursor', name: 'Cursor', icon: 'code-working-outline', color: '#FF9500' },
];

export default function ProvidersScreen() {
    const router = useRouter();
    const [settings, setSettings] = React.useState(() => loadProviderSettings());

    React.useEffect(() => {
        // Reload settings when screen comes into focus
        const unsubscribe = router.addListener?.('focus', () => {
            setSettings(loadProviderSettings());
        });
        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, [router]);

    const handleProviderPress = React.useCallback((provider: ProviderType) => {
        router.push(`/settings/providers/${provider}`);
    }, [router]);

    return (
        <ItemList>
            <ItemGroup title={t('providerSettings.title')}>
                {PROVIDERS.map(provider => {
                    try {
                        const config = getProviderConfig(settings, provider.type);
                        const agents = getAgentsForProvider(settings, provider.type);
                        const hasSystemPrompt = config.systemPrompt?.enabled ?? false;
                        const agentCount = agents.length;

                        return (
                            <Item
                                key={provider.type}
                                title={provider.name}
                                subtitle={
                                    hasSystemPrompt
                                        ? t('providerSettings.providerWithSystemPrompt', { count: agentCount })
                                        : t('providerSettings.providerWithoutSystemPrompt', { count: agentCount })
                                }
                                icon={<Ionicons name={provider.icon as any} size={29} color={provider.color} />}
                                detail={agentCount > 0 ? `${agentCount} ${t('providerSettings.agents')}` : undefined}
                                onPress={() => {
                                    console.log('Provider pressed:', provider.type);
                                    handleProviderPress(provider.type);
                                }}
                                showChevron
                            />
                        );
                    } catch (error) {
                        console.error('Error rendering provider:', provider.type, error);
                        return (
                            <Item
                                key={provider.type}
                                title={provider.name}
                                subtitle={t('providerSettings.notConfigured')}
                                icon={<Ionicons name={provider.icon as any} size={29} color={provider.color} />}
                                onPress={() => {
                                    console.log('Provider pressed:', provider.type);
                                    handleProviderPress(provider.type);
                                }}
                                showChevron
                            />
                        );
                    }
                })}
            </ItemGroup>

            <ItemGroup title={t('providerSettings.actions')}>
                <Item
                    title={t('providerSettings.importAgents')}
                    subtitle={t('providerSettings.importAgentsSubtitle')}
                    icon={<Ionicons name="download-outline" size={29} color="#007AFF" />}
                    onPress={() => {
                        console.log('Import agents pressed');
                        router.push('/settings/providers/import');
                    }}
                    showChevron
                />
            </ItemGroup>
        </ItemList>
    );
}

