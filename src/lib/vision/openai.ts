import { NODE_TYPES, EDGE_TYPES, EMBEDDING_DIM } from "@/lib/graph/types"
import type {
  FloorPlanInput,
  ParsedGraph,
  PhotoAnalysis,
  VisionProvider,
} from "./types"

// Real provider using OpenAI vision (Chat Completions). Enabled with
// VISION_PROVIDER=openai and OPENAI_API_KEY. Expect imperfect extraction — the
// editor (Prompt 2) is the correction path. Only raster images are supported;
// PDFs should be rasterised upstream (not done in the MVP), otherwise the caller
// falls back to the mock.
const DEFAULT_MODEL = "gpt-4o"

const SYSTEM = `You extract a topological spatial graph from a building floor plan image.
Return ONLY a JSON object (no prose) with this exact shape:
{
  "nodes": [{ "tempId": string, "type": one of ${JSON.stringify(NODE_TYPES)},
             "name": string|null, "floor": number,
             "pos_x": number, "pos_y": number,
             "bounds": { "x": number, "y": number, "w": number, "h": number } }],
  "edges": [{ "sourceTempId": string, "targetTempId": string,
             "type": one of ${JSON.stringify(EDGE_TYPES)}, "certain": boolean }]
}
Rules: identify EVERY room plus all doors ("door"), staircases ("stair") and
elevators ("elevator") visible on the plan, each as its own node — do not miss any.
Trace the WALL lines of the plan to determine each room's extent. "bounds" is the
element's bounding box in NORMALIZED [0,1] coordinates (x,y = top-left corner, w,h =
width/height as fractions of the whole image); make the box tightly follow the room's
walls (top-left = its upper-left wall corner, w/h = its wall-to-wall span). For doors
use a small box centred on the opening in the wall. Double-check that x+w<=1 and
y+h<=1 and that boxes do not overlap more than the walls do. pos_x/pos_y are layout
coordinates on a ~800x600 canvas. Use "connected_to"
for doors/passages, "adjacent_to" when unsure, "contains" for a room enclosing a
landmark. Mark certain=false for connections you are not confident about.`

const ANALYZE_SYSTEM = `You analyse a single photo taken inside a room of a building.
Return ONLY a JSON object (no prose) with this exact shape:
{
  "objects": string[],   // notable objects visible (e.g. "desk", "fire extinguisher")
  "landmarks": string[], // distinctive, memorable features useful to recognise this room
  "signs": string[],     // text on any visible signs/labels/doors
  "synonyms": string[]   // alternative names a person might call this room
}
Keep each list concise (max ~6 items). Use [] when nothing applies.`

export class OpenAIVisionProvider implements VisionProvider {
  async parseFloorPlan(input: FloorPlanInput): Promise<ParsedGraph> {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) throw new Error("OPENAI_API_KEY is not set")
    if (!input.data || !input.mimeType?.startsWith("image/")) {
      throw new Error(`Unsupported plan type for OpenAIVisionProvider: ${input.mimeType}`)
    }

    const dataUrl = `data:${input.mimeType};base64,${Buffer.from(input.data).toString("base64")}`
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: process.env.OPENAI_VISION_MODEL || DEFAULT_MODEL,
        max_tokens: 4096,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM },
          {
            role: "user",
            content: [
              { type: "text", text: "Extract the spatial graph as JSON." },
              { type: "image_url", image_url: { url: dataUrl, detail: "high" } },
            ],
          },
        ],
      }),
    })

    if (!res.ok) {
      throw new Error(`OpenAI API error ${res.status}: ${await res.text()}`)
    }

    const json = await res.json()
    const text: string = json.choices?.[0]?.message?.content ?? ""
    const parsed = JSON.parse(text) as ParsedGraph
    // Normalise: providers occasionally omit optional fields.
    parsed.nodes = parsed.nodes.map((n) => ({ ...n, description: n.description ?? null }))
    return parsed
  }

  async analyzePhoto(input: FloorPlanInput): Promise<PhotoAnalysis> {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) throw new Error("OPENAI_API_KEY is not set")
    if (!input.data || !input.mimeType?.startsWith("image/")) {
      throw new Error(`Unsupported photo type: ${input.mimeType}`)
    }

    const dataUrl = `data:${input.mimeType};base64,${Buffer.from(input.data).toString("base64")}`
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: process.env.OPENAI_VISION_MODEL || DEFAULT_MODEL,
        max_tokens: 1024,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: ANALYZE_SYSTEM },
          {
            role: "user",
            content: [
              { type: "text", text: "Analyse this room photo as JSON." },
              { type: "image_url", image_url: { url: dataUrl } },
            ],
          },
        ],
      }),
    })
    if (!res.ok) throw new Error(`OpenAI API error ${res.status}: ${await res.text()}`)

    const json = await res.json()
    const parsed = JSON.parse(json.choices?.[0]?.message?.content ?? "{}")
    return {
      objects: parsed.objects ?? [],
      landmarks: parsed.landmarks ?? [],
      signs: parsed.signs ?? [],
      synonyms: parsed.synonyms ?? [],
    }
  }

  async embed(text: string): Promise<number[]> {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) throw new Error("OPENAI_API_KEY is not set")

    const res = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "text-embedding-3-small",
        input: text,
        dimensions: EMBEDDING_DIM,
      }),
    })
    if (!res.ok) throw new Error(`OpenAI embeddings error ${res.status}: ${await res.text()}`)

    const json = await res.json()
    return json.data[0].embedding as number[]
  }
}
