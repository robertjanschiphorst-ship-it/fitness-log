import { auth } from "@/auth";

export default auth((req) => {
  const isAuth = !!req.auth;
  const isSignInPage = req.nextUrl.pathname === "/sign-in";

  if (!isAuth && !isSignInPage) {
    return Response.redirect(new URL("/sign-in", req.url));
  }
});

export const config = {
  // Protect everything except Next.js internals and the auth API itself
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
};
