"use client"

import { useState } from "react"
import { createProject } from "@/app/projects/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export function NewProjectForm() {
  const [pending, setPending] = useState(false)

  return (
    <form
      action={async (formData) => {
        setPending(true)
        await createProject(formData)
        setPending(false)
      }}
      className="flex max-w-xl gap-2 rounded-xl border border-border bg-card p-2 shadow-sm"
    >
      <Input
        name="name"
        placeholder="New building name — e.g. HQ, Ground Floor"
        required
        className="border-0 bg-transparent shadow-none focus-visible:ring-0"
      />
      <Button
        type="submit"
        disabled={pending}
        className="shrink-0 bg-brand text-brand-foreground hover:bg-brand/90"
      >
        {pending ? "Creating…" : "Create building"}
      </Button>
    </form>
  )
}
