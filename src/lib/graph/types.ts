// Shared domain types for the Spatial Graph — the single source of truth of a
// building. The graph is purely TOPOLOGICAL (no metric geometry); `pos_x/pos_y`
// are React Flow canvas coordinates only, and `floor` carries multi-storey info.

export const NODE_TYPES = [
  "room",
  "entrance",
  "stair",
  "elevator",
  "landmark",
  "door",
] as const
export type NodeType = (typeof NODE_TYPES)[number]

export const EDGE_TYPES = ["connected_to", "contains", "adjacent_to"] as const
export type EdgeType = (typeof EDGE_TYPES)[number]

// Dimension of image embeddings stored in photos.embedding (see Prompt 5/6).
export const EMBEDDING_DIM = 512

// Normalized [0,1] bounding box of a room on the plan image (stored in metadata).
export type Bounds = { x: number; y: number; w: number; h: number }

// Content stored in nodes.metadata (jsonb): photo-derived semantics (Prompt 5)
// and the room delimitation on the plan (plan editor). No DB schema change.
export type NodeSemantics = {
  objects?: string[]
  landmarks?: string[]
  signs?: string[]
  synonyms?: string[]
  bounds?: Bounds
}

export type GraphNode = {
  id: string
  type: NodeType
  name: string | null
  description: string | null
  floor: number
  pos_x: number
  pos_y: number
  metadata: NodeSemantics
}

export type GraphEdge = {
  id: string
  source: string
  target: string
  type: EdgeType
  certain: boolean
}

export type SpatialGraph = {
  nodes: GraphNode[]
  edges: GraphEdge[]
}
