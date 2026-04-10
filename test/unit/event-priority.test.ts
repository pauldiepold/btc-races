import { describe, it, expect } from 'vitest'
import { z } from 'zod'

const prioritySchema = z.enum(['A', 'B', 'C']).optional().nullable()

describe('priority field validation', () => {
  it('accepts A', () => {
    expect(prioritySchema.safeParse('A').success).toBe(true)
  })

  it('accepts B', () => {
    expect(prioritySchema.safeParse('B').success).toBe(true)
  })

  it('accepts C', () => {
    expect(prioritySchema.safeParse('C').success).toBe(true)
  })

  it('accepts null', () => {
    expect(prioritySchema.safeParse(null).success).toBe(true)
  })

  it('accepts undefined', () => {
    expect(prioritySchema.safeParse(undefined).success).toBe(true)
  })

  it('rejects lowercase a', () => {
    expect(prioritySchema.safeParse('a').success).toBe(false)
  })

  it('rejects D', () => {
    expect(prioritySchema.safeParse('D').success).toBe(false)
  })

  it('rejects arbitrary string', () => {
    expect(prioritySchema.safeParse('high').success).toBe(false)
  })
})
