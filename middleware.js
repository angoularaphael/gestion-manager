import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const COOKIE = 'bc_session';

const BOT_UA =
  /bot|crawl|spider|slurp|curl|wget|python-requests|scrapy|headless|ahrefs|semrush|dotbot|petalbot|bytespider|gptbot|chatgpt-user|claude-web|anthropic-ai|perplexitybot|mj12bot|blexbot|serpstat|dataforseo/i;

function isBlockedBot(request) {
  const ua = request.headers.get('user-agent') || '';
  if (!ua.trim()) return true;
  return BOT_UA.test(ua);
}

export async function middleware(request) {
  const { pathname } = request.nextUrl;
  if (!pathname.startsWith('/admin')) return NextResponse.next();

  if (isBlockedBot(request)) {
    return new NextResponse('Forbidden', {
      status: 403,
      headers: {
        'X-Robots-Tag': 'noindex, nofollow, noarchive',
        'Cache-Control': 'no-store',
      },
    });
  }

  const token = request.cookies.get(COOKIE)?.value;
  if (!token) {
    const res = NextResponse.redirect(new URL('/login', request.url));
    res.headers.set('X-Robots-Tag', 'noindex, nofollow');
    return res;
  }

  try {
    const secret = new TextEncoder().encode(
      process.env.SESSION_SECRET || process.env.SITE_API_SECRET || 'change-me'
    );
    await jwtVerify(token, secret);
    const res = NextResponse.next();
    res.headers.set('X-Robots-Tag', 'noindex, nofollow');
    res.headers.set('Cache-Control', 'no-store');
    return res;
  } catch {
    const res = NextResponse.redirect(new URL('/login', request.url));
    res.headers.set('X-Robots-Tag', 'noindex, nofollow');
    return res;
  }
}

export const config = { matcher: ['/admin/:path*'] };
