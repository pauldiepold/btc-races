import { z } from 'zod'
import { defineNotificationType } from './_define'

export const threadNewComment = defineNotificationType({
  type: 'thread_new_comment',
  actor: 'required',
  meta: {
    label: 'Neuer Kommentar in einem Thread',
    description: 'Wenn in einem Beitrag oder Event-Thread, an dem du beteiligt bist, ein neuer Kommentar erscheint.',
    adminOnly: false,
  },
  defaults: {
    email: { default: false, mandatory: false },
    push: { default: true, mandatory: false },
  },
  payload: z.object({
    threadTitle: z.string(),
    roomLabel: z.string(),
    commentBodyMarkdown: z.string(),
    commentBodyHtml: z.string(),
    threadLink: z.string(),
  }),
  email: {
    component: 'ThreadNewCommentEmail',
    subject: (p, ctx) => `Neuer Kommentar von ${ctx.actor.name}: ${p.threadTitle}`,
  },
  push: (p, ctx) => ({
    title: `${ctx.actor.name} in „${p.threadTitle}"`,
    body: stripMarkdown(p.commentBodyMarkdown).slice(0, 140),
    url: p.threadLink,
  }),
})

/** Kürzt Markdown auf Klartext für die Push-Vorschau (heuristisch, kein Renderer). */
function stripMarkdown(text: string): string {
  return text
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`]*`/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/[*_~>#-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}
