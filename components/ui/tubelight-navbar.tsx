"use client"

import React, { useEffect, useState } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { LucideIcon, User, Calendar, LogOut } from "lucide-react"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { AuthDropdownForm } from "@/components/auth/AuthDropdownForm"

interface NavItem {
  name: string
  url: string
  icon: LucideIcon
}

interface NavBarProps {
  items: NavItem[]
  className?: string
  logo?: {
    text: string
    url: string
    image?: string
  }
  auth?: {
    signIn: {
      text: string
      url: string
    }
    signUp: {
      text: string
      url: string
    }
  }
}

export function NavBar({ items, className, logo, auth }: NavBarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState(items[0].name)
  const [user, setUser] = useState<any>(null)
  const [fullName, setFullName] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // Fetch profile full_name when user is set
  useEffect(() => {
    if (!user?.id) {
      setFullName(null)
      return
    }
    const supabase = createClient()
    supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .single()
      .then(({ data }) => setFullName(data?.full_name ?? null))
      .catch(() => setFullName(null))
  }, [user?.id])

  const displayName = fullName || user?.email?.split("@")[0] || "User"

  // Check authentication state
  useEffect(() => {
    // Only check auth if Supabase is configured
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      setLoading(false)
      return
    }

    let subscription: any = null

    const checkUser = async () => {
      try {
        const supabase = createClient()
        const { data: { session } } = await supabase.auth.getSession()
        setUser(session?.user ?? null)

        // Listen for auth changes
        const { data } = supabase.auth.onAuthStateChange((_event, session) => {
          setUser(session?.user ?? null)
        })
        subscription = data.subscription
      } catch (error) {
        console.error('Error checking session:', error)
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    checkUser()

    return () => {
      if (subscription) {
        subscription.unsubscribe()
      }
    }
  }, [])

  // Update active tab based on current pathname
  useEffect(() => {
    const currentItem = items.find(item => {
      if (item.url === '/') return pathname === '/'
      return pathname.startsWith(item.url)
    })
    if (currentItem) {
      setActiveTab(currentItem.name)
    }
  }, [pathname, items])

  const handleSignOut = async () => {
    try {
      try {
        localStorage.clear()
        sessionStorage.clear()
      } catch {}

      const supabase = createClient()
      const signOutPromise = supabase.auth.signOut()
      const timeoutPromise = new Promise((resolve) => setTimeout(resolve, 2000))
      
      await Promise.race([signOutPromise, timeoutPromise])
    } catch (error) {
      console.error('Error signing out:', error)
    } finally {
      window.location.href = '/'
    }
  }

  return (
    <>
      {/* Desktop Navbar - Top */}
      <div
        className={cn(
          "hidden md:block fixed top-0 left-0 right-0 z-50 px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6",
          className,
        )}
      >
        <div className="container mx-auto">
          <div className="flex items-center justify-between gap-4">
            {/* Logo Section */}
            {logo && (
              <div className="flex items-center bg-white/10 border border-white/20 backdrop-blur-lg py-1 px-3 rounded-full">
                <Link href={logo.url} className="flex items-center gap-2 flex-shrink-0">
                  {logo.image ? (
                    <img src={logo.image} alt={logo.text} className="h-9 w-auto object-contain max-w-[120px] bg-transparent" />
                  ) : (
                    <>
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-teal-dark to-teal-medium flex items-center justify-center shadow-md border-2 border-chartreuse">
                        <span className="text-white font-bold text-lg">S</span>
                      </div>
                      <span className="text-lg font-bold text-gray-800">
                        {logo.text}
                      </span>
                    </>
                  )}
                </Link>
              </div>
            )}

            {/* Navigation Items with Tubelight Effect */}
            <div className="flex items-center gap-2 bg-white/10 border border-white/20 backdrop-blur-lg py-1 px-1 rounded-full">
              {items.map((item) => {
                const Icon = item.icon
                const isActive = activeTab === item.name

                return (
                  <Link
                    key={item.name}
                    href={item.url}
                    onClick={() => setActiveTab(item.name)}
                    className={cn(
                      "relative cursor-pointer text-sm font-semibold px-6 py-2 rounded-full transition-colors",
                      "text-gray-700 hover:text-teal-dark",
                      isActive && "bg-teal-dark/10 text-teal-dark",
                    )}
                  >
                    <span>{item.name}</span>
                    {isActive && (
                      <motion.div
                        layoutId="lamp-desktop"
                        className="absolute inset-0 w-full bg-teal-dark/5 rounded-full -z-10"
                        initial={false}
                        transition={{
                          type: "spring",
                          stiffness: 300,
                          damping: 30,
                        }}
                      >
                        <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-8 h-1 bg-chartreuse rounded-t-full shadow-[0_0_20px_rgba(214,247,76,0.6)]">
                          <div className="absolute w-12 h-6 bg-chartreuse/30 rounded-full blur-md -top-2 -left-2" />
                          <div className="absolute w-8 h-6 bg-chartreuse/30 rounded-full blur-md -top-1" />
                          <div className="absolute w-4 h-4 bg-chartreuse/30 rounded-full blur-sm top-0 left-2" />
                        </div>
                      </motion.div>
                    )}
                  </Link>
                )
              })}
            </div>

            {/* Account Dropdown */}
            {auth && !loading && (
              <div className="flex items-center flex-shrink-0">
                {!user ? (
                  <Popover modal={false}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-2 rounded-full bg-white/10 border-white/20 hover:bg-white/20 hover:border-white/30"
                      >
                        <User className="w-4 h-4" />
                        Account
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent align="end" className="w-[90vw] sm:w-[350px] bg-white opacity-100 border-2 border-gray-100 shadow-2xl p-0">
                      <AuthDropdownForm />
                    </PopoverContent>
                  </Popover>
                ) : (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-2 rounded-full bg-white/10 border-white/20 hover:bg-white/20 hover:border-white/30"
                      >
                        <User className="w-4 h-4" />
                        Account
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className="w-56 bg-white border border-slate-200 shadow-xl p-0 text-slate-900"
                    >
                      <div className="px-4 py-2 border-b border-slate-200 space-y-1">
                        <p className="text-sm font-semibold text-slate-900">
                          Hi, {displayName}
                        </p>
                        {user?.email && (
                          <p className="text-xs text-slate-500">
                            {user.email}
                          </p>
                        )}
                      </div>
                      <div className="p-1">
                        <DropdownMenuItem asChild>
                          <Link href="/profile" className="cursor-pointer text-slate-900 focus:bg-slate-100 focus:text-slate-900">
                            <User className="w-4 h-4 mr-2" />
                            My Profile
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href="/bookings" className="cursor-pointer text-slate-900 focus:bg-slate-100 focus:text-slate-900">
                            <Calendar className="w-4 h-4 mr-2" />
                            My Bookings
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={handleSignOut}
                          className="text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer"
                        >
                          <LogOut className="w-4 h-4 mr-2" />
                          Logout
                        </DropdownMenuItem>
                      </div>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Navbar - Floating Bottom Dock */}
      <div
        className={cn(
          "md:hidden fixed bottom-8 left-1/2 -translate-x-1/2 z-50 w-full max-w-sm px-4",
          className,
        )}
      >
        {/* Single Floating Dock Container */}
        <div className="flex items-center justify-between h-16 px-6 bg-white border border-gray-100 rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.12)]">
          {/* Logo Section - Left */}
          {logo && (
            <Link href={logo.url} className="flex items-center gap-2 flex-shrink-0">
              {logo.image ? (
                <img src={logo.image} alt={logo.text} className="h-8 w-auto object-contain bg-transparent" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-dark to-teal-medium flex items-center justify-center shadow-md border-2 border-chartreuse">
                  <span className="text-white font-bold text-sm">S</span>
                </div>
              )}
            </Link>
          )}

          {/* Navigation Items - Center */}
          <div className="flex items-center gap-6">
            {items.map((item) => {
              const Icon = item.icon
              const isActive = activeTab === item.name

              return (
                <Link
                  key={item.name}
                  href={item.url}
                  onClick={() => setActiveTab(item.name)}
                  className={cn(
                    "relative flex items-center justify-center transition-all",
                    isActive ? "text-teal-dark" : "text-gray-400 hover:text-gray-600"
                  )}
                >
                  {/* Icon */}
                  <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                </Link>
              )
            })}
          </div>

          {/* Account Dropdown - Right */}
          {auth && !loading && (
            <div className="flex items-center">
              {!user ? (
                <Popover modal={false}>
                  <PopoverTrigger asChild>
                    <button className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors">
                      <User className="w-5 h-5" />
                      Account
                    </button>
                  </PopoverTrigger>
                  <PopoverContent align="end" side="top" className="w-[90vw] sm:w-[350px] bg-white opacity-100 border-2 border-gray-100 shadow-2xl p-0">
                    <AuthDropdownForm />
                  </PopoverContent>
                </Popover>
              ) : (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors">
                      <User className="w-5 h-5" />
                      Account
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    side="top"
                    className="w-56 bg-white border border-slate-200 shadow-xl p-0 text-slate-900"
                  >
                    <div className="px-4 py-2 border-b border-slate-200 space-y-1">
                      <p className="text-sm font-semibold text-slate-900">
                        Hi, {displayName}
                      </p>
                      {user?.email && (
                        <p className="text-xs text-slate-500">
                          {user.email}
                        </p>
                      )}
                    </div>
                    <div className="p-1">
                      <DropdownMenuItem asChild>
                        <Link href="/profile" className="cursor-pointer text-slate-900 focus:bg-slate-100 focus:text-slate-900">
                          <User className="w-4 h-4 mr-2" />
                          My Profile
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/bookings" className="cursor-pointer text-slate-900 focus:bg-slate-100 focus:text-slate-900">
                          <Calendar className="w-4 h-4 mr-2" />
                          My Bookings
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={handleSignOut}
                        className="text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer"
                      >
                        <LogOut className="w-4 h-4 mr-2" />
                        Logout
                      </DropdownMenuItem>
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
