import * as React from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator, Platform } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { useAcceptedFriends, useFriendRequests, useRequestedFriends, useSocketStatus, useFeedItems, useFeedLoaded, useFriendsLoaded } from '@/sync/storage';
import { StatusDot } from './StatusDot';
import { UserCard } from '@/components/UserCard';
import { t } from '@/text';
import { ItemGroup } from '@/components/ItemGroup';
import { UpdateBanner } from './UpdateBanner';
import { Typography } from '@/constants/Typography';
import { useRouter } from 'expo-router';
import { layout } from '@/components/layout';
import { useIsTablet } from '@/utils/responsive';
import { Header } from './navigation/Header';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { FeedItemCard } from './FeedItemCard';
import { usePopulateIntegrationReleases } from '@/hooks/usePopulateIntegrationReleases';

const styles = StyleSheet.create((theme) => ({
    container: {
        flex: 1,
        backgroundColor: theme.colors.groupped.background,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    emptyIcon: {
        marginBottom: 16,
    },
    emptyTitle: {
        fontSize: 20,
        ...Typography.default('semiBold'),
        color: theme.colors.text,
        marginBottom: 8,
        textAlign: 'center',
    },
    emptyDescription: {
        fontSize: 16,
        ...Typography.default(),
        color: theme.colors.textSecondary,
        textAlign: 'center',
        lineHeight: 22,
    },
    sectionHeader: {
        fontSize: 14,
        ...Typography.default('semiBold'),
        color: theme.colors.textSecondary,
        paddingHorizontal: 16,
        paddingTop: 24,
        paddingBottom: 8,
        textTransform: 'uppercase',
    },
}));

interface InboxViewProps {
}

function HeaderTitle() {
    const { theme } = useUnistyles();
    const socketStatus = useSocketStatus();
    
    const getConnectionStatus = () => {
        const { status } = socketStatus;
        switch (status) {
            case 'connected':
                return {
                    color: theme.colors.status.connected,
                    isPulsing: false,
                    text: t('status.connected'),
                    textColor: theme.colors.status.connected
                };
            case 'connecting':
                return {
                    color: theme.colors.status.connecting,
                    isPulsing: true,
                    text: t('status.connecting'),
                    textColor: theme.colors.status.connecting
                };
            case 'disconnected':
                return {
                    color: theme.colors.status.disconnected,
                    isPulsing: false,
                    text: t('status.disconnected'),
                    textColor: theme.colors.status.disconnected
                };
            case 'error':
                return {
                    color: theme.colors.status.error,
                    isPulsing: false,
                    text: t('status.error'),
                    textColor: theme.colors.status.error
                };
            default:
                return {
                    color: theme.colors.status.default,
                    isPulsing: false,
                    text: '',
                    textColor: theme.colors.status.default
                };
        }
    };

    const connectionStatus = getConnectionStatus();
    
    return (
        <View style={{ flex: 1, alignItems: 'center' }}>
            <Text style={{
                fontSize: 17,
                color: theme.colors.header.tint,
                fontWeight: '600',
                ...Typography.default('semiBold'),
            }}>
                {t('tabs.inbox')}
            </Text>
            {connectionStatus.text && (
                <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    marginTop: -2,
                }}>
                    <StatusDot
                        color={connectionStatus.color}
                        isPulsing={connectionStatus.isPulsing}
                        size={6}
                        style={{ marginRight: 4 }}
                    />
                    <Text style={{
                        fontSize: 12,
                        fontWeight: '500',
                        lineHeight: 16,
                        color: connectionStatus.textColor,
                        ...Typography.default(),
                    }}>
                        {connectionStatus.text}
                    </Text>
                </View>
            )}
        </View>
    );
}

function HeaderLeft() {
    const { theme } = useUnistyles();
    return (
        <View style={{
            width: 40,
            height: 32,
            alignItems: 'center',
            justifyContent: 'center',
        }}>
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

function HeaderRight() {
    const router = useRouter();
    const { theme } = useUnistyles();
    return (
        <Pressable
            onPress={() => router.push('/friends/search')}
            hitSlop={15}
            style={{
                width: 32,
                height: 32,
                alignItems: 'center',
                justifyContent: 'center',
            }}
        >
            <Ionicons name="person-add-outline" size={24} color={theme.colors.header.tint} />
        </Pressable>
    );
}

// Simplified header components for tablet
function HeaderTitleTablet() {
    const { theme } = useUnistyles();
    return (
        <Text style={{
            fontSize: 17,
            color: theme.colors.header.tint,
            fontWeight: '600',
            ...Typography.default('semiBold'),
        }}>
            {t('tabs.inbox')}
        </Text>
    );
}

export const InboxView = React.memo(({}: InboxViewProps) => {
    const router = useRouter();
    const friends = useAcceptedFriends();
    const friendRequests = useFriendRequests();
    const requestedFriends = useRequestedFriends();
    const feedItems = useFeedItems();
    const feedLoaded = useFeedLoaded();
    const friendsLoaded = useFriendsLoaded();
    const { theme } = useUnistyles();
    const isTablet = useIsTablet();
    
    // Populate integration releases on mount
    usePopulateIntegrationReleases();

    const isLoading = !feedLoaded || !friendsLoaded;
    
    // Separate feed items by type
    const systemNotifications = feedItems.filter(item => item.body.kind === 'system_notification');
    const integrationUpdates = feedItems.filter(item => item.body.kind === 'integration_update');
    const socialFeedItems = feedItems.filter(item => 
        item.body.kind === 'friend_request' || 
        item.body.kind === 'friend_accepted' || 
        item.body.kind === 'text'
    );
    
    // Group integration updates by integration name
    const integrationGroups = React.useMemo(() => {
        const groups: Record<string, typeof integrationUpdates> = {};
        integrationUpdates.forEach(item => {
            if (item.body.kind === 'integration_update') {
                const integrationName = item.body.integration;
                if (!groups[integrationName]) {
                    groups[integrationName] = [];
                }
                groups[integrationName].push(item);
            }
        });
        return groups;
    }, [integrationUpdates]);
    
    const isEmpty = !isLoading && 
        friendRequests.length === 0 && 
        requestedFriends.length === 0 && 
        friends.length === 0 && 
        feedItems.length === 0;

    if (isLoading) {
        return (
            <View style={styles.container}>
                <View style={{ backgroundColor: theme.colors.groupped.background }}>
                    <Header
                        title={isTablet ? <HeaderTitleTablet /> : <HeaderTitle />}
                        headerRight={() => <HeaderRight />}
                        headerLeft={isTablet ? () => null : () => <HeaderLeft />}
                        headerShadowVisible={false}
                        headerTransparent={true}
                    />
                </View>
                <UpdateBanner />
                <View style={styles.emptyContainer}>
                    <ActivityIndicator size="large" color={theme.colors.textSecondary} />
                </View>
            </View>
        );
    }

    if (isEmpty) {
        return (
            <View style={styles.container}>
                <View style={{ backgroundColor: theme.colors.groupped.background }}>
                    <Header
                        title={isTablet ? <HeaderTitleTablet /> : <HeaderTitle />}
                        headerRight={() => <HeaderRight />}
                        headerLeft={isTablet ? () => null : () => <HeaderLeft />}
                        headerShadowVisible={false}
                        headerTransparent={true}
                    />
                </View>
                <UpdateBanner />
                <View style={styles.emptyContainer}>
                    <Image
                        source={require('@/assets/images/brutalist/Brutalism 10.png')}
                        contentFit="contain"
                        style={[{ width: 64, height: 64 }, styles.emptyIcon]}
                        tintColor={theme.colors.textSecondary}
                    />
                    <Text style={styles.emptyTitle}>{t('inbox.emptyTitle')}</Text>
                    <Text style={styles.emptyDescription}>{t('inbox.emptyDescription')}</Text>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={{ backgroundColor: theme.colors.groupped.background }}>
                <Header
                    title={isTablet ? <HeaderTitleTablet /> : <HeaderTitle />}
                    headerRight={() => <HeaderRight />}
                    headerLeft={isTablet ? () => null : () => <HeaderLeft />}
                    headerShadowVisible={false}
                    headerTransparent={true}
                />
            </View>
            <ScrollView contentContainerStyle={{ 
                maxWidth: layout.maxWidth, 
                alignSelf: 'center', 
                width: '100%'
            }}>
                <UpdateBanner />
                
                {/* System Notifications - Highest Priority */}
                {systemNotifications.length > 0 && (
                    <ItemGroup 
                        title={t('inbox.systemNotifications')} 
                        elevated={false}
                        headerStyle={{ paddingTop: Platform.select({ ios: 12, default: 8 }) }}
                        containerStyle={{ borderRadius: Platform.select({ ios: 8, default: 10 }) }}
                    >
                        {systemNotifications.map((item) => (
                            <FeedItemCard
                                key={item.id}
                                item={item}
                            />
                        ))}
                    </ItemGroup>
                )}
                
                {/* Integration Updates - Grouped by integration */}
                {Object.entries(integrationGroups).map(([integrationName, items]) => (
                    <ItemGroup 
                        key={integrationName} 
                        title={integrationName}
                        elevated={false}
                        headerStyle={{ paddingTop: Platform.select({ ios: 12, default: 8 }) }}
                        containerStyle={{ borderRadius: Platform.select({ ios: 8, default: 10 }) }}
                    >
                        {items.map((item) => (
                            <FeedItemCard
                                key={item.id}
                                item={item}
                            />
                        ))}
                    </ItemGroup>
                ))}
                
                {/* Social Feed Items */}
                {socialFeedItems.length > 0 && (
                    <ItemGroup 
                        title={t('inbox.updates')} 
                        elevated={false}
                        headerStyle={{ paddingTop: Platform.select({ ios: 12, default: 8 }) }}
                        containerStyle={{ borderRadius: Platform.select({ ios: 8, default: 10 }) }}
                    >
                        {socialFeedItems.map((item) => (
                            <FeedItemCard
                                key={item.id}
                                item={item}
                            />
                        ))}
                    </ItemGroup>
                )}
                
                {/* Friend Requests */}
                {friendRequests.length > 0 && (
                    <ItemGroup 
                        title={t('friends.pendingRequests')} 
                        elevated={false}
                        headerStyle={{ paddingTop: Platform.select({ ios: 12, default: 8 }) }}
                        containerStyle={{ borderRadius: Platform.select({ ios: 8, default: 10 }) }}
                    >
                        {friendRequests.map((friend) => (
                            <UserCard
                                key={friend.id}
                                user={friend}
                                onPress={() => router.push(`/user/${friend.id}`)}
                            />
                        ))}
                    </ItemGroup>
                )}

                {/* Requested Friends */}
                {requestedFriends.length > 0 && (
                    <ItemGroup 
                        title={t('friends.requestPending')} 
                        elevated={false}
                        headerStyle={{ paddingTop: Platform.select({ ios: 12, default: 8 }) }}
                        containerStyle={{ borderRadius: Platform.select({ ios: 8, default: 10 }) }}
                    >
                        {requestedFriends.map((friend) => (
                            <UserCard
                                key={friend.id}
                                user={friend}
                                onPress={() => router.push(`/user/${friend.id}`)}
                            />
                        ))}
                    </ItemGroup>
                )}

                {/* Friends List */}
                {friends.length > 0 && (
                    <ItemGroup 
                        title={t('friends.myFriends')} 
                        elevated={false}
                        headerStyle={{ paddingTop: Platform.select({ ios: 12, default: 8 }) }}
                        containerStyle={{ borderRadius: Platform.select({ ios: 8, default: 10 }) }}
                    >
                        {friends.map((friend) => (
                            <UserCard
                                key={friend.id}
                                user={friend}
                                onPress={() => router.push(`/user/${friend.id}`)}
                            />
                        ))}
                    </ItemGroup>
                )}
            </ScrollView>
        </View>
    );
});