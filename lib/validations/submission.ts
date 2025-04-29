import { z } from 'zod';
import { FieldType } from '@prisma/client';
import type { Template } from '@/types/template';

export const fieldSubmissionSchema = z.object({
  templateFieldId: z.string().uuid('Invalid field ID'),
  valueString: z.string().optional(),
  valueInteger: z.number().int().optional(),
  valueBoolean: z.boolean().optional(),
});

// Validation schema for the entire submission
export const submissionSchema = z.object({
  templateId: z.string().uuid('Invalid template ID'),
  fieldSubmissions: z.array(
    fieldSubmissionSchema
  )
});


export type CreateSubmissionInput = z.infer<typeof submissionSchema>;

export const validateFieldValue = (type: FieldType, required: boolean = false) => {
  let schema;
  
  switch (type) {
    case FieldType.STRING:
    case FieldType.TEXT:
      schema = z.string();
      if(required){
        schema = schema.min(1, "This field is required")
      }else{
        schema = schema.optional().nullable();
      }
      break;
    case FieldType.INTEGER:
      schema = z.string()
        .refine((val) => !isNaN(parseInt(val)), { message: 'Must be a valid number' })
         // Transform to number if not empty, otherwise handle optional case
        .transform((val, ctx) => {
            if (val === '') {
                // If it's optional and empty, return undefined or null
                if (!required) return null; 
                // If required and empty, add an issue
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: 'This field is required',
                });
                return z.NEVER; // Prevent further processing
            }
            const parsed = parseInt(val);
            if (isNaN(parsed)) {
                 ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: 'Must be a valid number',
                });
                return z.NEVER;
            }
            return parsed;
        });

      // If not required, make the whole transformation chain optional
      if (!required) {
        schema = schema.optional().nullable();
      }
    
      break;
    case FieldType.CHECKBOX:
      schema = z.boolean();
      if (required) {
        // Refine ensures it must be true if required
        schema = schema.refine((val) => val === true, {
          message: 'This checkbox is required', // More specific message
        });
      }else{
        // If not required, make it optional
        schema = schema.optional().nullable();
      }
      break;
    default:
      throw new Error(`Unsupported field type: ${type}`);
  }
    
  return schema
};

export const submissionValidationSchema = (template: Template) => {
const schemaFields: Record<string, any> = {};

template.templateFields.forEach((field) => {
    const fieldSchema = validateFieldValue(field.type, field.required);
    
    schemaFields[`${field.id}`] = fieldSchema;
});

return z.object(schemaFields);
};
export type SubmissionValidationInput = ReturnType<typeof submissionValidationSchema>;
