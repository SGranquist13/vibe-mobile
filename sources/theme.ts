import { Platform } from 'react-native';

export const lightTheme = {
    dark: false,
    colors: {

        //
        // Brand Colors - Coral/Terracotta Palette (from marketing)
        //

        brand: {
            primary: '#d97757',          // Coral/terracotta (marketing accent)
            primaryDark: '#c06042',      // Darker coral (marketing accent-secondary)
            primaryDarker: '#a84f35',    // Even darker coral
            primaryLight: '#e59477',     // Light coral
            primaryLighter: '#f0b199',   // Lighter coral
            primaryPale: '#f9e5dc',      // Very light coral for backgrounds
            primaryAlpha10: 'rgba(217, 119, 87, 0.1)',  // 10% opacity
            primaryAlpha20: 'rgba(217, 119, 87, 0.2)',  // 20% opacity
            primaryAlpha30: 'rgba(217, 119, 87, 0.3)',  // 30% opacity
        },

        //
        // Main colors (from marketing light theme)
        //

        text: '#3e3c38',                 // Dark charcoal (marketing)
        textDestructive: Platform.select({ ios: '#FF3B30', default: '#F44336' }),
        textSecondary: '#6b6962',        // Medium gray-brown (marketing)
        textTertiary: '#96948c',         // Light gray (marketing)
        textLink: '#d97757',             // Coral links
        warningCritical: '#FF3B30',
        warning: '#96948c',
        success: '#22c55e',              // Green from marketing
        surface: '#ffffff',              // White cards
        surfaceRipple: 'rgba(62, 60, 56, 0.08)',  // Marketing border-subtle
        surfacePressed: '#e8e6df',       // Marketing bg-secondary
        surfaceSelected: '#dedbd2',      // Marketing bg-tertiary
        surfacePressedOverlay: Platform.select({ ios: '#e8e6df', default: 'transparent' }),
        surfaceHigh: '#f8f7f4',          // Slightly off-white
        surfaceHighest: '#f0eee5',       // Marketing bg-primary
        surfaceElevated: '#ffffff',      // Pure white for elevation
        surfaceOverlay: 'rgba(62, 60, 56, 0.02)',
        divider: 'rgba(62, 60, 56, 0.08)',  // Marketing border-subtle
        dividerLight: 'rgba(62, 60, 56, 0.04)',

        //
        // Elevation & Shadows - Dramatic depth system
        //

        shadow: {
            color: Platform.select({ default: '#000000', web: 'rgba(0, 0, 0, 0.1)' }),
            opacity: 0.1,
        },
        elevation: {
            // Level 1 - Subtle elevation (buttons, items)
            level1: {
                shadowColor: '#000000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.08,
                shadowRadius: 2,
                elevation: 2,
            },
            // Level 2 - Medium elevation (cards, groups)
            level2: {
                shadowColor: '#000000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.12,
                shadowRadius: 8,
                elevation: 4,
            },
            // Level 3 - High elevation (modals, floating elements)
            level3: {
                shadowColor: '#000000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.16,
                shadowRadius: 12,
                elevation: 8,
            },
            // Level 4 - Dramatic elevation (overlays, important elements)
            level4: {
                shadowColor: '#000000',
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.20,
                shadowRadius: 16,
                elevation: 12,
            },
        },

        //
        // Border System
        //

        border: {
            default: 'rgba(62, 60, 56, 0.15)',     // Marketing border-active
            light: 'rgba(62, 60, 56, 0.08)',       // Marketing border-subtle
            dark: 'rgba(62, 60, 56, 0.25)',
            accent: '#d97757',                      // Coral accent border
            accentLight: '#e59477',                 // Light coral border
            success: '#22c55e',
            warning: '#FF9500',
            error: '#FF3B30',
        },

        //
        // System components
        //

        groupped: {
            background: '#f0eee5',                  // Marketing bg-primary (warm cream)
            chevron: '#96948c',                     // Marketing text-tertiary
            sectionTitle: '#6b6962',                // Marketing text-secondary
        },
        header: {
            background: '#ffffff',
            tint: '#3e3c38'                  // Marketing text-primary
        },
        switch: {
            track: {
                active: '#d97757',               // Coral
                inactive: '#dedbd2',             // Marketing bg-tertiary
            },
            thumb: {
                active: '#FFFFFF',
                inactive: '#96948c',
            },
        },
        fab: {
            background: '#d97757',               // Coral primary
            backgroundPressed: '#c06042',        // Darker coral
            backgroundHover: '#e59477',          // Light coral
            icon: '#FFFFFF',
        },
        radio: {
            active: '#d97757',                   // Coral
            inactive: '#dedbd2',
            dot: '#d97757',                      // Coral
        },
        modal: {
            border: 'rgba(62, 60, 56, 0.1)'
        },
        button: {
            primary: {
                background: '#d97757',           // Coral primary
                backgroundPressed: '#c06042',    // Darker coral
                backgroundHover: '#e59477',      // Light coral
                tint: '#FFFFFF',
                disabled: '#dedbd2',
            },
            secondary: {
                background: 'transparent',
                backgroundPressed: 'rgba(217, 119, 87, 0.1)',
                backgroundHover: 'rgba(217, 119, 87, 0.05)',
                tint: '#d97757',                 // Coral text
                border: '#d97757',               // Coral border
            },
            tertiary: {
                background: '#f9e5dc',           // Pale coral
                backgroundPressed: '#f0b199',    // Lighter coral
                tint: '#a84f35',                 // Dark coral text
            }
        },
        input: {
            background: '#f8f7f4',
            backgroundFocused: '#FFFFFF',
            text: '#3e3c38',                     // Marketing text-primary
            placeholder: '#96948c',              // Marketing text-tertiary
            border: 'rgba(62, 60, 56, 0.15)',
            borderFocused: '#d97757',            // Coral when focused
            borderError: '#FF3B30',
        },

        //
        // Highlight & Accent System
        //

        highlight: {
            teal: '#f9e5dc',                     // Pale coral for backgrounds
            tealStrong: '#d97757',               // Strong coral
            success: '#e8f7ee',                  // Light green
            warning: '#FFF8F0',                  // Light orange
            error: '#FFF0F0',                    // Light red
        },
        box: {
            warning: {
                background: '#FFF8F0',
                border: '#FF9500',
                text: '#FF9500',
            },
            error: {
                background: '#FFF0F0',
                border: '#FF3B30',
                text: '#FF3B30',
            }
        },

        //
        // App components
        //

        status: {
            connected: '#22c55e',            // Green (marketing)
            connecting: '#d97757',           // Coral for connecting
            disconnected: '#96948c',         // Marketing text-tertiary
            error: '#FF3B30',
            default: '#96948c',
        },

        // Permission mode colors
        permission: {
            default: '#96948c',
            acceptEdits: '#d97757',          // Coral for accept-edits
            bypass: '#FF9500',
            plan: '#22c55e',                 // Green
            readOnly: '#96948c',
            safeYolo: '#e59477',             // Light coral
            yolo: '#DC143C',
        },

        // Permission button colors
        permissionButton: {
            allow: {
                background: '#34C759',
                text: '#FFFFFF',
            },
            deny: {
                background: '#FF3B30',
                text: '#FFFFFF',
            },
            allowAll: {
                background: '#007AFF',
                text: '#FFFFFF',
            },
            inactive: {
                background: '#E5E5EA',
                border: '#D1D1D6',
                text: '#8E8E93',
            },
            selected: {
                background: '#F2F2F7',
                border: '#D1D1D6',
                text: '#3C3C43',
            },
        },


        // Diff view
        diff: {
            outline: '#E0E0E0',
            success: '#28A745',
            error: '#DC3545',
            // Traditional diff colors
            addedBg: '#E6FFED',
            addedBorder: '#34D058',
            addedText: '#24292E',
            removedBg: '#FFEEF0',
            removedBorder: '#D73A49',
            removedText: '#24292E',
            contextBg: '#F6F8FA',
            contextText: '#586069',
            lineNumberBg: '#F6F8FA',
            lineNumberText: '#959DA5',
            hunkHeaderBg: '#F1F8FF',
            hunkHeaderText: '#005CC5',
            leadingSpaceDot: '#E8E8E8',
            inlineAddedBg: '#ACFFA6',
            inlineAddedText: '#0A3F0A',
            inlineRemovedBg: '#FFCECB',
            inlineRemovedText: '#5A0A05',
        },

        // Message View colors
        userMessageBackground: '#ffffff',  // White for contrast with tan background
        userMessageText: '#000000',
        agentMessageText: '#000000',
        agentEventText: '#666666',
        // Tool call colors - distinct from user messages
        toolCallBackground: '#ffffff',          // White for contrast with tan background
        toolCallHeaderBackground: '#ffffff',     // White for contrast with tan background
        toolCallBorder: '#d97757',              // Coral accent border for left edge

        // Code/Syntax colors
        syntaxKeyword: '#1d4ed8',
        syntaxString: '#059669',
        syntaxComment: '#6b7280',
        syntaxNumber: '#0891b2',
        syntaxFunction: '#9333ea',
        syntaxBracket1: '#ff6b6b',
        syntaxBracket2: '#4ecdc4',
        syntaxBracket3: '#45b7d1',
        syntaxBracket4: '#f7b731',
        syntaxBracket5: '#5f27cd',
        syntaxDefault: '#374151',

        // Git status colors
        gitBranchText: '#6b7280',
        gitFileCountText: '#6b7280',
        gitAddedText: '#22c55e',
        gitRemovedText: '#ef4444',

        // Terminal/Command colors
        terminal: {
            background: '#1E1E1E',
            headerBackground: '#2D2D2D',
            border: '#1A1A1A',
            prompt: '#34C759',
            promptSymbol: '#34C759', // For ~ and -> symbols
            command: '#E0E0E0',
            stdout: '#E0E0E0',
            stderr: '#FFB86C',
            error: '#FF5555',
            emptyOutput: '#6272A4',
            windowControlRed: '#FF5F57',
            windowControlYellow: '#FFBD2E',
            windowControlGreen: '#28CA42',
        },

    },
};

export const darkTheme = {
    dark: true,
    colors: {

        //
        // Brand Colors - Teal Palette (Dark Mode)
        //

        brand: {
            primary: '#5DC4DB',              // Lighter teal for dark mode
            primaryDark: '#2BACCC',          // Main teal
            primaryDarker: '#1A8AA8',        // Darker teal
            primaryLight: '#8DD9EA',         // Light teal
            primaryLighter: '#B3E5F0',       // Even lighter
            primaryPale: '#2C4A52',          // Dark teal for backgrounds
            primaryAlpha10: 'rgba(93, 196, 219, 0.1)',
            primaryAlpha20: 'rgba(93, 196, 219, 0.2)',
            primaryAlpha30: 'rgba(93, 196, 219, 0.3)',
        },

        //
        // Main colors
        //

        text: '#ffffff',
        textDestructive: Platform.select({ ios: '#FF453A', default: '#F48FB1' }),
        textSecondary: Platform.select({ ios: '#8E8E93', default: '#CAC4D0' }),
        textTertiary: '#666666',
        textLink: '#5DC4DB',                 // Lighter teal for visibility
        warningCritical: '#FF453A',
        warning: '#8E8E93',
        success: '#32D74B',
        surface: Platform.select({ ios: '#18171C', default: '#212121' }),
        surfaceRipple: 'rgba(255, 255, 255, 0.08)',
        surfacePressed: '#2C2C2E',
        surfaceSelected: '#2C2C2E',
        surfacePressedOverlay: Platform.select({ ios: '#2C2C2E', default: 'transparent' }),
        // iOS dark theme is #1c1c1e for items, and #000 for the background
        surfaceHigh: Platform.select({ ios: '#2C2C2E', default: '#171717' }),
        surfaceHighest: Platform.select({ ios: '#38383A', default: '#292929' }),
        surfaceElevated: '#262626',          // Elevated surface for dark mode
        surfaceOverlay: 'rgba(255, 255, 255, 0.02)',
        divider: Platform.select({ ios: '#38383A', default: '#292929' }),
        dividerLight: '#2A2A2A',

        //
        // Elevation & Shadows - Dramatic depth system (Dark Mode)
        //

        shadow: {
            color: Platform.select({ default: '#000000', web: 'rgba(0, 0, 0, 0.3)' }),
            opacity: 0.3,
        },
        elevation: {
            // Level 1 - Subtle elevation
            level1: {
                shadowColor: '#000000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.3,
                shadowRadius: 2,
                elevation: 2,
            },
            // Level 2 - Medium elevation
            level2: {
                shadowColor: '#000000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.4,
                shadowRadius: 8,
                elevation: 4,
            },
            // Level 3 - High elevation
            level3: {
                shadowColor: '#000000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.5,
                shadowRadius: 12,
                elevation: 8,
            },
            // Level 4 - Dramatic elevation
            level4: {
                shadowColor: '#000000',
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.6,
                shadowRadius: 16,
                elevation: 12,
            },
        },

        //
        // Border System
        //

        border: {
            default: '#38383A',
            light: '#2A2A2A',
            dark: '#48484A',
            accent: '#5DC4DB',               // Light teal for visibility
            accentLight: '#8DD9EA',
            success: '#32D74B',
            warning: '#FF9F0A',
            error: '#FF453A',
        },

        //
        // System components
        //

        header: {
            background: Platform.select({ ios: '#18171C', default: '#212121' }),
            tint: '#ffffff'
        },
        switch: {
            track: {
                active: Platform.select({ ios: '#34C759', default: '#1976D2' }),
                inactive: '#3a393f',
            },
            thumb: {
                active: '#FFFFFF',
                inactive: '#767577',
            },
        },
        groupped: {
            background: Platform.select({ ios: '#1C1C1E', default: '#1e1e1e' }),
            chevron: Platform.select({ ios: '#48484A', default: '#CAC4D0' }),
            sectionTitle: Platform.select({ ios: '#8E8E93', default: '#CAC4D0' }),
        },
        fab: {
            background: '#5DC4DB',               // Light teal for dark mode
            backgroundPressed: '#2BACCC',        // Main teal when pressed
            backgroundHover: '#8DD9EA',          // Even lighter on hover
            icon: '#000000',                     // Dark icon on teal
        },
        radio: {
            active: '#5DC4DB',                   // Teal
            inactive: '#48484A',
            dot: '#5DC4DB',                      // Teal
        },
        modal: {
            border: 'rgba(255, 255, 255, 0.1)'
        },
        button: {
            primary: {
                background: '#5DC4DB',           // Light teal
                backgroundPressed: '#2BACCC',    // Main teal
                backgroundHover: '#8DD9EA',      // Lighter teal
                tint: '#000000',                 // Dark text on teal
                disabled: '#48484A',
            },
            secondary: {
                background: 'transparent',
                backgroundPressed: 'rgba(93, 196, 219, 0.2)',
                backgroundHover: 'rgba(93, 196, 219, 0.1)',
                tint: '#5DC4DB',                 // Teal text
                border: '#5DC4DB',               // Teal border
            },
            tertiary: {
                background: '#2C4A52',           // Dark teal background
                backgroundPressed: '#3A5A62',    // Slightly lighter
                tint: '#8DD9EA',                 // Light teal text
            }
        },
        input: {
            background: Platform.select({ ios: '#1C1C1E', default: '#303030' }),
            backgroundFocused: '#262626',
            text: '#FFFFFF',
            placeholder: '#8E8E93',
            border: '#38383A',
            borderFocused: '#5DC4DB',            // Teal when focused
            borderError: '#FF453A',
        },

        //
        // Highlight & Accent System (Dark Mode)
        //

        highlight: {
            teal: '#2C4A52',                     // Dark teal for backgrounds
            tealStrong: '#5DC4DB',               // Strong teal
            success: '#1A3A24',                  // Dark green
            warning: '#3A2A1A',                  // Dark orange
            error: '#3A1A1A',                    // Dark red
        },
        box: {
            warning: {
                background: 'rgba(255, 159, 10, 0.15)',
                border: '#FF9F0A',
                text: '#FFAB00',
            },
            error: {
                background: 'rgba(255, 69, 58, 0.15)',
                border: '#FF453A',
                text: '#FF6B6B',
            }
        },

        //
        // App components
        //

        status: { // App Connection Status
            connected: '#32D74B', // Green for connected/active
            connecting: '#FFFFFF',
            disconnected: '#8E8E93',
            error: '#FF453A',
            default: '#8E8E93',
        },

        // Permission mode colors
        permission: {
            default: '#8E8E93',
            acceptEdits: '#0A84FF',
            bypass: '#FF9F0A',
            plan: '#32D74B',
            readOnly: '#98989D',
            safeYolo: '#FF7A4C',
            yolo: '#FF453A',
        },

        // Permission button colors
        permissionButton: {
            allow: {
                background: '#32D74B',
                text: '#FFFFFF',
            },
            deny: {
                background: '#FF453A',
                text: '#FFFFFF',
            },
            allowAll: {
                background: '#0A84FF',
                text: '#FFFFFF',
            },
            inactive: {
                background: '#2C2C2E',
                border: '#38383A',
                text: '#8E8E93',
            },
            selected: {
                background: '#1C1C1E',
                border: '#38383A',
                text: '#FFFFFF',
            },
        },


        // Diff view
        diff: {
            outline: '#30363D',
            success: '#3FB950',
            error: '#F85149',
            // Traditional diff colors for dark mode
            addedBg: '#0D2E1F',
            addedBorder: '#3FB950',
            addedText: '#C9D1D9',
            removedBg: '#3F1B23',
            removedBorder: '#F85149',
            removedText: '#C9D1D9',
            contextBg: '#161B22',
            contextText: '#8B949E',
            lineNumberBg: '#161B22',
            lineNumberText: '#6E7681',
            hunkHeaderBg: '#161B22',
            hunkHeaderText: '#58A6FF',
            leadingSpaceDot: '#2A2A2A',
            inlineAddedBg: '#2A5A2A',
            inlineAddedText: '#7AFF7A',
            inlineRemovedBg: '#5A2A2A',
            inlineRemovedText: '#FF7A7A',
        },

        // Message View colors
        userMessageBackground: '#2C2C2E',
        userMessageText: '#FFFFFF',
        agentMessageText: '#FFFFFF',
        agentEventText: '#8E8E93',
        // Tool call colors - distinct from user messages
        toolCallBackground: Platform.select({ ios: '#1C1C1E', default: '#1A1A1A' }),  // Slightly different from user message background
        toolCallHeaderBackground: Platform.select({ ios: '#242426', default: '#222222' }),  // Slightly lighter for header
        toolCallBorder: '#5DC4DB',              // Teal accent border for left edge

        // Code/Syntax colors (brighter for dark mode)
        syntaxKeyword: '#569CD6',
        syntaxString: '#CE9178',
        syntaxComment: '#6A9955',
        syntaxNumber: '#B5CEA8',
        syntaxFunction: '#DCDCAA',
        syntaxBracket1: '#FFD700',
        syntaxBracket2: '#DA70D6',
        syntaxBracket3: '#179FFF',
        syntaxBracket4: '#FF8C00',
        syntaxBracket5: '#00FF00',
        syntaxDefault: '#D4D4D4',

        // Git status colors
        gitBranchText: '#8E8E93',
        gitFileCountText: '#8E8E93',
        gitAddedText: '#34C759',
        gitRemovedText: '#FF453A',

        // Terminal/Command colors
        terminal: {
            background: '#1E1E1E',
            headerBackground: '#2D2D2D',
            border: '#1A1A1A',
            prompt: '#32D74B',
            promptSymbol: '#32D74B', // For ~ and -> symbols
            command: '#E0E0E0',
            stdout: '#E0E0E0',
            stderr: '#FFB86C',
            error: '#FF6B6B',
            emptyOutput: '#7B7B93',
            windowControlRed: '#FF5F57',
            windowControlYellow: '#FFBD2E',
            windowControlGreen: '#28CA42',
        },

    },
} satisfies typeof lightTheme;

export type Theme = typeof lightTheme;
