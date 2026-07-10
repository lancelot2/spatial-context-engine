import { generateContext } from "@/lib/engine/context"
import { sessionDataSource, apiKeyDataSource } from "@/lib/engine/datasources"

// POST /api/context
// Body: { projectId, instruction, image?, current_location? }
// Runs Localization → Retrieval → Planning → Context Generation and returns
// { current_location, destination, path, landmarks, context }.
//
// Auth: `Authorization: Bearer <api-key>` for external clients, otherwise the
// caller's Supabase session (used by the in-app test console).
export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const { projectId, instruction, image, current_location } =
    (body ?? {}) as Record<string, unknown>

  if (typeof projectId !== "string" || typeof instruction !== "string") {
    return Response.json(
      { error: "`projectId` and `instruction` are required" },
      { status: 400 },
    )
  }

  const auth = request.headers.get("authorization")
  const apiKey = auth?.startsWith("Bearer ") ? auth.slice(7).trim() : null
  const dataSource = apiKey
    ? apiKeyDataSource(projectId, apiKey)
    : sessionDataSource(projectId)

  try {
    const result = await generateContext(
      {
        projectId,
        instruction,
        image: typeof image === "string" ? image : null,
        currentLocation:
          typeof current_location === "string" ? current_location : null,
      },
      dataSource,
    )
    return Response.json(result)
  } catch (err) {
    console.error("context engine error:", err)
    return Response.json(
      { error: "Context generation failed" },
      { status: 500 },
    )
  }
}
