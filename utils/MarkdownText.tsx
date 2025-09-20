import React from 'react';
import { Text, Linking, StyleSheet, TouchableOpacity } from 'react-native';
import COLORS from '../utils/colors';

// Markdown benzeri linkleri algılayıp tıklanabilir hale getirir
// [yazı](https://link.com) formatını destekler

import { ReactNode } from 'react';

type MarkdownTextProps = {
  children: string;
  style?: object;
};

export function MarkdownText({ children, style = {} }: MarkdownTextProps) {
  if (typeof children !== 'string') return <Text style={style}>{children}</Text>;

  const regex = /\[([^\]]+)\]\(([^)]+)\)/g;
  const parts: ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = regex.exec(children)) !== null) {
    if (match.index > lastIndex) {
      parts.push(
        <Text key={key++} style={style}>
          {children.substring(lastIndex, match.index)}
        </Text>
      );
    }
    parts.push(
      <Text
        key={key++}
        style={[style, styles.link]}
        onPress={() => Linking.openURL(match![2])}
        suppressHighlighting
      >
        {match[1]}
      </Text>
    );
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < children.length) {
    parts.push(
      <Text key={key++} style={style}>
        {children.substring(lastIndex)}
      </Text>
    );
  }
  return <Text style={style}>{parts}</Text>;
}

const styles = StyleSheet.create({
  link: {
    color: COLORS.primary,
    textDecorationStyle: 'solid',
    textDecorationColor: COLORS.primary,
    fontWeight: '500',
  },
});
