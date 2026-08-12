import React from 'react';
import { StyleSheet } from 'react-native';
import Svg, { Defs, RadialGradient, Stop, Rect } from 'react-native-svg';
import { useColors } from '@/hooks/useColors';

// Soft circular glow centered near the top of the screen, fading out into
// the flat background color — gives every screen the same subtle
// radial-gradient backdrop instead of a flat fill. Rendered as the first
// child of a screen's root container so it sits behind all real content.
export default function AppBackground() {
  const colors = useColors();

  return (
    <Svg
      style={StyleSheet.absoluteFillObject}
      width="100%"
      height="100%"
      pointerEvents="none"
    >
      <Defs>
        <RadialGradient id="appBgGlow" cx="50%" cy="18%" r="62%">
          <Stop offset="0%" stopColor="#42405E" stopOpacity={0.65} />
          <Stop offset="55%" stopColor={colors.background} stopOpacity={1} />
          <Stop offset="100%" stopColor={colors.background} stopOpacity={1} />
        </RadialGradient>
      </Defs>
      <Rect x={0} y={0} width="100%" height="100%" fill="url(#appBgGlow)" />
    </Svg>
  );
}
