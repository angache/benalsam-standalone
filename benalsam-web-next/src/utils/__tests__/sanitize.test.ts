import { describe, it, expect } from 'vitest'
import {
  sanitizeText,
  sanitizeHTML,
  sanitizeUrl,
  sanitizeObject,
  sanitizeMessage,
  sanitizeListingTitle,
  sanitizeSearchQuery,
} from '../sanitize'

describe('Sanitize Utility', () => {
  describe('sanitizeText', () => {
    it('should remove all HTML tags', () => {
      const input = '<script>alert("XSS")</script>Hello'
      const output = sanitizeText(input)
      expect(output).toBe('Hello')
    })

    it('should handle null and undefined', () => {
      expect(sanitizeText(null)).toBe('')
      expect(sanitizeText(undefined)).toBe('')
    })

    it('should remove img tags with onerror', () => {
      const input = '<img src=x onerror="alert(1)">Test'
      const output = sanitizeText(input)
      expect(output).toBe('Test')
    })

    it('should remove iframe tags', () => {
      const input = '<iframe src="javascript:alert(1)"></iframe>Safe'
      const output = sanitizeText(input)
      expect(output).toBe('Safe')
    })

    it('should remove style tags', () => {
      const input = '<style>body{display:none}</style>Content'
      const output = sanitizeText(input)
      expect(output).toBe('Content')
    })

    it('should preserve plain text', () => {
      const input = 'Hello World! 👋'
      const output = sanitizeText(input)
      expect(output).toBe('Hello World! 👋')
    })

    it('should handle special characters', () => {
      const input = 'Price: $100 & free shipping'
      const output = sanitizeText(input)
      expect(output).toBe('Price: $100 & free shipping')
    })
  })

  describe('sanitizeHTML', () => {
    it('should allow safe HTML tags', () => {
      const input = '<p>Hello <strong>World</strong></p>'
      const output = sanitizeHTML(input)
      expect(output).toContain('<p>')
      expect(output).toContain('<strong>')
    })

    it('should remove script tags', () => {
      const input = '<p>Safe</p><script>alert(1)</script>'
      const output = sanitizeHTML(input)
      expect(output).not.toContain('<script>')
      expect(output).toContain('Safe')
    })

    it('should add rel and target to links', () => {
      const input = '<a href="https://example.com">Link</a>'
      const output = sanitizeHTML(input)
      expect(output).toContain('rel="noopener noreferrer"')
      expect(output).toContain('target="_blank"')
    })

    it('should remove dangerous attributes', () => {
      const input = '<p onclick="alert(1)">Text</p>'
      const output = sanitizeHTML(input)
      expect(output).not.toContain('onclick')
    })
  })

  describe('sanitizeUrl', () => {
    it('should allow https URLs', () => {
      const input = 'https://example.com'
      const output = sanitizeUrl(input)
      expect(output).toBe('https://example.com')
    })

    it('should allow http URLs', () => {
      const input = 'http://example.com'
      const output = sanitizeUrl(input)
      expect(output).toBe('http://example.com')
    })

    it('should allow mailto URLs', () => {
      const input = 'mailto:test@example.com'
      const output = sanitizeUrl(input)
      expect(output).toBe('mailto:test@example.com')
    })

    it('should reject javascript URLs', () => {
      const input = 'javascript:alert(1)'
      const output = sanitizeUrl(input)
      expect(output).toBe('')
    })

    it('should reject data URLs', () => {
      const input = 'data:text/html,<script>alert(1)</script>'
      const output = sanitizeUrl(input)
      expect(output).toBe('')
    })

    it('should handle null and undefined', () => {
      expect(sanitizeUrl(null)).toBe('')
      expect(sanitizeUrl(undefined)).toBe('')
    })

    it('should handle invalid URLs', () => {
      const input = 'not-a-valid-url'
      const output = sanitizeUrl(input)
      expect(output).toBe('')
    })
  })

  describe('sanitizeObject', () => {
    it('should sanitize all string values in object', () => {
      const input = {
        name: '<script>alert(1)</script>John',
        bio: '<img src=x onerror="alert(1)">Developer',
      }
      const output = sanitizeObject(input)
      expect(output.name).toBe('John')
      expect(output.bio).toBe('Developer')
    })

    it('should handle nested objects', () => {
      const input = {
        user: {
          name: '<script>XSS</script>Alice',
        },
      }
      const output = sanitizeObject(input)
      expect(output.user.name).toBe('Alice')
    })

    it('should preserve non-string values', () => {
      const input = {
        name: 'John',
        age: 25,
        active: true,
      }
      const output = sanitizeObject(input)
      expect(output.age).toBe(25)
      expect(output.active).toBe(true)
    })
  })

  describe('sanitizeMessage', () => {
    it('should allow br tags', () => {
      const input = 'Line 1<br>Line 2'
      const output = sanitizeMessage(input)
      expect(output).toContain('<br>')
    })

    it('should remove script tags', () => {
      const input = 'Hello<script>alert(1)</script>'
      const output = sanitizeMessage(input)
      expect(output).not.toContain('<script>')
      expect(output).toBe('Hello')
    })

    it('should handle null and undefined', () => {
      expect(sanitizeMessage(null)).toBe('')
      expect(sanitizeMessage(undefined)).toBe('')
    })
  })

  describe('sanitizeListingTitle', () => {
    it('should remove all HTML', () => {
      const input = '<b>iPhone 13</b> Pro Max'
      const output = sanitizeListingTitle(input)
      expect(output).toBe('iPhone 13 Pro Max')
    })

    it('should trim whitespace', () => {
      const input = '  iPhone 13  '
      const output = sanitizeListingTitle(input)
      expect(output).toBe('iPhone 13')
    })

    it('should limit length to 200 characters', () => {
      const input = 'A'.repeat(300)
      const output = sanitizeListingTitle(input)
      expect(output.length).toBe(200)
    })

    it('should preserve special characters', () => {
      const input = 'iPhone 13 Pro - 256GB & AppleCare+'
      const output = sanitizeListingTitle(input)
      expect(output).toContain('&')
      expect(output).toContain('+')
    })
  })

  describe('sanitizeSearchQuery', () => {
    it('should remove HTML tags', () => {
      const input = '<script>alert(1)</script>iPhone'
      const output = sanitizeSearchQuery(input)
      expect(output).toBe('iPhone')
    })

    it('should remove SQL injection characters', () => {
      const input = "'; DROP TABLE users; --"
      const output = sanitizeSearchQuery(input)
      expect(output).not.toContain(';')
      expect(output).not.toContain("'")
      expect(output).not.toContain('\\')
    })

    it('should trim and limit length', () => {
      const input = '  ' + 'A'.repeat(150) + '  '
      const output = sanitizeSearchQuery(input)
      expect(output.length).toBe(100)
      expect(output).not.toContain('  ')
    })

    it('should handle null and undefined', () => {
      expect(sanitizeSearchQuery(null)).toBe('')
      expect(sanitizeSearchQuery(undefined)).toBe('')
    })
  })

  describe('XSS Attack Vectors', () => {
    const xssPayloads = [
      '<script>alert("XSS")</script>',
      '<img src=x onerror="alert(1)">',
      '<svg onload="alert(1)">',
      '<iframe src="javascript:alert(1)">',
      '<body onload="alert(1)">',
      '<input onfocus="alert(1)" autofocus>',
      '<select onfocus="alert(1)" autofocus>',
      '<textarea onfocus="alert(1)" autofocus>',
      '<marquee onstart="alert(1)">',
      '<style>body{display:none}</style>',
      '"><script>alert(1)</script>',
      '\';alert(1);//',
      '<IMG SRC=j&#X41vascript:alert(1)>',
      '<IMG SRC=&#106;&#97;&#118;&#97;&#115;&#99;&#114;&#105;&#112;&#116;&#58;&#97;&#108;&#101;&#114;&#116;&#40;&#49;&#41;>',
    ]

    xssPayloads.forEach((payload, index) => {
      it(`should block XSS payload #${index + 1}: ${payload.substring(0, 30)}...`, () => {
        const output = sanitizeText(payload)
        expect(output).not.toContain('<script')
        expect(output).not.toContain('onerror')
        expect(output).not.toContain('onload')
        expect(output).not.toContain('javascript:')
      })
    })
  })
})

