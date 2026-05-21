import { describe, expect, it } from 'vitest'
import { detectPlatform } from '~~/app/utils/platform'

const IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1'
const IPAD_CLASSIC = 'Mozilla/5.0 (iPad; CPU OS 12_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/12.1 Mobile/15E148 Safari/604.1'
const IPOD = 'Mozilla/5.0 (iPod touch; CPU iPhone OS 15_7 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148'
const MAC = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15'
const ANDROID = 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36'
const WINDOWS = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'

describe('detectPlatform', () => {
  it('detects an iPhone as iOS', () => {
    expect(detectPlatform(IPHONE)).toBe('ios')
  })

  it('detects a classic iPad as iOS', () => {
    expect(detectPlatform(IPAD_CLASSIC)).toBe('ios')
  })

  it('detects an iPod as iOS', () => {
    expect(detectPlatform(IPOD)).toBe('ios')
  })

  it('detects an iPad that masquerades as a Mac (iPadOS 13+) as iOS via touch points', () => {
    expect(detectPlatform(MAC, 5)).toBe('ios')
  })

  it('treats a real Mac (no touch) as desktop', () => {
    expect(detectPlatform(MAC, 0)).toBe('desktop')
    expect(detectPlatform(MAC)).toBe('desktop')
  })

  it('detects an Android phone as android', () => {
    expect(detectPlatform(ANDROID)).toBe('android')
  })

  it('treats a Windows PC as desktop, even with a touch screen', () => {
    expect(detectPlatform(WINDOWS)).toBe('desktop')
    expect(detectPlatform(WINDOWS, 10)).toBe('desktop')
  })

  it('falls back to desktop for an unknown user agent', () => {
    expect(detectPlatform('something-unexpected')).toBe('desktop')
    expect(detectPlatform('')).toBe('desktop')
  })

  it('is case-insensitive', () => {
    expect(detectPlatform(IPHONE.toUpperCase())).toBe('ios')
    expect(detectPlatform(ANDROID.toUpperCase())).toBe('android')
  })
})
