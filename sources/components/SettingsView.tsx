import { View, Pressable, Platform, Linking, TextInput } from 'react-native';
import { Image } from 'expo-image';
import * as React from 'react';
import { Text } from '@/components/StyledText';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { useAuth } from '@/auth/AuthContext';
import { Typography } from '@/constants/Typography';
import { Item } from '@/components/Item';
import { ItemGroup } from '@/components/ItemGroup';
import { ItemList } from '@/components/ItemList';
import { useConnectTerminal } from '@/hooks/useConnectTerminal';
import { useEntitlement, useLocalSettingMutable, useSetting, useAllMachines, useProfile } from '@/sync/storage';
import { sync } from '@/sync/sync';
import { trackPaywallButtonClicked } from '@/track';
import { Modal } from '@/modal';
import { useMultiClick } from '@/hooks/useMultiClick';
import { isMachineOnline } from '@/utils/machineUtils';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { layout } from '@/components/layout';
import { useVibeAction } from '@/hooks/useVibeAction';
import { getGitHubOAuthParams, disconnectGitHub } from '@/sync/apiGithub';
import { disconnectService } from '@/sync/apiServices';
import { getDisplayName, getAvatarUrl, getBio } from '@/sync/profile';
import { Avatar } from '@/components/Avatar';
import { t } from '@/text';

type IoniconName = keyof typeof Ionicons.glyphMap;

const stylesheet = StyleSheet.create((theme) => ({
    list: {
        paddingTop: 0,
    },
    listContent: {
        paddingBottom: Platform.select({ ios: 48, default: 32 }),
    },
    heroWrapper: {
        maxWidth: layout.maxWidth,
        width: '100%',
        alignSelf: 'center',
    },
    heroCard: {
        marginHorizontal: 16,
        marginTop: 16,
        marginBottom: 8,
        backgroundColor: theme.colors.surface,
        borderRadius: 28,
        paddingVertical: 24,
        paddingHorizontal: 20,
        alignItems: 'center',
    },
    heroAvatar: {
        marginBottom: 12,
    },
    heroName: {
        fontSize: 20,
        fontWeight: '600',
        color: theme.colors.text,
    },
    heroBio: {
        fontSize: 14,
        lineHeight: 20,
        color: theme.colors.textSecondary,
        textAlign: 'center',
        marginTop: 4,
    },
    heroLogo: {
        fontSize: 56,
        ...Typography.logo(),
        color: theme.colors.text,
        textAlign: 'center',
        marginBottom: 12,
    },
    heroMeta: {
        marginTop: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    heroMetaLabel: {
        fontSize: 12,
        color: theme.colors.textSecondary,
        marginRight: 6,
    },
    heroMetaValue: {
        fontSize: 12,
        color: theme.colors.text,
        fontWeight: '600',
    },
    sectionSpacingFirst: {
        marginTop: 12,
    },
    sectionSpacing: {
        marginTop: 4,
    },
    sectionHeader: {
        paddingTop: 12,
        paddingBottom: 6,
        paddingHorizontal: 24,
    },
    sectionHeading: {
        flexDirection: 'row',
        alignItems: 'baseline',
        justifyContent: 'space-between',
    },
    sectionHeadingLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.colors.text,
    },
    sectionHeadingHelper: {
        fontSize: 12,
        color: theme.colors.textSecondary,
        marginLeft: 8,
        flexShrink: 1,
        textAlign: 'right',
    },
    sectionContainer: {
        borderRadius: 24,
    },
    manualModal: {
        width: 320,
        maxWidth: '100%',
        padding: 24,
        backgroundColor: theme.colors.surface,
        borderRadius: 20,
    },
    manualModalTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: theme.colors.text,
        marginBottom: 6,
    },
    manualModalDescription: {
        fontSize: 14,
        lineHeight: 20,
        color: theme.colors.textSecondary,
        marginBottom: 16,
    },
    manualInput: {
        borderWidth: 1,
        borderColor: theme.colors.divider,
        borderRadius: 12,
        paddingVertical: 12,
        paddingHorizontal: 14,
        fontSize: 14,
        color: theme.colors.input.text,
        backgroundColor: theme.colors.input.background,
        marginBottom: 16,
    },
    manualActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
    },
    manualAction: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 999,
    },
    manualActionText: {
        fontSize: 15,
        color: theme.colors.textSecondary,
    },
    manualActionPrimary: {
        marginLeft: 12,
    },
    manualActionPrimaryText: {
        fontSize: 15,
        fontWeight: '600',
        color: theme.colors.brand.primary,
    },
    manualActionDisabled: {
        opacity: 0.4,
    },
}));

function ManualAuthModal({ onClose, onSubmit }: { onClose: () => void; onSubmit: (url: string) => void }) {
    const styles = stylesheet;
    const { theme } = useUnistyles();
    const [url, setUrl] = React.useState('');
    const trimmed = url.trim();
    const isDisabled = trimmed.length === 0;

    const handleSubmit = React.useCallback(() => {
        if (isDisabled) {
            return;
        }
        onSubmit(trimmed);
        onClose();
    }, [isDisabled, onSubmit, onClose, trimmed]);

    return (
        <View style={styles.manualModal}>
            <Text style={styles.manualModalTitle}>{t('modals.authenticateTerminal')}</Text>
            <Text style={styles.manualModalDescription}>{t('modals.pasteUrlFromTerminal')}</Text>
            <TextInput
                style={styles.manualInput}
                value={url}
                onChangeText={setUrl}
                placeholder={'vibe://terminal?...'}
                placeholderTextColor={theme.colors.input.placeholder}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
                autoFocus
                onSubmitEditing={handleSubmit}
            />
            <View style={styles.manualActions}>
                <Pressable onPress={onClose} style={styles.manualAction}>
                    <Text style={styles.manualActionText}>{t('common.cancel')}</Text>
                </Pressable>
                <Pressable
                    onPress={handleSubmit}
                    disabled={isDisabled}
                    style={[styles.manualAction, styles.manualActionPrimary, isDisabled && styles.manualActionDisabled]}
                >
                    <Text style={styles.manualActionPrimaryText}>{t('common.authenticate')}</Text>
                </Pressable>
            </View>
        </View>
    );
}

export const SettingsView = React.memo(function SettingsView() {
    const styles = stylesheet;
    const { theme } = useUnistyles();
    const router = useRouter();
    const appVersion = Constants.expoConfig?.version || '1.0.0';
    const auth = useAuth();
    const [devModeEnabled, setDevModeEnabled] = useLocalSettingMutable('devModeEnabled');
    const isPro = __DEV__ || useEntitlement('pro');
    const experiments = useSetting('experiments');
    const allMachines = useAllMachines();
    const profile = useProfile();
    const displayName = getDisplayName(profile);
    const avatarUrl = getAvatarUrl(profile);
    const bio = getBio(profile);

    const { connectTerminal, connectWithUrl, isLoading } = useConnectTerminal();

    const openExternalLink = React.useCallback(async (url: string) => {
        try {
            const supported = await Linking.canOpenURL(url);
            if (supported) {
                await Linking.openURL(url);
            }
        } catch (error) {
            console.error('Failed to open URL', error);
        }
    }, []);

    const handleSubscribe = React.useCallback(async () => {
        trackPaywallButtonClicked();
        const result = await sync.presentPaywall();
        if (!result.success) {
            console.error('Failed to present paywall:', result.error);
        } else if (result.purchased) {
            console.log('Purchase successful!');
        }
    }, []);

    const handleVersionClick = useMultiClick(() => {
        const newDevMode = !devModeEnabled;
        setDevModeEnabled(newDevMode);
        Modal.alert(
            t('modals.developerMode'),
            newDevMode ? t('modals.developerModeEnabled') : t('modals.developerModeDisabled')
        );
    }, {
        requiredClicks: 10,
        resetTimeout: 2000
    });

    const isGitHubConnected = !!profile.github;
    const isAnthropicConnected = profile.connectedServices?.includes('anthropic') || false;

    const [connectingGitHub, connectGitHub] = useVibeAction(async () => {
        const params = await getGitHubOAuthParams(auth.credentials!);
        await Linking.openURL(params.url);
    });

    const [disconnectingGitHub, handleDisconnectGitHub] = useVibeAction(async () => {
        const confirmed = await Modal.confirm(
            t('modals.disconnectGithub'),
            t('modals.disconnectGithubConfirm'),
            { confirmText: t('modals.disconnect'), destructive: true }
        );
        if (confirmed) {
            await disconnectGitHub(auth.credentials!);
        }
    });

    const [connectingAnthropic, connectAnthropic] = useVibeAction(async () => {
        router.push('/settings/connect/claude');
    });

    const [disconnectingAnthropic, handleDisconnectAnthropic] = useVibeAction(async () => {
        const confirmed = await Modal.confirm(
            t('modals.disconnectService', { service: 'Claude' }),
            t('modals.disconnectServiceConfirm', { service: 'Claude' }),
            { confirmText: t('modals.disconnect'), destructive: true }
        );
        if (confirmed) {
            await disconnectService(auth.credentials!, 'anthropic');
            await sync.refreshProfile();
        }
    });

    const showManualAuthModal = React.useCallback(() => {
        Modal.show({
            component: ManualAuthModal,
            props: {
                onSubmit: (url: string) => {
                    connectWithUrl(url.trim());
                }
            }
        });
    }, [connectWithUrl]);

    const machines = React.useMemo(() => {
        return [...allMachines].sort((a, b) => {
            const aOnline = isMachineOnline(a);
            const bOnline = isMachineOnline(b);
            if (aOnline !== bOnline) {
                return aOnline ? -1 : 1;
            }
            return (b.activeAt ?? 0) - (a.activeAt ?? 0);
        });
    }, [allMachines]);

    const sectionProps = React.useMemo(() => ({
        accent: 'none' as const,
        elevated: false,
        headerStyle: styles.sectionHeader,
        containerStyle: styles.sectionContainer,
    }), [styles.sectionHeader, styles.sectionContainer]);

    const renderSectionHeading = (label: string, helper?: string) => (
        <View style={styles.sectionHeading}>
            <Text style={styles.sectionHeadingLabel}>{label}</Text>
            {helper ? (
                <Text style={styles.sectionHeadingHelper} numberOfLines={1}>
                    {helper}
                </Text>
            ) : null}
        </View>
    );

    const featureItems: Array<{ key: string; title: string; subtitle: string; route: string; icon: IoniconName }> = [
        {
            key: 'account',
            title: t('settings.account'),
            subtitle: t('settings.accountSubtitle'),
            icon: 'person-circle-outline',
            route: '/settings/account'
        },
        {
            key: 'appearance',
            title: t('settings.appearance'),
            subtitle: t('settings.appearanceSubtitle'),
            icon: 'color-palette-outline',
            route: '/settings/appearance'
        },
        {
            key: 'voice',
            title: t('settings.voiceAssistant'),
            subtitle: t('settings.voiceAssistantSubtitle'),
            icon: 'mic-outline',
            route: '/settings/voice'
        },
        {
            key: 'features',
            title: t('settings.featuresTitle'),
            subtitle: t('settings.featuresSubtitle'),
            icon: 'flask-outline',
            route: '/settings/features'
        },
        {
            key: 'providers',
            title: t('providerSettings.title'),
            subtitle: t('providerSettings.subtitle'),
            icon: 'settings-outline',
            route: '/settings/providers'
        }
    ];

    if (experiments) {
        featureItems.push({
            key: 'usage',
            title: t('settings.usage'),
            subtitle: t('settings.usageSubtitle'),
            icon: 'analytics-outline',
            route: '/settings/usage'
        });
    }

    const aboutItems: Array<{ key: string; title: string; subtitle?: string; detail?: string; icon: IoniconName; onPress: () => void }> = [
        {
            key: 'whats-new',
            title: t('settings.whatsNew'),
            subtitle: t('settings.whatsNewSubtitle'),
            icon: 'sparkles-outline',
            onPress: () => openExternalLink('https://github.com/SGranquist13/vibe-mobile/releases')
        },
        {
            key: 'repo',
            title: t('settings.github'),
            detail: 'SGranquist13/vibe-mobile',
            icon: 'logo-github',
            onPress: () => openExternalLink('https://github.com/SGranquist13/vibe-mobile')
        },
        {
            key: 'issues',
            title: t('settings.reportIssue'),
            icon: 'bug-outline',
            onPress: () => openExternalLink('https://github.com/SGranquist13/vibe-mobile/issues')
        },
        {
            key: 'privacy',
            title: t('settings.privacyPolicy'),
            icon: 'shield-checkmark-outline',
            onPress: () => openExternalLink('https://github.com/SGranquist13/vibe-mobile/blob/main/PRIVACY.md')
        },
        {
            key: 'terms',
            title: t('settings.termsOfService'),
            icon: 'document-text-outline',
            onPress: () => openExternalLink('https://github.com/SGranquist13/vibe-mobile/blob/main/TERMS.md')
        }
    ];

    if (Platform.OS === 'ios') {
        aboutItems.push({
            key: 'eula',
            title: t('settings.eula'),
            icon: 'document-text-outline',
            onPress: () => openExternalLink('https://www.apple.com/legal/internet-services/itunes/dev/stdeula/')
        });
    }

    return (
        <ItemList style={styles.list} containerStyle={styles.listContent}>
            <View style={styles.heroWrapper}>
                <View style={styles.heroCard}>
                    {profile.firstName ? (
                        <>
                            <View style={styles.heroAvatar}>
                                <Avatar
                                    id={profile.id}
                                    size={90}
                                    imageUrl={avatarUrl}
                                    thumbhash={profile.avatar?.thumbhash}
                                />
                            </View>
                            <Text style={styles.heroName}>{displayName}</Text>
                            {bio ? (
                                <Text style={styles.heroBio}>{bio}</Text>
                            ) : null}
                        </>
                    ) : (
                        <Text style={styles.heroLogo}>VOTG</Text>
                    )}
                    <Pressable onPress={handleVersionClick} hitSlop={10}>
                        <View style={styles.heroMeta}>
                            <Text style={styles.heroMetaLabel}>{t('common.version')}</Text>
                            <Text style={styles.heroMetaValue}>{appVersion}</Text>
                        </View>
                    </Pressable>
                </View>
            </View>

            {Platform.OS !== 'web' && (
                <ItemGroup
                    {...sectionProps}
                    style={styles.sectionSpacingFirst}
                    title={renderSectionHeading(t('tabs.sessions'), t('settings.scanQrCodeToAuthenticate'))}
                >
                    <Item
                        title={t('settings.scanQrCodeToAuthenticate')}
                        icon={<Ionicons name="qr-code-outline" size={29} color={theme.colors.text} />}
                        onPress={connectTerminal}
                        loading={isLoading}
                        showChevron={false}
                    />
                    <Item
                        title={t('connect.enterUrlManually')}
                        icon={<Ionicons name="link-outline" size={29} color={theme.colors.text} />}
                        onPress={showManualAuthModal}
                        showChevron={false}
                    />
                </ItemGroup>
            )}

            <ItemGroup
                {...sectionProps}
                style={styles.sectionSpacing}
                title={renderSectionHeading(t('settings.supportUs'))}
            >
                <Item
                    title={t('settings.supportUs')}
                    subtitle={isPro ? t('settings.supportUsSubtitlePro') : t('settings.supportUsSubtitle')}
                    icon={<Ionicons name="heart" size={29} color={theme.colors.text} />}
                    showChevron={!isPro}
                    onPress={isPro ? undefined : handleSubscribe}
                />
            </ItemGroup>

            <ItemGroup
                {...sectionProps}
                style={styles.sectionSpacing}
                title={renderSectionHeading(t('settings.connectedAccounts'), t('settings.connectAccount'))}
            >
                <Item
                    title="Claude Code"
                    subtitle={isAnthropicConnected
                        ? t('settingsAccount.statusActive')
                        : t('settings.connectAccount')
                    }
                    icon={(
                        <Image
                            source={require('@/assets/images/icon-claude.png')}
                            style={{ width: 29, height: 29 }}
                            contentFit="contain"
                            tintColor={theme.colors.text}
                        />
                    )}
                    onPress={isAnthropicConnected ? handleDisconnectAnthropic : connectAnthropic}
                    loading={connectingAnthropic || disconnectingAnthropic}
                    showChevron={false}
                />
                <Item
                    title={t('settings.github')}
                    subtitle={isGitHubConnected
                        ? t('settings.githubConnected', { login: profile.github?.login! })
                        : t('settings.connectGithubAccount')
                    }
                    icon={<Ionicons name="logo-github" size={29} color={theme.colors.text} />}
                    onPress={isGitHubConnected ? handleDisconnectGitHub : connectGitHub}
                    loading={connectingGitHub || disconnectingGitHub}
                    showChevron={false}
                />
            </ItemGroup>

            {machines.length > 0 && (
                <ItemGroup
                    {...sectionProps}
                    style={styles.sectionSpacing}
                    title={renderSectionHeading(t('settings.machines'))}
                >
                    {machines.map((machine) => {
                        const isOnline = isMachineOnline(machine);
                        const host = machine.metadata?.host || t('settingsAccount.notAvailable');
                        const display = machine.metadata?.displayName || host;
                        const platformLabel = machine.metadata?.platform;
                        const subtitleParts: string[] = [];
                        if (machine.metadata?.displayName && machine.metadata.displayName !== host) {
                            subtitleParts.push(host);
                        }
                        if (platformLabel) {
                            subtitleParts.push(platformLabel);
                        }
                        subtitleParts.push(isOnline ? t('status.online') : t('status.offline'));

                        return (
                            <Item
                                key={machine.id}
                                title={display}
                                subtitle={subtitleParts.join(' • ')}
                                subtitleLines={0}
                                icon={(
                                    <Ionicons
                                        name="desktop-outline"
                                        size={29}
                                        color={isOnline ? theme.colors.status.connected : theme.colors.status.disconnected}
                                    />
                                )}
                                onPress={() => router.push(`/machine/${machine.id}`)}
                            />
                        );
                    })}
                </ItemGroup>
            )}

            <ItemGroup
                {...sectionProps}
                style={styles.sectionSpacing}
                title={renderSectionHeading(t('settings.features'), t('settings.featuresSubtitle'))}
            >
                {featureItems.map((item) => (
                    <Item
                        key={item.key}
                        title={item.title}
                        subtitle={item.subtitle}
                        icon={<Ionicons name={item.icon} size={29} color={theme.colors.text} />}
                        onPress={() => router.push(item.route)}
                    />
                ))}
            </ItemGroup>

            {(__DEV__ || devModeEnabled) && (
                <ItemGroup
                    {...sectionProps}
                    style={styles.sectionSpacing}
                    title={renderSectionHeading(t('settings.developer'), t('settings.developerTools'))}
                >
                    <Item
                        title={t('settings.developerTools')}
                        icon={<Ionicons name="construct-outline" size={29} color={theme.colors.text} />}
                        onPress={() => router.push('/dev')}
                    />
                </ItemGroup>
            )}

            <ItemGroup
                {...sectionProps}
                style={styles.sectionSpacing}
                title={renderSectionHeading(t('settings.about'))}
                footer={t('settings.aboutFooter')}
            >
                {aboutItems.map((item) => (
                    <Item
                        key={item.key}
                        title={item.title}
                        subtitle={item.subtitle}
                        detail={item.detail}
                        icon={<Ionicons name={item.icon} size={29} color={theme.colors.text} />}
                        onPress={item.onPress}
                    />
                ))}
                <Item
                    title={t('common.version')}
                    detail={appVersion}
                    icon={<Ionicons name="information-circle-outline" size={29} color={theme.colors.textSecondary} />}
                    onPress={handleVersionClick}
                    showChevron={false}
                />
            </ItemGroup>
        </ItemList>
    );
});
