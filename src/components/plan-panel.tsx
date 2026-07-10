"use client"

import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { uploadPlanAndGenerate, regenerateGraph } from "@/app/projects/actions"
import { Button } from "@/components/ui/button"

export function PlanPanel({
  projectId,
  hasPlan,
}: {
  projectId: string
  hasPlan: boolean
}) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)

  async function onFile(formData: FormData) {
    setBusy(true)
    await uploadPlanAndGenerate(projectId, formData)
    setBusy(false)
    router.refresh()
  }

  return (
    <div className="flex items-center gap-2">
      <form action={onFile}>
        <input
          ref={inputRef}
          type="file"
          name="plan"
          accept="application/pdf,image/png,image/jpeg"
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.length) e.currentTarget.form?.requestSubmit()
          }}
        />
        <Button
          type="button"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
        >
          {busy ? "Building graph…" : hasPlan ? "Replace plan" : "Upload plan"}
        </Button>
      </form>

      {hasPlan && (
        <Button
          variant="outline"
          disabled={busy}
          onClick={async () => {
            setBusy(true)
            await regenerateGraph(projectId)
            setBusy(false)
            router.refresh()
          }}
        >
          Regenerate
        </Button>
      )}
    </div>
  )
}
