import React, { useEffect, useRef, useState } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';

interface TruncatableTextProps {
  text: string;
  numberOfLines?: number;
  textStyle: any;
  moreLinkStyle: any;
}

// Measures the full (untruncated) text to find out whether it spans more than
// `numberOfLines` lines, and only then shows a More/Less toggle.
//
// Native (iOS/Android): measured via a hidden, unclipped copy of the text using
// onTextLayout. Wrapped in a height:0 / overflow:hidden container rather than
// opacity:0, because on Android opacity:0 can suppress the onTextLayout
// callback, causing needsTruncation to stay null forever.
//
// Web: react-native-web's <Text> does NOT implement onTextLayout at all (it's
// not in its forwarded/handled prop list), so the native approach above never
// fires there and the More button never appears. Instead, on web we measure
// the already-rendered, line-clamped Text node directly: RNW turns
// numberOfLines into CSS `-webkit-line-clamp`, which keeps the true content
// height in `scrollHeight` while `clientHeight` reflects the clamped box — so
// scrollHeight > clientHeight means the text is actually being cut off.
export default function TruncatableText({ text, numberOfLines = 4, textStyle, moreLinkStyle }: TruncatableTextProps) {
  const [expanded, setExpanded] = useState(false);
  const [needsTruncation, setNeedsTruncation] = useState<boolean | null>(null);
  const webTextRef = useRef<any>(null);

  useEffect(() => {
    if (Platform.OS !== 'web' || expanded) return;
    const node = webTextRef.current;
    if (node && typeof node.scrollHeight === 'number' && typeof node.clientHeight === 'number') {
      setNeedsTruncation(node.scrollHeight - node.clientHeight > 1);
    }
  }, [text, numberOfLines, expanded]);

  if (Platform.OS === 'web') {
    return (
      <View>
        <Text ref={webTextRef} style={textStyle} numberOfLines={expanded ? undefined : numberOfLines}>
          {text}
        </Text>
        {needsTruncation && (
          <Pressable onPress={() => setExpanded(e => !e)} hitSlop={6}>
            <Text style={moreLinkStyle}>{expanded ? 'Less' : 'More'}</Text>
          </Pressable>
        )}
      </View>
    );
  }

  return (
    <View>
      {/* Hidden measurement: full text with no line limit, visually clipped to 0 height */}
      {needsTruncation === null && (
        <View style={{ height: 0, overflow: 'hidden' }}>
          <Text
            style={textStyle}
            onTextLayout={(e) => setNeedsTruncation(e.nativeEvent.lines.length > numberOfLines)}
          >
            {text}
          </Text>
        </View>
      )}
      <Text style={textStyle} numberOfLines={expanded ? undefined : numberOfLines}>
        {text}
      </Text>
      {needsTruncation && (
        <Pressable onPress={() => setExpanded(e => !e)} hitSlop={6}>
          <Text style={moreLinkStyle}>{expanded ? 'Less' : 'More'}</Text>
        </Pressable>
      )}
    </View>
  );
}
