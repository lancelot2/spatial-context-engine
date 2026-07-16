import "server-only"
import { Graph } from "@/lib/graph/repository"
import { getVisionProvider } from "@/lib/vision"
import type { SpatialGraph, GraphNode } from "@/lib/graph/types"

// How the engine reads a project's data — swappable so the same engine serves
// the in-app session (RLS) and external API-key requests (SECURITY DEFINER).
export type ContextDataSource = {
  loadGraph: () => Promise<SpatialGraph>
  matchLocation: (embedding: number[]) => Promise<string | null>
}

// NaviGraph's context engine. Turns an instruction + camera frame into a rich,
// plain-text navigation context for models like Robostral Navigate.

export type ContextRequest = {
  projectId: string
  instruction: string
  image?: string | null // data URL or bare base64
  currentLocation?: string | null // manual override (node id or name)
}

export type ContextResult = {
  current_location: string | null
  destination: string | null
  path: string[]
  landmarks: string[]
  context: string
}

function nodeName(n: GraphNode): string {
  return n.name?.trim() || `unnamed ${n.type}`
}

// data:image/png;base64,xxxx  OR  bare base64 -> bytes + mime
function parseImage(
  image: string,
): { data: Uint8Array; mimeType: string } | null {
  const m = image.match(/^data:(.+?);base64,(.*)$/)
  const mimeType = m ? m[1] : "image/jpeg"
  const b64 = m ? m[2] : image
  try {
    return { data: new Uint8Array(Buffer.from(b64, "base64")), mimeType }
  } catch {
    return null
  }
}

// Step 1 — Localization. Manual override wins; otherwise embed the camera scene
// and find the nearest reference photo via pgvector.
async function localize(
  graph: SpatialGraph,
  req: ContextRequest,
  ds: ContextDataSource,
): Promise<GraphNode | null> {
  if (req.currentLocation) {
    return Graph.findNode(graph, req.currentLocation) ?? null
  }
  if (!req.image) return null

  const parsed = parseImage(req.image)
  if (!parsed) return null

  const provider = getVisionProvider()
  const analysis = await provider.analyzePhoto(parsed)
  const sceneText = [
    ...analysis.objects,
    ...analysis.landmarks,
    ...analysis.signs,
    ...analysis.synonyms,
  ]
    .filter(Boolean)
    .join(", ")
  if (!sceneText) return null

  const embedding = await provider.embed(sceneText)
  const nodeId = await ds.matchLocation(embedding)
  return nodeId ? (graph.nodes.find((n) => n.id === nodeId) ?? null) : null
}

// Step 2/retrieval helper — resolve the destination node from free-text
// instruction by matching node names and photo-derived synonyms.
function resolveDestination(
  graph: SpatialGraph,
  instruction: string,
): GraphNode | null {
  const text = instruction.toLowerCase()
  let best: GraphNode | null = null
  let bestLen = 0

  for (const node of graph.nodes) {
    // Match the instruction against the room's name, synonyms and its
    // photo/tag-derived landmarks and signs, so "go to the baby crib" resolves
    // to the room tagged with that landmark.
    const candidates = [
      node.name ?? "",
      ...(node.metadata.synonyms ?? []),
      ...(node.metadata.landmarks ?? []),
      ...(node.metadata.signs ?? []),
    ]
    for (const c of candidates) {
      const key = c.trim().toLowerCase()
      // Prefer the longest match to avoid weak partial hits.
      if (key.length >= 3 && text.includes(key) && key.length > bestLen) {
        best = node
        bestLen = key.length
      }
    }
  }
  return best
}

// Step 4 — Context Generation. Plain text optimized for a navigation model.
function buildContext(
  graph: SpatialGraph,
  current: GraphNode,
  destination: GraphNode,
  pathIds: string[],
): string {
  const nodes = pathIds.map((id) => graph.nodes.find((n) => n.id === id)!)
  const names = nodes.map(nodeName)
  const multiFloor = new Set(nodes.map((n) => n.floor)).size > 1

  const lines: string[] = []
  lines.push(
    `You are in ${nodeName(current)}. Goal: reach ${nodeName(destination)}.`,
  )
  lines.push(
    `Route: ${names.join(" → ")} (${nodes.length} nodes, ${multiFloor ? "multiple floors" : "same floor"}).`,
  )

  for (let i = 1; i < nodes.length; i++) {
    const from = nodes[i - 1]
    const to = nodes[i]
    let step = `Step ${i}: From ${nodeName(from)}, proceed to ${nodeName(to)}.`
    if (to.type === "stair")
      step += ` Take the stairs to floor ${to.floor}.`
    else if (to.type === "elevator")
      step += ` Take the elevator to floor ${to.floor}.`
    else if (from.floor !== to.floor)
      step += ` This changes floor to ${to.floor}.`
    lines.push(step)
  }

  const landmarks = destination.metadata.landmarks ?? []
  const signs = destination.metadata.signs ?? []
  if (landmarks.length || signs.length) {
    lines.push(
      `Destination landmarks: ${[...landmarks, ...signs].join(", ")}.`,
    )
  }
  if (destination.description?.trim()) {
    lines.push(`About ${nodeName(destination)}: ${destination.description.trim()}`)
  }

  return lines.join("\n")
}

export async function generateContext(
  req: ContextRequest,
  ds: ContextDataSource,
): Promise<ContextResult> {
  const graph = await ds.loadGraph()

  // Step 1 — Localization
  const current = await localize(graph, req, ds)
  if (!current) {
    return {
      current_location: null,
      destination: null,
      path: [],
      landmarks: [],
      context:
        "Could not determine the robot's current location from the image. Pass `current_location` (a room name) to proceed.",
    }
  }

  // Step 2 — Retrieval (resolve + gather destination knowledge)
  const destination = resolveDestination(graph, req.instruction)
  if (!destination) {
    return {
      current_location: nodeName(current),
      destination: null,
      path: [],
      landmarks: [],
      context: `You are in ${nodeName(current)}, but the destination in "${req.instruction}" could not be matched to a known room.`,
    }
  }

  const landmarks = destination.metadata.landmarks ?? []

  // Step 3 — Planning
  const pathIds = Graph.findPath(graph, current.id, destination.id)
  if (!pathIds) {
    return {
      current_location: nodeName(current),
      destination: nodeName(destination),
      path: [],
      landmarks,
      context: `You are in ${nodeName(current)}. No route to ${nodeName(destination)} exists in the current spatial graph — the buildings may be disconnected.`,
    }
  }

  // Step 4 — Context Generation
  const context = buildContext(graph, current, destination, pathIds)
  return {
    current_location: nodeName(current),
    destination: nodeName(destination),
    path: pathIds.map((id) => nodeName(graph.nodes.find((n) => n.id === id)!)),
    landmarks,
    context,
  }
}
