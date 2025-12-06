import * as React from 'react';
import { View, Text, StyleSheet, Platform, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Avatar } from '@/components/Avatar';
import { Typography } from '@/constants/Typography';
import { useHeaderHeight } from '@/utils/responsive';
import { layout } from '@/components/layout';
import { useUnistyles } from 'react-native-unistyles';

interface ChatHeaderViewProps {
    title: string;
    subtitle?: string;
    onBackPress?: () => void;
    onAvatarPress?: () => void;
    avatarId?: string;
    backgroundColor?: string;
    tintColor?: string;
    isConnected?: boolean;
    flavor?: string | null;
}

export const ChatHeaderView: React.FC<ChatHeaderViewProps> = ({
    title,
    subtitle,
    onBackPress,
    onAvatarPress,
    avatarId,
    isConnected = true,
    flavor,
}) => {
    const { theme } = useUnistyles();
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();
    const headerHeight = useHeaderHeight();

    const handleBackPress = () => {
        if (onBackPress) {
            onBackPress();
        } else {
            navigation.goBack();
        }
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            {/* Premium background with blur and gradient */}
            {Platform.OS === 'ios' ? (
                <BlurView
                    intensity={theme.dark ? 40 : 90}
                    tint={theme.dark ? 'dark' : 'light'}
                    style={styles.blurBackground}
                >
                    <LinearGradient
                        colors={theme.dark
                            ? ['rgba(18, 18, 20, 0.95)', 'rgba(28, 28, 30, 0.98)']
                            : ['rgba(255, 255, 255, 0.95)', 'rgba(250, 250, 252, 0.98)']
                        }
                        start={{ x: 0, y: 0 }}
                        end={{ x: 0, y: 1 }}
                        style={styles.gradientBackground}
                    />
                </BlurView>
            ) : (
                <LinearGradient
                    colors={theme.dark
                        ? ['rgba(18, 18, 20, 0.98)', 'rgba(28, 28, 30, 0.98)']
                        : ['rgba(255, 255, 255, 0.98)', 'rgba(250, 250, 252, 0.98)']
                    }
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                    style={styles.gradientBackground}
                />
            )}
            <View style={styles.contentWrapper}>
                <View style={[styles.content, { height: headerHeight }]}>
                <Pressable onPress={handleBackPress} style={styles.backButton} hitSlop={15}>
                    <Ionicons
                        name={Platform.OS === 'ios' ? 'chevron-back' : 'arrow-back'}
                        size={Platform.select({ ios: 28, default: 24 })}
                        color={theme.colors.header.tint}
                    />
                </Pressable>
                
                <View style={styles.titleContainer}>
                    <Text
                        numberOfLines={1}
                        ellipsizeMode="tail"
                        style={[
                            styles.title,
                            {
                                color: theme.colors.header.tint,
                                ...Typography.default('semiBold')
                            }
                        ]}
                    >
                        {title}
                    </Text>
                    {subtitle && (
                        <Text
                            numberOfLines={1}
                            ellipsizeMode="tail"
                            style={[
                                styles.subtitle,
                                {
                                    color: theme.colors.header.tint,
                                    opacity: 0.75,
                                    ...Typography.default()
                                }
                            ]}
                        >
                            {subtitle}
                        </Text>
                    )}
                </View>
                
                {avatarId && onAvatarPress && (
                    <Pressable
                        onPress={onAvatarPress}
                        hitSlop={15}
                        style={styles.avatarButton}
                    >
                        <Avatar
                            id={avatarId}
                            size={32}
                            monochrome={!isConnected}
                            flavor={flavor}
                        />
                    </Pressable>
                )}
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'relative',
        zIndex: 100,
        ...Platform.select({
            ios: {
                shadowColor: '#000000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 8,
            },
            android: {
                elevation: 4,
            },
            default: {
                shadowColor: '#000000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 8,
            },
        }),
    },
    blurBackground: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    gradientBackground: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    contentWrapper: {
        width: '100%',
        alignItems: 'center',
        position: 'relative',
        zIndex: 1,
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Platform.OS === 'ios' ? 8 : 16,
        width: '100%',
        maxWidth: layout.headerMaxWidth,
    },
    backButton: {
        marginRight: 8,
    },
    titleContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'flex-start',
    },
    title: {
        fontSize: Platform.select({
            ios: 16,
            android: 16,
            default: 17
        }),
        fontWeight: '600',
        marginBottom: 2,
        width: '100%',
        letterSpacing: 0.1,
    },
    subtitle: {
        fontSize: 13,
        fontWeight: '400',
        lineHeight: 16,
        letterSpacing: 0.2,
    },
    avatarButton: {
        width: 44,
        height: 44,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: Platform.select({ ios: -8, default: -8 }),
    },
});