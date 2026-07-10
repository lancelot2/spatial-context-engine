import { EMBEDDING_DIM } from "@/lib/graph/types"
import type { ParsedGraph, PhotoAnalysis, VisionProvider } from "./types"

// Default provider. Returns a plausible 2-floor building so the whole flow
// works end-to-end with no API key — the user then corrects it in the editor
// (Prompt 2). This is what makes the "first graph in under 2 minutes" promise
// hold even before a real vision backend is configured.
export class MockVisionProvider implements VisionProvider {
  async parseFloorPlan(): Promise<ParsedGraph> {
    return {
      nodes: [
        { tempId: "n1", type: "entrance", name: "Main Entrance", description: null, floor: 0, pos_x: 40, pos_y: 240, bounds: { x: 0.03, y: 0.42, w: 0.14, h: 0.16 } },
        { tempId: "n2", type: "room", name: "Lobby", description: null, floor: 0, pos_x: 240, pos_y: 240, bounds: { x: 0.2, y: 0.38, w: 0.22, h: 0.24 } },
        { tempId: "n3", type: "room", name: "Corridor", description: null, floor: 0, pos_x: 460, pos_y: 240, bounds: { x: 0.44, y: 0.42, w: 0.12, h: 0.5 } },
        { tempId: "n4", type: "room", name: "Meeting Room", description: null, floor: 0, pos_x: 680, pos_y: 120, bounds: { x: 0.6, y: 0.12, w: 0.32, h: 0.3 } },
        { tempId: "n5", type: "room", name: "Storage Room", description: null, floor: 0, pos_x: 680, pos_y: 360, bounds: { x: 0.6, y: 0.5, w: 0.32, h: 0.3 } },
        { tempId: "n6", type: "stair", name: "Staircase", description: null, floor: 0, pos_x: 460, pos_y: 440, bounds: { x: 0.44, y: 0.82, w: 0.12, h: 0.14 } },
        { tempId: "n7", type: "elevator", name: "Elevator", description: null, floor: 0, pos_x: 240, pos_y: 440, bounds: { x: 0.24, y: 0.7, w: 0.14, h: 0.14 } },
        { tempId: "n8", type: "room", name: "Office", description: null, floor: 1, pos_x: 680, pos_y: 560, bounds: { x: 0.05, y: 0.05, w: 0.3, h: 0.25 } },
      ],
      edges: [
        { sourceTempId: "n1", targetTempId: "n2", type: "connected_to", certain: true },
        { sourceTempId: "n2", targetTempId: "n3", type: "connected_to", certain: true },
        { sourceTempId: "n3", targetTempId: "n4", type: "connected_to", certain: true },
        { sourceTempId: "n3", targetTempId: "n5", type: "connected_to", certain: false },
        { sourceTempId: "n3", targetTempId: "n6", type: "connected_to", certain: true },
        { sourceTempId: "n2", targetTempId: "n7", type: "connected_to", certain: true },
        { sourceTempId: "n6", targetTempId: "n8", type: "connected_to", certain: true },
      ],
    }
  }

  async analyzePhoto(): Promise<PhotoAnalysis> {
    return {
      objects: ["shelves", "boxes", "door"],
      landmarks: ["Metal shelves"],
      signs: [],
      synonyms: [],
    }
  }

  // Deterministic pseudo-embedding so pgvector storage/similarity works without
  // an API key. Not semantically meaningful — real localization needs OpenAI.
  async embed(text: string): Promise<number[]> {
    const v = new Array(EMBEDDING_DIM).fill(0)
    for (let i = 0; i < text.length; i++) {
      v[i % EMBEDDING_DIM] += (text.charCodeAt(i) % 13) - 6
    }
    const norm = Math.sqrt(v.reduce((s, x) => s + x * x, 0)) || 1
    return v.map((x) => x / norm)
  }
}
