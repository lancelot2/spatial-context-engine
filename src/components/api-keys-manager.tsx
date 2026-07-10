"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createApiKey, revokeApiKey } from "@/app/dashboard/api/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

type ApiKey = {
  id: string
  name: string | null
  key: string
  created_at: string
  last_used_at: string | null
}

export function ApiKeysManager({ keys }: { keys: ApiKey[] }) {
  const router = useRouter()
  const [pending, setPending] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  return (
    <div className="flex flex-col gap-4">
      <form
        action={async (fd) => {
          setPending(true)
          await createApiKey(fd)
          setPending(false)
          router.refresh()
        }}
        className="flex gap-2"
      >
        <Input name="name" placeholder="Key name (e.g. robot-01)" className="max-w-xs" />
        <Button type="submit" disabled={pending}>
          {pending ? "Generating…" : "Generate key"}
        </Button>
      </form>

      {keys.length === 0 ? (
        <p className="text-sm text-muted-foreground">No keys yet.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {keys.map((k) => (
            <li
              key={k.id}
              className="flex items-center gap-3 rounded-md border p-3 text-sm"
            >
              <div className="min-w-0 flex-1">
                <div className="font-medium">{k.name}</div>
                <code className="block truncate text-xs text-muted-foreground">
                  {k.key}
                </code>
                <div className="text-xs text-muted-foreground">
                  {k.last_used_at
                    ? `Last used ${new Date(k.last_used_at).toLocaleDateString()}`
                    : "Never used"}
                </div>
              </div>
              <button
                onClick={() => {
                  void navigator.clipboard.writeText(k.key)
                  setCopiedId(k.id)
                  setTimeout(() => setCopiedId(null), 1500)
                }}
                className="rounded border px-2 py-1 text-xs hover:bg-muted"
              >
                {copiedId === k.id ? "Copied!" : "Copy"}
              </button>
              <button
                onClick={async () => {
                  await revokeApiKey(k.id)
                  router.refresh()
                }}
                className="rounded border px-2 py-1 text-xs text-red-600 hover:bg-muted"
              >
                Revoke
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
