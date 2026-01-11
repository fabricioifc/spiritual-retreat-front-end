import NextAuth, {
  AuthValidity,
  BackendJWT,
  CredentialsSignin,
  DecodedJWT,
  User,
} from 'next-auth';
import 'next-auth/jwt';
import { JWT } from 'next-auth/jwt';
import Credentials from 'next-auth/providers/credentials';

import { UnstorageAdapter } from '@auth/unstorage-adapter';
import { jwtDecode } from 'jwt-decode';
import { createStorage } from 'unstorage';
import memoryDriver from 'unstorage/drivers/memory';
import vercelKVDriver from 'unstorage/drivers/vercel-kv';

import { authRoutes } from './routes';
import { isPublicPath } from './routes';
import { LoginResponse } from './src/auth/types';
import apiServer from './src/lib/axiosServerInstance';
import {
  handleApiResponse,
  sendRequestServerVanilla,
} from './src/lib/sendRequestServerVanilla';
import { refresh } from './src/mocks/actions';

const storage = createStorage({
  driver: process.env.VERCEL
    ? vercelKVDriver({
        url: process.env.AUTH_KV_REST_API_URL,
        token: process.env.AUTH_KV_REST_API_TOKEN,
        env: false,
      })
    : memoryDriver(),
});

class UserNotActivatedError extends CredentialsSignin {
  constructor() {
    super('CONFIRMATION_CODE_REQUIRED');
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  debug: !!process.env.AUTH_DEBUG,
  logger: {
    error(error) {
      // Envia o erro para o Sentry com mais contexto
      // Sentry.captureException(metadata.error, {
      //   extra: {
      //     code: code,
      //     ...metadata
      //   }
      // });
      // Você pode também logar no console se quiser
      console.error(error.message);
    },
    warn(code) {
      console.log(code);
    },
    debug(code, message) {
      // Evite enviar logs de debug para produção
      if (process.env.NODE_ENV !== 'production') {
        console.error(code, message);
      }
    },
  },
  theme: { logo: 'https://authjs.dev/img/logo-sm.png' },
  session: {
    strategy: 'jwt',
    maxAge: 15 * 60, // 15 minutos
    updateAge: 5 * 60, // Tenta atualizar a sessão a cada 5 minutos
  },
  pages: {
    signIn: '/login',
    error: '/', // Error code passed in query string as ?error=
  },
  adapter: UnstorageAdapter(storage),

  //basePath: "/auth",
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider !== 'credentials') return true;
      if (user) {
        //console.log("User signed in:", user);
        return true;
      }
      return false;
    },

    async jwt({ token, user }) {
      if (user) {
        const enrichedUser = user as User & {
          tokens?: BackendJWT;
          validity?: AuthValidity;
        };

        // eslint-disable-next-line no-console
        console.log('✅ Initial signin - User data:', {
          userId: enrichedUser.user?.id ?? enrichedUser.id,
          hasTokens: !!enrichedUser.tokens,
          validUntil: enrichedUser.validity?.valid_until
            ? new Date(enrichedUser.validity.valid_until * 1000).toISOString()
            : 'N/A',
        });

        return { ...token, data: enrichedUser };
      }

      // ✅ Validação: se não tem data, significa que o token é inválido
      if (!token.data) {
        console.log('❌ Token without data - invalid token');
        return { ...token, error: 'NoTokenData' } as JWT;
      }

      const now = Date.now();
      const validUntil = token.data.validity?.valid_until
        ? token.data.validity.valid_until * 1000
        : 0;
      const refreshUntil = token.data.validity?.refresh_until
        ? token.data.validity.refresh_until * 1000
        : 0;

      // eslint-disable-next-line no-console
      console.log('🔍 Token check:', {
        token: token.data,
        now: new Date(now).toISOString(),
        validUntil: validUntil ? new Date(validUntil).toISOString() : 'N/A',
        refreshUntil: refreshUntil
          ? new Date(refreshUntil).toISOString()
          : 'N/A',
        isValid: now < validUntil,
        canRefresh: now < refreshUntil,
      });

      // The current access token is still valid
      if (token.data.validity?.valid_until && now < validUntil) {
        // eslint-disable-next-line no-console
        console.log('✅ Access token is still valid');
        return token;
      }

      // The current access token has expired, but the refresh token is still valid
      if (token.data.validity?.refresh_until && now < refreshUntil) {
        // eslint-disable-next-line no-console
        console.log('🔄 Refreshing access token...');
        const refreshedToken = await refreshAccessToken(token);
        if (refreshedToken.error) {
          console.log('❌ Refresh failed - forcing logout');
          return { ...token, error: 'RefreshAccessTokenError' };
        }

        return refreshedToken;
      }
      // The current access token and refresh token have both expired
      // This should not really happen unless you get really unlucky with
      // the timing of the token expiration because the middleware should
      // have caught this case before the callback is called
      console.log('Both tokens have expired');
      return { ...token, error: 'RefreshTokenExpired' } as JWT;
    },
    async session({ session, token }) {
      const buildInvalidSession = (errorCode: string) => {
        return {
          ...session,
          user: undefined,
          validity: null,
          tokens: undefined,
          error: errorCode,
          expires: '1970-01-01T00:00:00.000Z',
        };
      };

      if (token.error) {
        console.log('❌ Token error detected:', token.error);
        return buildInvalidSession(token.error as string);
      }

      const hasUserData =
        token.data?.user && Object.keys(token.data.user).length > 0;

      if (!hasUserData) {
        console.log('❌ Invalid user data in token');
        return buildInvalidSession('InvalidUserData');
      }

      return {
        ...session,
        user: token.data.user,
        validity: token.data.validity,
        tokens: token.data.tokens,
        error: token.error,
      };
    },
    authorized: ({ auth, request }) => {
      if (
        auth?.error === 'RefreshAccessTokenError' ||
        auth?.error === 'RefreshTokenExpired'
      ) {
        console.log('❌ Unauthorized due to token error:', auth.error);
        return false;
      }
      const { pathname } = request.nextUrl;
      const isPublicRoute = isPublicPath(pathname);
      const isAuthRoute = authRoutes.includes(pathname);

      if (!isPublicRoute && !isAuthRoute) {
        return !auth?.error && !!auth?.user;
      }
      return true;
    },
  },
  providers: [
    Credentials({
      id: 'confirmCode',
      name: 'Confirm Code',
      //   credentials: {
      //    result: {} as LoginResponse

      // },
      authorize: async (credentials: Partial<Record<'result', unknown>>) => {
        const result = credentials.result as LoginResponse | undefined;
        if (!result || !result.accessToken) return null;

        const tokens: BackendJWT = {
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
        };

        const access: DecodedJWT = jwtDecode(tokens.accessToken!);
        const REFRESH_TOKEN_LIFETIME = 30 * 24 * 60 * 60;
        const nowInSeconds = Math.floor(Date.now() / 1000);
        const validity: AuthValidity = {
          valid_until: access.exp,
          refresh_until: nowInSeconds + REFRESH_TOKEN_LIFETIME,
        };

        return {
          id: access.sub || access.jti || result.user?.id || 'unknown-id',
          tokens,
          user: result.user,
          validity,
        } as User;
      },
    }),
    Credentials({
      id: 'credentials',
      name: 'Login',
      credentials: {
        email: {
          label: 'Email',
          type: 'email',
          placeholder: 'john@mail.com',
        },
        password: { label: 'Password', type: 'password' },
        code: { label: 'Code', type: 'text', placeholder: '123456' }, // se usar fluxo de código
      },
      authorize: async (
        credentials: Partial<Record<'email' | 'password' | 'code', unknown>>
      ) => {
        // Não envolva tudo em try/catch que retorna null; só capture para re-lançar
        try {
          // Fluxo de verificação de código direto
          if (!!credentials.code) {
            const { data, error } = await handleApiResponse<LoginResponse>(
              await sendRequestServerVanilla.post('/verify-code', {
                email: credentials.email,
                code: credentials.code,
              })
            );

            if (!data?.accessToken || error) {
              // Código inválido -> credenciais inválidas
              return null;
            }

            const tokens: BackendJWT = {
              accessToken: data.accessToken,
              refreshToken: data.refreshToken,
            };
            const access: DecodedJWT = jwtDecode(tokens.accessToken!);

            // Refresh token is opaque (not a JWT), so we estimate its validity
            const REFRESH_TOKEN_LIFETIME = 30 * 24 * 60 * 60; // 30 days in seconds
            const nowInSeconds = Math.floor(Date.now() / 1000);

            const validity: AuthValidity = {
              valid_until: access.exp,
              refresh_until: nowInSeconds + REFRESH_TOKEN_LIFETIME,
            };

            return {
              id: access.sub || access.jti || 'unknown-id',
              tokens,
              user: data.user,
              validity,
            } as User;
          }

          // Login normal
          const response = await apiServer.post<LoginResponse>('/login', {
            email: credentials.email,
            password: credentials.password,
          });
          // eslint-disable-next-line no-console
          console.log(
            'RESPONSE LOGIN <-----------------',
            response.data,
            '<------------------RESPONSE LOGIN'
          );
          const data = response.data;

          if (!data) return null;

          if (data.isNonCodeConfirmed) {
            // Usuário precisa confirmar código -> lançar erro tipado
            throw new UserNotActivatedError();
          }

          if (!data.accessToken || !data.refreshToken) return null;

          const tokens: BackendJWT = {
            accessToken: data.accessToken,
            refreshToken: data.refreshToken,
          };
          const access: DecodedJWT = jwtDecode(tokens.accessToken!);

          // Refresh token is opaque (not a JWT), so we estimate its validity
          const REFRESH_TOKEN_LIFETIME = 30 * 24 * 60 * 60; // 30 days in seconds
          const nowInSeconds = Math.floor(Date.now() / 1000);

          const validity: AuthValidity = {
            valid_until: access.exp,
            refresh_until: nowInSeconds + REFRESH_TOKEN_LIFETIME,
          };

          return {
            id: access.sub || access.jti || data.user?.id || 'unknown-id',
            tokens,
            user: data.user,
            validity,
          } as User;
        } catch (err) {
          console.error('❌ Authorize execution failed:', err);
          // Se já é CredentialsSignin (ou subclasse) re-lança para NextAuth tratar e preservar cause
          if (err instanceof CredentialsSignin) throw err;

          // Qualquer outro erro inesperado -> encapsular em CredentialsSignin com identificador
          throw new CredentialsSignin('INTERNAL_AUTH_ERROR');
        }
      },
    }),
  ],
});

let refreshPromise: Promise<JWT> | null = null;

async function refreshAccessToken(nextAuthJWT: JWT): Promise<JWT> {
  // Se já existe um refresh acontecendo, retorna a promessa dele e não inicia outro!
  if (refreshPromise) {
    console.log('🔒 Refresh in progress - reusing existing promise');
    return refreshPromise;
  }

  // Inicia o processo e guarda a promessa na variável
  refreshPromise = (async () => {
    try {
      console.log('🔄 Starting new refresh request...');
      const refreshedTokens = await refresh(nextAuthJWT.data.tokens);

      if (!refreshedTokens?.accessToken) {
        throw new Error('No access token returned');
      }

      const { exp }: DecodedJWT = jwtDecode(refreshedTokens.accessToken);

      console.log('✅ Refresh successful!');

      return {
        ...nextAuthJWT,
        data: {
          ...nextAuthJWT.data,
          validity: {
            ...nextAuthJWT.data.validity,
            valid_until: exp,
          },
          tokens: {
            ...nextAuthJWT.data.tokens,
            accessToken: refreshedTokens.accessToken,
            // Se o backend rotaciona o refresh token, é CRUCIAL atualizar aqui
            refreshToken:
              refreshedTokens.refreshToken ??
              nextAuthJWT.data.tokens.refreshToken,
          },
        },
      };
    } catch (error) {
      console.error('❌ Failed to refresh access token:', error);
      return {
        ...nextAuthJWT,
        error: 'RefreshAccessTokenError',
      };
    } finally {
      // Importante: Limpa a variável para permitir futuros refreshes
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}
