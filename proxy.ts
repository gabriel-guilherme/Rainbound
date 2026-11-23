import { getSessionCookie } from "better-auth/cookies";
import { NextResponse, type NextRequest } from "next/server";

/*
 * Redireciona para o login quem abre uma área protegida sem cookie de
 * sessão. É só um atalho: o cookie pode estar vencido ou ser falso, então
 * páginas, Server Actions e rotas conferem a sessão de verdade
 * (lib/session.ts).
 */
export function proxy(request: NextRequest) {
  if (getSessionCookie(request)) {
    return NextResponse.next();
  }

  const loginUrl = new URL("/login", request.url);
  const { pathname, search } = request.nextUrl;

  loginUrl.searchParams.set("next", `${pathname}${search}`);

  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/library/:path*",
    "/read/:path*",
    "/admin/:path*",
    "/aguardando",
  ],
};
