import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, G, Line, Text as SvgText } from 'react-native-svg';
import type { NatalChart } from '@/utils/astrology';
import { useColors } from '@/hooks/useColors';
import { createStyles } from '@/utils/responsiveStyles';

interface NatalChartSVGProps {
  chart: NatalChart;
  size?: number;
  isCompatibility?: boolean;
}

const SIGN_SYMBOLS = ['♈','♉','♊','♋','♌','♍','♎','♏','♐','♑','♒','♓'];
const SIGN_COLORS = [
  '#DC143C','#228B22','#DAA520','#4169E1','#FFA500','#9ACD32',
  '#FF69B4','#8B0000','#9400D3','#708090','#4169E1','#20B2AA',
];

const ASPECT_COLORS: Record<string, string> = {
  Conjunction: '#C9973A',
  Sextile: '#87CEEB',
  Square: '#DC143C',
  Trine: '#90EE90',
  Opposition: '#FF6347',
};

export default function NatalChartSVG({ chart, size = 280, isCompatibility = false }: NatalChartSVGProps) {
  const colors = useColors();
  const cx = size / 2;
  const cy = size / 2;
  const R = size * 0.46;  // outer zodiac edge
  const rZodiac = size * 0.42; // zodiac text ring
  const rHouseOuter = size * 0.365;
  const rHouseInner = size * 0.29;
  const rPlanet = size * 0.235;

  const toSvgAngle = (lon: number): number => {
    // Ascendant at left (9 o'clock). Counterclockwise from Asc.
    const rel = ((lon - chart.ascendant + 360) % 360);
    return ((180 - rel + 360) % 360) * (Math.PI / 180);
  };

  const polarToCart = (r: number, angle: number) => ({
    x: cx + r * Math.cos(angle),
    y: cy + r * Math.sin(angle),
  });

  // Planet positions
  const planetPositions = useMemo(() => {
    return chart.positions
      .filter(p => p.planet !== 'Ascendant' && p.planet !== 'Midheaven')
      .map(p => {
        const angle = toSvgAngle(p.longitude);
        const pos = polarToCart(rPlanet, angle);
        return { ...p, ...pos, angle };
      });
  }, [chart]);

  // Aspects (only show major ones)
  const aspectLines = useMemo(() => {
    const majorPlanets = ['Sun', 'Moon', 'Venus', 'Mars', 'Mercury'];
    return chart.aspects
      .filter(a =>
        majorPlanets.some(p => a.planet1.includes(p)) &&
        majorPlanets.some(p => a.planet2.includes(p))
      )
      .slice(0, 8)
      .map(aspect => {
        const p1 = chart.positions.find(p => p.planet === aspect.planet1 || aspect.planet1.includes(p.planet));
        const p2 = chart.positions.find(p => p.planet === aspect.planet2 || aspect.planet2.includes(p.planet));
        if (!p1 || !p2) return null;
        const a1 = toSvgAngle(p1.longitude);
        const a2 = toSvgAngle(p2.longitude);
        const pos1 = polarToCart(rPlanet * 0.9, a1);
        const pos2 = polarToCart(rPlanet * 0.9, a2);
        const color = ASPECT_COLORS[aspect.aspectType] ?? '#888';
        return { ...pos1, x2: pos2.x, y2: pos2.y, color, type: aspect.aspectType };
      })
      .filter(Boolean);
  }, [chart]);

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        {/* Outer zodiac ring */}
        <Circle cx={cx} cy={cy} r={R} fill="none" stroke={colors.border} strokeWidth={1} />
        <Circle cx={cx} cy={cy} r={rHouseOuter} fill="none" stroke={colors.border} strokeWidth={0.5} />
        <Circle cx={cx} cy={cy} r={rHouseInner} fill={colors.background + 'AA'} stroke={colors.border} strokeWidth={0.5} />

        {/* Zodiac sign segments */}
        {SIGN_SYMBOLS.map((symbol, i) => {
          const startAngle = toSvgAngle(i * 30);
          const midAngle = toSvgAngle(i * 30 + 15);
          const endAngle = toSvgAngle((i + 1) * 30);
          const textPos = polarToCart(rZodiac, midAngle);
          const lineStartPos = polarToCart(rHouseOuter, startAngle);
          const lineEndPos = polarToCart(R, startAngle);
          return (
            <G key={`sign_${i}`}>
              <Line
                x1={lineStartPos.x} y1={lineStartPos.y}
                x2={lineEndPos.x} y2={lineEndPos.y}
                stroke={colors.border} strokeWidth={0.5}
              />
              <SvgText
                x={textPos.x} y={textPos.y + 4}
                fill={SIGN_COLORS[i]}
                fontSize={size * 0.055}
                textAnchor="middle"
                fontWeight="400"
              >
                {symbol}
              </SvgText>
            </G>
          );
        })}

        {/* House cusps */}
        {Array.from({ length: 12 }).map((_, i) => {
          const angle = toSvgAngle(i * 30);
          const inner = polarToCart(rHouseInner, angle);
          const outer = polarToCart(rHouseOuter, angle);
          const textPos = polarToCart((rHouseInner + rHouseOuter) / 2, toSvgAngle(i * 30 + 15));
          return (
            <G key={`house_${i}`}>
              <Line
                x1={inner.x} y1={inner.y}
                x2={outer.x} y2={outer.y}
                stroke={colors.border} strokeWidth={0.5} strokeDasharray="2,2"
              />
              <SvgText
                x={textPos.x} y={textPos.y + 3}
                fill={colors.mutedForeground}
                fontSize={size * 0.028}
                textAnchor="middle"
                opacity={0.7}
              >
                {i + 1}
              </SvgText>
            </G>
          );
        })}

        {/* Ascendant axis */}
        {(() => {
          const ascAngle = toSvgAngle(chart.ascendant);
          const descAngle = toSvgAngle(chart.ascendant + 180);
          const p1 = polarToCart(rHouseInner, ascAngle);
          const p2 = polarToCart(rHouseInner, descAngle);
          return (
            <G>
              <Line
                x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
                stroke={colors.gold} strokeWidth={1} opacity={0.5}
              />
            </G>
          );
        })()}

        {/* Aspect lines */}
        {aspectLines.map((line, i) =>
          line ? (
            <Line
              key={`aspect_${i}`}
              x1={line.x} y1={line.y}
              x2={line.x2} y2={line.y2}
              stroke={line.color}
              strokeWidth={0.7}
              opacity={0.6}
              strokeDasharray={line.type === 'Square' || line.type === 'Opposition' ? '3,3' : undefined}
            />
          ) : null
        )}

        {/* Planet symbols */}
        {planetPositions.map((p, i) => (
          <G key={`planet_${i}`}>
            <Circle
              cx={p.x} cy={p.y}
              r={size * 0.028}
              fill={colors.background}
              stroke={p.color}
              strokeWidth={1.2}
            />
            <SvgText
              x={p.x} y={p.y + size * 0.012}
              fill={p.color}
              fontSize={size * 0.05}
              textAnchor="middle"
              fontWeight="500"
            >
              {p.symbol === 'AC' ? 'AC' : p.symbol}
            </SvgText>
          </G>
        ))}

        {/* Center decoration */}
        <Circle cx={cx} cy={cy} r={size * 0.06} fill={colors.background} stroke={colors.border} strokeWidth={0.5} />
        <SvgText x={cx} y={cy + 4} fill={colors.gold} fontSize={size * 0.055} textAnchor="middle" opacity={0.8}>
          ✦
        </SvgText>
      </Svg>
    </View>
  );
}

const styles = createStyles({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
