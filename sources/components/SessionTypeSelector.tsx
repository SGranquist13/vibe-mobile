import React from 'react';
import { View, Text, Pressable, Platform } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Typography } from '@/constants/Typography';
import { t } from '@/text';

interface SessionTypeSelectorProps {
    value: 'simple' | 'worktree';
    onChange: (value: 'simple' | 'worktree') => void;
}

const stylesheet = StyleSheet.create((theme) => ({
    container: {
        flexDirection: 'row',
        gap: 8,
    },
    title: {
        fontSize: 13,
        color: theme.colors.textSecondary,
        marginBottom: 8,
        marginLeft: 16,
        marginTop: 12,
        ...Typography.default('semiBold'),
    },
    optionContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.input.background,
        borderRadius: Platform.select({ default: 16, android: 20 }),
        paddingHorizontal: 10,
        paddingVertical: 6,
        height: 32,
        flex: 1,
    },
    optionPressed: {
        backgroundColor: theme.colors.surfacePressed,
    },
    radioButton: {
        width: 16,
        height: 16,
        borderRadius: 8,
        borderWidth: 2,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 8,
    },
    radioButtonActive: {
        borderColor: theme.colors.radio.active,
    },
    radioButtonInactive: {
        borderColor: theme.colors.radio.inactive,
    },
    radioButtonDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: theme.colors.radio.dot,
    },
    optionLabel: {
        fontSize: 13,
        fontWeight: '600',
        ...Typography.default('semiBold'),
    },
    optionLabelActive: {
        color: theme.colors.button.secondary.tint,
    },
    optionLabelInactive: {
        color: theme.colors.button.secondary.tint,
    },
}));

export const SessionTypeSelector: React.FC<SessionTypeSelectorProps> = ({ value, onChange }) => {
    const { theme } = useUnistyles();
    const styles = stylesheet;

    const handlePress = (type: 'simple' | 'worktree') => {
        onChange(type);
    };

    return (
        <View style={styles.container}>
            <Pressable
                onPress={() => handlePress('simple')}
                style={({ pressed }) => [
                    styles.optionContainer,
                    pressed && styles.optionPressed,
                ]}
            >
                <View style={[
                    styles.radioButton,
                    value === 'simple' ? styles.radioButtonActive : styles.radioButtonInactive,
                ]}>
                    {value === 'simple' && <View style={styles.radioButtonDot} />}
                </View>
                <Text style={[
                    styles.optionLabel,
                    value === 'simple' ? styles.optionLabelActive : styles.optionLabelInactive,
                ]}>
                    {t('newSession.sessionType.simple')}
                </Text>
            </Pressable>

            <Pressable
                onPress={() => handlePress('worktree')}
                style={({ pressed }) => [
                    styles.optionContainer,
                    pressed && styles.optionPressed,
                ]}
            >
                <View style={[
                    styles.radioButton,
                    value === 'worktree' ? styles.radioButtonActive : styles.radioButtonInactive,
                ]}>
                    {value === 'worktree' && <View style={styles.radioButtonDot} />}
                </View>
                <Text style={[
                    styles.optionLabel,
                    value === 'worktree' ? styles.optionLabelActive : styles.optionLabelInactive,
                ]}>
                    {t('newSession.sessionType.worktree')}
                </Text>
            </Pressable>
        </View>
    );
};