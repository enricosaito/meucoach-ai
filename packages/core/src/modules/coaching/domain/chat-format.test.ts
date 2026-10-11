import { describe, expect, it } from 'vitest'
import { parseChatMarkdown } from './chat-format'

describe('parseChatMarkdown', () => {
  it('turns **bold** and *italic* into styled spans', () => {
    expect(
      parseChatMarkdown('Coma **150 g de proteína** por dia, *de preferência* em 4 refeições.'),
    ).toEqual([
      {
        type: 'paragraph',
        spans: [
          { text: 'Coma ' },
          { text: '150 g de proteína', bold: true },
          { text: ' por dia, ' },
          { text: 'de preferência', italic: true },
          { text: ' em 4 refeições.' },
        ],
      },
    ])
  })

  it('handles bold + italic and italic inside bold', () => {
    expect(parseChatMarkdown('***Bora!*** e **muito *bem* mesmo**')[0]).toEqual({
      type: 'paragraph',
      spans: [
        { text: 'Bora!', bold: true, italic: true },
        { text: ' e ' },
        { text: 'muito ', bold: true },
        { text: 'bem', bold: true, italic: true },
        { text: ' mesmo', bold: true },
      ],
    })
  })

  it('parses bullet and numbered lists', () => {
    const blocks = parseChatMarkdown(
      'Plano:\n* Supino 4x8\n- Remada **4x10**\n• Prancha\n\n1. Aqueça\n2) Treine',
    )
    expect(blocks.map((b) => b.type)).toEqual([
      'paragraph',
      'bullet',
      'bullet',
      'bullet',
      'numbered',
      'numbered',
    ])
    expect(blocks[2]).toEqual({
      type: 'bullet',
      spans: [{ text: 'Remada ' }, { text: '4x10', bold: true }],
    })
    expect(blocks[5]).toEqual({ type: 'numbered', number: 2, spans: [{ text: 'Treine' }] })
  })

  it('renders headings as a bold line', () => {
    expect(parseChatMarkdown('## Treino *A*')).toEqual([
      {
        type: 'heading',
        spans: [
          { text: 'Treino ', bold: true },
          { text: 'A', bold: true, italic: true },
        ],
      },
    ])
  })

  it('keeps line breaks inside a paragraph and splits on blank lines', () => {
    expect(parseChatMarkdown('linha 1\nlinha 2\n\nnovo parágrafo')).toEqual([
      { type: 'paragraph', spans: [{ text: 'linha 1\nlinha 2' }] },
      { type: 'paragraph', spans: [{ text: 'novo parágrafo' }] },
    ])
  })

  it('degrades everything else to plain text', () => {
    const text = parseChatMarkdown('Veja [o guia](https://x.y) e use `kg`.\n---\n```\ncode\n```')
    expect(text).toEqual([
      { type: 'paragraph', spans: [{ text: 'Veja o guia e use kg.' }] },
      { type: 'paragraph', spans: [{ text: 'code' }] },
    ])
  })

  it('leaves stray markers and snake_case alone', () => {
    expect(parseChatMarkdown('2 * 3 = 6, peso_corporal e **sem fim')).toEqual([
      { type: 'paragraph', spans: [{ text: '2 * 3 = 6, peso_corporal e **sem fim' }] },
    ])
  })

  it('does not mistake italic at the start of a line for a bullet', () => {
    expect(parseChatMarkdown('*Dica:* beba água')[0]).toEqual({
      type: 'paragraph',
      spans: [{ text: 'Dica:', italic: true }, { text: ' beba água' }],
    })
  })
})
