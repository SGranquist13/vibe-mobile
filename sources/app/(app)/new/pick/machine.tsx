import React from 'react';
import { View, Text, ScrollView, ActivityIndicator, Pressable } from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ItemGroup } from '@/components/ItemGroup';
import { Item } from '@/components/Item';
import { Typography } from '@/constants/Typography';
import { useAllMachines } from '@/sync/storage';
import { Ionicons } from '@expo/vector-icons';
import { isMachineOnline } from '@/utils/machineUtils';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { layout } from '@/components/layout';
import { t } from '@/text';
import { callbacks } from '../index';
import { ItemList } from '@/components/ItemList';
import { Modal } from '@/modal';
import { machineDelete } from '@/sync/ops';
import { sync } from '@/sync/sync';

const stylesheet = StyleSheet.create((theme) => ({
    container: {
        flex: 1,
        backgroundColor: theme.colors.groupped.background,
    },
    scrollContainer: {
        flex: 1,
    },
    scrollContent: {
        paddingVertical: 16,
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
    offlineWarning: {
        marginHorizontal: 16,
        marginTop: 16,
        marginBottom: 8,
        padding: 16,
        backgroundColor: theme.colors.box.warning.background,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: theme.colors.box.warning.border,
    },
    offlineWarningTitle: {
        fontSize: 14,
        color: theme.colors.box.warning.text,
        marginBottom: 8,
        ...Typography.default('semiBold'),
    },
    offlineWarningText: {
        fontSize: 13,
        color: theme.colors.box.warning.text,
        lineHeight: 20,
        marginBottom: 4,
        ...Typography.default(),
    },
    checkboxContainer: {
        width: 24,
        height: 24,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: theme.colors.textSecondary,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    checkboxSelected: {
        backgroundColor: theme.colors.brand.primary,
        borderColor: theme.colors.brand.primary,
    },
    checkboxIcon: {
        color: '#FFFFFF',
    },
}));

export default function MachinePickerScreen() {
    const { theme } = useUnistyles();
    const styles = stylesheet;
    const router = useRouter();
    const params = useLocalSearchParams<{ selectedId?: string }>();
    const machines = useAllMachines();
    const safeArea = useSafeAreaInsets();
    const [isSelectionMode, setIsSelectionMode] = React.useState(false);
    const [selectedMachineIds, setSelectedMachineIds] = React.useState<Set<string>>(new Set());
    const [isDeleting, setIsDeleting] = React.useState(false);

    const handleSelectMachine = (machineId: string) => {
        if (isSelectionMode) {
            // Toggle selection
            const newSelected = new Set(selectedMachineIds);
            if (newSelected.has(machineId)) {
                newSelected.delete(machineId);
            } else {
                newSelected.add(machineId);
            }
            setSelectedMachineIds(newSelected);
        } else {
            // Normal selection - navigate back
            callbacks.onMachineSelected(machineId);
            router.back();
        }
    };

    const handleToggleSelectionMode = () => {
        setIsSelectionMode(!isSelectionMode);
        if (isSelectionMode) {
            // Clear selection when exiting selection mode
            setSelectedMachineIds(new Set());
        }
    };

    const handleDeleteSelected = async () => {
        if (selectedMachineIds.size === 0) return;

        const count = selectedMachineIds.size;
        const confirmed = await Modal.confirm(
            t('common.delete'),
            count === 1 
                ? t('machine.deleteMachineConfirm')
                : t('machine.deleteMachinesConfirm', { count }),
            { 
                confirmText: t('common.delete'), 
                destructive: true 
            }
        );

        if (!confirmed) return;

        setIsDeleting(true);
        try {
            const deletePromises = Array.from(selectedMachineIds).map(machineId => 
                machineDelete(machineId)
            );
            
            const results = await Promise.all(deletePromises);
            const failed = results.filter(r => !r.success);
            
            if (failed.length > 0) {
                Modal.alert(
                    t('common.error'),
                    t('machine.deleteMachinesFailed', { count: failed.length })
                );
            } else {
                // Refresh machines list
                await sync.refreshMachines();
                // Exit selection mode and clear selection
                setIsSelectionMode(false);
                setSelectedMachineIds(new Set());
            }
        } catch (error) {
            Modal.alert(
                t('common.error'),
                error instanceof Error ? error.message : t('machine.deleteMachinesFailed', { count: selectedMachineIds.size })
            );
        } finally {
            setIsDeleting(false);
        }
    };

    const selectedCount = selectedMachineIds.size;
    const showDeleteButton = isSelectionMode && selectedCount > 0;

    if (machines.length === 0) {
        return (
            <>
                <Stack.Screen
                    options={{
                        headerShown: true,
                        headerTitle: 'Select Machine',
                        headerBackTitle: t('common.back'),
                        headerRight: () => (
                            <Pressable
                                onPress={handleToggleSelectionMode}
                                hitSlop={10}
                                style={{ marginRight: 16 }}
                            >
                                <Ionicons
                                    name={isSelectionMode ? "close" : "remove-circle-outline"}
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
                            No machines available
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
                    headerTitle: isSelectionMode 
                        ? (selectedCount > 0 ? `${selectedCount} selected` : 'Select Machines')
                        : 'Select Machine',
                    headerBackTitle: t('common.back'),
                    headerRight: () => (
                        <Pressable
                            onPress={handleToggleSelectionMode}
                            hitSlop={10}
                            style={{ marginRight: 16 }}
                        >
                            <Ionicons
                                name={isSelectionMode ? "close" : "remove-circle-outline"}
                                size={24}
                                color={theme.colors.header.tint}
                            />
                        </Pressable>
                    )
                }}
            />
            {showDeleteButton && (
                <View style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    backgroundColor: theme.colors.surface,
                    borderTopWidth: 1,
                    borderTopColor: theme.colors.divider,
                    paddingTop: 16,
                    paddingBottom: Math.max(16, safeArea.bottom),
                    paddingHorizontal: 16,
                    zIndex: 1000,
                    flexDirection: 'row',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: 8,
                }}>
                    <Pressable
                        onPress={handleDeleteSelected}
                        disabled={isDeleting || selectedCount === 0}
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: theme.colors.textDestructive,
                            paddingVertical: 12,
                            paddingHorizontal: 24,
                            borderRadius: 8,
                            gap: 8,
                            opacity: (isDeleting || selectedCount === 0) ? 0.5 : 1,
                        }}
                    >
                        {isDeleting ? (
                            <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                            <Ionicons name="trash-outline" size={20} color="#FFFFFF" />
                        )}
                        <Text style={{
                            fontSize: 16,
                            fontWeight: '600',
                            color: '#FFFFFF',
                            ...Typography.default('semiBold'),
                        }}>
                            {isDeleting 
                                ? t('common.deleting')
                                : t('common.delete') + (selectedCount > 1 ? ` ${selectedCount}` : '')
                            }
                        </Text>
                    </Pressable>
                </View>
            )}
            <ItemList style={showDeleteButton ? { paddingBottom: 80 } : undefined}>
                {machines.length === 0 && (
                    <View style={styles.offlineWarning}>
                        <Text style={styles.offlineWarningTitle}>
                            All machines offline
                        </Text>
                        <View style={{ marginTop: 4 }}>
                            <Text style={styles.offlineWarningText}>
                                {t('machine.offlineHelp')}
                            </Text>
                        </View>
                    </View>
                )}

                <ItemGroup>
                    {machines.map((machine) => {
                        const displayName = machine.metadata?.displayName || machine.metadata?.host || machine.id;
                        const hostName = machine.metadata?.host || machine.id;
                        const offline = !isMachineOnline(machine);
                        const isSelected = params.selectedId === machine.id;
                        const isSelectedForDeletion = selectedMachineIds.has(machine.id);

                        return (
                            <Item
                                key={machine.id}
                                title={displayName}
                                subtitle={displayName !== hostName ? hostName : undefined}
                                leftElement={
                                    isSelectionMode ? (
                                        <View style={[
                                            styles.checkboxContainer,
                                            isSelectedForDeletion && styles.checkboxSelected
                                        ]}>
                                            {isSelectedForDeletion && (
                                                <Ionicons
                                                    name="checkmark"
                                                    size={16}
                                                    color={styles.checkboxIcon.color}
                                                />
                                            )}
                                        </View>
                                    ) : (
                                        <Ionicons
                                            name="desktop-outline"
                                            size={24}
                                            color={offline ? theme.colors.textSecondary : theme.colors.text}
                                        />
                                    )
                                }
                                detail={!isSelectionMode && (offline ? 'offline' : 'online')}
                                detailStyle={{
                                    color: offline ? theme.colors.status.disconnected : theme.colors.status.connected
                                }}
                                titleStyle={{
                                    color: offline ? theme.colors.textSecondary : theme.colors.text
                                }}
                                subtitleStyle={{
                                    color: theme.colors.textSecondary
                                }}
                                selected={!isSelectionMode && isSelected}
                                onPress={() => handleSelectMachine(machine.id)}
                                showChevron={false}
                            />
                        );
                    })}
                </ItemGroup>
            </ItemList>
        </>
    );
}