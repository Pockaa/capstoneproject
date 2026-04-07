import React from 'react';
import { Text, View, StyleSheet } from 'react-native';

interface MarkdownTextProps {
  children: string;
  style?: any;
  isDark?: boolean;
}

/**
 * Lightweight markdown renderer for chat messages.
 * Supports: **bold**, *italic*, bullet points, numbered lists, 
 * headings (#), tables, and line breaks.
 */
export function MarkdownText({ children, style, isDark = false }: MarkdownTextProps) {
  const text = children || '';
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    // Skip empty lines (add spacing)
    if (trimmed === '') {
      elements.push(<View key={`sp-${i}`} style={{ height: 6 }} />);
      i++;
      continue;
    }

    // Table detection: skip markdown table separator rows
    if (/^\|[-:\s|]+\|$/.test(trimmed)) {
      i++;
      continue;
    }

    // Table rows: | col1 | col2 | col3 |
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      const cells = trimmed.slice(1, -1).split('|').map(c => c.trim());
      
      // Check if next line is separator (header row)
      const isHeader = i + 1 < lines.length && /^\|[-:\s|]+\|$/.test(lines[i + 1].trim());
      
      elements.push(
        <View key={`tr-${i}`} style={[
          mdStyles.tableRow,
          isHeader && mdStyles.tableHeaderRow,
          { backgroundColor: isHeader ? (isDark ? '#1e293b' : '#f1f5f9') : 'transparent' }
        ]}>
          {cells.map((cell, ci) => (
            <View key={ci} style={[mdStyles.tableCell, ci > 0 && mdStyles.tableCellBorder]}>
              <Text style={[
                mdStyles.tableCellText,
                isHeader && mdStyles.tableHeaderText,
                { color: isDark ? '#e2e8f0' : '#1e293b' },
              ]}>
                {cell}
              </Text>
            </View>
          ))}
        </View>
      );
      i++;
      continue;
    }

    // Headings: ## Heading
    if (trimmed.startsWith('#')) {
      const match = trimmed.match(/^(#+)\s+(.+)$/);
      if (match) {
        const level = match[1].length;
        const headingText = match[2];
        elements.push(
          <Text key={`h-${i}`} style={[
            mdStyles.heading,
            level === 1 && { fontSize: 16 },
            level === 2 && { fontSize: 15 },
            level >= 3 && { fontSize: 14 },
            { color: isDark ? '#f8fafc' : '#0f172a' },
            style,
          ]}>
            {renderInlineMarkdown(headingText, isDark, style)}
          </Text>
        );
        i++;
        continue;
      }
    }

    // Bullet points: - item, * item, • item
    if (/^[-*•]\s+/.test(trimmed)) {
      const bulletText = trimmed.replace(/^[-*•]\s+/, '');
      elements.push(
        <View key={`bl-${i}`} style={mdStyles.bulletRow}>
          <Text style={[mdStyles.bulletDot, { color: isDark ? '#94a3b8' : '#64748b' }]}>•</Text>
          <Text style={[mdStyles.bulletText, { color: isDark ? '#e2e8f0' : '#1e293b' }, style]}>
            {renderInlineMarkdown(bulletText, isDark, style)}
          </Text>
        </View>
      );
      i++;
      continue;
    }

    // Numbered lists: 1. item
    if (/^\d+[.)]\s+/.test(trimmed)) {
      const match = trimmed.match(/^(\d+)[.)]\s+(.+)$/);
      if (match) {
        elements.push(
          <View key={`nl-${i}`} style={mdStyles.bulletRow}>
            <Text style={[mdStyles.numberDot, { color: isDark ? '#94a3b8' : '#64748b' }]}>{match[1]}.</Text>
            <Text style={[mdStyles.bulletText, { color: isDark ? '#e2e8f0' : '#1e293b' }, style]}>
              {renderInlineMarkdown(match[2], isDark, style)}
            </Text>
          </View>
        );
        i++;
        continue;
      }
    }

    // Regular paragraph
    elements.push(
      <Text key={`p-${i}`} style={[mdStyles.paragraph, { color: isDark ? '#e2e8f0' : '#1e293b' }, style]}>
        {renderInlineMarkdown(trimmed, isDark, style)}
      </Text>
    );
    i++;
  }

  return <View style={mdStyles.container}>{elements}</View>;
}

/**
 * Render inline markdown: **bold**, *italic*, `code`, emoji
 */
function renderInlineMarkdown(text: string, isDark: boolean, baseStyle?: any): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  // Match patterns: **bold**, *italic*, `code`
  const regex = /(\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`)/g;
  
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = regex.exec(text)) !== null) {
    // Add text before match
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    if (match[2]) {
      // **bold**
      parts.push(
        <Text key={`b-${key++}`} style={{ fontWeight: '700' }}>{match[2]}</Text>
      );
    } else if (match[3]) {
      // *italic*
      parts.push(
        <Text key={`i-${key++}`} style={{ fontStyle: 'italic' }}>{match[3]}</Text>
      );
    } else if (match[4]) {
      // `code`
      parts.push(
        <Text key={`c-${key++}`} style={[
          mdStyles.inlineCode,
          { backgroundColor: isDark ? '#334155' : '#f1f5f9', color: isDark ? '#f472b6' : '#be185d' },
        ]}>
          {match[4]}
        </Text>
      );
    }

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length > 0 ? parts : [text];
}

const mdStyles = StyleSheet.create({
  container: {
    gap: 2,
  },
  paragraph: {
    fontSize: 13,
    lineHeight: 19,
  },
  heading: {
    fontWeight: '700',
    marginTop: 4,
    marginBottom: 2,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingLeft: 4,
    gap: 6,
    marginVertical: 1,
  },
  bulletDot: {
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '600',
    width: 10,
  },
  numberDot: {
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '600',
    width: 16,
  },
  bulletText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
  },
  inlineCode: {
    fontFamily: 'monospace',
    fontSize: 12,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
    overflow: 'hidden',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingVertical: 4,
  },
  tableHeaderRow: {
    borderBottomWidth: 2,
    borderBottomColor: '#cbd5e1',
  },
  tableCell: {
    flex: 1,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  tableCellBorder: {
    borderLeftWidth: 1,
    borderLeftColor: '#e2e8f0',
  },
  tableCellText: {
    fontSize: 12,
    lineHeight: 17,
  },
  tableHeaderText: {
    fontWeight: '700',
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
});
