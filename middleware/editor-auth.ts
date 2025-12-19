import { NextResponse } from 'next/server';

export function middleware() {
  // Add middleware logic for editor authentication here
  // For now, allow all requests
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/editor/:path*',
    '/api/editor/:path*',
  ],
};
 