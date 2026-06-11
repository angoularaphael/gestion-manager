import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const COOKIE = 'bc_session';

export async function middleware(request) {
  const { pathname } = request.nextUrl;
  if (!pathname.startsWith('/admin')) return NextResponse.next();

  const token = request.cookies.get(COOKIE)?.value;
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    const secret = new TextEncoder().encode(
      process.env.SESSION_SECRET || process.env.SITE_API_SECRET || 'change-me'
    );
    await jwtVerify(token, secret);
    return NextResponse.next();
  } catch {
    return NextResponse.redirect(new URL('/login', request.url));
  }
}

export const config = { matcher: ['/admin/:path*'] };
