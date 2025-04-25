import { z } from 'zod';
import { FieldType } from '@prisma/client';

const fieldSubmissionValueSchema = z.object({
  templateFieldId: z.string({
    required_error: 'Field ID is required',
  }).uuid('Invalid field ID'),
  valueString: z.string().optional(),
  valueInteger: z.number().int().optional(),
  valueBoolean: z.boolean().optional(),
}).refine(
  (data) => {
    // Ensure at least one value is provided
    return data.valueString !== undefined ||
      data.valueInteger !== undefined ||
      data.valueBoolean !== undefined;
  },
  {
    message: 'At least one value must be provided',
    path: ['value'],
  }
);

export const createSubmissionSchema = z.object({
  templateId: z.string({
    required_error: 'Template ID is required',
  }).uuid('Invalid template ID'),
  fieldSubmissions: z.array(fieldSubmissionValueSchema)
    .min(1, 'At least one field submission is required'),
});

export type CreateSubmissionInput = z.infer<typeof createSubmissionSchema>;

export const validateFieldValue = (type: FieldType, value: any) => {
  switch (type) {
    case FieldType.STRING:
    case FieldType.TEXT:
      return z.string({
        required_error: 'This field is required',
      }).min(1, 'This field cannot be empty');
    case FieldType.INTEGER:
      return z.number({
        required_error: 'This field is required',
      }).int('Value must be an integer');
    case FieldType.CHECKBOX:
      return z.boolean({
        required_error: 'This field is required',
      });
    default:
      throw new Error(`Unsupported field type: ${type}`);
  }
};