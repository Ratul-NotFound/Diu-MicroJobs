import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

interface RateLimitInfo {
  count: number;
  resetTime: number;
}

const rateLimitMap = new Map<string, RateLimitInfo>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const limit = 100; // max 100 requests per minute
  const windowMs = 60 * 1000;

  const info = rateLimitMap.get(ip);
  if (!info) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs });
    return false;
  }

  if (now > info.resetTime) {
    info.count = 1;
    info.resetTime = now + windowMs;
    return false;
  }

  info.count += 1;
  return info.count > limit;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Apply rate limiting for API endpoints
  if (pathname.startsWith('/api')) {
    const ip = (request as any).ip || request.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';
    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    // CSRF Protection for state-changing operations
    const method = request.method;
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      const origin = request.headers.get('origin');
      const host = request.headers.get('host');
      const proto = request.headers.get('x-forwarded-proto') || 'http';
      const localOrigin = `${proto}://${host}`;

      if (origin && origin !== localOrigin) {
        return NextResponse.json(
          { error: 'CSRF Protection: Cross-origin request blocked' },
          { status: 403 }
        );
      }
    }
  }

  const response = NextResponse.next();

  // Security Headers
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'geolocation=(), camera=(), microphone=()');
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');

  const cspHeader = `
    default-src 'self';
    script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.firebaseapp.com https://apis.google.com https://www.gstatic.com;
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
    img-src 'self' data: blob: https://lh3.googleusercontent.com https://firebasestorage.googleapis.com;
    connect-src 'self' https://*.googleapis.com https://*.firebaseio.com wss://*.firebaseio.com;
    font-src 'self' https://fonts.gstatic.com;
    frame-src 'self' https://*.firebaseapp.com;
  `.replace(/\s{2,}/g, ' ').trim();

  response.headers.set('Content-Security-Policy', cspHeader);

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
