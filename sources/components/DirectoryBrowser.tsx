import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Typography } from '@/constants/Typography';
import { Item } from './Item';
import { ItemGroup } from './ItemGroup';
import { machineListDirectory, type DirectoryEntry } from '@/sync/ops';
import { t } from '@/text';
import { Modal } from '@/modal';
import { layout } from './layout';

export interface DirectoryBrowserProps {
    machineId: string;
    initialPath?: string;
    homeDir?: string;
    allowedPaths?: string[]; // Paths that are safe to browse without consent
    onPathSelect?: (path: string) => void;
    onPathChange?: (path: string) => void;
}

const stylesheet = StyleSheet.create((theme) => ({
    container: {
        flex: 1,
    },
    breadcrumbContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        backgroundColor: theme.colors.surface,
        borderBottomWidth: 0.5,
        borderBottomColor: theme.colors.divider,
        minHeight: 44,
    },
    breadcrumbContent: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    breadcrumbSegment: {
        flexDirection: 'row',
        alignItems: 'center',
        flexShrink: 0,
    },
    breadcrumbText: {
        ...Typography.default('regular'),
        fontSize: 13,
        color: theme.colors.textSecondary,
        paddingHorizontal: 4,
        paddingVertical: 2,
    },
    breadcrumbTextActive: {
        color: theme.colors.text,
        fontWeight: '600',
    },
    breadcrumbSeparator: {
        marginHorizontal: 4,
        color: theme.colors.textSecondary,
        fontSize: 12,
    },
    currentPathDisplay: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 10,
        backgroundColor: theme.colors.input.background,
        borderRadius: 10,
        marginHorizontal: 16,
        marginTop: 8,
        marginBottom: 8,
        borderWidth: 0.5,
        borderColor: theme.colors.divider,
    },
    currentPathText: {
        ...Typography.default('regular'),
        fontSize: 13,
        color: theme.colors.text,
        flex: 1,
    },
    upButton: {
        padding: 6,
        marginLeft: 8,
        borderRadius: 6,
    },
    homeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        marginHorizontal: 16,
        marginTop: 4,
        marginBottom: 8,
        backgroundColor: theme.colors.input.background,
        borderRadius: 8,
    },
    homeButtonText: {
        ...Typography.default('semiBold'),
        fontSize: 13,
        color: theme.colors.text,
        marginLeft: 6,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    loadingText: {
        ...Typography.default('regular'),
        fontSize: 14,
        color: theme.colors.textSecondary,
        marginTop: 12,
    },
    errorContainer: {
        padding: 20,
        alignItems: 'center',
    },
    errorText: {
        ...Typography.default('regular'),
        fontSize: 14,
        color: theme.colors.textDestructive,
        textAlign: 'center',
    },
    emptyContainer: {
        padding: 40,
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
    },
    emptyText: {
        ...Typography.default('regular'),
        fontSize: 14,
        color: theme.colors.textSecondary,
        textAlign: 'center',
        marginTop: 12,
    },
    selectButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 16,
        paddingVertical: 14,
        marginHorizontal: 16,
        marginTop: 16,
        marginBottom: 16,
        backgroundColor: theme.colors.brand.primary,
        borderRadius: 12,
        ...theme.colors.elevation.level2,
    },
    selectButtonText: {
        ...Typography.default('semiBold'),
        fontSize: 15,
        color: '#FFFFFF',
        marginLeft: 6,
    },
    selectButtonDisabled: {
        opacity: 0.5,
    },
}));

export const DirectoryBrowser = React.memo<DirectoryBrowserProps>((props) => {
    const { theme } = useUnistyles();
    const styles = stylesheet;
    const { machineId, initialPath, homeDir = '/home', allowedPaths = [], onPathSelect, onPathChange } = props;

    const [currentPath, setCurrentPath] = useState<string>(initialPath || homeDir);
    const [entries, setEntries] = useState<DirectoryEntry[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [consentedPaths, setConsentedPaths] = useState<Set<string>>(new Set());

    // Normalize paths for comparison (ensure trailing slash consistency)
    const normalizePath = useCallback((path: string): string => {
        if (!path) return '/';
        // Handle Windows paths
        if (path.includes('\\')) {
            // Remove trailing backslashes except for drive root (C:\)
            const normalized = path.replace(/\\+$/, '');
            return normalized || path.substring(0, 3); // Return C:\ if empty
        }
        // Handle Unix paths
        // Remove trailing slashes except for root
        const normalized = path === '/' ? '/' : path.replace(/\/+$/, '');
        return normalized || '/';
    }, []);

    // Check if a path is allowed (either in allowedPaths or consented)
    const isPathAllowed = useCallback((path: string): boolean => {
        const normalized = normalizePath(path);
        const normalizedHome = normalizePath(homeDir);
        
        // Always allow home directory
        if (normalized === normalizedHome || normalized === '/') {
            return true;
        }

        // Check if path is in allowed paths
        const isInAllowed = allowedPaths.some(allowed => {
            const normalizedAllowed = normalizePath(allowed);
            // Check if path is the allowed path or a subdirectory
            return normalized === normalizedAllowed || normalized.startsWith(normalizedAllowed + '/');
        });

        if (isInAllowed) return true;

        // Check if path has been consented
        for (const consented of consentedPaths) {
            const normalizedConsented = normalizePath(consented);
            if (normalized === normalizedConsented || normalized.startsWith(normalizedConsented + '/')) {
                return true;
            }
        }

        return false;
    }, [allowedPaths, consentedPaths, homeDir, normalizePath]);

    // Request consent to browse a path
    const requestConsent = useCallback(async (path: string): Promise<boolean> => {
        const normalized = normalizePath(path);
        if (isPathAllowed(normalized)) {
            return true;
        }

        const confirmed = await Modal.confirm(
            t('pathPicker.browseRestrictedDirectory'),
            t('pathPicker.browseRestrictedDirectoryMessage', { path: normalized }),
            {
                cancelText: t('common.cancel'),
                confirmText: t('common.yes')
            }
        );

        if (confirmed) {
            // Add this path and all parent paths to consented paths
            const newConsented = new Set(consentedPaths);
            const parts = normalized.split('/').filter(p => p);
            let currentConsentPath = '';
            for (const part of parts) {
                currentConsentPath = currentConsentPath ? `${currentConsentPath}/${part}` : `/${part}`;
                newConsented.add(currentConsentPath);
            }
            setConsentedPaths(newConsented);
            return true;
        }

        return false;
    }, [consentedPaths, isPathAllowed, normalizePath]);

    // Load directory contents
    const loadDirectory = useCallback(async (path: string) => {
        const normalized = normalizePath(path);
        
        // Check if we're allowed to browse this path
        if (!isPathAllowed(normalized)) {
            const consented = await requestConsent(normalized);
            if (!consented) {
                // User denied consent, navigate back to home
                setCurrentPath(homeDir);
                return;
            }
        }

        setLoading(true);
        setError(null);
        
        try {
            const result = await machineListDirectory(machineId, normalized);
            if (result.success && result.entries) {
                // Filter to show only directories for folder selection
                const directories = result.entries.filter(e => e.type === 'directory');
                setEntries(directories);
                setError(null);
            } else {
                setError(result.error || t('pathPicker.directoryListingFailed'));
                setEntries([]);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : t('pathPicker.directoryListingFailed'));
            setEntries([]);
        } finally {
            setLoading(false);
        }
    }, [machineId, isPathAllowed, requestConsent, normalizePath, homeDir]);

    // Ensure initial path is allowed, if not, find a safe fallback
    useEffect(() => {
        const normalized = normalizePath(currentPath);
        if (!isPathAllowed(normalized)) {
            // If initial path is not allowed, try to find a safe path from allowed paths
            // Prefer a non-home directory if available
            const safePath = allowedPaths.find(p => {
                const normalizedAllowed = normalizePath(p);
                const normalizedHome = normalizePath(homeDir);
                return normalizedAllowed !== normalizedHome;
            }) || allowedPaths[0] || homeDir;
            setCurrentPath(safePath);
        }
    }, []); // Only run on mount

    // Load directory when path changes
    useEffect(() => {
        const normalized = normalizePath(currentPath);
        if (isPathAllowed(normalized)) {
            loadDirectory(normalized);
            onPathChange?.(normalized);
        }
    }, [currentPath, loadDirectory, onPathChange, isPathAllowed, normalizePath]);

    // Navigate into a directory
    const navigateToDirectory = useCallback(async (dirName: string) => {
        // Handle Windows paths
        let newPath: string;
        if (currentPath.includes('\\')) {
            newPath = currentPath.endsWith('\\') 
                ? `${currentPath}${dirName}` 
                : `${currentPath}\\${dirName}`;
        } else {
            newPath = currentPath.endsWith('/') 
                ? `${currentPath}${dirName}` 
                : `${currentPath}/${dirName}`;
        }
        const normalized = normalizePath(newPath);
        
        // Check if we need consent before navigating
        if (!isPathAllowed(normalized)) {
            const consented = await requestConsent(normalized);
            if (!consented) {
                // User denied consent, don't navigate
                return;
            }
        }
        
        setCurrentPath(normalized);
    }, [currentPath, isPathAllowed, requestConsent, normalizePath]);

    // Navigate up one level
    const navigateUp = useCallback(async () => {
        if (currentPath === '/' || normalizePath(currentPath) === normalizePath(homeDir)) {
            return; // Already at root or home
        }
        const parentPath = currentPath.split('/').slice(0, -1).join('/') || '/';
        const normalized = normalizePath(parentPath);
        
        // Check if we need consent before navigating
        if (!isPathAllowed(normalized)) {
            const consented = await requestConsent(normalized);
            if (!consented) {
                // User denied consent, navigate to home instead
                setCurrentPath(homeDir);
                return;
            }
        }
        
        setCurrentPath(normalized);
    }, [currentPath, homeDir, isPathAllowed, requestConsent, normalizePath]);

    // Navigate to home
    const navigateToHome = useCallback(() => {
        setCurrentPath(homeDir);
    }, [homeDir]);

    // Select current path
    const handleSelectPath = useCallback(() => {
        onPathSelect?.(currentPath);
    }, [currentPath, onPathSelect]);

    // Parse breadcrumb segments - handle both Unix and Windows paths
    const breadcrumbSegments = React.useMemo(() => {
        const segments: Array<{ name: string; path: string }> = [];
        
        // Handle Windows paths (C:\Users\...)
        if (currentPath.match(/^[A-Za-z]:\\/)) {
            const parts = currentPath.split('\\').filter(p => p);
            if (parts.length > 0) {
                // First part is drive (C:)
                segments.push({ name: parts[0] + '\\', path: parts[0] + '\\' });
                // Build path progressively
                let currentSegPath = parts[0] + '\\';
                for (let i = 1; i < parts.length; i++) {
                    currentSegPath = currentSegPath + parts[i] + '\\';
                    segments.push({ name: parts[i], path: currentSegPath.slice(0, -1) });
                }
            }
            return segments;
        }
        
        // Handle Unix paths
        const parts = currentPath.split('/').filter(p => p);
        
        // Add root
        if (currentPath.startsWith('/')) {
            segments.push({ name: '/', path: '/' });
        } else {
            segments.push({ name: '~', path: homeDir });
        }

        // Build path progressively
        let currentSegPath = currentPath.startsWith('/') ? '' : homeDir;
        parts.forEach((part) => {
            currentSegPath = currentSegPath.endsWith('/') 
                ? `${currentSegPath}${part}` 
                : `${currentSegPath}/${part}`;
            segments.push({ name: part, path: currentSegPath });
        });

        return segments;
    }, [currentPath, homeDir]);

    // Navigate to breadcrumb segment
    const navigateToBreadcrumb = useCallback(async (path: string) => {
        const normalized = normalizePath(path);
        
        // Check if we need consent before navigating
        if (!isPathAllowed(normalized)) {
            const consented = await requestConsent(normalized);
            if (!consented) {
                // User denied consent, don't navigate
                return;
            }
        }
        
        setCurrentPath(normalized);
    }, [isPathAllowed, requestConsent, normalizePath]);

    // Format current path for display (truncate if too long, show middle ellipsis)
    const displayPath = React.useMemo(() => {
        const path = currentPath;
        const maxLength = 60;
        if (path.length > maxLength) {
            // Show first 25 and last 30 chars with ellipsis in middle
            const start = path.substring(0, 25);
            const end = path.substring(path.length - 30);
            return `${start}...${end}`;
        }
        return path;
    }, [currentPath]);

    return (
        <View style={styles.container}>
            {/* Current Path Display */}
            <View style={styles.currentPathDisplay}>
                <Ionicons name="folder" size={16} color={theme.colors.textSecondary} style={{ marginRight: 8 }} />
                <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false}
                    style={{ flex: 1 }}
                    contentContainerStyle={{ alignItems: 'center' }}
                >
                    <Text style={styles.currentPathText} numberOfLines={1}>
                        {displayPath}
                    </Text>
                </ScrollView>
                {/* Up button - navigate to parent */}
                {currentPath !== '/' && normalizePath(currentPath) !== normalizePath(homeDir) && (
                    <Pressable
                        onPress={navigateUp}
                        style={({ pressed }) => [
                            styles.upButton,
                            { opacity: pressed ? 0.6 : 1 }
                        ]}
                    >
                        <Ionicons name="arrow-up" size={18} color={theme.colors.textSecondary} />
                    </Pressable>
                )}
            </View>

            {/* Breadcrumb Navigation - Compact, only show if more than 2 segments */}
            {breadcrumbSegments.length > 2 && (
                <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false}
                    style={styles.breadcrumbContainer}
                    contentContainerStyle={styles.breadcrumbContent}
                >
                    {breadcrumbSegments.map((segment, index) => {
                        const isWindowsPath = currentPath.includes('\\');
                        const separator = isWindowsPath ? '\\' : '/';
                        const isLast = index === breadcrumbSegments.length - 1;
                        
                        return (
                            <View key={segment.path} style={styles.breadcrumbSegment}>
                                {index > 0 && (
                                    <Text style={[styles.breadcrumbSeparator, { fontSize: 12 }]}>
                                        {separator}
                                    </Text>
                                )}
                                <Pressable
                                    onPress={() => navigateToBreadcrumb(segment.path)}
                                    disabled={isLast}
                                >
                                    <Text
                                        style={[
                                            styles.breadcrumbText,
                                            isLast && styles.breadcrumbTextActive
                                        ]}
                                        numberOfLines={1}
                                    >
                                        {segment.name}
                                    </Text>
                                </Pressable>
                            </View>
                        );
                    })}
                </ScrollView>
            )}

            {/* Home Button - Only show if not at home */}
            {currentPath !== homeDir && normalizePath(currentPath) !== normalizePath(homeDir) && (
                <Pressable
                    onPress={navigateToHome}
                    style={styles.homeButton}
                >
                    <Ionicons name="home-outline" size={16} color={theme.colors.text} />
                    <Text style={styles.homeButtonText}>{t('pathPicker.goToHome')}</Text>
                </Pressable>
            )}

            {/* Content */}
            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={theme.colors.brand.primary} />
                    <Text style={styles.loadingText}>{t('pathPicker.loading')}</Text>
                </View>
            ) : error ? (
                <View style={styles.errorContainer}>
                    <Ionicons name="alert-circle-outline" size={24} color={theme.colors.textDestructive} />
                    <Text style={styles.errorText}>{error}</Text>
                    <Pressable
                        onPress={() => loadDirectory(currentPath)}
                        style={{ marginTop: 12, padding: 8 }}
                    >
                        <Text style={{ color: theme.colors.brand.primary, fontSize: 14 }}>
                            {t('common.retry')}
                        </Text>
                    </Pressable>
                </View>
            ) : entries.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Ionicons name="folder-outline" size={40} color={theme.colors.textSecondary} />
                    <Text style={styles.emptyText}>{t('pathPicker.emptyDirectory')}</Text>
                    {/* Select Current Folder Button even when empty */}
                    <Pressable
                        onPress={handleSelectPath}
                        style={[styles.selectButton, { marginTop: 24 }]}
                    >
                        <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
                        <Text style={styles.selectButtonText}>
                            {t('pathPicker.selectThisFolder')}
                        </Text>
                    </Pressable>
                </View>
            ) : (
                <ScrollView 
                    style={{ flex: 1 }}
                    contentContainerStyle={{ paddingBottom: 16 }}
                    showsVerticalScrollIndicator={true}
                >
                    <ItemGroup title={t('pathPicker.directories')} elevated={false} headerStyle={{ paddingTop: Platform.select({ ios: 12, default: 8 }) }} containerStyle={{ borderRadius: Platform.select({ ios: 8, default: 10 }) }}>
                        {entries.map((entry, index) => (
                            <Item
                                key={entry.name}
                                title={entry.name}
                                leftElement={
                                    <Ionicons
                                        name="folder-outline"
                                        size={18}
                                        color={theme.colors.textSecondary}
                                    />
                                }
                                onPress={() => navigateToDirectory(entry.name)}
                                showChevron={true}
                                showDivider={index < entries.length - 1}
                            />
                        ))}
                    </ItemGroup>

                    {/* Select Current Folder Button */}
                    <Pressable
                        onPress={handleSelectPath}
                        style={[styles.selectButton]}
                    >
                        <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
                        <Text style={styles.selectButtonText}>
                            {t('pathPicker.selectThisFolder')}
                        </Text>
                    </Pressable>
                </ScrollView>
            )}
        </View>
    );
});

DirectoryBrowser.displayName = 'DirectoryBrowser';
