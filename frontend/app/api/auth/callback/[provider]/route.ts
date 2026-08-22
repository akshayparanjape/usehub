import { NextRequest, NextResponse } from "next/server";

function getOrigin(request: NextRequest): string {
  const host = request.headers.get("x-forwarded-host") || request.headers.get("host");
  const proto = request.headers.get("x-forwarded-proto") || "http";

  // Check if host is a valid external hostname (localhost, IP, or domain with dots)
  if (host) {
    const hostname = host.split(":")[0];
    if (hostname === "localhost" || hostname === "127.0.0.1" || hostname.includes(".")) {
      return `${proto}://${host}`;
    }
  }

  // Fallback to configured site URL or default local frontend URL
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_FRONTEND_URL;
  if (envUrl) {
    return envUrl.replace(/\/$/, "");
  }

  return "http://localhost:3000";
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider } = await params;
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const origin = getOrigin(request);

  if (!code || !state) {
    const loginUrl = new URL("/login", origin);
    loginUrl.searchParams.set("error", "no_code");
    return NextResponse.redirect(loginUrl);
  }

  try {
    const backendUrl = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000").replace(/\/$/, "");
    const queryParams = new URLSearchParams({ code, state });
    const response = await fetch(
      `${backendUrl}/api/v1/auth/callback/${provider}?${queryParams.toString()}`,
      { method: "GET", cache: "no-store" }
    );

    if (response.ok) {
      const rawSetCookie = response.headers.get("set-cookie");
      const setCookies =
        response.headers.getSetCookie?.() ?? (rawSetCookie ? [rawSetCookie] : []);

      if (setCookies.length === 0) {
        return NextResponse.redirect(new URL("/login?error=missing_cookie", origin));
      }
      const redirectResponse = NextResponse.redirect(
        new URL("/feed", origin)
      );
      for (const cookie of setCookies) {
        redirectResponse.headers.append("Set-Cookie", cookie);
      }
      return redirectResponse;
    }

    return NextResponse.redirect(new URL("/login?error=auth_failed", origin));
  } catch {
    return NextResponse.redirect(new URL("/login?error=server_error", origin));
  }
}
