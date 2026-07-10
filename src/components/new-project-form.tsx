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
      className="flex gap-2"
    >
      <Input
        name="name"
        placeholder="New building name (e.g. HQ – Ground Floor)"
        required
        className="max-w-sm"
      />
      <Button type="submit" disabled={pending}>
        {pending ? "Creating…" : "Create project"}
      </Button>
    </form>
  )
}
