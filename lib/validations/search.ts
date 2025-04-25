import { z } from 'zod';

export const templateSearchSchema = z.object({
  query: z.string().optional(),
  topicId: z.string().uuid('Invalid topic ID').optional(),
  tags: z.array(z.string()).optional(),
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().max(50).optional().default(10),
  sortBy: z.enum(['created', 'updated', 'likes', 'submissions']).optional().default('created'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  isPublic: z.boolean().optional(),
});

export type TemplateSearchInput = z.infer<typeof templateSearchSchema>;

export const templateFilterSchema = z.object({
  topicId: z.string().uuid('Invalid topic ID').optional(),
  tags: z.array(z.string()).optional(),
  isPublic: z.boolean().optional(),
});

export type TemplateFilterInput = z.infer<typeof templateFilterSchema>;