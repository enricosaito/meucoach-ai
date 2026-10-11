import { parseChatMarkdown, type ChatSpan } from '@mycoach/core/coaching/contracts'
import { useMemo } from 'react'
import { StyleSheet, View } from 'react-native'
import { font, tabular } from '../../lib/typography'
import { space } from '../../theme'
import { Txt } from '../ui'

// The figure at the start of a bold span ("150 g", "3x10", "2,5 kg") is a key number: Archivo,
// like every other number in the app. Words after it stay in bold Manrope.
const LEADING_FIGURE = /^[\d.,]+(?:\s?(?:kg|g|kcal|min|h|s|x|%|lb|cm|km|reps?)\b|x\d+)?/i

/**
 * A coach reply with its light formatting applied (bold, emphasis, lists, headings as a bold
 * line). Parsing lives in core (`parseChatMarkdown`); anything unsupported shows as plain text.
 */
export function ChatText({ content, color }: { content: string; color: string }) {
  const blocks = useMemo(() => parseChatMarkdown(content), [content])
  return (
    <View style={styles.blocks}>
      {blocks.map((block, i) => {
        const key = `${block.type}-${String(i)}`
        if (block.type === 'bullet' || block.type === 'numbered') {
          return (
            <View key={key} style={styles.listRow}>
              {block.type === 'bullet' ? (
                <View style={[styles.bullet, { backgroundColor: color }]} />
              ) : (
                <Txt variant="number" style={[styles.number, { color }]}>
                  {`${String(block.number)}.`}
                </Txt>
              )}
              <Txt selectable style={{ flex: 1, color }}>
                <Spans spans={block.spans} color={color} />
              </Txt>
            </View>
          )
        }
        return (
          <Txt key={key} selectable style={{ color }}>
            <Spans spans={block.spans} color={color} />
          </Txt>
        )
      })}
    </View>
  )
}

function Spans({ spans, color }: { spans: ChatSpan[]; color: string }) {
  return spans.map((span, i) => {
    const key = String(i)
    const figure = span.bold ? LEADING_FIGURE.exec(span.text)?.[0] : undefined
    if (figure) {
      const rest = span.text.slice(figure.length)
      return (
        <Txt key={key} style={{ color }}>
          <Txt style={[font('display', 700), tabular, styles.inlineNumber, { color }]}>
            {figure}
          </Txt>
          {rest ? <Txt style={{ fontWeight: '700', color }}>{rest}</Txt> : null}
        </Txt>
      )
    }
    // Manrope has no italic design, so emphasis is a step up in weight rather than a fake slant.
    const weight = span.bold ? '700' : span.italic ? '600' : undefined
    return weight ? (
      <Txt key={key} style={{ fontWeight: weight, color }}>
        {span.text}
      </Txt>
    ) : (
      span.text
    )
  })
}

const styles = StyleSheet.create({
  blocks: { gap: space.sm },
  listRow: { flexDirection: 'row', gap: space.sm, alignItems: 'flex-start' },
  // Centered on the first line of body text (24 px line height).
  bullet: { width: 5, height: 5, borderRadius: 2.5, marginTop: 10, marginHorizontal: 4 },
  number: { fontSize: 15, lineHeight: 24, minWidth: 18 },
  // Archivo Expanded is wide; a touch smaller keeps it in step with the Manrope around it.
  inlineNumber: { fontSize: 15 },
})
