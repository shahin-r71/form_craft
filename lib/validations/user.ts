import { z } from 'zod';

export const userProfileSchema = z.object({
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name cannot exceed 50 characters')
    .optional(),
  email: z.string({
    required_error: 'Email is required',
  }).email('Invalid email address'),
  avatarUrl: z.string().url('Invalid avatar URL').optional(),
});

export type UserProfileInput = z.infer<typeof userProfileSchema>;

export const updatePasswordSchema = z.object({
  currentPassword: z.string({
    required_error: 'Current password is required',
  }).min(8, 'Password must be at least 8 characters'),
  newPassword: z.string({
    required_error: 'New password is required',
  }).min(8, 'Password must be at least 8 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/,
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
    ),
  confirmPassword: z.string({
    required_error: 'Please confirm your password',
  }),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export type UpdatePasswordInput = z.infer<typeof updatePasswordSchema>;