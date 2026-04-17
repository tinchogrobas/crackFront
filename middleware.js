import { NextResponse } from 'next/server';

export function middleware(request) {
  const url = request.nextUrl.clone();
  const host = request.headers.get('host') || '';

  // Canonicaliza dominio: www -> apex.
  if (host.toLowerCase() === 'www.cracktcg.com') {
    url.host = 'cracktcg.com';
    return NextResponse.redirect(url, 308);
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/:path*',
};
