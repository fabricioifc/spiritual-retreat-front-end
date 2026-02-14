'use server';

import { AuthError } from 'next-auth';

import { z } from 'zod';

import { signIn } from '@/auth';

const loginSchema = z.object({
  email: z.string().email('Informe um email válido'),
  password: z.string().min(1, 'A senha é obrigatória'),
});

const DEFAULT_REDIRECT = '/dashboard';

export async function loginServerAction(formData: FormData) {
  const validatedFields = loginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Dados inválidos. Verifique os campos.',
    };
  }

  const { email, password } = validatedFields.data;

  const callbackUrl =
    formData.get('callbackUrl')?.toString() || DEFAULT_REDIRECT;
  console.warn('[auth][login-server] submit', {
    email,
    callbackUrl,
  });

  try {
    await signIn('credentials', {
      email,
      password,
      redirectTo: callbackUrl,
    });
    console.warn('[auth][login-server] signIn resolved without redirect throw');
  } catch (error) {
    if (
      typeof error === 'object' &&
      error !== null &&
      'digest' in error &&
      typeof (error as { digest?: unknown }).digest === 'string'
    ) {
      console.warn('[auth][login-server] redirect/error digest', {
        digest: (error as { digest: string }).digest,
      });
    }

    if (error instanceof AuthError) {
      console.warn('[auth][login-server] auth error', {
        type: error.type,
        message: error.message,
      });
      switch (error.type) {
        case 'CredentialsSignin':
        case 'CallbackRouteError': // Às vezes ocorre em credenciais erradas
          return {
            message: 'Credenciais inválidas. Verifique email e senha.',
          };
        case 'AccessDenied':
          return {
            message: 'Acesso negado. Verifique suas permissões.',
          };
        default:
          return { message: 'Algo deu errado. Tente novamente.' };
      }
    }

    // O Next.js usa um erro especial para fazer o redirect.
    // Se você retornar algo aqui, o redirect é cancelado.
    throw error;
  }
}
