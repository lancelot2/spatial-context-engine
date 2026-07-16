"use client"

import { useState } from "react"
import type { GraphNode } from "@/lib/graph/types"
import { PlanPathView } from "@/components/plan-path-view"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type ContextResult = {
  current_location: string | null
  destination: string | null
  path: string[]
  landmarks: string[]
  context: string
}

// Resolve the path (returned as names) back to node ids for the plan highlight.
function resolvePathIds(nodes: GraphNode[], pathNames: string[]): string[] {
  const byName = new Map(
    nodes.map((n) => [(n.name?.trim() ?? "").toLowerCase(), n.id]),
  )
  return pathNames
    .map((nm) => byName.get(nm.trim().toLowerCase()))
    .filter((id): id is string => !!id)
}

export function ContextTester({
  projectId,
  planUrl,
  nodes,
}: {
  projectId: string
  planUrl: string | null
  nodes: GraphNode[]
}) {
  const [instruction, setInstruction] = useState("")
  const [manual, setManual] = useState("")
  const [image, setImage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<ContextResult | null>(null)
  const [copied, setCopied] = useState(false)

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    const r = new FileReader()
    r.onload = () => setImage(r.result as string)
    r.readAsDataURL(f)
  }

  async function run() {
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const res = await fetch("/api/context", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          projectId,
          instruction,
          image: image ?? null,
          current_location: manual || null,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "Request failed")
      setResult(json as ContextResult)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed")
    } finally {
      setLoading(false)
    }
  }

  const pathIds = result ? resolvePathIds(nodes, result.path) : []

  return (
    <div className="grid flex-1 gap-6 overflow-auto p-6 lg:grid-cols-[360px_1fr]">
      {/* Request */}
      <div className="flex flex-col gap-4">
        <div className="grid gap-1.5">
          <Label htmlFor="instruction">Instruction</Label>
          <textarea
            id="instruction"
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
            placeholder="e.g. Go to the supply room"
            rows={2}
            className="rounded-md border border-input bg-transparent px-3 py-2 text-sm"
          />
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor="camera">Camera frame</Label>
          <input
            id="camera"
            type="file"
            accept="image/png,image/jpeg"
            onChange={onFile}
            className="text-sm"
          />
          {image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={image} alt="Camera frame" className="mt-1 max-h-40 w-full rounded border object-contain" />
          )}
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor="manual">Manual location (fallback)</Label>
          <Input
            id="manual"
            value={manual}
            onChange={(e) => setManual(e.target.value)}
            placeholder="e.g. Entrance"
          />
          <p className="text-xs text-muted-foreground">
            Overrides image localization — use it to test retrieval, planning and
            context generation directly.
          </p>
        </div>

        <Button onClick={run} disabled={loading || !instruction.trim()}>
          {loading ? "Running…" : "Run /context"}
        </Button>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>

      {/* Response */}
      <div className="flex min-w-0 flex-col gap-4">
        {!result ? (
          <div className="flex h-full items-center justify-center rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
            Enter an instruction (and a camera frame or a manual location), then run
            the engine to see the result.
          </div>
        ) : (
          <>
            <div className="flex flex-wrap gap-2 text-sm">
              <Badge label="Location" value={result.current_location} tone="green" />
              <Badge label="Destination" value={result.destination} tone="blue" />
            </div>

            {result.path.length > 0 && (
              <div className="flex flex-wrap items-center gap-1 text-sm">
                {result.path.map((name, i) => (
                  <span key={i} className="flex items-center gap-1">
                    {i > 0 && <span className="text-muted-foreground">→</span>}
                    <span className="rounded bg-muted px-2 py-0.5">{name}</span>
                  </span>
                ))}
              </div>
            )}

            {result.landmarks.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-xs text-muted-foreground">Landmarks:</span>
                {result.landmarks.map((l) => (
                  <span key={l} className="rounded-full bg-red-50 px-2 py-0.5 text-xs text-red-700">
                    {l}
                  </span>
                ))}
              </div>
            )}

            <PlanPathView planUrl={planUrl} nodes={nodes} pathIds={pathIds} />

            <div className="overflow-hidden rounded-xl border border-border bg-[#181713]">
              <div className="flex items-center justify-between border-b border-white/10 px-4 py-2.5">
                <span className="label-mono !text-white/50">
                  context · robostral input
                </span>
                <button
                  onClick={() => {
                    void navigator.clipboard.writeText(result.context)
                    setCopied(true)
                    setTimeout(() => setCopied(false), 1500)
                  }}
                  className="font-mono text-xs text-white/60 hover:text-white"
                >
                  {copied ? "copied!" : "copy"}
                </button>
              </div>
              <pre className="overflow-x-auto whitespace-pre-wrap p-4 font-mono text-xs leading-relaxed text-neutral-200">
                {result.context}
              </pre>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function Badge({
  label,
  value,
  tone,
}: {
  label: string
  value: string | null
  tone: "green" | "blue"
}) {
  const color =
    tone === "green"
      ? "border-clay/30 bg-clay/10 text-clay"
      : "border-brand/30 bg-brand/10 text-brand"
  return (
    <span className={`rounded-md border px-2.5 py-1 ${color}`}>
      <span className="label-mono !text-[10px] !tracking-normal opacity-80">
        {label}{" "}
      </span>
      <span className="font-medium">{value ?? "—"}</span>
    </span>
  )
}
