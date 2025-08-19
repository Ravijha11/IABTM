import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token');
  const refreshToken = request.cookies.get('refreshToken');

  // Check if any authentication token exists
  const hasAuthToken = token || refreshToken;

  if (request.nextUrl.pathname.startsWith('/dashboard') && !hasAuthToken) {
    return NextResponse.redirect(new URL('/sign-in', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*'],
};
