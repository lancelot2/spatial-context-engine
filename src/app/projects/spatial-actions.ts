"use server"

import { randomUUID } from "crypto"
import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import type { Bounds, NodeSemantics, NodeType } from "@/lib/graph/types"

// Create a brand-new object of a given type, with either drawn bounds or a
// default box in the centre of the plan. Returns the new node id so the caller
// can immediately select it.
export async function addNode(
  projectId: string,
  type: NodeType = "room",
  bounds: Bounds = { x: 0.4, y: 0.4, w: 0.2, h: 0.15 },
): Promise<string> {
  const supabase = await createClient()
  const id = randomUUID()
  await supabase.from("nodes").insert({
    id,
    project_id: projectId,
    type,
    name: null,
    floor: 0,
    pos_x: 400,
    pos_y: 300,
    metadata: { bounds },
  })
  revalidatePath(`/projects/${projectId}`)
  return id
}

// Replace a node's landmark tags (kept in metadata, preserving bounds/semantics).
export async function setNodeLandmarks(
  projectId: string,
  nodeId: string,
  landmarks: string[],
): Promise<void> {
  const supabase = await createClient()
  const { data: node } = await supabase
    .from("nodes")
    .select("metadata")
    .eq("id", nodeId)
    .eq("project_id", projectId)
    .single()
  const meta = (node?.metadata ?? {}) as NodeSemantics
  await supabase
    .from("nodes")
    .update({ metadata: { ...meta, landmarks } })
    .eq("id", nodeId)
    .eq("project_id", projectId)
}

// Room delimitation lives in nodes.metadata.bounds (jsonb) — no schema change.

// Move/resize a room: persist its bounding box. Called frequently during drag,
// so no revalidate — the editor keeps the canvas state locally.
export async function setNodeBounds(
  projectId: string,
  nodeId: string,
  bounds: Bounds,
): Promise<void> {
  const supabase = await createClient()
  const { data: node } = await supabase
    .from("nodes")
    .select("metadata")
    .eq("id", nodeId)
    .eq("project_id", projectId)
    .single()
  const meta = (node?.metadata ?? {}) as NodeSemantics
  await supabase
    .from("nodes")
    .update({ metadata: { ...meta, bounds } })
    .eq("id", nodeId)
    .eq("project_id", projectId)
}

// Split a room into two side-by-side rooms. The original keeps the left half and
// its semantics; a new blank room takes the right half.
export async function splitNode(
  projectId: string,
  nodeId: string,
): Promise<void> {
  const supabase = await createClient()
  const { data: node } = await supabase
    .from("nodes")
    .select("type, floor, pos_x, pos_y, metadata")
    .eq("id", nodeId)
    .eq("project_id", projectId)
    .single()
  if (!node) return

  const meta = (node.metadata ?? {}) as NodeSemantics
  const b: Bounds = meta.bounds ?? { x: 0.35, y: 0.35, w: 0.3, h: 0.3 }
  const left: Bounds = { x: b.x, y: b.y, w: b.w / 2, h: b.h }
  const right: Bounds = { x: b.x + b.w / 2, y: b.y, w: b.w / 2, h: b.h }

  await supabase
    .from("nodes")
    .update({ metadata: { ...meta, bounds: left } })
    .eq("id", nodeId)
    .eq("project_id", projectId)

  await supabase.from("nodes").insert({
    id: randomUUID(),
    project_id: projectId,
    type: node.type,
    name: null,
    floor: node.floor,
    pos_x: node.pos_x + 30,
    pos_y: node.pos_y,
    metadata: { bounds: right },
  })

  revalidatePath(`/projects/${projectId}`)
}

// Delete a room (its edges and photos cascade via FK).
export async function deleteNode(
  projectId: string,
  nodeId: string,
): Promise<void> {
  const supabase = await createClient()
  await supabase
    .from("nodes")
    .delete()
    .eq("id", nodeId)
    .eq("project_id", projectId)
  revalidatePath(`/projects/${projectId}`)
}
