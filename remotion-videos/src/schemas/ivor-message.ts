import { z } from "zod";

export const teaseSchema = z.object({
  title: z.string().min(1).max(80),
  hook: z.string().min(1).max(180),
  url: z.string().url(),
  thumbnail: z.string().optional(),
  voteCount: z.number().int().nonnegative().optional(),
  rank: z.number().int().min(1).max(99).optional(),
});

export const ctaSchema = z.object({
  text: z.string().min(1).max(60),
  url: z.string().url(),
  spokenUrl: z.string().min(1).max(60),
});

export const ivorMessagePropsSchema = z.object({
  property: z.enum(["ivor-events", "news-digest", "social-seen"]),
  title: z.string().min(1).max(60),
  intro: z.string().max(280).optional(),
  teases: z.array(teaseSchema).min(1).max(4),
  cta: ctaSchema,
  avatarVideo: z.string().default("assets/ivor-avatar.mp4"),
  voiceTrack: z.string().optional(),
  bgMusic: z.boolean().default(false),
  durationSeconds: z.number().min(8).max(90).default(35),
  showName: z.string().min(1).max(40).default("BLKOUT News"),
  weekLabel: z.string().max(40).optional(),
  dateRangeFrom: z.string().max(40).optional(),
  dateRangeTo: z.string().max(40).optional(),
  tickerText: z.string().min(1).max(400),
  backdropImage: z.string().optional(),
  backdropVideo: z.string().optional(),
});

export type IvorMessageProps = z.infer<typeof ivorMessagePropsSchema>;
export type Tease = z.infer<typeof teaseSchema>;
export type Cta = z.infer<typeof ctaSchema>;
