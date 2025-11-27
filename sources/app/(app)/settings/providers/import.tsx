import * as React from 'react';
import { View, TextInput, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Item } from '@/components/Item';
import { ItemGroup } from '@/components/ItemGroup';
import { ItemList } from '@/components/ItemList';
import { Ionicons } from '@expo/vector-icons';
import { fetchAgentList, importAgentFromGitHub, searchAgents, groupAgentsByCategory, type GitHubAgentInfo } from '@/utils/githubAgents';
import { loadProviderSettings, saveProviderSettings } from '@/sync/persistence';
import { addAgent, applyProviderSettings, getProviderConfig } from '@/sync/providerSettings';
import { Modal } from '@/modal';
import { useUnistyles, StyleSheet } from 'react-native-unistyles';
import { Text } from '@/components/StyledText';
import { Typography } from '@/constants/Typography';
import { t } from '@/text';
import type { ProviderType } from '@/types/providerSettings';

const stylesheet = StyleSheet.create((theme) => ({
    searchContainer: {
        padding: 16,
        backgroundColor: theme.colors.groupped.background,
    },
    searchInput: {
        backgroundColor: theme.colors.input.background,
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        color: theme.colors.input.text,
        ...Typography.default(),
    },
    loadingContainer: {
        padding: 32,
        alignItems: 'center',
    },
    errorContainer: {
        padding: 32,
        alignItems: 'center',
    },
    errorText: {
        color: theme.colors.error || '#FF3B30',
        fontSize: 14,
        textAlign: 'center',
        ...Typography.default(),
    },
    emptyContainer: {
        padding: 32,
        alignItems: 'center',
    },
    emptyText: {
        color: theme.colors.typographySecondary,
        fontSize: 14,
        textAlign: 'center',
        ...Typography.default(),
    },
}));

export default function ImportAgentsScreen() {
    const router = useRouter();
    const { theme, styles } = useUnistyles(stylesheet);
    
    const [agents, setAgents] = React.useState<GitHubAgentInfo[]>([]);
    const [filteredAgents, setFilteredAgents] = React.useState<GitHubAgentInfo[]>([]);
    const [searchQuery, setSearchQuery] = React.useState('');
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);
    const [importing, setImporting] = React.useState<string | null>(null);

    React.useEffect(() => {
        loadAgents();
    }, []);

    React.useEffect(() => {
        if (searchQuery.trim()) {
            const filtered = searchAgents(agents, searchQuery);
            setFilteredAgents(filtered);
        } else {
            setFilteredAgents(agents);
        }
    }, [searchQuery, agents]);

    const loadAgents = async () => {
        try {
            setLoading(true);
            setError(null);
            const agentList = await fetchAgentList();
            setAgents(agentList);
            setFilteredAgents(agentList);
        } catch (err) {
            console.error('Failed to load agents:', err);
            setError(err instanceof Error ? err.message : t('providerSettings.failedToLoadAgents'));
        } finally {
            setLoading(false);
        }
    };

    const handleImport = React.useCallback(async (agentInfo: GitHubAgentInfo) => {
        try {
            setImporting(agentInfo.name);
            const agentData = await importAgentFromGitHub(agentInfo.url);
            
            if (!agentData) {
                throw new Error(t('providerSettings.failedToParseAgent'));
            }

            // Load current settings
            const settings = loadProviderSettings();
            
            // Add agent
            const updatedSettings = addAgent(settings, agentData);
            
            // If agent is for a specific provider or 'all', add to that provider's enabled list
            if (agentData.provider !== 'all') {
                const provider = agentData.provider;
                const providerConfig = getProviderConfig(updatedSettings, provider);
                const agentId = Object.keys(updatedSettings.agents).find(
                    id => updatedSettings.agents[id].name === agentData.name
                );
                
                if (agentId) {
                    const finalSettings = applyProviderSettings(updatedSettings, {
                        providers: {
                            [provider]: {
                                ...providerConfig,
                                enabledAgents: [...(providerConfig.enabledAgents || []), agentId],
                            },
                        },
                    });
                    saveProviderSettings(finalSettings);
                } else {
                    saveProviderSettings(updatedSettings);
                }
            } else {
                saveProviderSettings(updatedSettings);
            }

            Modal.alert(
                t('common.success'),
                t('providerSettings.agentImported', { name: agentData.name })
            );
        } catch (err) {
            console.error('Failed to import agent:', err);
            Modal.alert(
                t('common.error'),
                err instanceof Error ? err.message : t('providerSettings.failedToImportAgent')
            );
        } finally {
            setImporting(null);
        }
    }, []);

    const groupedAgents = React.useMemo(() => {
        return groupAgentsByCategory(filteredAgents);
    }, [filteredAgents]);

    if (loading) {
        return (
            <ItemList>
                <ItemGroup>
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={theme.colors.primary} />
                        <Text style={{ marginTop: 16, color: theme.colors.typographySecondary }}>
                            {t('providerSettings.loadingAgents')}
                        </Text>
                    </View>
                </ItemGroup>
            </ItemList>
        );
    }

    if (error) {
        return (
            <ItemList>
                <ItemGroup>
                    <View style={styles.errorContainer}>
                        <Ionicons
                            name="alert-circle-outline"
                            size={48}
                            color={theme.colors.error || '#FF3B30'}
                            style={{ marginBottom: 16 }}
                        />
                        <Text style={styles.errorText}>{error}</Text>
                        <Item
                            title={t('common.retry')}
                            onPress={loadAgents}
                            icon={<Ionicons name="refresh-outline" size={29} color={theme.colors.primary} />}
                            showChevron={false}
                        />
                    </View>
                </ItemGroup>
            </ItemList>
        );
    }

    return (
        <ItemList>
            {/* Search */}
            <View style={styles.searchContainer}>
                <TextInput
                    style={styles.searchInput}
                    placeholder={t('providerSettings.searchAgents')}
                    placeholderTextColor={theme.colors.input.placeholder}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    autoCapitalize="none"
                    autoCorrect={false}
                />
            </View>

            {/* Agents by Category */}
            {Object.keys(groupedAgents).length === 0 ? (
                <ItemGroup>
                    <View style={styles.emptyContainer}>
                        <Ionicons
                            name="search-outline"
                            size={48}
                            color={theme.colors.typographySecondary}
                            style={{ marginBottom: 16 }}
                        />
                        <Text style={styles.emptyText}>
                            {t('providerSettings.noAgentsFound')}
                        </Text>
                    </View>
                </ItemGroup>
            ) : (
                Object.entries(groupedAgents).map(([category, categoryAgents]) => (
                    <ItemGroup key={category} title={category}>
                        {categoryAgents.map(agent => (
                            <Item
                                key={agent.name}
                                title={agent.name}
                                subtitle={agent.path}
                                icon={<Ionicons name="cube-outline" size={29} color="#007AFF" />}
                                rightElement={
                                    importing === agent.name ? (
                                        <ActivityIndicator size="small" color={theme.colors.primary} />
                                    ) : (
                                        <Ionicons name="download-outline" size={20} color={theme.colors.primary} />
                                    )
                                }
                                onPress={() => handleImport(agent)}
                                disabled={!!importing}
                                showChevron={false}
                            />
                        ))}
                    </ItemGroup>
                ))
            )}
        </ItemList>
    );
}


