import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"

function isCustomerFacingPath(pathname: string) {
  // Allow ALL users (including vendors) to access the public home page "/"
  // so that after logout they can reliably land on the marketing homepage
  // without being forced back into the vendor dashboard.
  if (pathname === "/") return false

  if (pathname.startsWith("/venues")) return true
  if (pathname.startsWith("/browse-courts")) return true
  // Add other customer-only paths here if needed
  return false
}

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const pathname = req.nextUrl.pathname

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll().map(({ name, value }) => ({ name, value }))
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            res.cookies.set(name, value, options)
          })
        },
      },
    },
  )

  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Not logged in: protect vendor and dashboard areas
  if (!session) {
    if (pathname.startsWith("/vendor") || pathname.startsWith("/dashboard")) {
      const redirectUrl = new URL("/login", req.url)
      redirectUrl.searchParams.set(
        "redirectTo",
        req.nextUrl.pathname + req.nextUrl.search,
      )
      return NextResponse.redirect(redirectUrl)
    }
    return res
  }

  // Logged in: determine role
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", session.user.id)
    .single()

  const role = !error && profile?.role === "vendor" ? "vendor" : "customer"

  // Vendor trying to access customer-facing pages -> send to vendor dashboard
  if (role === "vendor" && isCustomerFacingPath(pathname)) {
    const redirectUrl = new URL("/vendor/dashboard", req.url)
    return NextResponse.redirect(redirectUrl)
  }

  // Customer / non-vendor trying to access vendor routes -> send to home
  if (role !== "vendor" && pathname.startsWith("/vendor")) {
    const redirectUrl = new URL("/", req.url)
    return NextResponse.redirect(redirectUrl)
  }

  return res
}

export const config = {
  matcher: ["/", "/vendor/:path*", "/dashboard/:path*"],
}

