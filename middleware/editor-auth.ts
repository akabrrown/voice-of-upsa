import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
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
