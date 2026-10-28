import { NextRequest, NextResponse } from "next/server";

/*
 * No app lock (removed by Stu 2026-10-22: not needed for the hackathon demo). The app runs on the M5 laptop and
 * serves renders from local disk. What stays: every response is marked noindex and robots.txt disallows everything,
 * so nothing here is ever indexed by a search engine.
 */
export function middleware(req: NextRequest) {
  if (req.nextUrl.pathname === "/robots.txt") {
    return new NextResponse("User-agent: *\nDisallow: /\n", {
      headers: { "Content-Type": "text/plain; charset=utf-8", "X-Robots-Tag": "noindex, nofollow, noarchive" },
    });
  }
  const res = NextResponse.next();
  res.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
  return res;
}

export const config = {
  matcher: ["/((?!api/health|_next/).*)"],
};
