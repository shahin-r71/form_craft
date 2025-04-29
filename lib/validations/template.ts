import { z } from 'zod';
import { FieldType } from '@prisma/client';

export const templateFieldSchema = z.object({
  type: z.nativeEnum(FieldType),
  title: z.string()
    .min(1, 'Title is required')
    .max(200, 'Title must be less than 200 characters'),
  description: z.string()
    .max(500, 'Description must be less than 500 characters')
    .optional()
    .nullable(),
  required: z.boolean().default(false),
  showInResults: z.boolean().default(true),
});

const templateBaseSchema = z.object({
  title: z.string()
    .min(3, 'Title must be at least 3 characters')
    .max(200, 'Title must be less than 200 characters'),
  description: z.string()
    .max(500, 'Description must be less than 500 characters')
    .optional()
    .nullable(),
  isPublic: z.boolean().default(true),
  topicId: z.string().uuid('Invalid topic ID').optional().nullable(),
  imageUrl: z.string().optional().nullable(),
  templateFields: z.array(templateFieldSchema)
    .min(1, 'At least one field is required')
    .max(30, 'Maximum of 30 fields allowed')
    .refine(
      (fields) => {
        const titles = new Set(fields.map(field => field.title.toLowerCase()));
        return titles.size === fields.length;
      },
      {
        message: 'Field titles must be unique',
        path: ['fields']
      }
    ),
});

export const createTemplateSchema = templateBaseSchema.extend({
  templateTags: z.array(z.string().uuid('Invalid tag ID')).optional(),
  accessGrants: z.array(z.string().uuid('Invalid user ID')).optional(),
});

export const updateTemplateSchema = templateBaseSchema.extend({
  templateTags: z.array(z.string().uuid('Invalid tag ID')).optional(),
  accessGrants: z.array(z.string().uuid('Invalid user ID')).optional(),
});

export type CreateTemplateInput = z.infer<typeof createTemplateSchema>;
export type UpdateTemplateInput = z.infer<typeof updateTemplateSchema>;
export type TemplateFieldInput = z.infer<typeof templateFieldSchema>;