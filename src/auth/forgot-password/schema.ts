import { z } from 'zod';

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .email('Por favor, insira um email válido')
    .min(1, 'Email é obrigatório'),
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
