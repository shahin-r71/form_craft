import { z } from 'zod';

export const createCommentSchema = z.object({
  templateId: z.string({
    required_error: 'Template ID is required',
  }).uuid('Invalid template ID'),
  content: z.string({
    required_error: 'Comment content is required',
  }).min(1, 'Comment cannot be empty')
    .max(1000, 'Comment cannot exceed 1000 characters'),
});

export type CreateCommentInput = z.infer<typeof createCommentSchema>;

export const updateCommentSchema = z.object({
  id: z.string({
    required_error: 'Comment ID is required',
  }).uuid('Invalid comment ID'),
  content: z.string({
    required_error: 'Comment content is required',
  }).min(1, 'Comment cannot be empty')
    .max(1000, 'Comment cannot exceed 1000 characters'),
});

export type UpdateCommentInput = z.infer<typeof updateCommentSchema>;