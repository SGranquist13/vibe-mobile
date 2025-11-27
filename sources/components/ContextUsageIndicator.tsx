import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useUnistyles } from 'react-native-unistyles';
import { Theme } from '@/theme';

interface ContextUsageIndicatorProps {
    contextSize: number;
    maxContextSize: number;
    size?: number;
    strokeWidth?: number;
}

const stylesheet = StyleSheet.create((theme: Theme) => ({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
    },
}));

export const ContextUsageIndicator: React.FC<ContextUsageIndicatorProps> = ({
    contextSize,
    maxContextSize,
    size = 24,
    strokeWidth = 2.5,
}) => {
    const { theme } = useUnistyles();
    const styles = stylesheet;

    const percentage = Math.min(100, (contextSize / maxContextSize) * 100);
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    // strokeDashoffset: 0 = full circle visible, circumference = no circle visible
    // We want: 0% usage = no progress circle, 100% usage = full progress circle
    const strokeDashoffset = circumference * (1 - percentage / 100);

    // Color based on usage percentage
    let strokeColor: string;
    if (percentage >= 90) {
        strokeColor = theme.colors.warningCritical || '#FF3B30';
    } else if (percentage >= 75) {
        strokeColor = theme.colors.warning || '#FF9500';
    } else if (percentage >= 50) {
        strokeColor = theme.colors.textSecondary || '#8E8E93';
    } else {
        strokeColor = theme.colors.success || '#34C759';
    }

    const backgroundColor = theme.colors.divider || '#E5E5EA';

    return (
        <View style={[styles.container, { width: size, height: size }]}>
            <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
                {/* Background circle */}
                <Circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke={backgroundColor}
                    strokeWidth={strokeWidth}
                    fill="transparent"
                />
                {/* Progress circle */}
                <Circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke={strokeColor}
                    strokeWidth={strokeWidth}
                    fill="transparent"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                />
            </Svg>
        </View>
    );
};

