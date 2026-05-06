import { describe, it, expect } from 'vitest'
import { sanitizeHtml, sanitizeInput } from './sanitize'

describe('sanitizeHtml', () => {
  it('escapes < and > characters', () => {
    expect(sanitizeHtml('<div>hello</div>')).toBe('&lt;div&gt;hello&lt;/div&gt;')
  })

  it('escapes script elements', () => {
    expect(sanitizeHtml('<script>alert("xss")</script>')).toBe(
      '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'
    )
  })

  it('escapes ampersands', () => {
    expect(sanitizeHtml('a & b')).toBe('a &amp; b')
  })

  it('escapes double quotes', () => {
    expect(sanitizeHtml('say "hello"')).toBe('say &quot;hello&quot;')
  })

  it('escapes single quotes', () => {
    expect(sanitizeHtml("it's fine")).toBe('it&#x27;s fine')
  })

  it('escapes all dangerous characters together', () => {
    expect(sanitizeHtml('<img src="x" onerror=\'alert(1)\'>')).toBe(
      '&lt;img src=&quot;x&quot; onerror=&#x27;alert(1)&#x27;&gt;'
    )
  })

  it('preserves normal text without special characters', () => {
    expect(sanitizeHtml('Hello world 123')).toBe('Hello world 123')
  })

  it('preserves letters, numbers, and safe punctuation', () => {
    expect(sanitizeHtml('Price: $10.50 (USD) - 20% off!')).toBe(
      'Price: $10.50 (USD) - 20% off!'
    )
  })

  it('preserves whitespace characters', () => {
    expect(sanitizeHtml('line1\nline2\ttab')).toBe('line1\nline2\ttab')
  })

  it('preserves unicode characters', () => {
    expect(sanitizeHtml('café résumé naïve')).toBe('café résumé naïve')
  })

  it('handles empty string', () => {
    expect(sanitizeHtml('')).toBe('')
  })

  it('handles string with only special characters', () => {
    expect(sanitizeHtml('<>&"\'')).toBe('&lt;&gt;&amp;&quot;&#x27;')
  })

  it('escapes event handler attributes', () => {
    expect(sanitizeHtml('onload="alert(1)"')).toBe('onload=&quot;alert(1)&quot;')
  })

  it('escapes nested script attempts', () => {
    expect(sanitizeHtml('<<script>>alert(1)<</script>>')).toBe(
      '&lt;&lt;script&gt;&gt;alert(1)&lt;&lt;/script&gt;&gt;'
    )
  })
})

describe('sanitizeInput', () => {
  it('trims leading and trailing whitespace', () => {
    expect(sanitizeInput('  hello  ')).toBe('hello')
  })

  it('trims and escapes HTML', () => {
    expect(sanitizeInput('  <b>bold</b>  ')).toBe('&lt;b&gt;bold&lt;/b&gt;')
  })

  it('handles empty string', () => {
    expect(sanitizeInput('')).toBe('')
  })

  it('handles whitespace-only string', () => {
    expect(sanitizeInput('   ')).toBe('')
  })

  it('preserves internal whitespace while trimming edges', () => {
    expect(sanitizeInput('  hello   world  ')).toBe('hello   world')
  })

  it('sanitizes script injection with surrounding whitespace', () => {
    expect(sanitizeInput('  <script>alert("xss")</script>  ')).toBe(
      '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'
    )
  })
})
