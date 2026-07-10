"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import type { GraphNode } from "@/lib/graph/types"
import type { KnowledgeIssue, IssueType } from "@/lib/knowledge/score"
import {
  renameNode,
  setNodeType,
  confirmEdge,
  deleteEdge,
} from "@/app/projects/graph-actions"
import { addNodePhoto } from "@/app/projects/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

// Ask about the highest-impact gap first. Main entrance is weighted heaviest;
// naming comes before describing/photographing because it grounds later
// questions; fixing structure (uncertain edges) before enrichment.
const PRIORITY: Record<IssueType, number> = {
  no_main_entrance: 0,
  no_name: 1,
  uncertain_connection: 2,
  no_photo: 3,
}

function prioritize(issues: KnowledgeIssue[]): KnowledgeIssue[] {
  return [...issues].sort((a, b) => PRIORITY[a.type] - PRIORITY[b.type])
}

export function EnrichmentAssistant({
  projectId,
  nodes,
  issues,
}: {
  projectId: string
  nodes: GraphNode[]
  issues: KnowledgeIssue[]
}) {
  const [skipped, setSkipped] = useState<Set<string>>(new Set())
  const ordered = useMemo(
    () => prioritize(issues).filter((i) => !skipped.has(i.id)),
    [issues, skipped],
  )
  const current = ordered[0]

  return (
    <div className="border-b p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-medium">Enrichment assistant</h2>
        {current && (
          <span className="text-xs text-muted-foreground">
            {ordered.length} left
          </span>
        )}
      </div>
      {current ? (
        <Question
          key={current.id}
          projectId={projectId}
          issue={current}
          nodes={nodes}
          onSkip={() =>
            setSkipped((s) => {
              const n = new Set(s)
              n.add(current.id)
              return n
            })
          }
        />
      ) : (
        <p className="text-sm text-green-600">
          Nothing to ask — your spatial memory is complete. 🎉
        </p>
      )}
    </div>
  )
}

function nameOf(node?: GraphNode): string {
  if (node?.name?.trim()) return `"${node.name.trim()}"`
  return `this ${node?.type ?? "node"}`
}

function Question({
  projectId,
  issue,
  nodes,
  onSkip,
}: {
  projectId: string
  issue: KnowledgeIssue
  nodes: GraphNode[]
  onSkip: () => void
}) {
  const router = useRouter()
  const [pending, setPending] = useState(false)
  const [text, setText] = useState("")
  const [selected, setSelected] = useState(nodes[0]?.id ?? "")
  const node = issue.nodeId ? nodes.find((n) => n.id === issue.nodeId) : undefined

  async function run(fn: () => Promise<unknown>) {
    setPending(true)
    try {
      await fn()
      router.refresh()
    } finally {
      setPending(false)
    }
  }

  const prompt = questionText(issue, node)

  return (
    <div className="flex flex-col gap-3">
      <p className="rounded-lg bg-muted px-3 py-2 text-sm">🤖 {prompt}</p>

      {issue.type === "no_name" && (
        <form
          className="flex flex-col gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            const value = text.trim()
            if (!value) return
            void run(() => renameNode(projectId, issue.nodeId!, value))
          }}
        >
          <Input
            autoFocus
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Room name…"
          />
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={pending || !text.trim()}>
              Save
            </Button>
            <SkipButton onSkip={onSkip} disabled={pending} />
          </div>
        </form>
      )}

      {issue.type === "no_photo" && (
        <form
          action={(fd) => run(() => addNodePhoto(projectId, issue.nodeId!, fd))}
          className="flex flex-col gap-2"
        >
          <input
            type="file"
            name="photo"
            accept="image/png,image/jpeg"
            required
            className="text-sm"
          />
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={pending}>
              {pending ? "Uploading…" : "Add photo"}
            </Button>
            <SkipButton onSkip={onSkip} disabled={pending} />
          </div>
        </form>
      )}

      {issue.type === "uncertain_connection" && (
        <div className="flex gap-2">
          <Button
            size="sm"
            disabled={pending}
            onClick={() => run(() => confirmEdge(projectId, issue.edgeId!))}
          >
            Yes, it exists
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={pending}
            onClick={() => run(() => deleteEdge(projectId, issue.edgeId!))}
          >
            No, remove it
          </Button>
          <SkipButton onSkip={onSkip} disabled={pending} />
        </div>
      )}

      {issue.type === "no_main_entrance" &&
        (nodes.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            Upload a plan to add nodes first.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            <select
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
              className="h-9 rounded-md border border-input bg-transparent px-2 text-sm"
            >
              {nodes.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.name?.trim() || `Unnamed ${n.type}`}
                </option>
              ))}
            </select>
            <div className="flex gap-2">
              <Button
                size="sm"
                disabled={pending || !selected}
                onClick={() =>
                  run(() => setNodeType(projectId, selected, "entrance"))
                }
              >
                Set as main entrance
              </Button>
              <SkipButton onSkip={onSkip} disabled={pending} />
            </div>
          </div>
        ))}
    </div>
  )
}

function SkipButton({
  onSkip,
  disabled,
}: {
  onSkip: () => void
  disabled: boolean
}) {
  return (
    <Button type="button" size="sm" variant="ghost" disabled={disabled} onClick={onSkip}>
      Skip
    </Button>
  )
}

function questionText(issue: KnowledgeIssue, node?: GraphNode): string {
  switch (issue.type) {
    case "no_main_entrance":
      return "Which node is the main entrance?"
    case "no_name":
      return `What is this ${node?.type ?? "node"} called?`
    case "no_photo":
      return `Can you add a photo of ${nameOf(node)}?`
    case "uncertain_connection":
      return `Is this connection real? ${issue.label.replace("Uncertain connection: ", "")}`
  }
}
