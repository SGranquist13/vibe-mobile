import * as React from 'react';
import { View, ScrollView, Pressable, Platform } from 'react-native';
import { Text } from '@/components/StyledText';
import { MultiTextInput, MultiTextInputHandle } from '@/components/MultiTextInput';
import { ItemGroup } from '@/components/ItemGroup';
import { Item } from '@/components/Item';
import { Switch } from '@/components/Switch';
import { useUnistyles, StyleSheet } from 'react-native-unistyles';
import { Typography } from '@/constants/Typography';
import { t } from '@/text';
import type { SystemPromptMode } from '@/types/providerSettings';

export interface SystemPromptEditorProps {
    mode: SystemPromptMode;
    content: string;
    enabled: boolean;
    onModeChange: (mode: SystemPromptMode) => void;
    onContentChange: (content: string) => void;
    onEnabledChange: (enabled: boolean) => void;
    previewContent?: string; // Optional preview of final system prompt
    showPreview?: boolean;
}

const stylesheet = StyleSheet.create((theme) => ({
    container: {
        flex: 1,
    },
    modeSelector: {
        flexDirection: 'row',
        backgroundColor: theme.colors.groupped.background,
        borderRadius: 8,
        padding: 4,
        marginBottom: 16,
    },
    modeButton: {
        flex: 1,
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 6,
        alignItems: 'center',
        justifyContent: 'center',
    },
    modeButtonActive: {
        backgroundColor: theme.colors.primary,
    },
    modeButtonText: {
        ...Typography.default('semiBold'),
        fontSize: 14,
        color: theme.colors.typography,
    },
    modeButtonTextActive: {
        color: '#FFFFFF',
    },
    textInputContainer: {
        backgroundColor: theme.colors.input.background,
        borderRadius: 8,
        padding: 12,
        minHeight: 200,
        maxHeight: 400,
    },
    textInput: {
        flex: 1,
        color: theme.colors.input.text,
        fontSize: 14,
        ...Typography.default(),
    },
    previewContainer: {
        backgroundColor: theme.colors.groupped.background,
        borderRadius: 8,
        padding: 12,
        marginTop: 16,
    },
    previewText: {
        color: theme.colors.typography,
        fontSize: 14,
        ...Typography.default(),
    },
    characterCount: {
        marginTop: 8,
        alignSelf: 'flex-end',
        fontSize: 12,
        color: theme.colors.typographySecondary,
        ...Typography.default(),
    },
}));

export const SystemPromptEditor = React.memo(function SystemPromptEditor({
    mode,
    content,
    enabled,
    onModeChange,
    onContentChange,
    onEnabledChange,
    previewContent,
    showPreview = false,
}: SystemPromptEditorProps) {
    const { theme } = useUnistyles();
    const styles = stylesheet;
    const inputRef = React.useRef<MultiTextInputHandle>(null);

    const characterCount = content.length;

    return (
        <View style={styles.container}>
            <ItemGroup
                title={t('providerSettings.systemPrompt')}
                footer={mode === 'append' 
                    ? t('providerSettings.systemPromptAppendDescription')
                    : t('providerSettings.systemPromptReplaceDescription')
                }
                elevated={false}
                headerStyle={{ paddingTop: Platform.select({ ios: 12, default: 8 }) }}
                containerStyle={{ borderRadius: Platform.select({ ios: 8, default: 10 }) }}
            >
                <Item
                    title={t('providerSettings.enableSystemPrompt')}
                    subtitle={enabled 
                        ? t('providerSettings.systemPromptEnabled')
                        : t('providerSettings.systemPromptDisabled')
                    }
                    rightElement={
                        <Switch
                            value={enabled}
                            onValueChange={onEnabledChange}
                        />
                    }
                    showChevron={false}
                />
            </ItemGroup>

            {enabled && (
                <>
                    {/* Mode Selector */}
                    <View style={styles.modeSelector}>
                        <Pressable
                            style={[
                                styles.modeButton,
                                mode === 'append' && styles.modeButtonActive,
                            ]}
                            onPress={() => onModeChange('append')}
                        >
                            <Text style={[
                                styles.modeButtonText,
                                mode === 'append' && styles.modeButtonTextActive,
                            ]}>
                                {t('providerSettings.append')}
                            </Text>
                        </Pressable>
                        <Pressable
                            style={[
                                styles.modeButton,
                                mode === 'replace' && styles.modeButtonActive,
                            ]}
                            onPress={() => onModeChange('replace')}
                        >
                            <Text style={[
                                styles.modeButtonText,
                                mode === 'replace' && styles.modeButtonTextActive,
                            ]}>
                                {t('providerSettings.replace')}
                            </Text>
                        </Pressable>
                    </View>

                    {/* Text Input */}
                    <View style={styles.textInputContainer}>
                        <ScrollView
                            style={{ flex: 1 }}
                            keyboardShouldPersistTaps="handled"
                        >
                            <MultiTextInput
                                ref={inputRef}
                                value={content}
                                onChangeText={onContentChange}
                                placeholder={mode === 'append'
                                    ? t('providerSettings.systemPromptAppendPlaceholder')
                                    : t('providerSettings.systemPromptReplacePlaceholder')
                                }
                                paddingTop={12}
                                paddingBottom={12}
                                paddingLeft={0}
                                paddingRight={0}
                            />
                        </ScrollView>
                        <Text style={styles.characterCount}>
                            {characterCount} {t('providerSettings.characters')}
                        </Text>
                    </View>

                    {/* Preview */}
                    {showPreview && previewContent && (
                        <View style={styles.previewContainer}>
                            <Text style={[styles.previewText, { marginBottom: 8, ...Typography.default('semiBold') }]}>
                                {t('providerSettings.preview')}
                            </Text>
                            <Text style={styles.previewText}>
                                {previewContent}
                            </Text>
                        </View>
                    )}
                </>
            )}
        </View>
    );
});

