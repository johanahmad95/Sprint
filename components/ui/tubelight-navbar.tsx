"use client"

import React, { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { LucideIcon, Menu, X, User, Calendar, LogOut } from "lucide-react"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"

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
  const [loading, setLoading] = useState(true)
  const [showUserMenu, setShowUserMenu] = useState(false)

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

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (!target.closest('[data-user-menu]')) {
        setShowUserMenu(false)
      }
    }

    if (showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showUserMenu])

  const handleSignOut = async () => {
    try {
      const supabase = createClient()
      await supabase.auth.signOut()
      setShowUserMenu(false)
      router.push('/')
      router.refresh()
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  // Get user initials for avatar
  const getUserInitials = () => {
    if (!user) return 'U'
    const email = user.email || ''
    return email.charAt(0).toUpperCase()
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
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-teal-dark to-teal-medium flex items-center justify-center shadow-md border-2 border-chartreuse">
                    <span className="text-white font-bold text-lg">S</span>
                  </div>
                  <span className="text-lg font-bold text-gray-800">
                    {logo.text}
                  </span>
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

            {/* Auth Buttons or User Menu */}
            {auth && !loading && (
              <div className="flex items-center gap-2 bg-white/10 border border-white/20 backdrop-blur-lg py-1 px-1 rounded-full flex-shrink-0">
                {user ? (
                  <div className="relative" data-user-menu>
                    <button
                      onClick={() => setShowUserMenu(!showUserMenu)}
                      className="flex items-center gap-2 px-3 py-2 text-sm font-semibold text-gray-700 hover:text-teal-dark transition-colors rounded-full"
                    >
                      {/* Hamburger Icon */}
                      {showUserMenu ? (
                        <X className="w-4 h-4" />
                      ) : (
                        <Menu className="w-4 h-4" />
                      )}
                      {/* User Avatar */}
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-dark to-teal-medium flex items-center justify-center shadow-md border border-white/30">
                        <span className="text-white font-bold text-xs">{getUserInitials()}</span>
                      </div>
                    </button>

                    {/* Dropdown Menu */}
                    <AnimatePresence>
                      {showUserMenu && (
                        <motion.div
                          initial={{ opacity: 0, y: -10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -10, scale: 0.95 }}
                          transition={{ duration: 0.2 }}
                          className="absolute right-0 top-full mt-2 w-48 bg-white/95 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl overflow-hidden z-50"
                        >
                          <div className="py-2">
                            <Link
                              href="/profile"
                              onClick={() => setShowUserMenu(false)}
                              className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-teal-dark/10 hover:text-teal-dark transition-colors"
                            >
                              <User className="w-4 h-4" />
                              My Profile
                            </Link>
                            <Link
                              href="/bookings"
                              onClick={() => setShowUserMenu(false)}
                              className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-teal-dark/10 hover:text-teal-dark transition-colors"
                            >
                              <Calendar className="w-4 h-4" />
                              My Booking
                            </Link>
                            <div className="border-t border-gray-200 my-1" />
                            <button
                              onClick={handleSignOut}
                              className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 w-full text-left transition-colors"
                            >
                              <LogOut className="w-4 h-4" />
                              Sign Out
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ) : (
                  <>
                    <Link
                      href={auth.signIn.url}
                      className="inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-700 hover:text-teal-dark transition-colors rounded-full"
                    >
                      {auth.signIn.text}
                    </Link>
                    <Link
                      href={auth.signUp.url}
                      className="inline-flex items-center px-5 py-2 text-sm font-semibold text-white bg-tomato hover:bg-tomato-dark rounded-full transition-all shadow-md hover:shadow-lg"
                    >
                      {auth.signUp.text}
                    </Link>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Navbar - Floating Bottom Dock */}
      <div
        className={cn(
          "md:hidden fixed bottom-8 left-1/2 -translate-x-1/2 z-50",
          className,
        )}
      >
        {/* Single Floating Dock Container */}
        <div className="flex items-center gap-3 bg-white/60 border border-white/20 backdrop-blur-xl py-2 px-4 rounded-full shadow-2xl">
          {/* Logo Section - Left */}
          {logo && (
            <Link href={logo.url} className="flex items-center gap-2 flex-shrink-0">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-dark to-teal-medium flex items-center justify-center shadow-md border-2 border-chartreuse">
                <span className="text-white font-bold text-lg">S</span>
              </div>
            </Link>
          )}

          {/* Divider */}
          <div className="w-px h-8 bg-white/30" />

          {/* Navigation Items - Center */}
          <div className="flex items-center gap-1">
            {items.map((item) => {
              const Icon = item.icon
              const isActive = activeTab === item.name

              return (
                <Link
                  key={item.name}
                  href={item.url}
                  onClick={() => setActiveTab(item.name)}
                  className={cn(
                    "relative flex flex-col items-center justify-center px-4 py-2 rounded-full transition-all",
                    isActive ? "text-teal-dark" : "text-vista-blue hover:text-vista-blue-dark"
                  )}
                >
                  {/* Chartreuse Indicator Above Active Icon */}
                  {isActive && (
                    <motion.div
                      layoutId="activeIndicator"
                      className="absolute -top-3 left-1/2 -translate-x-1/2 w-8 h-1 bg-chartreuse rounded-full shadow-[0_0_12px_rgba(214,247,76,0.8)]"
                      initial={false}
                      transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 30,
                      }}
                    />
                  )}
                  
                  {/* Icon */}
                  <Icon size={20} strokeWidth={2.5} />
                </Link>
              )
            })}
          </div>

          {/* Divider */}
          <div className="w-px h-8 bg-white/30" />

          {/* Sign Up Button or User Menu - Right */}
          {auth && !loading && (
            <>
              {user ? (
                <div className="relative" data-user-menu>
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-2 px-3 py-2 rounded-full transition-all"
                  >
                    {/* Hamburger Icon */}
                    {showUserMenu ? (
                      <X className="w-5 h-5 text-gray-700" />
                    ) : (
                      <Menu className="w-5 h-5 text-gray-700" />
                    )}
                    {/* User Avatar */}
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-teal-dark to-teal-medium flex items-center justify-center shadow-md border-2 border-chartreuse">
                      <span className="text-white font-bold text-sm">{getUserInitials()}</span>
                    </div>
                  </button>

                  {/* Dropdown Menu */}
                  <AnimatePresence>
                    {showUserMenu && (
                      <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="absolute right-0 bottom-full mb-2 w-48 bg-white/95 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl overflow-hidden z-50"
                      >
                        <div className="py-2">
                          <Link
                            href="/profile"
                            onClick={() => setShowUserMenu(false)}
                            className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-teal-dark/10 hover:text-teal-dark transition-colors"
                          >
                            <User className="w-4 h-4" />
                            My Profile
                          </Link>
                          <Link
                            href="/bookings"
                            onClick={() => setShowUserMenu(false)}
                            className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-teal-dark/10 hover:text-teal-dark transition-colors"
                          >
                            <Calendar className="w-4 h-4" />
                            My Booking
                          </Link>
                          <div className="border-t border-gray-200 my-1" />
                          <button
                            onClick={handleSignOut}
                            className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 w-full text-left transition-colors"
                          >
                            <LogOut className="w-4 h-4" />
                            Sign Out
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <Link
                  href={auth.signUp.url}
                  className="flex items-center px-5 py-2.5 text-sm font-bold text-white bg-tomato hover:bg-tomato-dark rounded-full transition-all shadow-lg hover:shadow-xl hover:scale-105"
                >
                  {auth.signUp.text}
                </Link>
              )}
            </>
          )}
        </div>
      </div>
    </>
  )
}
