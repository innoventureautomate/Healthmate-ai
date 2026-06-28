import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Auth is handled client-side via Firebase + layout-level useEffect guards.
// This middleware only handles static asset passthrough — no cookie checks.
export function middleware(request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: [],
};
