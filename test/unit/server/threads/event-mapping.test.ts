import { describe, it, expect } from 'vitest'
import { eventTypeToRoom } from '~~/server/threads'

describe('eventTypeToRoom', () => {
  it('maps training events to the training room', () => {
    expect(eventTypeToRoom('training')).toBe('training')
  })

  it('maps social events to the social room', () => {
    expect(eventTypeToRoom('social')).toBe('social')
  })

  it('maps manual competition events to the races room', () => {
    expect(eventTypeToRoom('competition')).toBe('races')
  })

  it('maps LADV-imported events to the races room', () => {
    expect(eventTypeToRoom('ladv')).toBe('races')
  })

  it('maps external-LADV events to the races room', () => {
    expect(eventTypeToRoom('ladv_external')).toBe('races')
  })
})
