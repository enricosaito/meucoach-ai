/**
 * The small Markdown subset coach replies may use, parsed into blocks a client can render with
 * its own text styles. Pure, so web and mobile render the same structure.
 *
 * Supported: **bold**, *italic* (also __/_), bullet lists (-, *, •), numbered lists (1. / 1)),
 * headings (rendered as a bold line), paragraphs and line breaks. Everything else degrades to
 * plain text: links keep their label, inline code and code fences keep their content, rules and
 * tables' pipes are left as typed. Nothing is ever executed or made tappable.
 */

export interface ChatSpan {
  text: string
  bold?: boolean
  italic?: boolean
}

export type ChatBlock =
  | { type: 'paragraph'; spans: ChatSpan[] }
  | { type: 'heading'; spans: ChatSpan[] }
  | { type: 'bullet'; spans: ChatSpan[] }
  | { type: 'numbered'; number: number; spans: ChatSpan[] }

const BULLET = /^\s*[-*•]\s+(.*)$/
const NUMBERED = /^\s*(\d{1,3})[.)]\s+(.*)$/
const HEADING = /^\s*#{1,6}\s+(.*)$/
const RULE = /^\s*([-*_])(\s*\1){2,}\s*$/
const FENCE = /^\s*```/

type Style = Pick<ChatSpan, 'bold' | 'italic'>

// Inline markers, tried at every position; the earliest match wins (ties: listed order).
const INLINE: { pattern: RegExp; style?: Style; plain?: boolean }[] = [
  { pattern: /\*\*\*(?=\S)([\s\S]+?)(?<=\S)\*\*\*/, style: { bold: true, italic: true } },
  { pattern: /\*\*(?=\S)([\s\S]+?)(?<=\S)\*\*/, style: { bold: true } },
  { pattern: /(?<![\w])__(?=\S)([\s\S]+?)(?<=\S)__(?![\w])/, style: { bold: true } },
  { pattern: /\*(?=[^\s*])([\s\S]+?)(?<=[^\s*])\*/, style: { italic: true } },
  { pattern: /(?<![\w])_(?=[^\s_])([\s\S]+?)(?<=[^\s_])_(?![\w])/, style: { italic: true } },
  { pattern: /`([^`]+)`/, plain: true },
  { pattern: /\[([^\]]+)\]\([^)\s]+\)/, plain: true },
]

function parseInline(text: string, style: Style = {}): ChatSpan[] {
  const spans: ChatSpan[] = []
  let rest = text
  while (rest.length > 0) {
    let best: {
      index: number
      length: number
      inner: string
      rule: (typeof INLINE)[number]
    } | null = null
    for (const rule of INLINE) {
      const match = rule.pattern.exec(rest)
      if (match && (best === null || match.index < best.index)) {
        best = { index: match.index, length: match[0].length, inner: match[1] ?? '', rule }
      }
    }
    if (!best) {
      spans.push({ text: rest, ...style })
      break
    }
    if (best.index > 0) spans.push({ text: rest.slice(0, best.index), ...style })
    if (best.rule.plain) spans.push({ text: best.inner, ...style })
    else spans.push(...parseInline(best.inner, { ...style, ...best.rule.style }))
    rest = rest.slice(best.index + best.length)
  }
  return mergeSpans(spans)
}

/** Joins neighbours with the same style and drops empty spans. */
function mergeSpans(spans: ChatSpan[]): ChatSpan[] {
  const merged: ChatSpan[] = []
  for (const span of spans) {
    if (!span.text) continue
    const last = merged[merged.length - 1]
    if (
      last &&
      Boolean(last.bold) === Boolean(span.bold) &&
      Boolean(last.italic) === Boolean(span.italic)
    ) {
      last.text += span.text
    } else {
      merged.push({ ...span })
    }
  }
  return merged
}

export function parseChatMarkdown(text: string): ChatBlock[] {
  const blocks: ChatBlock[] = []
  let paragraph: string[] = []

  const flush = () => {
    if (paragraph.length === 0) return
    const spans = parseInline(paragraph.join('\n'))
    if (spans.length > 0) blocks.push({ type: 'paragraph', spans })
    paragraph = []
  }

  for (const line of text.replace(/\r\n?/g, '\n').split('\n')) {
    if (FENCE.test(line)) continue
    if (line.trim() === '' || RULE.test(line)) {
      flush()
      continue
    }
    const heading = HEADING.exec(line)
    const bullet = BULLET.exec(line)
    const numbered = NUMBERED.exec(line)
    if (heading) {
      flush()
      blocks.push({ type: 'heading', spans: parseInline(heading[1] ?? '', { bold: true }) })
    } else if (bullet) {
      flush()
      blocks.push({ type: 'bullet', spans: parseInline(bullet[1] ?? '') })
    } else if (numbered) {
      flush()
      blocks.push({
        type: 'numbered',
        number: Number(numbered[1]),
        spans: parseInline(numbered[2] ?? ''),
      })
    } else {
      paragraph.push(line.trim())
    }
  }
  flush()
  return blocks
}
