import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state");

  if (!code || !state) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("error", "no_code");
    return NextResponse.redirect(loginUrl);
  }

  try {
    const backendUrl = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000").replace(/\/$/, "");
    const params = new URLSearchParams({ code, state });
    const response = await fetch(
      `${backendUrl}/api/v1/auth/callback/google?${params.toString()}`,
      { method: "GET", cache: "no-store" }
    );

    if (response.ok) {
      const rawSetCookie = response.headers.get("set-cookie");
      const setCookies =
        response.headers.getSetCookie?.() ?? (rawSetCookie ? [rawSetCookie] : []);

      if (setCookies.length === 0) {
        return NextResponse.redirect(new URL("/login?error=missing_cookie", request.url));
      }
      const redirectResponse = NextResponse.redirect(
        new URL("/feed", request.url)
      );
      for (const cookie of setCookies) {
        redirectResponse.headers.append("Set-Cookie", cookie);
      }
      return redirectResponse;
    }

    return NextResponse.redirect(new URL("/login?error=auth_failed", request.url));
  } catch {
    return NextResponse.redirect(new URL("/login?error=server_error", request.url));
  }
}
