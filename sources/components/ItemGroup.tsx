import * as React from 'react';
import {
    View,
    Text,
    StyleProp,
    ViewStyle,
    TextStyle,
    Platform
} from 'react-native';
import { Typography } from '@/constants/Typography';
import { layout } from './layout';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

interface ItemChildProps {
    showDivider?: boolean;
    [key: string]: any;
}

export interface ItemGroupProps {
    title?: string | React.ReactNode;
    footer?: string;
    children: React.ReactNode;
    style?: StyleProp<ViewStyle>;
    headerStyle?: StyleProp<ViewStyle>;
    footerStyle?: StyleProp<ViewStyle>;
    titleStyle?: StyleProp<TextStyle>;
    footerTextStyle?: StyleProp<TextStyle>;
    containerStyle?: StyleProp<ViewStyle>;
    /** Accent color variant for left border - 'primary' (teal), 'success', 'warning', 'error', or 'none' */
    accent?: 'primary' | 'success' | 'warning' | 'error' | 'none';
    /** Enable dramatic shadow elevation (default: true) */
    elevated?: boolean;
}

const stylesheet = StyleSheet.create((theme, runtime) => ({
    wrapper: {
        alignItems: 'center',
    },
    container: {
        width: '100%',
        maxWidth: layout.maxWidth,
        paddingHorizontal: Platform.select({ ios: 0, default: 4 }),
    },
    header: {
        paddingTop: Platform.select({ ios: 35, default: 20 }),
        paddingBottom: Platform.select({ ios: 8, default: 10 }),
        paddingHorizontal: Platform.select({ ios: 32, default: 24 }),
    },
    headerNoTitle: {
        paddingTop: Platform.select({ ios: 20, default: 16 }),
    },
    headerText: {
        ...Typography.default('semiBold'),
        color: theme.colors.groupped.sectionTitle,
        fontSize: Platform.select({ ios: 13, default: 14 }),
        lineHeight: Platform.select({ ios: 18, default: 20 }),
        letterSpacing: Platform.select({ ios: 0.5, default: 0.8 }),
        textTransform: 'uppercase',
    },
    contentContainer: {
        backgroundColor: theme.colors.surface,
        marginHorizontal: Platform.select({ ios: 16, default: 12 }),
        borderRadius: Platform.select({ ios: 12, default: 16 }),
        overflow: 'hidden',
    },
    // Elevated shadow variant (dramatic)
    contentContainerElevated: {
        ...theme.colors.elevation.level2,
    },
    // Base shadow variant (subtle) - DEPRECATED, use contentContainerFlat instead
    contentContainerBase: {
        shadowColor: theme.colors.shadow.color,
        shadowOffset: { width: 0, height: 0.33 },
        shadowOpacity: theme.colors.shadow.opacity,
        shadowRadius: 0,
        elevation: 1,
    },
    // Completely flat variant (no shadows, no elevation)
    contentContainerFlat: {
        shadowColor: 'transparent',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0,
        shadowRadius: 0,
        elevation: 0,
    },
    // Accent border variants
    accentBorder: {
        borderLeftWidth: 4,
    },
    accentPrimary: {
        borderLeftColor: theme.colors.brand.primary,
    },
    accentSuccess: {
        borderLeftColor: theme.colors.success,
    },
    accentWarning: {
        borderLeftColor: theme.colors.warning,
    },
    accentError: {
        borderLeftColor: theme.colors.warningCritical,
    },
    footer: {
        paddingTop: Platform.select({ ios: 8, default: 10 }),
        paddingBottom: Platform.select({ ios: 10, default: 16 }),
        paddingHorizontal: Platform.select({ ios: 32, default: 24 }),
    },
    footerText: {
        ...Typography.default('regular'),
        color: theme.colors.textSecondary,
        fontSize: Platform.select({ ios: 13, default: 14 }),
        lineHeight: Platform.select({ ios: 18, default: 20 }),
        letterSpacing: Platform.select({ ios: -0.08, default: 0 }),
    },
}));

export const ItemGroup = React.memo<ItemGroupProps>((props) => {
    const { theme } = useUnistyles();
    const styles = stylesheet;

    const {
        title,
        footer,
        children,
        style,
        headerStyle,
        footerStyle,
        titleStyle,
        footerTextStyle,
        containerStyle,
        accent = 'none',
        elevated = false
    } = props;

    // Build container styles with accent and elevation
    // When elevated={false}, use completely flat styling (no shadows, no borders)
    const containerStyles = [
        styles.contentContainer,
        elevated ? styles.contentContainerElevated : styles.contentContainerFlat,
        // Only apply accent borders when elevated (for flat UI, no borders)
        elevated && accent !== 'none' && styles.accentBorder,
        elevated && accent === 'primary' && styles.accentPrimary,
        elevated && accent === 'success' && styles.accentSuccess,
        elevated && accent === 'warning' && styles.accentWarning,
        elevated && accent === 'error' && styles.accentError,
        containerStyle
    ];

    return (
        <View style={[styles.wrapper, style]}>
            <View style={styles.container}>
                {/* Header */}
                {title ? (
                    <View style={[styles.header, headerStyle]}>
                        {typeof title === 'string' ? (
                            <Text style={[styles.headerText, titleStyle]}>
                                {title}
                            </Text>
                        ) : (
                            title
                        )}
                    </View>
                ) : (
                    // Add top margin when there's no title
                    <View style={styles.headerNoTitle} />
                )}

                {/* Content Container */}
                <View style={containerStyles}>
                    {React.Children.map(children, (child, index) => {
                        if (React.isValidElement<ItemChildProps>(child)) {
                            // Don't add props to React.Fragment
                            if (child.type === React.Fragment) {
                                return child;
                            }
                            const isLast = index === React.Children.count(children) - 1;
                            const childProps = child.props as ItemChildProps;
                            return React.cloneElement(child, {
                                ...childProps,
                                showDivider: !isLast && childProps.showDivider !== false
                            });
                        }
                        return child;
                    })}
                </View>

                {/* Footer */}
                {footer && (
                    <View style={[styles.footer, footerStyle]}>
                        <Text style={[styles.footerText, footerTextStyle]}>
                            {footer}
                        </Text>
                    </View>
                )}
            </View>
        </View>
    );
});