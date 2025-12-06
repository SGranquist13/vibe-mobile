import * as React from 'react';
import { Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Item } from '@/components/Item';
import { ItemGroup } from '@/components/ItemGroup';
import { ItemList } from '@/components/ItemList';
import { Ionicons } from '@expo/vector-icons';
import { loadProviderSettings, saveProviderSettings } from '@/sync/persistence';
import { getProviderConfig, getAgentsForProvider, getAllAgents } from '@/sync/providerSettings';
import { t } from '@/text';
import type { ProviderType } from '@/types/providerSettings';
import { useUnistyles } from 'react-native-unistyles';

const PROVIDERS: Array<{ type: ProviderType; name: string; icon: string }> = [
    { type: 'claude', name: 'Claude', icon: 'sparkles-outline' },
    { type: 'codex', name: 'Codex', icon: 'code-outline' },
    { type: 'gemini', name: 'Gemini', icon: 'diamond-outline' },
    { type: 'cursor', name: 'Cursor', icon: 'code-working-outline' },
];

export default function ProvidersScreen() {
    const { theme } = useUnistyles();
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
            <ItemGroup title={t('providerSettings.title')} elevated={false} headerStyle={{ paddingTop: Platform.select({ ios: 12, default: 8 }) }} containerStyle={{ borderRadius: Platform.select({ ios: 8, default: 10 }) }}>
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
                                icon={<Ionicons name={provider.icon as any} size={29} color={theme.colors.text} />}
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
                                icon={<Ionicons name={provider.icon as any} size={29} color={theme.colors.text} />}
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

            <ItemGroup title={t('providerSettings.actions')} elevated={false} headerStyle={{ paddingTop: Platform.select({ ios: 12, default: 8 }) }} containerStyle={{ borderRadius: Platform.select({ ios: 8, default: 10 }) }}>
                <Item
                    title={t('providerSettings.importAgents')}
                    subtitle={t('providerSettings.importAgentsSubtitle')}
                    icon={<Ionicons name="download-outline" size={29} color={theme.colors.text} />}
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

