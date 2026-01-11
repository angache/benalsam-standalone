/**
 * Unit Tests for Lazy Framer Motion Utilities
 * 
 * Tests lazy loading wrapper for framer-motion to reduce initial bundle size
 */

import { describe, it, expect, vi } from 'vitest'
import React from 'react'
import {
  MotionFallback,
  motionVariants,
} from '../lazyFramerMotion'

describe('lazyFramerMotion', () => {
  describe('MotionFallback', () => {
    it('should create a div element with children', () => {
      const result = MotionFallback({ children: 'Test Content' })
      expect(result).toBeDefined()
      expect(result.type).toBe('div')
      expect(result.props.children).toBe('Test Content')
    })

    it('should pass through props', () => {
      const result = MotionFallback({ 
        children: 'Content',
        className: 'test-class',
      })
      
      expect(result).toBeDefined()
      expect(result.type).toBe('div')
      expect(result.props.className).toBe('test-class')
    })

    it('should handle multiple children', () => {
      const result = MotionFallback({
        children: [
          React.createElement('span', { key: '1' }, 'Child 1'),
          React.createElement('span', { key: '2' }, 'Child 2'),
        ],
      })
      
      expect(result).toBeDefined()
      expect(Array.isArray(result.props.children)).toBe(true)
    })

    it('should handle onClick prop', () => {
      const onClick = vi.fn()
      const result = MotionFallback({
        children: 'Content',
        onClick,
      })
      
      expect(result.props.onClick).toBe(onClick)
    })
  })

  describe('motionVariants', () => {
    it('should have fadeIn variant with correct structure', () => {
      expect(motionVariants.fadeIn).toEqual({
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
      })
    })

    it('should have slideIn variant with correct structure', () => {
      expect(motionVariants.slideIn).toEqual({
        initial: { x: -100, opacity: 0 },
        animate: { x: 0, opacity: 1 },
        exit: { x: 100, opacity: 0 },
      })
    })

    it('should have scaleIn variant with correct structure', () => {
      expect(motionVariants.scaleIn).toEqual({
        initial: { scale: 0.8, opacity: 0 },
        animate: { scale: 1, opacity: 1 },
        exit: { scale: 0.8, opacity: 0 },
      })
    })

    it('should have slideUp variant with correct structure', () => {
      expect(motionVariants.slideUp).toEqual({
        initial: { y: 20, opacity: 0 },
        animate: { y: 0, opacity: 1 },
        exit: { y: -20, opacity: 0 },
      })
    })

    it('should have all required properties for each variant', () => {
      Object.values(motionVariants).forEach(variant => {
        expect(variant).toHaveProperty('initial')
        expect(variant).toHaveProperty('animate')
        expect(variant).toHaveProperty('exit')
      })
    })
  })
})
