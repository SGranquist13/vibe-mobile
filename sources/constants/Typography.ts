import { Platform } from 'react-native';

/**
 * Typography system for vibe app
 * 
 * Default typography: Raleway (Google Fonts) - works on all platforms
 * Monospace typography: System monospace fonts (SF Mono on iOS, monospace on Android/Web)
 * Logo typography: Raleway Bold (uses Raleway with bold weight)
 * 
 * Usage Examples:
 * 
 * // Default typography (Raleway)
 * <Text style={{ fontSize: 16, ...Typography.default() }}>Regular text</Text>
 * <Text style={{ fontSize: 16, ...Typography.default('italic') }}>Italic text</Text>
 * <Text style={{ fontSize: 16, ...Typography.default('semiBold') }}>Semi-bold text</Text>
 * 
 * // Monospace typography (System monospace)
 * <Text style={{ fontSize: 14, ...Typography.mono() }}>Code text</Text>
 * <Text style={{ fontSize: 14, ...Typography.mono('italic') }}>Italic code</Text>
 * <Text style={{ fontSize: 14, ...Typography.mono('semiBold') }}>Bold code</Text>
 * 
 * // Logo typography (Raleway Bold)
 * <Text style={{ fontSize: 28, ...Typography.logo() }}>Logo Text</Text>
 * 
 * // Alternative direct usage
 * <Text style={{ fontSize: 16, fontFamily: getDefaultFont('semiBold') }}>Direct usage</Text>
 * <Text style={{ fontSize: 14, fontFamily: getMonoFont() }}>Direct mono usage</Text>
 * <Text style={{ fontSize: 28, fontFamily: getLogoFont() }}>Direct logo usage</Text>
 */

// Font family constants
// Default typography uses Raleway (Google Fonts) - works consistently across all platforms
export const FontFamilies = {
  // Raleway font family (default typography)
  default: {
    regular: 'Raleway_400Regular',
    italic: 'Raleway_400Regular_Italic',
    semiBold: 'Raleway_600SemiBold',
  },
  
  // System monospace fonts
  mono: {
    regular: Platform.select({ 
      ios: 'SF Mono', 
      android: 'monospace', 
      default: 'monospace' 
    }),
    italic: Platform.select({ 
      ios: 'SF Mono', 
      android: 'monospace', 
      default: 'monospace' 
    }),
    semiBold: Platform.select({ 
      ios: 'SF Mono', 
      android: 'monospace', 
      default: 'monospace' 
    }),
  },
  
  // Raleway Bold (for logo/special use)
  logo: {
    bold: 'Raleway_700Bold',
  },
  
  // Legacy fonts (keep for backward compatibility)
  legacy: {
    spaceMono: 'SpaceMono',
    systemMono: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  }
};

// Helper functions for easy access to font families
export const getDefaultFont = (weight: 'regular' | 'italic' | 'semiBold' = 'regular') => {
  return FontFamilies.default[weight];
};

export const getMonoFont = (weight: 'regular' | 'italic' | 'semiBold' = 'regular') => {
  return FontFamilies.mono[weight];
};

export const getLogoFont = () => {
  return FontFamilies.logo.bold;
};

// Font weight mappings for the font families
export const FontWeights = {
  regular: '400',
  semiBold: '600', 
  bold: '700',
} as const;

// Style utilities for easy inline usage
export const Typography = {
  // Default font styles (Raleway)
  default: (weight: 'regular' | 'italic' | 'semiBold' = 'regular') => {
    const fontFamily = getDefaultFont(weight);
    const style: { fontFamily?: string; fontStyle?: 'italic'; fontWeight?: '400' | '600' } = {};
    
    if (fontFamily) {
      style.fontFamily = fontFamily;
    }
    
    if (weight === 'italic') {
      style.fontStyle = 'italic';
    } else if (weight === 'semiBold') {
      style.fontWeight = '600';
    }
    
    return style;
  },
  
  // Monospace font styles (System monospace)
  mono: (weight: 'regular' | 'italic' | 'semiBold' = 'regular') => {
    const fontFamily = getMonoFont(weight);
    const style: { fontFamily?: string; fontStyle?: 'italic'; fontWeight?: '400' | '600' } = {};
    
    if (fontFamily) {
      style.fontFamily = fontFamily;
    }
    
    if (weight === 'italic') {
      style.fontStyle = 'italic';
    } else if (weight === 'semiBold') {
      style.fontWeight = '600';
    }
    
    return style;
  },
  
  // Logo font style (Raleway Bold)
  logo: () => {
    const fontFamily = getLogoFont();
    const style: { fontFamily?: string; fontWeight?: '700' } = {};
    
    if (fontFamily) {
      style.fontFamily = fontFamily;
    }
    
    style.fontWeight = '700';
    
    return style;
  },
  
  // Header text style
  header: () => ({
    ...Typography.default('semiBold'),
  }),
  
  // Body text style
  body: () => ({
    ...Typography.default('regular'),
  }),
  
  // Legacy font styles (for backward compatibility)
  legacy: {
    spaceMono: () => ({
      fontFamily: FontFamilies.legacy.spaceMono,
    }),
    systemMono: () => ({
      fontFamily: FontFamilies.legacy.systemMono,
    }),
  }
}; 