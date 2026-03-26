"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { z } from "zod"
import { Loader2, X, Eye, EyeOff } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PopoverClose } from "@/components/ui/popover"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"

const signUpSchema = z
  .object({
    full_name: z.string().min(1, "Full name is required"),
    email: z.string().email("Invalid email"),
    password: z.string().min(1, "Password is required"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  })

export function AuthDropdownForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  // Sign In State
  const [signInEmail, setSignInEmail] = useState("")
  const [signInPassword, setSignInPassword] = useState("")
  const [rememberMe, setRememberMe] = useState(false)

  // Sign Up State
  const [signUpEmail, setSignUpEmail] = useState("")
  const [signUpPassword, setSignUpPassword] = useState("")
  const [signUpConfirmPassword, setSignUpConfirmPassword] = useState("")
  const [signUpName, setSignUpName] = useState("")
  const [showSignUpPassword, setShowSignUpPassword] = useState(false)
  const [showSignUpConfirmPassword, setShowSignUpConfirmPassword] = useState(false)
  const [signUpConfirmError, setSignUpConfirmError] = useState<string | null>(null)

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!signInEmail || !signInPassword) {
      toast.error("Please fill in all fields")
      return
    }

    setLoading(true)
    // Use localStorage when "Remember Me" is checked, otherwise sessionStorage
    const storage = rememberMe ? window.localStorage : window.sessionStorage
    const supabase = createClient(storage)

    const { error } = await supabase.auth.signInWithPassword({
      email: signInEmail,
      password: signInPassword,
    })

    if (error) {
      setLoading(false)
      toast.error(error.message)
      return
    }

    // Fetch the user's role from profiles and redirect accordingly
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !user) {
        setLoading(false)
        toast.success("Welcome back!")
        router.refresh()
        return
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single()

      setLoading(false)

      const role = profile?.role

      if (!profileError && role === "vendor") {
        toast.success("Welcome back, vendor!")
        router.replace("/vendor/dashboard")
      } else {
        toast.success("Welcome back!")
        router.push("/")
      }
      router.refresh()
    } catch (err: any) {
      setLoading(false)
      toast.success("Welcome back!")
      router.refresh()
    }
  }

  const signUpValidation = signUpSchema.safeParse({
    full_name: signUpName,
    email: signUpEmail,
    password: signUpPassword,
    confirmPassword: signUpConfirmPassword,
  })
  const signUpIsValid = signUpValidation.success
  const signUpConfirmMismatch =
    signUpConfirmPassword.length > 0 && signUpPassword !== signUpConfirmPassword

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    const result = signUpSchema.safeParse({
      full_name: signUpName,
      email: signUpEmail,
      password: signUpPassword,
      confirmPassword: signUpConfirmPassword,
    })
    if (!result.success) {
      const confirmErr = result.error.flatten().fieldErrors.confirmPassword?.[0]
      setSignUpConfirmError(confirmErr ?? result.error.errors[0]?.message ?? "Validation failed")
      toast.error(result.error.errors[0]?.message ?? "Please fix the form errors.")
      return
    }
    setSignUpConfirmError(null)

    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email: result.data.email,
      password: result.data.password,
      options: {
        data: {
          full_name: result.data.full_name,
        },
      },
    })
    setLoading(false)

    if (error) {
      toast.error(error.message)
    } else {
      toast.success("Account created! Please check your email.")
    }
  }

  const handleGoogleLogin = async () => {
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    
    if (error) {
      setLoading(false)
      toast.error(error.message)
    }
    // If successful, it redirects, so no need to stop loading
  }

  return (
    <div
      className="w-full p-4 relative"
      onKeyDown={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <PopoverClose className="absolute right-4 top-4 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:outline-none">
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </PopoverClose>

      <Tabs defaultValue="signin" className="w-full mt-6">
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="signin">Sign In</TabsTrigger>
          <TabsTrigger value="signup">Sign Up</TabsTrigger>
        </TabsList>
        
        <TabsContent value="signin">
          <form onSubmit={handleSignIn} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="signin-email">Email</Label>
              <Input
                id="signin-email"
                type="email"
                placeholder="m@example.com"
                value={signInEmail}
                onChange={(e) => setSignInEmail(e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="signin-password">Password</Label>
              <Input
                id="signin-password"
                type="password"
                value={signInPassword}
                onChange={(e) => setSignInPassword(e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  className="h-3.5 w-3.5 rounded border-gray-300"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  disabled={loading}
                />
                <span>Remember me on this device</span>
              </label>
            </div>
            <Button type="submit" className="w-full bg-[#FF6B35] hover:bg-[#E55A2B] text-white" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sign In
            </Button>
          </form>
        </TabsContent>

        <TabsContent value="signup">
          <form onSubmit={handleSignUp} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="signup-name">Full Name</Label>
              <Input
                id="signup-name"
                placeholder="John Doe"
                value={signUpName}
                onChange={(e) => setSignUpName(e.target.value)}
                disabled={loading}
                className="focus-visible:ring-[#FF6B35]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="signup-email">Email</Label>
              <Input
                id="signup-email"
                type="email"
                placeholder="m@example.com"
                value={signUpEmail}
                onChange={(e) => setSignUpEmail(e.target.value)}
                disabled={loading}
                className="focus-visible:ring-[#FF6B35]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="signup-password">Password</Label>
              <div className="relative">
                <Input
                  id="signup-password"
                  type={showSignUpPassword ? "text" : "password"}
                  value={signUpPassword}
                  onChange={(e) => setSignUpPassword(e.target.value)}
                  disabled={loading}
                  className="pr-9 focus-visible:ring-[#FF6B35]"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowSignUpPassword((p) => !p)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label={showSignUpPassword ? "Hide password" : "Show password"}
                >
                  {showSignUpPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="signup-confirm-password">Confirm Password</Label>
              <div className="relative">
                <Input
                  id="signup-confirm-password"
                  type={showSignUpConfirmPassword ? "text" : "password"}
                  value={signUpConfirmPassword}
                  onChange={(e) => {
                    setSignUpConfirmPassword(e.target.value)
                    setSignUpConfirmError(null)
                  }}
                  disabled={loading}
                  className={cn(
                    "pr-9 focus-visible:ring-[#FF6B35]",
                    signUpConfirmMismatch && "border-destructive focus-visible:ring-destructive"
                  )}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowSignUpConfirmPassword((p) => !p)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label={showSignUpConfirmPassword ? "Hide password" : "Show password"}
                >
                  {showSignUpConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {signUpConfirmMismatch && (
                <p className="text-sm text-destructive">Passwords do not match.</p>
              )}
              {signUpConfirmError && !signUpConfirmMismatch && (
                <p className="text-sm text-destructive">{signUpConfirmError}</p>
              )}
            </div>
            <Button
              type="submit"
              className="w-full bg-[#FF6B35] hover:bg-[#E55A2B] text-white"
              disabled={loading || !signUpIsValid}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Account
            </Button>
          </form>
        </TabsContent>
      </Tabs>

      <div className="flex flex-col gap-4 mt-6">
        <div className="text-center text-xs text-muted-foreground">
          Continue with Google
        </div>
        <Button variant="outline" className="w-full border-[#7ACD2E] hover:bg-[#7ACD2E]/10" onClick={handleGoogleLogin} disabled={loading}>
        {loading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
        )}
        Google
      </Button>
      </div>
    </div>
  )
}
