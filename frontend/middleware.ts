import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Simple middleware to protect dashboard routes
  // In a real app, verify the JWT token from cookies here
  const path = request.nextUrl.pathname;
  
  const isProtectedRoute = path.startsWith('/dashboard');
  const hasToken = request.cookies.has('sb-access-token') || true; // Mocking true for demo

  if (isProtectedRoute && !hasToken) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*'],
};
