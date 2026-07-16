import Link from "next/link"
import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { ContextTester } from "@/components/context-tester"
import type { GraphNode, NodeType, NodeSemantics } from "@/lib/graph/types"

export default async function TestPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: project } = await supabase
    .from("projects")
    .select("id, name, plan_path")
    .eq("id", id)
    .single()
  if (!project) notFound()

  const { data: nodeRows } = await supabase
    .from("nodes")
    .select("id, type, name, description, floor, pos_x, pos_y, metadata")
    .eq("project_id", id)

  const nodes: GraphNode[] = (nodeRows ?? []).map((n) => ({
    ...n,
    type: n.type as NodeType,
    metadata: (n.metadata ?? {}) as NodeSemantics,
  }))

  const planUrl = project.plan_path
    ? ((await supabase.storage.from("plans").createSignedUrl(project.plan_path, 3600))
        .data?.signedUrl ?? null)
    : null

  return (
    <div className="flex h-screen flex-1 flex-col">
      <header className="flex items-center justify-between border-b border-border bg-card/60 px-6 py-3">
        <div className="flex items-center gap-4">
          <Link
            href={`/projects/${project.id}`}
            className="flex h-8 w-8 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            aria-label="Back to editor"
          >
            ←
          </Link>
          <div>
            <span className="label-mono">context api · test console</span>
            <h1 className="font-display text-xl leading-tight tracking-tight">
              {project.name}
            </h1>
          </div>
        </div>
        <code className="rounded-md border border-border bg-card px-2.5 py-1 font-mono text-xs text-brand">
          POST /api/context
        </code>
      </header>

      <ContextTester projectId={project.id} planUrl={planUrl} nodes={nodes} />
    </div>
  )
}
