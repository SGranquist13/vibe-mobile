import * as React from 'react';
import { View, Pressable, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { t } from '@/text';

const stylesheet = StyleSheet.create((theme, runtime) => ({
    container: {
        position: 'absolute',
        left: 16,
        right: 16,
    },
    button: {
        borderRadius: 16,
        paddingVertical: 18,
        paddingHorizontal: 24,
        alignItems: 'center',
        justifyContent: 'center',
        // Dramatic elevation
        ...theme.colors.elevation.level3,
    },
    buttonDefault: {
        backgroundColor: theme.colors.fab.background,
    },
    buttonPressed: {
        backgroundColor: theme.colors.fab.backgroundPressed,
        transform: [{ scale: 0.98 }],
    },
    text: {
        fontSize: 17,
        fontWeight: '700',
        letterSpacing: 0.3,
        color: theme.colors.fab.icon,
    },
}));

export const FABWide = React.memo(({ onPress }: { onPress: () => void }) => {
    const styles = stylesheet;
    const safeArea = useSafeAreaInsets();
    return (
        <View
            style={[
                styles.container,
                { bottom: safeArea.bottom + 16 }
            ]}
        >
            <Pressable
                style={({ pressed }) => [
                    styles.button,
                    pressed ? styles.buttonPressed : styles.buttonDefault
                ]}
                onPress={onPress}
            >
                <Text style={styles.text}>{t('newSession.title')}</Text>
            </Pressable>
        </View>
    )
});