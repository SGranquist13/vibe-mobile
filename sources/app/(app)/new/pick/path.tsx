import React, { useState, useMemo, useRef, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, Platform } from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { ItemGroup } from '@/components/ItemGroup';
import { Item } from '@/components/Item';
import { Typography } from '@/constants/Typography';
import { useAllMachines, useSessions, useSetting } from '@/sync/storage';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { layout } from '@/components/layout';
import { t } from '@/text';
import { MultiTextInput, MultiTextInputHandle } from '@/components/MultiTextInput';
import { DirectoryBrowser } from '@/components/DirectoryBrowser';
import { callbacks } from '../index';

const stylesheet = StyleSheet.create((theme) => ({
    container: {
        flex: 1,
        backgroundColor: theme.colors.groupped.background,
    },
    scrollContainer: {
        flex: 1,
    },
    scrollContent: {
        alignItems: 'center',
    },
    contentWrapper: {
        width: '100%',
        maxWidth: layout.maxWidth,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    emptyText: {
        fontSize: 16,
        color: theme.colors.textSecondary,
        textAlign: 'center',
        ...Typography.default(),
    },
    pathInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 16,
        paddingVertical: 16,
    },
    pathInput: {
        flex: 1,
        backgroundColor: theme.colors.input.background,
        borderRadius: 10,
        paddingHorizontal: 12,
        minHeight: 36,
        position: 'relative',
        borderWidth: 0.5,
        borderColor: theme.colors.divider,
    },
    tabContainer: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 8,
        gap: 8,
    },
    tab: {
        flex: 1,
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.colors.input.background,
    },
    tabActive: {
        backgroundColor: theme.colors.brand.primary,
    },
    tabText: {
        ...Typography.default('semiBold'),
        fontSize: 14,
        color: theme.colors.text,
    },
    tabTextActive: {
        color: '#FFFFFF',
    },
    browserContainer: {
        flex: 1,
    },
}));

export default function PathPickerScreen() {
    const { theme } = useUnistyles();
    const styles = stylesheet;
    const router = useRouter();
    const params = useLocalSearchParams<{ machineId?: string; selectedPath?: string }>();
    const machines = useAllMachines();
    const sessions = useSessions();
    const inputRef = useRef<MultiTextInputHandle>(null);
    const recentMachinePaths = useSetting('recentMachinePaths');

    // Get the selected machine first (needed by other hooks)
    const machine = useMemo(() => {
        return machines.find(m => m.id === params.machineId);
    }, [machines, params.machineId]);

    // Helper to normalize paths
    const normalizePath = useCallback((path: string): string => {
        if (!path) return '/';
        const normalized = path === '/' ? '/' : path.replace(/\/+$/, '');
        return normalized || '/';
    }, []);

    // Get recent paths first to determine safe initial path
    const recentPaths = useMemo(() => {
        if (!params.machineId) return [];

        const paths: string[] = [];
        const pathSet = new Set<string>();
        const homeDir = machine?.metadata?.homeDir || '/home';

        // Always include home directory
        if (homeDir) {
            paths.push(homeDir);
            pathSet.add(homeDir);
        }

        // First, add paths from recentMachinePaths (these are the most recent)
        recentMachinePaths.forEach(entry => {
            if (entry.machineId === params.machineId && !pathSet.has(entry.path)) {
                paths.push(entry.path);
                pathSet.add(entry.path);
            }
        });

        // Then add paths from sessions if we need more
        if (sessions) {
            const pathsWithTimestamps: Array<{ path: string; timestamp: number }> = [];

            sessions.forEach(item => {
                if (typeof item === 'string') return; // Skip section headers

                const session = item as any;
                if (session.metadata?.machineId === params.machineId && session.metadata?.path) {
                    const path = session.metadata.path;
                    if (!pathSet.has(path)) {
                        pathSet.add(path);
                        pathsWithTimestamps.push({
                            path,
                            timestamp: session.updatedAt || session.createdAt
                        });
                    }
                }
            });

            // Sort session paths by most recent first and add them
            pathsWithTimestamps
                .sort((a, b) => b.timestamp - a.timestamp)
                .forEach(item => paths.push(item.path));
        }

        return paths;
    }, [sessions, params.machineId, recentMachinePaths, machine]);

    // Determine safe initial path - prefer most recent non-home path over home directory
    const safeInitialPath = useMemo(() => {
        if (params.selectedPath) {
            return params.selectedPath;
        }
        // Use the first recent path (most recent) if available, preferring non-home paths
        if (recentPaths.length > 0) {
            const homeDir = machine?.metadata?.homeDir || '/home';
            const normalizedHome = normalizePath(homeDir);
            // Skip home directory if there are other paths
            const nonHomePath = recentPaths.find(p => normalizePath(p) !== normalizedHome);
            return nonHomePath || recentPaths[0];
        }
        return machine?.metadata?.homeDir || '/home';
    }, [params.selectedPath, recentPaths, machine, normalizePath]);

    const [customPath, setCustomPath] = useState(safeInitialPath);
    const [activeTab, setActiveTab] = useState<'browse' | 'manual'>('browse');



    const handleSelectPath = React.useCallback(() => {
        const pathToUse = customPath.trim() || machine?.metadata?.homeDir || '/home';
        // Set the selection and go back
        callbacks.onPathSelected(pathToUse);
        router.back();
    }, [customPath, router, machine]);

    const handlePathSelectFromBrowser = React.useCallback((path: string) => {
        setCustomPath(path);
        // Auto-select the path and go back
        callbacks.onPathSelected(path);
        router.back();
    }, [router]);

    const handlePathChangeFromBrowser = React.useCallback((path: string) => {
        setCustomPath(path);
    }, []);

    if (!machine) {
        return (
            <>
                <Stack.Screen
                    options={{
                        headerShown: true,
                        headerTitle: 'Select Path',
                        headerBackTitle: t('common.back'),
                        headerRight: () => (
                            <Pressable
                                onPress={handleSelectPath}
                                disabled={!customPath.trim()}
                                style={({ pressed }) => ({
                                    marginRight: 16,
                                    opacity: pressed ? 0.7 : 1,
                                    padding: 4,
                                })}
                            >
                                <Ionicons
                                    name="checkmark"
                                    size={24}
                                    color={theme.colors.header.tint}
                                />
                            </Pressable>
                        )
                    }}
                />
                <View style={styles.container}>
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>
                            No machine selected
                        </Text>
                    </View>
                </View>
            </>
        );
    }

    return (
        <>
            <Stack.Screen
                options={{
                    headerShown: true,
                    headerTitle: 'Select Path',
                    headerBackTitle: t('common.back'),
                    headerRight: () => (
                        <Pressable
                            onPress={handleSelectPath}
                            disabled={!customPath.trim()}
                            style={({ pressed }) => ({
                                opacity: pressed ? 0.7 : 1,
                                padding: 4,
                            })}
                        >
                            <Ionicons
                                name="checkmark"
                                size={24}
                                color={theme.colors.header.tint}
                            />
                        </Pressable>
                    )
                }}
            />
            <View style={styles.container}>
                {/* Tab Switcher */}
                <View style={styles.tabContainer}>
                    <Pressable
                        onPress={() => setActiveTab('browse')}
                        style={[styles.tab, activeTab === 'browse' && styles.tabActive]}
                    >
                        <Text style={[styles.tabText, activeTab === 'browse' && styles.tabTextActive]}>
                            {t('pathPicker.browse')}
                        </Text>
                    </Pressable>
                    <Pressable
                        onPress={() => setActiveTab('manual')}
                        style={[styles.tab, activeTab === 'manual' && styles.tabActive]}
                    >
                        <Text style={[styles.tabText, activeTab === 'manual' && styles.tabTextActive]}>
                            {t('pathPicker.manual')}
                        </Text>
                    </Pressable>
                </View>

                {activeTab === 'browse' ? (
                    <View style={styles.browserContainer}>
                        {params.machineId && (
                            <DirectoryBrowser
                                machineId={params.machineId}
                                initialPath={safeInitialPath}
                                homeDir={machine?.metadata?.homeDir || '/home'}
                                allowedPaths={recentPaths}
                                onPathSelect={handlePathSelectFromBrowser}
                                onPathChange={handlePathChangeFromBrowser}
                            />
                        )}
                    </View>
                ) : (
                    <ScrollView
                        style={styles.scrollContainer}
                        contentContainerStyle={styles.scrollContent}
                        keyboardShouldPersistTaps="handled"
                    >
                        <View style={styles.contentWrapper}>
                            <ItemGroup title={t('pathPicker.enterPath')} elevated={false} headerStyle={{ paddingTop: Platform.select({ ios: 12, default: 8 }) }} containerStyle={{ borderRadius: Platform.select({ ios: 8, default: 10 }) }}>
                                <View style={styles.pathInputContainer}>
                                    <View style={[styles.pathInput, { paddingVertical: 8 }]}>
                                        <MultiTextInput
                                            ref={inputRef}
                                            value={customPath}
                                            onChangeText={setCustomPath}
                                            placeholder={t('pathPicker.pathPlaceholder')}
                                            maxHeight={76}
                                            paddingTop={8}
                                            paddingBottom={8}
                                        />
                                    </View>
                                </View>
                            </ItemGroup>

                            {recentPaths.length > 0 && (
                                <ItemGroup title={t('pathPicker.recentPaths')} elevated={false} headerStyle={{ paddingTop: Platform.select({ ios: 12, default: 8 }) }} containerStyle={{ borderRadius: Platform.select({ ios: 8, default: 10 }) }}>
                                    {recentPaths.map((path, index) => {
                                        const isSelected = customPath.trim() === path;
                                        const isLast = index === recentPaths.length - 1;

                                        return (
                                            <Item
                                                key={path}
                                                title={path}
                                                leftElement={
                                                    <Ionicons
                                                        name="folder-outline"
                                                        size={18}
                                                        color={theme.colors.textSecondary}
                                                    />
                                                }
                                                onPress={() => {
                                                    setCustomPath(path);
                                                    setTimeout(() => inputRef.current?.focus(), 50);
                                                }}
                                                selected={isSelected}
                                                showChevron={false}
                                                pressableStyle={isSelected ? { backgroundColor: theme.colors.surfaceSelected } : undefined}
                                                showDivider={!isLast}
                                            />
                                        );
                                    })}
                                </ItemGroup>
                            )}

                            {recentPaths.length === 0 && (
                                <ItemGroup title={t('pathPicker.suggestedPaths')} elevated={false} headerStyle={{ paddingTop: Platform.select({ ios: 12, default: 8 }) }} containerStyle={{ borderRadius: Platform.select({ ios: 8, default: 10 }) }}>
                                    {(() => {
                                        const homeDir = machine.metadata?.homeDir || '/home';
                                        const suggestedPaths = [
                                            homeDir,
                                            `${homeDir}/projects`,
                                            `${homeDir}/Documents`,
                                            `${homeDir}/Desktop`
                                        ];
                                        return suggestedPaths.map((path, index) => {
                                            const isSelected = customPath.trim() === path;

                                            return (
                                                <Item
                                                    key={path}
                                                    title={path}
                                                    leftElement={
                                                        <Ionicons
                                                            name="folder-outline"
                                                            size={18}
                                                            color={theme.colors.textSecondary}
                                                        />
                                                    }
                                                    onPress={() => {
                                                        setCustomPath(path);
                                                        setTimeout(() => inputRef.current?.focus(), 50);
                                                    }}
                                                    selected={isSelected}
                                                    showChevron={false}
                                                    pressableStyle={isSelected ? { backgroundColor: theme.colors.surfaceSelected } : undefined}
                                                    showDivider={index < 3}
                                                />
                                            );
                                        });
                                    })()}
                                </ItemGroup>
                            )}
                        </View>
                    </ScrollView>
                )}
            </View>
        </>
    );
}