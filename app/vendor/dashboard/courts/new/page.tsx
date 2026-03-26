import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { AddCourtForm } from "@/components/vendor/AddCourtForm"

export default async function NewCourtPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/vendor/login")
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-gray-900">Add New Court</h1>
      <AddCourtForm />
    </div>
  )
}

