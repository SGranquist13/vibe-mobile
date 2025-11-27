import * as React from 'react';
import { FeedItem } from '@/sync/feedTypes';
import { Ionicons } from '@expo/vector-icons';
import { t } from '@/text';
import { useRouter } from 'expo-router';
import { useUser, storage } from '@/sync/storage';
import { Avatar } from './Avatar';
import { Item } from './Item';
import { useUnistyles, StyleSheet } from 'react-native-unistyles';
import { Linking, View, Text, Pressable } from 'react-native';
import { useAuth } from '@/auth/AuthContext';
import { deleteFeedItem } from '@/sync/apiFeed';
import { Typography } from '@/constants/Typography';

interface FeedItemCardProps {
    item: FeedItem;
    onDismiss?: () => void;
}

export const FeedItemCard = React.memo(({ item, onDismiss }: FeedItemCardProps) => {
    const { theme } = useUnistyles();
    const router = useRouter();
    const { credentials } = useAuth();
    const [isDismissing, setIsDismissing] = React.useState(false);
    
    const styles = StyleSheet.create((theme) => ({
        dismissButton: {
            padding: 8,
            marginRight: -8,
        },
        readMoreLink: {
            marginTop: 8,
            marginBottom: 4,
            paddingVertical: 8,
            paddingLeft: 16,
            paddingRight: 16,
        },
        readMoreText: {
            fontSize: 14,
            ...Typography.default('semiBold'),
            color: theme.colors.brand.primary,
            textDecorationLine: 'underline',
        },
    }));
    
    // Get user profile from global users cache for friend-related items
    // User MUST exist for friend-related items or they would have been filtered out
    const user = useUser(
        (item.body.kind === 'friend_request' || item.body.kind === 'friend_accepted')
            ? item.body.uid 
            : undefined
    );
    
    const getTimeAgo = (timestamp: number) => {
        const now = Date.now();
        const diff = now - timestamp;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);
        
        if (minutes < 1) return t('time.justNow');
        if (minutes < 60) return t('time.minutesAgo', { count: minutes });
        if (hours < 24) return t('time.hoursAgo', { count: hours });
        return t('sessionHistory.daysAgo', { count: days });
    };
    
    switch (item.body.kind) {
        case 'friend_request': {
            const avatarElement = user!.avatar ? (
                <Avatar 
                    id={user!.id}
                    imageUrl={user!.avatar.url}
                    size={40}
                />
            ) : (
                <Ionicons name="person" size={20} color={theme.colors.textSecondary} />
            );
            
            return (
                <Item
                    title={t('feed.friendRequestFrom', { name: user!.firstName || user!.username })}
                    subtitle={getTimeAgo(item.createdAt)}
                    leftElement={avatarElement}
                    onPress={() => router.push(`/user/${user!.id}`)}
                    showChevron={true}
                />
            );
        }
            
        case 'friend_accepted': {
            const avatarElement = user!.avatar ? (
                <Avatar 
                    id={user!.id}
                    imageUrl={user!.avatar.url}
                    size={40}
                />
            ) : (
                <Ionicons name="checkmark-circle" size={20} color={theme.colors.status.connected} />
            );
            
            return (
                <Item
                    title={t('feed.friendAccepted', { name: user!.firstName || user!.username })}
                    subtitle={getTimeAgo(item.createdAt)}
                    leftElement={avatarElement}
                    onPress={() => router.push(`/user/${user!.id}`)}
                    showChevron={true}
                />
            );
        }
            
        case 'text':
            return (
                <Item
                    title={item.body.text}
                    subtitle={getTimeAgo(item.createdAt)}
                    icon={<Ionicons name="information-circle" size={20} color={theme.colors.textSecondary} />}
                    showChevron={false}
                />
            );

        case 'integration_update': {
            const { integration, version, message, type, releaseUrl } = item.body;
            
            const getIcon = () => {
                switch (type) {
                    case 'update':
                        return <Ionicons name="arrow-up-circle" size={20} color={theme.colors.brand.primary} />;
                    case 'issue':
                        return <Ionicons name="warning" size={20} color={theme.colors.warning} />;
                    case 'deprecation':
                        return <Ionicons name="alert-circle" size={20} color={theme.colors.warning} />;
                    case 'feature':
                        return <Ionicons name="sparkles" size={20} color={theme.colors.success} />;
                    default:
                        return <Ionicons name="information-circle" size={20} color={theme.colors.textSecondary} />;
                }
            };

            const getTitle = () => {
                const integrationName = integration.charAt(0).toUpperCase() + integration.slice(1);
                if (version) {
                    return t('inbox.integrationUpdate.title', { integration: integrationName, version });
                }
                return t('inbox.integrationUpdate.titleNoVersion', { integration: integrationName });
            };

            // Truncate message to first 3 lines (approximately 200 characters)
            const MAX_PREVIEW_LENGTH = 200;
            const lines = message.split('\n');
            const previewLines = lines.slice(0, 3);
            const previewText = previewLines.join('\n');
            const shouldTruncate = message.length > MAX_PREVIEW_LENGTH || lines.length > 3;
            const displayText = shouldTruncate 
                ? (previewText.length > MAX_PREVIEW_LENGTH 
                    ? previewText.substring(0, MAX_PREVIEW_LENGTH) + '...' 
                    : previewText + (previewText.length < message.length ? '...' : ''))
                : message;
            
            // Map integration display names to their GitHub repos for fallback URLs
            const integrationRepoMap: Record<string, string> = {
                'Gemini CLI': 'google-gemini/gemini-cli',
                'Codex': 'cursor-ai/codex-cli',
                'Cursor': 'getcursor/cursor',
                'Claude Code': 'anthropic-ai/claude-code',
                'MCP SDK': '@modelcontextprotocol/sdk' // npm package
            };
            
            // Construct fallback URL if releaseUrl is missing
            let effectiveReleaseUrl = releaseUrl;
            if (!effectiveReleaseUrl && integration) {
                const repo = integrationRepoMap[integration];
                if (repo) {
                    if (repo.startsWith('@')) {
                        // npm package - use npm URL
                        effectiveReleaseUrl = `https://www.npmjs.com/package/${repo}`;
                    } else {
                        // GitHub repo - use releases page
                        effectiveReleaseUrl = `https://github.com/${repo}/releases`;
                    }
                }
            }

            const handleDismiss = async () => {
                if (!credentials || isDismissing) return;
                
                setIsDismissing(true);
                try {
                    await deleteFeedItem(credentials, item.id);
                    storage.getState().deleteFeedItem(item.id);
                    onDismiss?.();
                } catch (error) {
                    console.error('Failed to dismiss feed item:', error);
                } finally {
                    setIsDismissing(false);
                }
            };

            const handleReadMore = async () => {
                if (effectiveReleaseUrl) {
                    try {
                        const supported = await Linking.canOpenURL(effectiveReleaseUrl);
                        if (supported) {
                            await Linking.openURL(effectiveReleaseUrl);
                        }
                    } catch (error) {
                        console.error('Error opening release URL:', error);
                    }
                }
            };

            const dismissButton = (
                <Pressable
                    onPress={handleDismiss}
                    disabled={isDismissing}
                    style={styles.dismissButton}
                    hitSlop={8}
                >
                    <Ionicons 
                        name="close" 
                        size={20} 
                        color={theme.colors.textSecondary} 
                    />
                </Pressable>
            );

            return (
                <View>
                    <Item
                        title={getTitle()}
                        subtitle={displayText}
                        subtitleLines={3}
                        icon={getIcon()}
                        showChevron={false}
                        rightElement={dismissButton}
                    />
                    {shouldTruncate && effectiveReleaseUrl && (
                        <Pressable onPress={handleReadMore} style={styles.readMoreLink}>
                            <Text style={styles.readMoreText}>
                                {t('inbox.integrationUpdate.readMore')}
                            </Text>
                        </Pressable>
                    )}
                </View>
            );
        }

        case 'system_notification': {
            const { title, message, severity, actionUrl } = item.body;
            
            const getIcon = () => {
                switch (severity) {
                    case 'error':
                        return <Ionicons name="close-circle" size={20} color={theme.colors.textDestructive} />;
                    case 'warning':
                        return <Ionicons name="warning" size={20} color={theme.colors.warning} />;
                    case 'success':
                        return <Ionicons name="checkmark-circle" size={20} color={theme.colors.success} />;
                    case 'info':
                    default:
                        return <Ionicons name="information-circle" size={20} color={theme.colors.brand.primary} />;
                }
            };

            const handlePress = async () => {
                if (actionUrl) {
                    try {
                        const supported = await Linking.canOpenURL(actionUrl);
                        if (supported) {
                            await Linking.openURL(actionUrl);
                        }
                    } catch (error) {
                        console.error('Error opening URL:', error);
                    }
                }
            };

            const handleDismiss = async () => {
                if (!credentials || isDismissing) return;
                
                setIsDismissing(true);
                try {
                    await deleteFeedItem(credentials, item.id);
                    storage.getState().deleteFeedItem(item.id);
                    onDismiss?.();
                } catch (error) {
                    console.error('Failed to dismiss feed item:', error);
                } finally {
                    setIsDismissing(false);
                }
            };

            const dismissButton = (
                <Pressable
                    onPress={handleDismiss}
                    disabled={isDismissing}
                    style={styles.dismissButton}
                    hitSlop={8}
                >
                    <Ionicons 
                        name="close" 
                        size={20} 
                        color={theme.colors.textSecondary} 
                    />
                </Pressable>
            );

            return (
                <Item
                    title={title}
                    subtitle={message}
                    icon={getIcon()}
                    onPress={actionUrl ? handlePress : undefined}
                    showChevron={!!actionUrl}
                    rightElement={dismissButton}
                />
            );
        }
            
        default:
            return null;
    }
});