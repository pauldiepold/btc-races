import { z } from 'zod'
import { defineNotificationType } from './_define'

export const threadAnnouncement = defineNotificationType({
  type: 'thread_announcement',
  actor: 'required',
  meta: {
    label: 'Ankündigungen vom Vorstand',
    description: 'Vereins-Ankündigungen vom Vorstand. Verpflichtend — kann nicht abbestellt werden.',
    adminOnly: false,
  },
  defaults: {
    email: { default: true, mandatory: true },
    push: { default: true, mandatory: true },
  },
  payload: z.object({
    threadTitle: z.string(),
    bodyMarkdown: z.string(),
    bodyHtml: z.string(),
    threadLink: z.string(),
  }),
  email: {
    component: 'ThreadAnnouncementEmail',
    subject: (p, ctx) => `Ankündigung von ${ctx.actor.name}: ${p.threadTitle}`,
  },
  push: (p, ctx) => ({
    title: `Ankündigung: ${p.threadTitle}`,
    body: `${ctx.actor.name} hat eine neue Ankündigung veröffentlicht.`,
    url: p.threadLink,
  }),
})
