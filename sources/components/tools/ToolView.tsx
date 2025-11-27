import * as React from 'react';
import { Text, View, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Ionicons, Octicons } from '@expo/vector-icons';
import { getToolViewComponent } from './views/_all';
import { Message, ToolCall } from '@/sync/typesMessage';
import { CodeView } from '../CodeView';
import { ToolSectionView } from './ToolSectionView';
import { useElapsedTime } from '@/hooks/useElapsedTime';
import { ToolError } from './ToolError';
import { knownTools } from '@/components/tools/knownTools';
import { Metadata } from '@/sync/storageTypes';
import { useRouter } from 'expo-router';
import { PermissionFooter } from './PermissionFooter';
import { parseToolUseError } from '@/utils/toolErrorParser';
import { formatMCPTitle } from './views/MCPToolView';
import { t } from '@/text';

interface ToolViewProps {
    metadata: Metadata | null;
    tool: ToolCall;
    messages?: Message[];
    onPress?: () => void;
    sessionId?: string;
    messageId?: string;
}

export const ToolView = React.memo<ToolViewProps>((props) => {
    const { tool, onPress, sessionId, messageId } = props;
    const router = useRouter();
    const { theme } = useUnistyles();

    // Create default onPress handler for navigation
    const handlePress = React.useCallback(() => {
        if (onPress) {
            onPress();
        } else if (sessionId && messageId) {
            router.push(`/session/${sessionId}/message/${messageId}`);
        }
    }, [onPress, sessionId, messageId, router]);

    // Enable pressable if either onPress is provided or we have navigation params
    const isPressable = !!(onPress || (sessionId && messageId));

    let knownTool = knownTools[tool.name as keyof typeof knownTools] as any;

    let description: string | null = null;
    let status: string | null = null;
    let minimal = false;
    let icon = <Ionicons name="construct-outline" size={18} color={theme.colors.textSecondary} />;
    let noStatus = false;
    let hideDefaultError = false;

    // Extract status first to potentially use as title
    if (knownTool && typeof knownTool.extractStatus === 'function') {
        const state = knownTool.extractStatus({ tool, metadata: props.metadata });
        if (typeof state === 'string' && state) {
            status = state;
        }
    }

    // Handle optional title and function type
    let toolTitle = tool.name;
    
    // Special handling for MCP tools
    if (tool.name.startsWith('mcp__')) {
        toolTitle = formatMCPTitle(tool.name);
        icon = <Ionicons name="extension-puzzle-outline" size={18} color={theme.colors.textSecondary} />;
        minimal = true;
    } else if (knownTool?.title) {
        if (typeof knownTool.title === 'function') {
            toolTitle = knownTool.title({ tool, metadata: props.metadata });
        } else {
            toolTitle = knownTool.title;
        }
    }

    if (knownTool && typeof knownTool.extractSubtitle === 'function') {
        const subtitle = knownTool.extractSubtitle({ tool, metadata: props.metadata });
        if (typeof subtitle === 'string' && subtitle) {
            description = subtitle;
        }
    }
    if (knownTool && knownTool.minimal !== undefined) {
        if (typeof knownTool.minimal === 'function') {
            minimal = knownTool.minimal({ tool, metadata: props.metadata, messages: props.messages });
        } else {
            minimal = knownTool.minimal;
        }
    }
    
    // Special handling for CodexBash to determine icon based on parsed_cmd
    if (tool.name === 'CodexBash' && tool.input?.parsed_cmd && Array.isArray(tool.input.parsed_cmd) && tool.input.parsed_cmd.length > 0) {
        const parsedCmd = tool.input.parsed_cmd[0];
        if (parsedCmd.type === 'read') {
            icon = <Octicons name="eye" size={18} color={theme.colors.text} />;
        } else if (parsedCmd.type === 'write') {
            icon = <Octicons name="file-diff" size={18} color={theme.colors.text} />;
        } else {
            icon = <Octicons name="terminal" size={18} color={theme.colors.text} />;
        }
    } else if (knownTool && typeof knownTool.icon === 'function') {
        icon = knownTool.icon(18, theme.colors.text);
    }
    
    if (knownTool && typeof knownTool.noStatus === 'boolean') {
        noStatus = knownTool.noStatus;
    }
    if (knownTool && typeof knownTool.hideDefaultError === 'boolean') {
        hideDefaultError = knownTool.hideDefaultError;
    }

    let statusIcon = null;

    let isToolUseError = false;
    if (tool.state === 'error' && tool.result && parseToolUseError(tool.result).isToolUseError) {
        isToolUseError = true;
        console.log('isToolUseError', tool.result);
    }

    // Check permission status first for denied/canceled states
    if (tool.permission && (tool.permission.status === 'denied' || tool.permission.status === 'canceled')) {
        statusIcon = <Ionicons name="remove-circle-outline" size={20} color={theme.colors.textSecondary} />;
    } else if (isToolUseError) {
        statusIcon = <Ionicons name="remove-circle-outline" size={20} color={theme.colors.textSecondary} />;
        hideDefaultError = true;
        minimal = true;
    } else {
        switch (tool.state) {
            case 'running':
                if (!noStatus) {
                    statusIcon = <ActivityIndicator size="small" color={theme.colors.text} style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }} />;
                }
                break;
            case 'completed':
                // if (!noStatus) {
                //     statusIcon = <Ionicons name="checkmark-circle" size={20} color="#34C759" />;
                // }
                break;
            case 'error':
                statusIcon = <Ionicons name="alert-circle-outline" size={20} color={theme.colors.warning} />;
                break;
        }
    }

    // Get display text - prefer description, then status, then tool title
    const displayText = description || status || toolTitle;
    
    return (
        <View style={styles.container}>
            {/* Timeline line */}
            <View style={styles.timelineLine} />
            {/* Icon */}
            <View style={styles.iconWrapper}>
                {icon}
            </View>
            {/* Text content */}
            <View style={styles.contentWrapper}>
                {isPressable ? (
                    <TouchableOpacity onPress={handlePress} activeOpacity={0.7} style={styles.textContainer}>
                        <View style={styles.textRow}>
                            <Text style={styles.toolText} numberOfLines={1}>
                                {displayText}
                            </Text>
                            {tool.state === 'running' && (
                                <View style={styles.elapsedContainer}>
                                    <Text style={styles.elapsedInline}> • </Text>
                                    <ElapsedView from={tool.createdAt} />
                                </View>
                            )}
                        </View>
                    </TouchableOpacity>
                ) : (
                    <View style={styles.textContainer}>
                        <View style={styles.textRow}>
                            <Text style={styles.toolText} numberOfLines={1}>
                                {displayText}
                            </Text>
                            {tool.state === 'running' && (
                                <View style={styles.elapsedContainer}>
                                    <Text style={styles.elapsedInline}> • </Text>
                                    <ElapsedView from={tool.createdAt} />
                                </View>
                            )}
                        </View>
                    </View>
                )}
            </View>
            {/* Status icon on the right */}
            {statusIcon && (
                <View style={styles.statusIconWrapper}>
                    {statusIcon}
                </View>
            )}

            {/* Expanded content - only show when clicked/pressed */}
            {/* Content is hidden by default in timeline view, accessible via full view */}

            {/* Permission footer - always renders when permission exists to maintain consistent height */}
            {tool.permission && sessionId && (
                <PermissionFooter permission={tool.permission} sessionId={sessionId} toolName={tool.name} toolInput={tool.input} metadata={props.metadata} />
            )}
        </View>
    );
});

function ElapsedView(props: { from: number }) {
    const { theme } = useUnistyles();
    const { from } = props;
    const elapsed = useElapsedTime(from);
    return <Text style={styles.elapsedInline}>{elapsed.toFixed(1)}s</Text>;
}

const styles = StyleSheet.create((theme) => ({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingLeft: 20,
        paddingRight: 20,
        position: 'relative',
        minHeight: 32,
    },
    timelineLine: {
        position: 'absolute',
        left: 27, // Center of icon (20px padding + 14px icon center)
        top: 0,
        bottom: 0,
        width: 1,
        backgroundColor: theme.colors.divider,
    },
    iconWrapper: {
        width: 28,
        height: 28,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
        zIndex: 1,
        backgroundColor: theme.colors.surface,
        borderRadius: 14,
    },
    contentWrapper: {
        flex: 1,
    },
    textContainer: {
        flex: 1,
    },
    textRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    toolText: {
        fontSize: 14,
        color: theme.colors.text,
        fontWeight: '400',
    },
    elapsedContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 4,
    },
    elapsedInline: {
        fontSize: 13,
        color: theme.colors.textSecondary,
        fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
    },
    statusIconWrapper: {
        marginLeft: 8,
        width: 20,
        height: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
}));
