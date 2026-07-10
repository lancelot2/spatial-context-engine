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
      <header className="flex items-center justify-between border-b px-6 py-4">
        <div>
          <Link
            href={`/projects/${project.id}`}
            className="text-sm text-muted-foreground hover:underline"
          >
            ← Back to editor
          </Link>
          <h1 className="text-xl font-semibold tracking-tight">
            {project.name} · Context API test
          </h1>
        </div>
        <code className="rounded bg-muted px-2 py-1 text-xs">POST /api/context</code>
      </header>

      <ContextTester projectId={project.id} planUrl={planUrl} nodes={nodes} />
    </div>
  )
}
