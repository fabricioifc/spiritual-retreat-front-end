import { authRoutes, DEFAULT_LOGIN_REDIRECT, isPublicPath } from "./routes";
import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { nextUrl } = req;
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-url", req.url);
  const acceptHeader = req.headers.get("accept") || "";
  const fetchDest = req.headers.get("sec-fetch-dest") || "";
  const fetchMode = req.headers.get("sec-fetch-mode") || "";
  const isHtmlNavigation =
    acceptHeader.includes("text/html") ||
    (fetchDest === "document" && fetchMode === "navigate");

  const isPublicRoute = isPublicPath(nextUrl.pathname);
  const isCodeRoute = nextUrl.pathname === "/login/code";
  const isAuthRoute =
    !isCodeRoute &&
    authRoutes.some((route) => nextUrl.pathname.startsWith(route));

  const hasValidUser =
    req.auth?.user &&
    typeof req.auth.user === "object" &&
    Object.keys(req.auth.user).length > 0;
  const isLoggedIn = hasValidUser && !req.auth?.error;

  // Verifica se há erros de token que requerem redirecionamento para login
  const hasTokenError =
    req.auth?.error === "RefreshAccessTokenError" ||
    req.auth?.error === "RefreshTokenExpired";

  // Se há erro de token, redireciona para login
  if (hasTokenError && !isAuthRoute && isHtmlNavigation) {
    let callbackUrl = nextUrl.pathname;
    if (nextUrl.search) {
      callbackUrl += nextUrl.search;
    }
    const encodedCallbackUrl = encodeURIComponent(callbackUrl);
    return NextResponse.redirect(
      new URL(`/login?callbackUrl=${encodedCallbackUrl}`, nextUrl)
    );
  }

  if (nextUrl.pathname === "/") {
    if (isLoggedIn) {
      return NextResponse.redirect(new URL(DEFAULT_LOGIN_REDIRECT, nextUrl));
    }
    return NextResponse.redirect(new URL("/login", nextUrl));
  }

  if (isAuthRoute) {
    if (isLoggedIn)
      return Response.redirect(new URL(DEFAULT_LOGIN_REDIRECT, nextUrl));
  }

  if (!isLoggedIn && !isPublicRoute && !isAuthRoute && isHtmlNavigation) {
    let callbackUrl = nextUrl.pathname;
    if (nextUrl.search) {
      callbackUrl += nextUrl.search;
    }
    const encodedCallbackUrl = encodeURIComponent(callbackUrl);
    return NextResponse.redirect(
      new URL(`/login?callbackUrl=${encodedCallbackUrl}`, nextUrl)
    );
  }

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
});

export const config = {
  matcher: [
    /*
     * Corresponde a todas as rotas, exceto:
     * - api (rotas de API)
     * - _next/static (arquivos estáticos)
     * - _next/image (otimização de imagem)
     * - favicon.ico (favicon)
     */
    //todo: verificar outras rotas public que possam estar passando pelo middleware
    "/((?!api|images|installHook.js.map|mockServiceWorker|_next/static|_next/image|favicon.ico).*)",
  ],
};
