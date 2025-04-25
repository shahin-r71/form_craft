import { z } from 'zod';

// Topic schema and types are reserved for future use when manual topic creation is implemented
export const createTopicSchema = z.object({
  name: z.string({
    required_error: 'Topic name is required',
  }).min(2, 'Topic name must be at least 2 characters')
    .max(50, 'Topic name cannot exceed 50 characters')
    .regex(/^[\w\s-]+$/, 'Topic name can only contain letters, numbers, spaces, and hyphens'),
});

export type CreateTopicInput = z.infer<typeof createTopicSchema>;

export const updateTopicSchema = createTopicSchema.extend({
  id: z.string({
    required_error: 'Topic ID is required',
  }).uuid('Invalid topic ID'),
});

export type UpdateTopicInput = z.infer<typeof updateTopicSchema>;

export const createTagSchema = z.object({
  name: z.string({
    required_error: 'Tag name is required',
  }).min(2, 'Tag name must be at least 2 characters')
    .max(30, 'Tag name cannot exceed 30 characters')
    .regex(/^[\w\s-]+$/, 'Tag name can only contain letters, numbers, spaces, and hyphens'),
});

export type CreateTagInput = z.infer<typeof createTagSchema>;

export const updateTagSchema = createTagSchema.extend({
  id: z.string({
    required_error: 'Tag ID is required',
  }).uuid('Invalid tag ID'),
});

export type UpdateTagInput = z.infer<typeof updateTagSchema>;