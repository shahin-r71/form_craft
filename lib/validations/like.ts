import { z } from 'zod';

export const createLikeSchema = z.object({
  templateId: z.string({
    required_error: 'Template ID is required',
  }).uuid('Invalid template ID'),
});

export type CreateLikeInput = z.infer<typeof createLikeSchema>;

export const deleteLikeSchema = z.object({
  templateId: z.string({
    required_error: 'Template ID is required',
  }).uuid('Invalid template ID'),
});

export type DeleteLikeInput = z.infer<typeof deleteLikeSchema>;