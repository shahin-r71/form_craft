import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string({
    required_error: 'Email is required',
  }).email('Invalid email address'),
  password: z.string({
    required_error: 'Password is required',
  })
    .min(8, 'Password must be at least 8 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]+$/,
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    ),
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name cannot exceed 50 characters')
    .optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string({
    required_error: 'Email is required',
  }).email('Invalid email address'),
  password: z.string({
    required_error: 'Password is required',
  }),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const resetPasswordSchema = z.object({
  email: z.string({
    required_error: 'Email is required',
  }).email('Invalid email address'),
});

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

export const newPasswordSchema = z.object({
  token: z.string({
    required_error: 'Reset token is required',
  }),
  password: z.string({
    required_error: 'Password is required',
  })
    .min(8, 'Password must be at least 8 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]+$/,
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    ),
  confirmPassword: z.string({
    required_error: 'Password confirmation is required',
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export type NewPasswordInput = z.infer<typeof newPasswordSchema>;