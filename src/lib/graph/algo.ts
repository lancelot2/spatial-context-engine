import type { SpatialGraph, GraphNode } from "./types"

// Pure graph algorithms — safe to use on both client and server (no I/O).

// Find a node by exact id, or by case-insensitive name match.
export function findNode(
  graph: SpatialGraph,
  query: string,
): GraphNode | undefined {
  const byId = graph.nodes.find((n) => n.id === query)
  if (byId) return byId
  const q = query.trim().toLowerCase()
  return graph.nodes.find((n) => (n.name ?? "").trim().toLowerCase() === q)
}

// Shortest topological path (by hop count) from source to target node id.
// Edges are treated as bidirectional for navigation; multi-floor works because
// stair/elevator nodes are connected across floors like any other node.
// Returns the ordered list of node ids, or null if unreachable.
export function findPath(
  graph: SpatialGraph,
  sourceId: string,
  targetId: string,
): string[] | null {
  if (sourceId === targetId) return [sourceId]

  const adjacency = new Map<string, string[]>()
  for (const n of graph.nodes) adjacency.set(n.id, [])
  for (const e of graph.edges) {
    adjacency.get(e.source)?.push(e.target)
    adjacency.get(e.target)?.push(e.source)
  }

  const queue: string[] = [sourceId]
  const cameFrom = new Map<string, string | null>([[sourceId, null]])

  while (queue.length) {
    const current = queue.shift()!
    if (current === targetId) break
    for (const next of adjacency.get(current) ?? []) {
      if (!cameFrom.has(next)) {
        cameFrom.set(next, current)
        queue.push(next)
      }
    }
  }

  if (!cameFrom.has(targetId)) return null

  const path: string[] = []
  let step: string | null = targetId
  while (step !== null) {
    path.unshift(step)
    step = cameFrom.get(step) ?? null
  }
  return path
}
