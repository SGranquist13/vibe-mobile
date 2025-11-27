import * as React from 'react';
import { View, ScrollView } from 'react-native';
import { Item } from '@/components/Item';
import { ItemGroup } from '@/components/ItemGroup';
import { ItemList } from '@/components/ItemList';
import { MultiTextInput, MultiTextInputHandle } from '@/components/MultiTextInput';
import { Switch } from '@/components/Switch';
import { useUnistyles, StyleSheet } from 'react-native-unistyles';
import { Text } from '@/components/StyledText';
import { Typography } from '@/constants/Typography';
import { t } from '@/text';
import type { AgentDefinition, ProviderType, AgentSource } from '@/types/providerSettings';

export interface AgentEditorProps {
    agent?: AgentDefinition | null;
    onSave: (agent: Omit<AgentDefinition, 'id' | 'createdAt' | 'updatedAt'>) => void;
    onCancel?: () => void;
    availableTools?: string[];
}

// Common tools available in Claude Code
const DEFAULT_TOOLS = [
    'Read',
    'Write',
    'Edit',
    'Bash',
    'Glob',
    'Grep',
    'WebFetch',
    'WebSearch',
];

const stylesheet = StyleSheet.create((theme) => ({
    textInputContainer: {
        backgroundColor: theme.colors.input.background,
        borderRadius: 8,
        padding: 12,
        minHeight: 100,
        maxHeight: 200,
    },
    textAreaContainer: {
        backgroundColor: theme.colors.input.background,
        borderRadius: 8,
        padding: 12,
        minHeight: 150,
        maxHeight: 300,
    },
}));

const PROVIDER_OPTIONS: Array<{ value: ProviderType | 'all'; label: string }> = [
    { value: 'all', label: t('providerSettings.providerAll') },
    { value: 'claude', label: 'Claude' },
    { value: 'codex', label: 'Codex' },
    { value: 'gemini', label: 'Gemini' },
    { value: 'cursor', label: 'Cursor' },
];

export const AgentEditor = React.memo(function AgentEditor({
    agent,
    onSave,
    onCancel,
    availableTools = DEFAULT_TOOLS,
}: AgentEditorProps) {
    const { theme } = useUnistyles();
    const styles = stylesheet;
    
    const [name, setName] = React.useState(agent?.name || '');
    const [description, setDescription] = React.useState(agent?.description || '');
    const [systemPrompt, setSystemPrompt] = React.useState(agent?.systemPrompt || '');
    const [tools, setTools] = React.useState<string[]>(agent?.tools || []);
    const [provider, setProvider] = React.useState<ProviderType | 'all'>(agent?.provider || 'all');
    const [category, setCategory] = React.useState(agent?.category || '');
    const [source, setSource] = React.useState<AgentSource>(agent?.source || 'custom');

    const nameInputRef = React.useRef<MultiTextInputHandle>(null);
    const descriptionInputRef = React.useRef<MultiTextInputHandle>(null);
    const systemPromptInputRef = React.useRef<MultiTextInputHandle>(null);
    const categoryInputRef = React.useRef<MultiTextInputHandle>(null);

    const toggleTool = React.useCallback((tool: string) => {
        setTools(prev => {
            if (prev.includes(tool)) {
                return prev.filter(t => t !== tool);
            } else {
                return [...prev, tool];
            }
        });
    }, []);

    const handleSave = React.useCallback(() => {
        if (!name.trim()) {
            // Show error - name is required
            return;
        }

        onSave({
            name: name.trim(),
            description: description.trim(),
            systemPrompt: systemPrompt.trim(),
            tools,
            provider,
            category: category.trim() || undefined,
            source,
        });
    }, [name, description, systemPrompt, tools, provider, category, source, onSave]);

    const currentProviderIndex = PROVIDER_OPTIONS.findIndex(opt => opt.value === provider);

    const handleProviderCycle = React.useCallback(() => {
        const nextIndex = (currentProviderIndex + 1) % PROVIDER_OPTIONS.length;
        setProvider(PROVIDER_OPTIONS[nextIndex].value);
    }, [currentProviderIndex]);

    return (
        <ItemList>
            <ItemGroup title={agent ? t('providerSettings.editAgent') : t('providerSettings.createAgent')}>
                {/* Name */}
                <ItemGroup>
                    <View style={styles.textInputContainer}>
                        <Text style={[Typography.default('semiBold'), { marginBottom: 8, color: theme.colors.typography }]}>
                            {t('providerSettings.agentName')} *
                        </Text>
                        <MultiTextInput
                            ref={nameInputRef}
                            value={name}
                            onChangeText={setName}
                            placeholder={t('providerSettings.agentNamePlaceholder')}
                            paddingTop={8}
                            paddingBottom={8}
                            paddingLeft={0}
                            paddingRight={0}
                        />
                    </View>
                </ItemGroup>

                {/* Description */}
                <ItemGroup>
                    <View style={styles.textInputContainer}>
                        <Text style={[Typography.default('semiBold'), { marginBottom: 8, color: theme.colors.typography }]}>
                            {t('providerSettings.agentDescription')} *
                        </Text>
                        <MultiTextInput
                            ref={descriptionInputRef}
                            value={description}
                            onChangeText={setDescription}
                            placeholder={t('providerSettings.agentDescriptionPlaceholder')}
                            paddingTop={8}
                            paddingBottom={8}
                            paddingLeft={0}
                            paddingRight={0}
                        />
                    </View>
                </ItemGroup>

                {/* System Prompt */}
                <ItemGroup>
                    <View style={styles.textAreaContainer}>
                        <Text style={[Typography.default('semiBold'), { marginBottom: 8, color: theme.colors.typography }]}>
                            {t('providerSettings.agentSystemPrompt')} *
                        </Text>
                        <ScrollView keyboardShouldPersistTaps="handled">
                            <MultiTextInput
                                ref={systemPromptInputRef}
                                value={systemPrompt}
                                onChangeText={setSystemPrompt}
                                placeholder={t('providerSettings.agentSystemPromptPlaceholder')}
                                paddingTop={8}
                                paddingBottom={8}
                                paddingLeft={0}
                                paddingRight={0}
                            />
                        </ScrollView>
                    </View>
                </ItemGroup>

                {/* Provider */}
                <Item
                    title={t('providerSettings.agentProvider')}
                    subtitle={PROVIDER_OPTIONS[currentProviderIndex].label}
                    onPress={handleProviderCycle}
                    showChevron
                />

                {/* Category */}
                <ItemGroup>
                    <View style={styles.textInputContainer}>
                        <Text style={[Typography.default('semiBold'), { marginBottom: 8, color: theme.colors.typography }]}>
                            {t('providerSettings.agentCategory')}
                        </Text>
                        <MultiTextInput
                            ref={categoryInputRef}
                            value={category}
                            onChangeText={setCategory}
                            placeholder={t('providerSettings.agentCategoryPlaceholder')}
                            paddingTop={8}
                            paddingBottom={8}
                            paddingLeft={0}
                            paddingRight={0}
                        />
                    </View>
                </ItemGroup>

                {/* Tools */}
                <ItemGroup title={t('providerSettings.agentTools')}>
                    {availableTools.map(tool => (
                        <Item
                            key={tool}
                            title={tool}
                            rightElement={
                                <Switch
                                    value={tools.includes(tool)}
                                    onValueChange={() => toggleTool(tool)}
                                />
                            }
                            showChevron={false}
                        />
                    ))}
                </ItemGroup>

                {/* Save Button */}
                <Item
                    title={t('common.save')}
                    onPress={handleSave}
                    icon={<Text style={{ color: theme.colors.primary, ...Typography.default('semiBold') }}>✓</Text>}
                    showChevron={false}
                />

                {/* Cancel Button */}
                {onCancel && (
                    <Item
                        title={t('common.cancel')}
                        onPress={onCancel}
                        showChevron={false}
                    />
                )}
            </ItemGroup>
        </ItemList>
    );
});

