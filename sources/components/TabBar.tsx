import * as React from 'react';
import { View, Pressable, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Image } from 'expo-image';
import { t } from '@/text';
import { Typography } from '@/constants/Typography';
import { layout } from '@/components/layout';
import { useInboxHasContent } from '@/hooks/useInboxHasContent';
import { useSettings } from '@/sync/storage';

export type TabType = 'inbox' | 'sessions' | 'settings';

interface TabBarProps {
    activeTab: TabType;
    onTabPress: (tab: TabType) => void;
    inboxBadgeCount?: number;
}

const styles = StyleSheet.create((theme) => ({
    outerContainer: {
        backgroundColor: theme.colors.surface,
        borderTopWidth: 1,
        borderTopColor: theme.colors.divider,
        ...theme.colors.elevation.level1,
    },
    innerContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'flex-start',
        maxWidth: layout.maxWidth,
        width: '100%',
        alignSelf: 'center',
    },
    tab: {
        flex: 1,
        alignItems: 'center',
        paddingTop: 8,
        paddingBottom: 4,
        position: 'relative',
    },
    tabContent: {
        alignItems: 'center',
        position: 'relative',
    },
    // Active tab indicator bar
    activeIndicator: {
        position: 'absolute',
        top: 0,
        left: '25%',
        right: '25%',
        height: 3,
        backgroundColor: theme.colors.brand.primary,
        borderRadius: 2,
    },
    label: {
        fontSize: 10,
        marginTop: 4,
        ...Typography.default(),
    },
    labelActive: {
        color: theme.colors.brand.primary,
        ...Typography.default('semiBold'),
    },
    labelInactive: {
        color: theme.colors.textSecondary,
    },
    badge: {
        position: 'absolute',
        top: -4,
        right: -8,
        backgroundColor: theme.colors.status.error,
        borderRadius: 8,
        minWidth: 16,
        height: 16,
        paddingHorizontal: 4,
        justifyContent: 'center',
        alignItems: 'center',
        ...theme.colors.elevation.level2,
    },
    badgeText: {
        color: '#FFFFFF',
        fontSize: 10,
        fontWeight: '700',
        ...Typography.default('semiBold'),
    },
    indicatorDot: {
        position: 'absolute',
        top: 0,
        right: -2,
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: theme.colors.brand.primary,
    },
}));

export const TabBar = React.memo(({ activeTab, onTabPress, inboxBadgeCount = 0 }: TabBarProps) => {
    const { theme } = useUnistyles();
    const insets = useSafeAreaInsets();
    const inboxHasContent = useInboxHasContent();
    const settings = useSettings();

    const tabs: { key: TabType; icon: any; label: string }[] = React.useMemo(() => {
        return [
            { key: 'inbox', icon: require('@/assets/images/brutalist/Brutalism 27.png'), label: t('tabs.inbox') },
            { key: 'sessions', icon: require('@/assets/images/brutalist/Brutalism 15.png'), label: t('tabs.sessions') },
            { key: 'settings', icon: require('@/assets/images/brutalist/Brutalism 9.png'), label: t('tabs.settings') },
        ];
    }, []);

    return (
        <View style={[styles.outerContainer, { paddingBottom: insets.bottom }]}>
            <View style={styles.innerContainer}>
                {tabs.map((tab) => {
                    const isActive = activeTab === tab.key;
                    
                    return (
                        <Pressable
                            key={tab.key}
                            style={styles.tab}
                            onPress={() => onTabPress(tab.key)}
                            hitSlop={8}
                        >
                            {/* Active tab indicator */}
                            {isActive && <View style={styles.activeIndicator} />}

                            <View style={styles.tabContent}>
                                <Image
                                    source={tab.icon}
                                    contentFit="contain"
                                    style={[{ width: 24, height: 24 }]}
                                    tintColor={isActive ? theme.colors.brand.primary : theme.colors.textSecondary}
                                />
                                {tab.key === 'inbox' && inboxBadgeCount > 0 && (
                                    <View style={styles.badge}>
                                        <Text style={styles.badgeText}>
                                            {inboxBadgeCount > 99 ? '99+' : inboxBadgeCount}
                                        </Text>
                                    </View>
                                )}
                                {tab.key === 'inbox' && inboxHasContent && inboxBadgeCount === 0 && (
                                    <View style={styles.indicatorDot} />
                                )}
                            </View>
                            <Text style={[
                                styles.label,
                                isActive ? styles.labelActive : styles.labelInactive
                            ]}>
                                {tab.label}
                            </Text>
                        </Pressable>
                    );
                })}
            </View>
        </View>
    );
});