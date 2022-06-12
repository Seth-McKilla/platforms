import { NextResponse } from "next/server";

import type { NextRequest } from "next/server";

export default function middleware(req: NextRequest) {
  // Clone the request url
  const url = req.nextUrl.clone();

  // Get pathname of request (e.g. /blog-slug)
  const { pathname } = req.nextUrl;

  // Check if user is currently authed by presense of next-auth cookie
  const isAuthed =
    req.cookies["next-auth.session-token"] ||
    req.cookies["__Secure-next-auth.session-token"];

  // Get hostname of request (e.g. demo.vercel.pub, demo.localhost:3000)
  const hostname = req.headers.get("host");

  if (!hostname) {
    return new Response(null, {
      status: 400,
      statusText: "No hostname found in request headers",
    });
  }

  // Only for demo purposes – remove this if you want to use your root domain as the landing page
  if (hostname === "vercel.pub" || hostname === "platforms.vercel.app") {
    return NextResponse.redirect("https://demo.vercel.pub");
  }

  /*  Note: You can also use wildcard subdomains on .vercel.app links that are associated with your Vercel team slug
      in this case, our team slug is "platformize", thus *.platformize.vercel.app works. Do note that you'll
      still need to add "*.platformize.vercel.app" as a wildcard domain on your Vercel dashboard. */
  const currentHost = hostname.replace(`.${process.env.VERCEL_URL}`, "");

  // Hide sites directory from client
  if (pathname.startsWith(`/_sites`)) {
    return new Response(null, {
      status: 404,
    });
  }

  // Skip files and api directory
  if (pathname.includes(".") || pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  if (currentHost === "app") {
    const redirectToHome = () => {
      url.pathname = "/";
      return NextResponse.redirect(url);
    };

    const rewritePathToApp = () => {
      url.pathname = `/app${pathname}`;
      return NextResponse.rewrite(url);
    };

    return isAuthed && pathname === "/login"
      ? redirectToHome()
      : rewritePathToApp();
  }

  // Map the root domain to the home directory
  if (hostname === process.env.VERCEL_URL) {
    url.pathname = `/home${pathname}`;
    return NextResponse.rewrite(url);
  }

  url.pathname = `/_sites/${currentHost}${pathname}`;
  return NextResponse.rewrite(url);
}
