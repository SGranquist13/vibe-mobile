import * as React from 'react';
import { View, Pressable, Platform } from 'react-native';
import { Item } from '@/components/Item';
import { ItemGroup } from '@/components/ItemGroup';
import { ItemList } from '@/components/ItemList';
import { Ionicons } from '@expo/vector-icons';
import { useUnistyles, StyleSheet } from 'react-native-unistyles';
import { Text } from '@/components/StyledText';
import { Typography } from '@/constants/Typography';
import { t } from '@/text';
import type { AgentDefinition, ProviderType } from '@/types/providerSettings';

export interface AgentListProps {
    agents: AgentDefinition[];
    onAgentPress?: (agent: AgentDefinition) => void;
    onAgentDelete?: (agent: AgentDefinition) => void;
    provider?: ProviderType;
    showProviderBadge?: boolean;
    emptyMessage?: string;
}

const stylesheet = StyleSheet.create((theme) => ({
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        backgroundColor: theme.colors.primary + '20',
        marginLeft: 8,
    },
    badgeText: {
        fontSize: 11,
        color: theme.colors.primary,
        ...Typography.default('semiBold'),
    },
    sourceBadge: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 8,
        backgroundColor: theme.colors.groupped.background,
        marginLeft: 4,
    },
    sourceBadgeText: {
        fontSize: 10,
        color: theme.colors.typographySecondary,
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

const getProviderColor = (provider: ProviderType | 'all'): string => {
    switch (provider) {
        case 'claude':
            return '#007AFF';
        case 'codex':
            return '#5856D6';
        case 'gemini':
            return '#34C759';
        case 'cursor':
            return '#FF9500';
        default:
            return '#8E8E93';
    }
};

const getProviderIcon = (provider: ProviderType | 'all'): string => {
    switch (provider) {
        case 'claude':
            return 'sparkles-outline';
        case 'codex':
            return 'code-outline';
        case 'gemini':
            return 'diamond-outline';
        case 'cursor':
            return 'cursor-outline';
        default:
            return 'apps-outline';
    }
};

const getSourceLabel = (source: AgentDefinition['source']): string => {
    switch (source) {
        case 'imported':
            return t('providerSettings.agentSourceImported');
        case 'custom':
            return t('providerSettings.agentSourceCustom');
        case 'builtin':
            return t('providerSettings.agentSourceBuiltin');
    }
};

export const AgentList = React.memo(function AgentList({
    agents,
    onAgentPress,
    onAgentDelete,
    provider,
    showProviderBadge = true,
    emptyMessage,
}: AgentListProps) {
    const { theme } = useUnistyles();
    const styles = stylesheet;

    if (agents.length === 0) {
        return (
            <ItemList>
                <ItemGroup elevated={false} headerStyle={{ paddingTop: Platform.select({ ios: 12, default: 8 }) }} containerStyle={{ borderRadius: Platform.select({ ios: 8, default: 10 }) }}>
                    <View style={styles.emptyContainer}>
                        <Ionicons
                            name="cube-outline"
                            size={48}
                            color={theme.colors.typographySecondary}
                            style={{ marginBottom: 16 }}
                        />
                        <Text style={styles.emptyText}>
                            {emptyMessage || t('providerSettings.noAgents')}
                        </Text>
                    </View>
                </ItemGroup>
            </ItemList>
        );
    }

    return (
        <ItemList>
            <ItemGroup title={t('providerSettings.agents')} elevated={false} headerStyle={{ paddingTop: Platform.select({ ios: 12, default: 8 }) }} containerStyle={{ borderRadius: Platform.select({ ios: 8, default: 10 }) }}>
                {agents.map((agent) => {
                    const providerColor = getProviderColor(agent.provider);
                    const providerIcon = getProviderIcon(agent.provider);

                    return (
                        <Item
                            key={agent.id}
                            title={agent.name}
                            subtitle={agent.description}
                            icon={
                                <Ionicons
                                    name={providerIcon as any}
                                    size={29}
                                    color={providerColor}
                                />
                            }
                            detail={agent.category}
                            rightElement={
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    {showProviderBadge && agent.provider !== 'all' && (
                                        <View style={[styles.badge, { backgroundColor: providerColor + '20' }]}>
                                            <Text style={[styles.badgeText, { color: providerColor }]}>
                                                {agent.provider}
                                            </Text>
                                        </View>
                                    )}
                                    <View style={styles.sourceBadge}>
                                        <Text style={styles.sourceBadgeText}>
                                            {getSourceLabel(agent.source)}
                                        </Text>
                                    </View>
                                </View>
                            }
                            onPress={() => onAgentPress?.(agent)}
                            onLongPress={onAgentDelete ? () => {
                                // Show delete confirmation
                                onAgentDelete(agent);
                            } : undefined}
                            showChevron={!!onAgentPress}
                        />
                    );
                })}
            </ItemGroup>
        </ItemList>
    );
});

