import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(req: NextRequest) {
    // Only run this proxy for /admin routes
    if (!req.nextUrl.pathname.startsWith('/admin')) {
        return NextResponse.next();
    }

    // Get client IP
    let ip = (req as any).ip || req.headers.get('x-forwarded-for') || '::1';

    // Handle comma-separated headers (proxies)
    if (ip.includes(',')) {
        ip = ip.split(',')[0].trim();
    }

    const allowedIps = (process.env.ADMIN_ALLOWED_IPS || '').split(',').map(i => i.trim());

    if (!allowedIps.includes(ip)) {
        return NextResponse.redirect(new URL('/', req.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: '/admin/:path*',
};
