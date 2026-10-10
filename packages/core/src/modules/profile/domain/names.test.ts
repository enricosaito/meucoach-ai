import { describe, expect, it } from 'vitest'
import { firstName, greetingName } from './names'

describe('greetingName', () => {
  it('prefers the display name', () => {
    expect(greetingName({ displayName: 'Ana Paula', username: 'ana_p' })).toBe('Ana Paula')
  })

  it('falls back to the username when the display name is missing or blank', () => {
    expect(greetingName({ displayName: null, username: 'ana_p' })).toBe('ana_p')
    expect(greetingName({ displayName: '   ', username: 'ana_p' })).toBe('ana_p')
  })
})

describe('firstName', () => {
  it('uses the first word of the display name', () => {
    expect(firstName({ displayName: 'Ana Paula Souza', username: 'ana' })).toBe('Ana')
  })

  it('uses the whole username when there is no display name', () => {
    expect(firstName({ displayName: null, username: 'ana.souza' })).toBe('ana.souza')
  })
})
