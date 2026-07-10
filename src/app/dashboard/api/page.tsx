import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { ApiKeysManager } from "@/components/api-keys-manager"

export default async function ApiPage() {
  const supabase = await createClient()

  const [{ data: keys }, { data: projects }] = await Promise.all([
    supabase
      .from("api_keys")
      .select("id, name, key, created_at, last_used_at")
      .order("created_at", { ascending: false }),
    supabase.from("projects").select("id").limit(1),
  ])

  const sampleProjectId = projects?.[0]?.id ?? "YOUR_PROJECT_ID"
  const sampleKey = keys?.[0]?.key ?? "sce_your_api_key"

  const curl = `curl -X POST https://your-app.netlify.app/api/context \\
  -H "Authorization: Bearer ${sampleKey}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "projectId": "${sampleProjectId}",
    "instruction": "Go to the supply room",
    "image": "data:image/jpeg;base64,...optional camera frame..."
  }'`

  return (
    <div className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
      <header className="mb-8">
        <Link href="/dashboard" className="text-sm text-muted-foreground hover:underline">
          ← Dashboard
        </Link>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">API keys</h1>
        <p className="text-sm text-muted-foreground">
          Call the Spatial Context Engine from any robot or backend.
        </p>
      </header>

      <section className="mb-10">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Your keys
        </h2>
        <ApiKeysManager keys={keys ?? []} />
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Quickstart
        </h2>

        <p className="text-sm">
          Send a <code className="rounded bg-muted px-1 py-0.5">POST</code> to{" "}
          <code className="rounded bg-muted px-1 py-0.5">/api/context</code> with your
          key in the <code className="rounded bg-muted px-1 py-0.5">Authorization</code>{" "}
          header.
        </p>

        <div>
          <p className="mb-1 text-sm font-medium">Body parameters</p>
          <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
            <li>
              <code className="rounded bg-muted px-1 py-0.5">projectId</code> — the
              building to navigate. It&apos;s the id in your project URL:{" "}
              <code className="rounded bg-muted px-1 py-0.5">/projects/&lt;projectId&gt;</code>.
            </li>
            <li>
              <code className="rounded bg-muted px-1 py-0.5">instruction</code> — natural
              language goal, e.g. &quot;Go to the supply room&quot;.
            </li>
            <li>
              <code className="rounded bg-muted px-1 py-0.5">image</code> — optional
              camera frame (base64 data URL) used to localize the robot.
            </li>
            <li>
              <code className="rounded bg-muted px-1 py-0.5">current_location</code> —
              optional fallback: a room name to skip image localization.
            </li>
          </ul>
        </div>

        <pre className="overflow-x-auto rounded-lg border bg-neutral-950 p-4 text-xs leading-relaxed text-neutral-100">
          {curl}
        </pre>

        <div>
          <p className="mb-1 text-sm font-medium">Response</p>
          <pre className="overflow-x-auto rounded-lg border bg-muted/40 p-4 text-xs leading-relaxed">
{`{
  "current_location": "Main Lobby",
  "destination": "Supply Room",
  "path": ["Main Lobby", "East Corridor", "Supply Room"],
  "landmarks": ["metal shelves"],
  "context": "You are in Main Lobby. Goal: reach Supply Room. ..."
}`}
          </pre>
        </div>

        <p className="text-xs text-muted-foreground">
          The <code className="rounded bg-muted px-1 py-0.5">context</code> string is the
          deliverable — feed it straight into your navigation model (Robostral, OpenVLA,
          GR00T, …).
        </p>
      </section>
    </div>
  )
}
