import * as React from "react";
import { View } from "react-native";
import { Image } from "expo-image";
import { AvatarSkia } from "./AvatarSkia";
import { AvatarGradient } from "./AvatarGradient";
import { AvatarBrutalist } from "./AvatarBrutalist";
import { useSetting } from '@/sync/storage';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

interface AvatarProps {
    id: string;
    title?: boolean;
    square?: boolean;
    size?: number;
    monochrome?: boolean;
    flavor?: string | null;
    imageUrl?: string | null;
    thumbhash?: string | null;
    /** Status ring color - 'active' (teal), 'success' (green), 'warning' (orange), 'error' (red), or 'none' */
    status?: 'active' | 'success' | 'warning' | 'error' | 'none';
}

const flavorIcons = {
    claude: require('@/assets/images/icon-claude.png'),
    codex: require('@/assets/images/icon-gpt.png'),
    gemini: require('@/assets/images/icon-gemini.png'),
};

const styles = StyleSheet.create((theme) => ({
    container: {
        position: 'relative',
    },
    flavorIcon: {
        position: 'absolute',
        bottom: -2,
        right: -2,
        backgroundColor: theme.colors.surface,
        borderRadius: 100,
        padding: 2,
        shadowColor: theme.colors.shadow.color,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
        elevation: 3,
    },
    statusRing: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        borderRadius: 9999,
        borderWidth: 3,
    },
    statusActive: {
        borderColor: theme.colors.brand.primary,
    },
    statusSuccess: {
        borderColor: theme.colors.success,
    },
    statusWarning: {
        borderColor: theme.colors.warning,
    },
    statusError: {
        borderColor: theme.colors.warningCritical,
    },
}));

export const Avatar = React.memo((props: AvatarProps) => {
    const { flavor, size = 48, imageUrl, thumbhash, status, ...avatarProps } = props;
    const avatarStyle = useSetting('avatarStyle');
    const showFlavorIcons = useSetting('showFlavorIcons');
    const { theme } = useUnistyles();

    // Status ring styling
    const statusRingStyle = status && status !== 'none' ? [
        styles.statusRing,
        status === 'active' && styles.statusActive,
        status === 'success' && styles.statusSuccess,
        status === 'warning' && styles.statusWarning,
        status === 'error' && styles.statusError,
    ] : null;

    // Render custom image if provided
    if (imageUrl) {
        const imageElement = (
            <Image
                source={{ uri: imageUrl, thumbhash: thumbhash || undefined }}
                placeholder={thumbhash ? { thumbhash: thumbhash } : undefined}
                contentFit="cover"
                style={{
                    width: size,
                    height: size,
                    borderRadius: avatarProps.square ? 0 : size / 2
                }}
            />
        );

        // Add flavor icon overlay if enabled
        if (showFlavorIcons && flavor) {
            const effectiveFlavor = flavor || 'claude';
            const flavorIcon = flavorIcons[effectiveFlavor as keyof typeof flavorIcons] || flavorIcons.claude;
            const circleSize = Math.round(size * 0.35);
            const iconSize = effectiveFlavor === 'codex'
                ? Math.round(size * 0.25)
                : effectiveFlavor === 'claude'
                    ? Math.round(size * 0.28)
                    : Math.round(size * 0.35);

            return (
                <View style={[styles.container, { width: size, height: size }]}>
                    {imageElement}
                    {statusRingStyle && <View style={statusRingStyle} />}
                    <View style={[styles.flavorIcon, {
                        width: circleSize,
                        height: circleSize,
                        alignItems: 'center',
                        justifyContent: 'center'
                    }]}>
                        <Image
                            source={flavorIcon}
                            style={{ width: iconSize, height: iconSize }}
                            contentFit="contain"
                            tintColor={effectiveFlavor === 'codex' ? theme.colors.text : undefined}
                        />
                    </View>
                </View>
            );
        }

        if (statusRingStyle) {
            return (
                <View style={[styles.container, { width: size, height: size }]}>
                    {imageElement}
                    <View style={statusRingStyle} />
                </View>
            );
        }

        return imageElement;
    }

    // Original generated avatar logic
    // Determine which avatar variant to render
    let AvatarComponent: React.ComponentType<any>;
    if (avatarStyle === 'pixelated') {
        AvatarComponent = AvatarSkia;
    } else if (avatarStyle === 'brutalist') {
        AvatarComponent = AvatarBrutalist;
    } else {
        AvatarComponent = AvatarGradient;
    }

    // Determine flavor icon for generated avatars
    const effectiveFlavor = flavor || 'claude';
    const flavorIcon = flavorIcons[effectiveFlavor as keyof typeof flavorIcons] || flavorIcons.claude;
    // Make icons smaller while keeping same circle size
    // Claude slightly bigger than codex
    const circleSize = Math.round(size * 0.35);
    const iconSize = effectiveFlavor === 'codex'
        ? Math.round(size * 0.25)
        : effectiveFlavor === 'claude'
            ? Math.round(size * 0.28)
            : Math.round(size * 0.35);

    // Only wrap in container if showing flavor icons or status ring
    if (showFlavorIcons || statusRingStyle) {
        return (
            <View style={[styles.container, { width: size, height: size }]}>
                <AvatarComponent {...avatarProps} size={size} />
                {statusRingStyle && <View style={statusRingStyle} />}
                {showFlavorIcons && (
                    <View style={[styles.flavorIcon, {
                        width: circleSize,
                        height: circleSize,
                        alignItems: 'center',
                        justifyContent: 'center'
                    }]}>
                        <Image
                            source={flavorIcon}
                            style={{ width: iconSize, height: iconSize }}
                            contentFit="contain"
                            tintColor={effectiveFlavor === 'codex' ? theme.colors.text : undefined}
                        />
                    </View>
                )}
            </View>
        );
    }

    // Return avatar without wrapper when not showing flavor icons or status
    return <AvatarComponent {...avatarProps} size={size} />;
});