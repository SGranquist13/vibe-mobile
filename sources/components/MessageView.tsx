import * as React from "react";
import { View, Text, Platform, Animated } from "react-native";
import { StyleSheet } from 'react-native-unistyles';
import { MarkdownView } from "./markdown/MarkdownView";
import { t } from '@/text';
import { Message, UserTextMessage, AgentTextMessage, ToolCallMessage } from "@/sync/typesMessage";
import { Metadata } from "@/sync/storageTypes";
import { layout } from "./layout";
import { ToolView } from "./tools/ToolView";
import { AgentEvent } from "@/sync/typesRaw";
import { sync } from '@/sync/sync';
import { Option } from './markdown/MarkdownView';
import { Typography } from '@/constants/Typography';
import { useUnistyles } from 'react-native-unistyles';

export const MessageView = (props: {
  message: Message;
  metadata: Metadata | null;
  sessionId: string;
  getMessageById?: (id: string) => Message | null;
}) => {
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const scaleAnim = React.useRef(new Animated.Value(0.95)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View 
      style={[
        styles.messageContainer,
        {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        }
      ]}
      renderToHardwareTextureAndroid={true}
    >
      <View style={styles.messageContent}>
        <RenderBlock
          message={props.message}
          metadata={props.metadata}
          sessionId={props.sessionId}
          getMessageById={props.getMessageById}
        />
      </View>
    </Animated.View>
  );
};

// RenderBlock function that dispatches to the correct component based on message kind
function RenderBlock(props: {
  message: Message;
  metadata: Metadata | null;
  sessionId: string;
  getMessageById?: (id: string) => Message | null;
}): React.ReactElement {
  switch (props.message.kind) {
    case 'user-text':
      return <UserTextBlock message={props.message} sessionId={props.sessionId} />;

    case 'agent-text':
      return <AgentTextBlock message={props.message} sessionId={props.sessionId} metadata={props.metadata} />;

    case 'tool-call':
      return <ToolCallBlock
        message={props.message}
        metadata={props.metadata}
        sessionId={props.sessionId}
        getMessageById={props.getMessageById}
      />;

    case 'agent-event':
      return <AgentEventBlock event={props.message.event} metadata={props.metadata} />;


    default:
      // Exhaustive check - TypeScript will error if we miss a case
      const _exhaustive: never = props.message;
      throw new Error(`Unknown message kind: ${_exhaustive}`);
  }
}

function UserTextBlock(props: {
  message: UserTextMessage;
  sessionId: string;
}) {
  const { theme } = useUnistyles();
  const handleOptionPress = React.useCallback((option: Option) => {
    sync.sendMessage(props.sessionId, option.title);
  }, [props.sessionId]);

  const formatTimestamp = (timestamp?: number) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <View style={styles.userMessageContainer}>
      <View style={styles.userMessageBubbleWrapper}>
        <View style={styles.userMessageBubble}>
          <View style={styles.userMessageContent}>
            <MarkdownView markdown={props.message.displayText || props.message.text} onOptionPress={handleOptionPress} />
            {/* {__DEV__ && (
              <Text style={styles.debugText}>{JSON.stringify(props.message.meta)}</Text>
            )} */}
          </View>
        </View>
        <View style={styles.userMessageFooter}>
          <Text style={[styles.timestamp, { color: theme.colors.textSecondary }]}>{formatTimestamp(props.message.createdAt)}</Text>
          <View style={[styles.userLabel, { backgroundColor: theme.dark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)' }]}>
            <Text style={[styles.userLabelText, { color: theme.colors.textSecondary }]}>You</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

function AgentTextBlock(props: {
  message: AgentTextMessage;
  sessionId: string;
  metadata: Metadata | null;
}) {
  const { theme } = useUnistyles();
  const handleOptionPress = React.useCallback((option: Option) => {
    sync.sendMessage(props.sessionId, option.title);
  }, [props.sessionId]);

  const formatTimestamp = (timestamp?: number) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getAgentName = () => {
    const flavor = props.metadata?.flavor;
    if (flavor === 'codex') return t('agentInput.agent.codex');
    if (flavor === 'gemini') return t('agentInput.agent.gemini');
    if (flavor === 'cursor') return t('agentInput.agent.cursor');
    return t('agentInput.agent.claude'); // Default to Claude
  };

  return (
    <View style={styles.agentMessageContainer}>
      <View style={styles.agentMessageBubbleWrapper}>
        <View style={styles.agentMessageBubble}>
          <View style={styles.agentMessageContent}>
            <MarkdownView markdown={props.message.text} onOptionPress={handleOptionPress} />
          </View>
        </View>
        <View style={styles.agentMessageFooter}>
          <Text style={[styles.timestamp, { color: theme.colors.textSecondary }]}>{formatTimestamp(props.message.createdAt)}</Text>
          <View style={[styles.agentLabel, { backgroundColor: theme.dark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)' }]}>
            <Text style={[styles.agentLabelText, { color: theme.colors.textSecondary }]}>{getAgentName()}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

function AgentEventBlock(props: {
  event: AgentEvent;
  metadata: Metadata | null;
}) {
  if (props.event.type === 'switch') {
    return (
      <View style={styles.agentEventContainer}>
        <Text style={styles.agentEventText}>{t('message.switchedToMode', { mode: props.event.mode })}</Text>
      </View>
    );
  }
  if (props.event.type === 'message') {
    return (
      <View style={styles.agentEventContainer}>
        <Text style={styles.agentEventText}>{props.event.message}</Text>
      </View>
    );
  }
  if (props.event.type === 'limit-reached') {
    const formatTime = (timestamp: number): string => {
      try {
        const date = new Date(timestamp * 1000); // Convert from Unix timestamp
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      } catch {
        return t('message.unknownTime');
      }
    };

    return (
      <View style={styles.agentEventContainer}>
        <Text style={styles.agentEventText}>
          {t('message.usageLimitUntil', { time: formatTime(props.event.endsAt) })}
        </Text>
      </View>
    );
  }
  return (
    <View style={styles.agentEventContainer}>
      <Text style={styles.agentEventText}>{t('message.unknownEvent')}</Text>
    </View>
  );
}

function ToolCallBlock(props: {
  message: ToolCallMessage;
  metadata: Metadata | null;
  sessionId: string;
  getMessageById?: (id: string) => Message | null;
}) {
  if (!props.message.tool) {
    return null;
  }
  return (
    <View style={styles.toolContainer}>
      <ToolView
        tool={props.message.tool}
        metadata={props.metadata}
        messages={props.message.children}
        sessionId={props.sessionId}
        messageId={props.message.id}
      />
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  messageContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  messageContent: {
    flexDirection: 'column',
    flexGrow: 1,
    flexBasis: 0,
    maxWidth: layout.maxWidth,
  },
  userMessageContainer: {
    maxWidth: '100%',
    flexDirection: 'column',
    alignItems: 'flex-end',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
  },
  userMessageBubbleWrapper: {
    marginBottom: 24,
    maxWidth: '100%',
    alignItems: 'flex-end',
  },
  userMessageBubble: {
    borderRadius: 24,
    backgroundColor: theme.dark ? 'rgba(255, 255, 255, 0.06)' : '#F5F5F7',
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: theme.dark ? 0.3 : 0.08,
        shadowRadius: 12,
      },
      android: {
        elevation: 5,
      },
      default: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: theme.dark ? 0.3 : 0.08,
        shadowRadius: 12,
      },
    }),
    borderWidth: theme.dark ? 1 : 0,
    borderColor: theme.dark ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
  },
  userMessageContent: {
    paddingHorizontal: 18,
    paddingVertical: 14,
    ...Typography.default(),
    lineHeight: 24,
    letterSpacing: 0.15,
  },
  userMessageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 8,
  },
  userLabel: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  userLabelText: {
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  agentMessageContainer: {
    marginHorizontal: 20,
    marginBottom: 24,
    alignSelf: 'flex-start',
  },
  agentMessageBubbleWrapper: {
    alignItems: 'flex-start',
  },
  agentMessageBubble: {
    borderRadius: 24,
    backgroundColor: theme.dark ? 'rgba(255, 255, 255, 0.08)' : '#FFFFFF',
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: theme.dark ? 0.35 : 0.1,
        shadowRadius: 12,
      },
      android: {
        elevation: 5,
      },
      default: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: theme.dark ? 0.35 : 0.1,
        shadowRadius: 12,
      },
    }),
    borderWidth: theme.dark ? 1 : 0,
    borderColor: theme.dark ? 'rgba(255, 255, 255, 0.12)' : 'transparent',
  },
  agentMessageContent: {
    paddingHorizontal: 18,
    paddingVertical: 14,
    ...Typography.default(),
    lineHeight: 24,
    letterSpacing: 0.15,
  },
  agentMessageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 8,
  },
  agentLabel: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  agentLabelText: {
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  timestamp: {
    fontSize: 11,
    letterSpacing: 0.2,
    opacity: 0.7,
  },
  agentEventContainer: {
    marginHorizontal: 20,
    alignItems: 'center',
    paddingVertical: 12,
  },
  agentEventText: {
    color: theme.colors.agentEventText,
    fontSize: 13,
    letterSpacing: 0.3,
    fontWeight: '500',
  },
  toolContainer: {
    marginHorizontal: 0,
  },
  debugText: {
    color: theme.colors.agentEventText,
    fontSize: 12,
  },
}));
