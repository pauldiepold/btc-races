import { describe, it, expect } from 'vitest'
import { resolveRecipients, type ResolveRecipientsInput } from '~~/server/threads/recipients'

function baseInput(overrides: Partial<ResolveRecipientsInput> = {}): ResolveRecipientsInput {
  return {
    threadAuthorId: null,
    commenterIds: [],
    eventParticipantIds: [],
    overrides: [],
    triggerAuthorId: 0,
    ...overrides,
  }
}

describe('resolveRecipients', () => {
  it('includes the thread author', () => {
    const result = resolveRecipients(baseInput({ threadAuthorId: 1, triggerAuthorId: 99 }))
    expect(result).toEqual([1])
  })

  it('includes previous commenters', () => {
    const result = resolveRecipients(baseInput({ commenterIds: [2, 3], triggerAuthorId: 99 }))
    expect(result.sort()).toEqual([2, 3])
  })

  it('includes event participants (for event threads)', () => {
    const result = resolveRecipients(baseInput({ eventParticipantIds: [4, 5], triggerAuthorId: 99 }))
    expect(result.sort()).toEqual([4, 5])
  })

  it('deduplicates users that appear in multiple buckets', () => {
    const result = resolveRecipients(baseInput({
      threadAuthorId: 1,
      commenterIds: [1, 2],
      eventParticipantIds: [2, 3],
      triggerAuthorId: 99,
    }))
    expect(result.sort()).toEqual([1, 2, 3])
  })

  it('excludes the triggering comment author', () => {
    const result = resolveRecipients(baseInput({
      threadAuthorId: 1,
      commenterIds: [1, 2, 7],
      triggerAuthorId: 7,
    }))
    expect(result.sort()).toEqual([1, 2])
  })

  it('subtracts muted users even if they would otherwise be recipients', () => {
    const result = resolveRecipients(baseInput({
      threadAuthorId: 1,
      commenterIds: [2, 3],
      overrides: [{ userId: 2, state: 'muted' }],
      triggerAuthorId: 99,
    }))
    expect(result.sort()).toEqual([1, 3])
  })

  it('adds following users that are not automatic recipients', () => {
    const result = resolveRecipients(baseInput({
      threadAuthorId: 1,
      overrides: [{ userId: 42, state: 'following' }],
      triggerAuthorId: 99,
    }))
    expect(result.sort()).toEqual([1, 42])
  })

  it('does not double-count a follower that is already an automatic recipient', () => {
    const result = resolveRecipients(baseInput({
      threadAuthorId: 1,
      commenterIds: [42],
      overrides: [{ userId: 42, state: 'following' }],
      triggerAuthorId: 99,
    }))
    expect(result.sort()).toEqual([1, 42])
  })

  it('lets mute beat follow when both states exist for the same user (defensive)', () => {
    const result = resolveRecipients(baseInput({
      commenterIds: [2],
      overrides: [
        { userId: 2, state: 'muted' },
        { userId: 2, state: 'following' },
      ],
      triggerAuthorId: 99,
    }))
    expect(result).toEqual([])
  })

  it('still excludes the trigger author even when they explicitly follow', () => {
    const result = resolveRecipients(baseInput({
      threadAuthorId: 1,
      overrides: [{ userId: 7, state: 'following' }],
      triggerAuthorId: 7,
    }))
    expect(result).toEqual([1])
  })

  it('returns an empty list when nobody qualifies', () => {
    expect(resolveRecipients(baseInput({ triggerAuthorId: 1 }))).toEqual([])
  })
})
