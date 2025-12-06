import * as React from 'react';
import { View, Text, ViewStyle, TextStyle, Platform } from 'react-native';
import { Typography } from '@/constants/Typography';
import { Ionicons } from '@expo/vector-icons';
import { useUnistyles } from 'react-native-unistyles';

interface ChatFooterProps {
    controlledByUser?: boolean;
}

export const ChatFooter = React.memo((props: ChatFooterProps) => {
    const { theme } = useUnistyles();
    const containerStyle: ViewStyle = {
        alignItems: 'center',
        paddingTop: 4,
        paddingBottom: 2,
    };
    const warningContainerStyle: ViewStyle = {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 8,
        backgroundColor: theme.colors.box.warning.background,
        borderRadius: 12,
        marginHorizontal: 20,
        marginTop: 6,
        ...Platform.select({
            ios: {
                shadowColor: '#FF9500',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.15,
                shadowRadius: 4,
            },
            android: {
                elevation: 2,
            },
            default: {
                shadowColor: '#FF9500',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.15,
                shadowRadius: 4,
            },
        }),
    };
    const warningTextStyle: TextStyle = {
        fontSize: 12,
        color: theme.colors.box.warning.text,
        marginLeft: 8,
        lineHeight: 16,
        letterSpacing: 0.2,
        ...Typography.default()
    };
    return (
        <View style={containerStyle}>
            {props.controlledByUser && (
                <View style={warningContainerStyle}>
                    <Ionicons 
                        name="information-circle" 
                        size={16} 
                        color={theme.colors.box.warning.text}
                    />
                    <Text style={warningTextStyle}>
                        Permissions shown in terminal only. Reset or send a message to control from app.
                    </Text>
                </View>
            )}
        </View>
    );
});