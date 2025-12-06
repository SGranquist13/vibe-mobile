import React from 'react';
import { View, Text, Platform, Pressable, useWindowDimensions } from 'react-native';
import { Typography } from '@/constants/Typography';
import { useAllMachines, storage, useSetting } from '@/sync/storage';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useUnistyles } from 'react-native-unistyles';
import { layout } from '@/components/layout';
import { t } from '@/text';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { AgentInput } from '@/components/AgentInput';
import { MultiTextInputHandle } from '@/components/MultiTextInput';
import { useHeaderHeight } from '@/utils/responsive';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Constants from 'expo-constants';
import { machineSpawnNewSession, createCloudSession, improvePrompt } from '@/sync/ops';
import { Modal } from '@/modal';
import { sync } from '@/sync/sync';
import { SessionTypeSelector } from '@/components/SessionTypeSelector';
import { createWorktree } from '@/utils/createWorktree';
import { getTempData, type NewSessionData } from '@/utils/tempDataStore';
import { PermissionMode, ModelMode } from '@/components/PermissionModeSelector';

// Simple temporary state for passing selections back from picker screens
let onMachineSelected: (machineId: string) => void = () => { };
let onPathSelected: (path: string) => void = () => { };
export const callbacks = {
    onMachineSelected: (machineId: string) => {
        onMachineSelected(machineId);
    },
    onPathSelected: (path: string) => {
        onPathSelected(path);
    }
}

// Helper function to get the most recent path for a machine from settings or sessions
const getRecentPathForMachine = (machineId: string | null, recentPaths: Array<{ machineId: string; path: string }>): string => {
    if (!machineId) return '/home/';

    // First check recent paths from settings
    const recentPath = recentPaths.find(rp => rp.machineId === machineId);
    if (recentPath) {
        return recentPath.path;
    }

    // Fallback to session history
    const machine = storage.getState().machines[machineId];
    const defaultPath = machine?.metadata?.homeDir || '/home/';

    const sessions = Object.values(storage.getState().sessions);
    const pathsWithTimestamps: Array<{ path: string; timestamp: number }> = [];
    const pathSet = new Set<string>();

    sessions.forEach(session => {
        if (session.metadata?.machineId === machineId && session.metadata?.path) {
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

    // Sort by most recent first
    pathsWithTimestamps.sort((a, b) => b.timestamp - a.timestamp);

    return pathsWithTimestamps[0]?.path || defaultPath;
};

// Helper function to update recent machine paths
const updateRecentMachinePaths = (
    currentPaths: Array<{ machineId: string; path: string }>,
    machineId: string,
    path: string
): Array<{ machineId: string; path: string }> => {
    // Remove any existing entry for this machine
    const filtered = currentPaths.filter(rp => rp.machineId !== machineId);
    // Add new entry at the beginning
    const updated = [{ machineId, path }, ...filtered];
    // Keep only the last 10 entries
    return updated.slice(0, 10);
};

function NewSessionScreen() {
    const { theme } = useUnistyles();
    const router = useRouter();
    const { prompt, dataId } = useLocalSearchParams<{ prompt?: string; dataId?: string }>();

    // Try to get data from temporary store first, fallback to direct prompt parameter
    const tempSessionData = React.useMemo(() => {
        if (dataId) {
            return getTempData<NewSessionData>(dataId);
        }
        return null;
    }, [dataId]);

    const [input, setInput] = React.useState(() => {
        if (tempSessionData?.prompt) {
            return tempSessionData.prompt;
        }
        return prompt || '';
    });
    const [isSending, setIsSending] = React.useState(false);
    const [isImprovingPrompt, setIsImprovingPrompt] = React.useState(false);
    const [sessionType, setSessionType] = React.useState<'simple' | 'worktree'>('simple');
    const ref = React.useRef<MultiTextInputHandle>(null);
    const headerHeight = useHeaderHeight();
    const safeArea = useSafeAreaInsets();
    const screenWidth = useWindowDimensions().width;

    // Load recent machine paths and last used agent from settings
    const recentMachinePaths = useSetting('recentMachinePaths');
    const lastUsedAgent = useSetting('lastUsedAgent');
    const lastUsedPermissionMode = useSetting('lastUsedPermissionMode');
    const lastUsedModelMode = useSetting('lastUsedModelMode');
    const experimentsEnabled = useSetting('experiments');

    //
    // Machines state
    //

    const machines = useAllMachines();
    const [selectedMachineId, setSelectedMachineId] = React.useState<string | null>(() => {
        if (machines.length > 0) {
            // Check if we have a recently used machine that's currently available
            if (recentMachinePaths.length > 0) {
                // Find the first machine from recent paths that's currently available
                for (const recent of recentMachinePaths) {
                    if (machines.find(m => m.id === recent.machineId)) {
                        return recent.machineId;
                    }
                }
            }
            // Fallback to first machine if no recent machine is available
            return machines[0].id;
        }
        return null;
    });
    React.useEffect(() => {
        if (machines.length > 0) {
            if (!selectedMachineId) {
                // No machine selected yet, prefer the most recently used machine
                let machineToSelect = machines[0].id; // Default to first machine

                // Check if we have a recently used machine that's currently available
                if (recentMachinePaths.length > 0) {
                    for (const recent of recentMachinePaths) {
                        if (machines.find(m => m.id === recent.machineId)) {
                            machineToSelect = recent.machineId;
                            break; // Use the first (most recent) match
                        }
                    }
                }

                setSelectedMachineId(machineToSelect);
                // Also set the best path for the selected machine
                const bestPath = getRecentPathForMachine(machineToSelect, recentMachinePaths);
                setSelectedPath(bestPath);
            } else {
                // Machine is already selected, but check if we need to update path
                // This handles the case where machines load after initial render
                const currentMachine = machines.find(m => m.id === selectedMachineId);
                if (currentMachine) {
                    // Update path based on recent paths (only if path hasn't been manually changed)
                    const bestPath = getRecentPathForMachine(selectedMachineId, recentMachinePaths);
                    setSelectedPath(prevPath => {
                        // Only update if current path is the default /home/
                        if (prevPath === '/home/' && bestPath !== '/home/') {
                            return bestPath;
                        }
                        return prevPath;
                    });
                }
            }
        }
    }, [machines, selectedMachineId, recentMachinePaths]);

    React.useEffect(() => {
        let handler = (machineId: string) => {
            let machine = storage.getState().machines[machineId];
            if (machine) {
                setSelectedMachineId(machineId);
                // Also update the path when machine changes
                const bestPath = getRecentPathForMachine(machineId, recentMachinePaths);
                setSelectedPath(bestPath);
            }
        };
        onMachineSelected = handler;
        return () => {
            onMachineSelected = () => { };
        };
    }, [recentMachinePaths]);

    React.useEffect(() => {
        let handler = (path: string) => {
            setSelectedPath(path);
        };
        onPathSelected = handler;
        return () => {
            onPathSelected = () => { };
        };
    }, []);

    //
    // Agent selection
    //

    const [agentType, setAgentType] = React.useState<'claude' | 'codex' | 'gemini' | 'cursor'>(() => {
        // Check if agent type was provided in temp data
        if (tempSessionData?.agentType) {
            const tempAgent = tempSessionData.agentType;
            // If experiments disabled and temp agent is gemini/cursor, fall back to claude
            if (!experimentsEnabled && (tempAgent === 'gemini' || tempAgent === 'cursor')) {
                return 'claude';
            }
            return tempAgent;
        }
        // Initialize with last used agent if valid, otherwise default to 'claude'
        // If experiments disabled and last agent is gemini/cursor, fall back to claude
        if (lastUsedAgent === 'claude' || lastUsedAgent === 'codex') {
            return lastUsedAgent;
        } else if (experimentsEnabled && (lastUsedAgent === 'gemini' || lastUsedAgent === 'cursor')) {
            return lastUsedAgent;
        }
        return 'claude';
    });

    const handleAgentClick = React.useCallback(() => {
        setAgentType(prev => {
            // Cycle through agents based on experiments flag
            // If experiments enabled: claude -> codex -> gemini -> cursor -> claude
            // If experiments disabled: claude -> codex -> claude
            const agentOrder: Array<'claude' | 'codex' | 'gemini' | 'cursor'> = experimentsEnabled
                ? ['claude', 'codex', 'gemini', 'cursor']
                : ['claude', 'codex'];
            const currentIndex = agentOrder.indexOf(prev);
            const nextIndex = (currentIndex + 1) % agentOrder.length;
            const newAgent = agentOrder[nextIndex];
            // Save the new selection immediately
            sync.applySettings({ lastUsedAgent: newAgent });
            return newAgent;
        });
    }, [experimentsEnabled]);

    const handleMachineClick = React.useCallback(() => {
        router.push(`/new/pick/machine?agentType=${agentType}`);
    }, [agentType, router]);

    //
    // Permission and Model Mode selection
    //

    const [permissionMode, setPermissionMode] = React.useState<PermissionMode>(() => {
        // Initialize with last used permission mode if valid, otherwise default to 'default'
        const validClaudeModes: PermissionMode[] = ['default', 'acceptEdits', 'plan', 'bypassPermissions'];
        const validCodexModes: PermissionMode[] = ['default', 'read-only', 'safe-yolo', 'yolo'];
        // Gemini and Cursor use default permission mode only
        const validGeminiModes: PermissionMode[] = ['default'];
        const validCursorModes: PermissionMode[] = ['default'];

        if (lastUsedPermissionMode) {
            if (agentType === 'codex' && validCodexModes.includes(lastUsedPermissionMode as PermissionMode)) {
                return lastUsedPermissionMode as PermissionMode;
            } else if (agentType === 'claude' && validClaudeModes.includes(lastUsedPermissionMode as PermissionMode)) {
                return lastUsedPermissionMode as PermissionMode;
            } else if (agentType === 'gemini' && validGeminiModes.includes(lastUsedPermissionMode as PermissionMode)) {
                return lastUsedPermissionMode as PermissionMode;
            } else if (agentType === 'cursor' && validCursorModes.includes(lastUsedPermissionMode as PermissionMode)) {
                return lastUsedPermissionMode as PermissionMode;
            }
        }
        return 'default';
    });

    const [modelMode, setModelMode] = React.useState<ModelMode>(() => {
        // Initialize with last used model mode if valid, otherwise default
        const validClaudeModes: ModelMode[] = ['default', 'adaptiveUsage', 'sonnet', 'opus'];
        const validCodexModes: ModelMode[] = ['gpt-5-codex-high', 'gpt-5-codex-medium', 'gpt-5-codex-low', 'default', 'gpt-5-minimal', 'gpt-5-low', 'gpt-5-medium', 'gpt-5-high'];
        const validGeminiModes: ModelMode[] = ['default', 'gemini-2.0-flash-exp', 'gemini-2.0-flash-thinking-exp', 'gemini-1.5-pro', 'gemini-1.5-flash'];
        const validCursorModes: ModelMode[] = ['default', 'cursor-default'];

        if (lastUsedModelMode) {
            if (agentType === 'codex' && validCodexModes.includes(lastUsedModelMode as ModelMode)) {
                return lastUsedModelMode as ModelMode;
            } else if (agentType === 'claude' && validClaudeModes.includes(lastUsedModelMode as ModelMode)) {
                return lastUsedModelMode as ModelMode;
            } else if (agentType === 'gemini' && validGeminiModes.includes(lastUsedModelMode as ModelMode)) {
                return lastUsedModelMode as ModelMode;
            } else if (agentType === 'cursor' && validCursorModes.includes(lastUsedModelMode as ModelMode)) {
                return lastUsedModelMode as ModelMode;
            }
        }
        // Default model for each agent type
        if (agentType === 'codex') return 'gpt-5-codex-high';
        if (agentType === 'gemini') return 'default';
        if (agentType === 'cursor') return 'default';
        return 'default';
    });

    // Reset permission and model modes when agent type changes
    // Also handle experiments flag changes - if disabled, reset to claude/codex
    React.useEffect(() => {
        // If experiments disabled and current agent is gemini/cursor, switch to claude
        if (!experimentsEnabled && (agentType === 'gemini' || agentType === 'cursor')) {
            setAgentType('claude');
            setPermissionMode('default');
            setModelMode('default');
            return;
        }

        if (agentType === 'codex') {
            // Switch to codex-compatible modes
            setPermissionMode('default');
            setModelMode('gpt-5-codex-high');
        } else if (agentType === 'gemini') {
            // Switch to gemini-compatible modes
            setPermissionMode('default');
            setModelMode('default');
        } else if (agentType === 'cursor') {
            // Switch to cursor-compatible modes
            setPermissionMode('default');
            setModelMode('default');
        } else {
            // Switch to claude-compatible modes
            setPermissionMode('default');
            setModelMode('default');
        }
    }, [agentType, experimentsEnabled]);

    const handlePermissionModeChange = React.useCallback((mode: PermissionMode) => {
        setPermissionMode(mode);
        // Save the new selection immediately
        sync.applySettings({ lastUsedPermissionMode: mode });
    }, []);

    const handleModelModeChange = React.useCallback((mode: ModelMode) => {
        setModelMode(mode);
        // Save the new selection immediately
        sync.applySettings({ lastUsedModelMode: mode });
    }, []);

    //
    // Path selection
    //

    const [selectedPath, setSelectedPath] = React.useState<string>(() => {
        // Initialize with the path from the selected machine (which should be the most recent if available)
        return getRecentPathForMachine(selectedMachineId, recentMachinePaths);
    });
    const handlePathClick = React.useCallback(() => {
        if (selectedMachineId) {
            router.push(`/new/pick/path?machineId=${selectedMachineId}`);
        }
    }, [selectedMachineId, router]);

    // Get selected machine name
    const selectedMachine = React.useMemo(() => {
        if (!selectedMachineId) return null;
        return machines.find(m => m.id === selectedMachineId);
    }, [selectedMachineId, machines]);

    // Autofocus
    React.useLayoutEffect(() => {
        if (Platform.OS === 'ios') {
            setTimeout(() => {
                ref.current?.focus();
            }, 800);
        } else {
            ref.current?.focus();
        }
    }, []);

    // Create Cloud Session
    const doCreateCloudSession = React.useCallback(async () => {
        if (isSending) return;
        setIsSending(true);

        try {
            const result = await createCloudSession({
                initialMessage: input,
                agentType: agentType === 'codex' ? 'codex' : 'claude',
            });

            if (result.success && result.sessionId) {
                // Refresh sessions to get the new cloud session
                await sync.refreshSessions();

                // Set permission and model modes on the session
                storage.getState().updateSessionPermissionMode(result.sessionId, permissionMode);
                storage.getState().updateSessionModelMode(result.sessionId, modelMode);

                // Send initial message if provided
                if (input.trim()) {
                    await sync.sendMessage(result.sessionId, input);
                }

                // Navigate to session
                router.replace(`/session/${result.sessionId}`, {
                    dangerouslySingular() {
                        return 'session'
                    },
                });
            } else {
                throw new Error(result.error || 'Failed to create cloud session');
            }
        } catch (error) {
            console.error('Failed to create cloud session', error);
            Modal.alert(
                t('common.error'),
                error instanceof Error ? error.message : 'Failed to create cloud session. Make sure E2B_API_KEY is configured on the server.'
            );
        } finally {
            setIsSending(false);
        }
    }, [input, agentType, permissionMode, modelMode]);

    // Create
    const doCreate = React.useCallback(async () => {
        if (!selectedMachineId) {
            Modal.alert(t('common.error'), t('newSession.noMachineSelected'));
            return;
        }
        if (!selectedPath) {
            Modal.alert(t('common.error'), t('newSession.noPathSelected'));
            return;
        }

        setIsSending(true);
        try {
            let actualPath = selectedPath;
            
            // Handle worktree creation if selected and experiments are enabled
            if (sessionType === 'worktree' && experimentsEnabled) {
                const worktreeResult = await createWorktree(selectedMachineId, selectedPath);
                
                if (!worktreeResult.success) {
                    if (worktreeResult.error === 'Not a Git repository') {
                        Modal.alert(
                            t('common.error'), 
                            t('newSession.worktree.notGitRepo')
                        );
                    } else {
                        Modal.alert(
                            t('common.error'), 
                            t('newSession.worktree.failed', { error: worktreeResult.error || 'Unknown error' })
                        );
                    }
                    setIsSending(false);
                    return;
                }
                
                // Update the path to the new worktree location
                actualPath = worktreeResult.worktreePath;
            }

            // Save the machine-path combination to settings before sending
            const updatedPaths = updateRecentMachinePaths(recentMachinePaths, selectedMachineId, selectedPath);
            sync.applySettings({ recentMachinePaths: updatedPaths });

            const result = await machineSpawnNewSession({
                machineId: selectedMachineId,
                directory: actualPath,
                // For now we assume you already have a path to start in
                approvedNewDirectoryCreation: true,
                agent: agentType
            });

            // Use sessionId to check for success for backwards compatibility
            if ('sessionId' in result && result.sessionId) {
                // Store worktree metadata if applicable
                if (sessionType === 'worktree') {
                    // The metadata will be stored by the session itself once created
                }


                // Load sessions
                await sync.refreshSessions();

                // Set permission and model modes on the session
                storage.getState().updateSessionPermissionMode(result.sessionId, permissionMode);
                storage.getState().updateSessionModelMode(result.sessionId, modelMode);

                // Send message
                await sync.sendMessage(result.sessionId, input);
                // Navigate to session
                router.replace(`/session/${result.sessionId}`, {
                    dangerouslySingular() {
                        return 'session'
                    },
                });
            } else {
                throw new Error('Session spawning failed - no session ID returned.');
            }
        } catch (error) {
            console.error('Failed to start session', error);

            let errorMessage = 'Failed to start session. Make sure the daemon is running on the target machine.';
            if (error instanceof Error) {
                if (error.message.includes('timeout')) {
                    errorMessage = 'Session startup timed out. The machine may be slow or the daemon may not be responding.';
                } else if (error.message.includes('Socket not connected')) {
                    errorMessage = 'Not connected to server. Check your internet connection.';
                }
            }

            Modal.alert(t('common.error'), errorMessage);
        } finally {
            setIsSending(false);
        }
    }, [agentType, selectedMachineId, selectedPath, input, recentMachinePaths, sessionType, experimentsEnabled, permissionMode, modelMode]);

    // Improve prompt handler
    const handleImprovePrompt = React.useCallback(async () => {
        if (!input.trim() || isImprovingPrompt) return;
        
        setIsImprovingPrompt(true);
        try {
            const result = await improvePrompt({
                prompt: input,
                agentType: agentType === 'codex' ? 'codex' : 
                          agentType === 'gemini' ? 'gemini' :
                          agentType === 'cursor' ? 'cursor' : 'claude'
            });
            
            if (result.success && result.improvedPrompt) {
                setInput(result.improvedPrompt);
                // Focus the input and move cursor to end
                ref.current?.focus();
            } else {
                Modal.alert(
                    t('common.error'),
                    result.error || 'Failed to improve prompt'
                );
            }
        } catch (error) {
            Modal.alert(
                t('common.error'),
                error instanceof Error ? error.message : 'Failed to improve prompt'
            );
        } finally {
            setIsImprovingPrompt(false);
        }
    }, [input, agentType]);

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? Constants.statusBarHeight + headerHeight : 0}
            style={{
                flex: 1,
                justifyContent: Platform.OS === 'web' ? 'center' : 'flex-start',
                paddingTop: Platform.OS === 'web' ? 0 : 16,
                marginBottom: safeArea.bottom,
            }}
        >
            <View style={{
                width: '100%',
                alignSelf: 'center',
                flex: 1,
                paddingTop: Platform.OS === 'web' ? safeArea.top : Math.max(safeArea.top, 16),
                paddingHorizontal: Platform.OS === 'web' ? 0 : 8,
                justifyContent: 'flex-end',
            }}>
                {/* Session type selector - only show when experiments are enabled */}
                {experimentsEnabled && (
                    <View style={[
                        { paddingHorizontal: screenWidth > 700 ? 16 : 8, flexDirection: 'row', justifyContent: 'center', marginBottom: 8 }
                    ]}>
                        <View style={[
                            { maxWidth: layout.maxWidth, flex: 1 }
                        ]}>
                            <SessionTypeSelector 
                                value={sessionType}
                                onChange={setSessionType}
                            />
                        </View>
                    </View>
                )}

                {/* Agent input */}
                <AgentInput
                    placeholder={t('session.inputPlaceholder')}
                    ref={ref}
                    value={input}
                    onChangeText={setInput}
                    onSend={doCreate}
                    isSending={isSending}
                    agentType={agentType}
                    onAgentClick={handleAgentClick}
                    machineName={selectedMachine?.metadata?.displayName || selectedMachine?.metadata?.host || null}
                    onMachineClick={handleMachineClick}
                    onCloudSessionClick={experimentsEnabled ? doCreateCloudSession : undefined}
                    isCreatingCloudSession={experimentsEnabled && isSending}
                    permissionMode={permissionMode}
                    onPermissionModeChange={handlePermissionModeChange}
                    modelMode={modelMode}
                    onModelModeChange={handleModelModeChange}
                    currentPath={selectedPath}
                    onPathClick={handlePathClick}
                    onImprovePrompt={handleImprovePrompt}
                    isImprovingPrompt={isImprovingPrompt}
                    autocompletePrefixes={[]}
                    autocompleteSuggestions={async () => []}
                />
            </View>
        </KeyboardAvoidingView>
    )
}

export default React.memo(NewSessionScreen);
