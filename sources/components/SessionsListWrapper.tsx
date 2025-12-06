import * as React from 'react';
import { View, ActivityIndicator, Pressable, Text } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Header } from './navigation/Header';
import { SessionsList } from './SessionsList';
import { EmptyMainScreen } from './EmptyMainScreen';
import { useVisibleSessionListViewData } from '@/hooks/useVisibleSessionListViewData';
import { useSocketStatus, storage } from '@/sync/storage';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { StatusDot } from './StatusDot';
import { Typography } from '@/constants/Typography';
import { t } from '@/text';
import { Modal } from '@/modal';
import { sessionDelete } from '@/sync/ops';

const stylesheet = StyleSheet.create((theme) => ({
    container: {
        flex: 1,
    },
    loadingContainerWrapper: {
        flex: 1,
        flexBasis: 0,
        flexGrow: 1,
        backgroundColor: theme.colors.groupped.background,
    },
    loadingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingBottom: 32,
    },
    emptyStateContainer: {
        flex: 1,
        flexBasis: 0,
        flexGrow: 1,
        flexDirection: 'column',
        backgroundColor: theme.colors.groupped.background,
    },
    emptyStateContentContainer: {
        flex: 1,
        flexBasis: 0,
        flexGrow: 1,
    },
    headerButton: {
        width: 32,
        height: 32,
        alignItems: 'center',
        justifyContent: 'center',
    },
    logoContainer: {
        width: 40,
        height: 32,
        alignItems: 'center',
        justifyContent: 'center',
    },
    titleContainer: {
        flex: 1,
        alignItems: 'center',
    },
    titleText: {
        fontSize: 17,
        color: theme.colors.header.tint,
        fontWeight: '600',
        ...Typography.default('semiBold'),
    },
    statusContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: -2,
    },
    statusDot: {
        marginRight: 4,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '500',
        lineHeight: 16,
        ...Typography.default(),
    },
    statusConnected: {
        color: theme.colors.status.connected,
    },
    statusConnecting: {
        color: theme.colors.status.connecting,
    },
    statusDisconnected: {
        color: theme.colors.status.disconnected,
    },
    statusError: {
        color: theme.colors.status.error,
    },
    statusDefault: {
        color: theme.colors.status.default,
    },
}));

function HeaderTitle() {
    const socketStatus = useSocketStatus();
    const styles = stylesheet;

    const getConnectionStatus = () => {
        const { status } = socketStatus;
        switch (status) {
            case 'connected':
                return {
                    color: styles.statusConnected.color,
                    isPulsing: false,
                    text: t('status.connected'),
                    textColor: styles.statusConnected.color
                };
            case 'connecting':
                return {
                    color: styles.statusConnecting.color,
                    isPulsing: true,
                    text: t('status.connecting'),
                    textColor: styles.statusConnecting.color
                };
            case 'disconnected':
                return {
                    color: styles.statusDisconnected.color,
                    isPulsing: false,
                    text: t('status.disconnected'),
                    textColor: styles.statusDisconnected.color
                };
            case 'error':
                return {
                    color: styles.statusError.color,
                    isPulsing: false,
                    text: t('status.error'),
                    textColor: styles.statusError.color
                };
            default:
                return {
                    color: styles.statusDefault.color,
                    isPulsing: false,
                    text: '',
                    textColor: styles.statusDefault.color
                };
        }
    };

    const connectionStatus = getConnectionStatus();

    return (
        <View style={styles.titleContainer}>
            <Text style={styles.titleText}>
                {t('tabs.sessions')}
            </Text>
            {connectionStatus.text && (
                <View style={styles.statusContainer}>
                    <StatusDot
                        color={connectionStatus.color}
                        isPulsing={connectionStatus.isPulsing}
                        size={6}
                        style={styles.statusDot}
                    />
                    <Text style={[
                        styles.statusText,
                        { color: connectionStatus.textColor }
                    ]}>
                        {connectionStatus.text}
                    </Text>
                </View>
            )}
        </View>
    );
}

function HeaderLeft() {
    const styles = stylesheet;
    const { theme } = useUnistyles();
    return (
        <View style={styles.logoContainer}>
            <Text style={{ 
                fontSize: 12, 
                ...Typography.logo(), 
                color: theme.colors.header.tint 
            }}>
                VOTG
            </Text>
        </View>
    );
}

function HeaderRight({ 
    onToggleSelectionMode, 
    isSelectionMode 
}: { 
    onToggleSelectionMode: () => void;
    isSelectionMode: boolean;
}) {
    const router = useRouter();
    const styles = stylesheet;
    const { theme } = useUnistyles();

    return (
        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
            {isSelectionMode ? (
                <Pressable
                    onPress={onToggleSelectionMode}
                    hitSlop={15}
                    style={styles.headerButton}
                >
                    <Ionicons name="close-outline" size={28} color={theme.colors.header.tint} />
                </Pressable>
            ) : (
                <>
                    <Pressable
                        onPress={onToggleSelectionMode}
                        hitSlop={15}
                        style={styles.headerButton}
                    >
                        <Ionicons name="remove-outline" size={28} color={theme.colors.header.tint} />
                    </Pressable>
                    <Pressable
                        onPress={() => router.push('/new')}
                        hitSlop={15}
                        style={styles.headerButton}
                    >
                        <Ionicons name="add-outline" size={28} color={theme.colors.header.tint} />
                    </Pressable>
                </>
            )}
        </View>
    );
}

export const SessionsListWrapper = React.memo(() => {
    const { theme } = useUnistyles();
    const sessionListViewData = useVisibleSessionListViewData();
    const styles = stylesheet;
    const [isSelectionMode, setIsSelectionMode] = React.useState(false);
    const [selectedSessionIds, setSelectedSessionIds] = React.useState<Set<string>>(new Set());

    const handleToggleSelectionMode = React.useCallback(() => {
        setIsSelectionMode(prev => !prev);
        if (isSelectionMode) {
            // Clear selection when exiting selection mode
            setSelectedSessionIds(new Set());
        }
    }, [isSelectionMode]);

    const handleToggleSessionSelection = React.useCallback((sessionId: string) => {
        setSelectedSessionIds(prev => {
            const next = new Set(prev);
            if (next.has(sessionId)) {
                next.delete(sessionId);
            } else {
                next.add(sessionId);
            }
            return next;
        });
    }, []);

    const handleBulkDelete = React.useCallback(async () => {
        if (selectedSessionIds.size === 0) return;

        const confirmed = await Modal.confirm(
            t('sessionInfo.deleteSession'),
            selectedSessionIds.size === 1
                ? t('sessionInfo.deleteSessionWarning')
                : `Delete ${selectedSessionIds.size} sessions? This action cannot be undone.`,
            {
                confirmText: t('sessionInfo.deleteSession'),
                cancelText: t('common.cancel'),
                destructive: true,
            }
        );

        if (!confirmed) return;

        // Delete all selected sessions
        const sessionIdsArray = Array.from(selectedSessionIds);
        let successCount = 0;
        let failCount = 0;

        for (const sessionId of sessionIdsArray) {
            try {
                const result = await sessionDelete(sessionId);
                if (result.success) {
                    storage.getState().deleteSession(sessionId);
                    successCount++;
                } else {
                    failCount++;
                }
            } catch (error) {
                failCount++;
            }
        }

        // Clear selection and exit selection mode
        setSelectedSessionIds(new Set());
        setIsSelectionMode(false);

        if (failCount > 0) {
            Modal.alert(
                t('common.error'),
                `Failed to delete ${failCount} session${failCount > 1 ? 's' : ''}.`
            );
        }
    }, [selectedSessionIds]);

    return (
        <View style={styles.container}>
            <View style={{ backgroundColor: theme.colors.groupped.background }}>
                <Header
                    title={<HeaderTitle />}
                    headerRight={() => (
                        <HeaderRight 
                            onToggleSelectionMode={handleToggleSelectionMode}
                            isSelectionMode={isSelectionMode}
                        />
                    )}
                    headerLeft={() => <HeaderLeft />}
                    headerShadowVisible={false}
                    headerTransparent={true}
                />
            </View>
            
            {sessionListViewData === null ? (
                <View style={styles.loadingContainerWrapper}>
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="small" color={theme.colors.textSecondary} />
                    </View>
                </View>
            ) : sessionListViewData.length === 0 ? (
                <View style={styles.emptyStateContainer}>
                    <View style={styles.emptyStateContentContainer}>
                        <EmptyMainScreen />
                    </View>
                </View>
            ) : (
                <SessionsList 
                    isSelectionMode={isSelectionMode}
                    selectedSessionIds={selectedSessionIds}
                    onToggleSessionSelection={handleToggleSessionSelection}
                    onBulkDelete={handleBulkDelete}
                />
            )}
        </View>
    );
});