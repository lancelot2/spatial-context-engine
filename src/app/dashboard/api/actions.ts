"use server"

import { randomBytes } from "crypto"
import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"

export async function createApiKey(formData: FormData): Promise<void> {
  const name = String(formData.get("name") ?? "").trim() || "Default"
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return

  const key = "sce_" + randomBytes(24).toString("hex")
  await supabase.from("api_keys").insert({ user_id: user.id, name, key })
  revalidatePath("/dashboard/api")
}

export async function revokeApiKey(id: string): Promise<void> {
  const supabase = await createClient()
  await supabase.from("api_keys").delete().eq("id", id)
  revalidatePath("/dashboard/api")
}
