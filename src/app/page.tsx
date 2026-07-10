import Link from "next/link"

const STEPS = [
  {
    n: "01",
    title: "Builder",
    body: "Upload a floor plan. The vision layer extracts rooms, doors, stairs and elevators into an editable Spatial Graph.",
  },
  {
    n: "02",
    title: "Knowledge",
    body: "An assistant fills the gaps — names, photos, connections — and each room gains landmarks, tags and a semantic embedding.",
  },
  {
    n: "03",
    title: "Localization",
    body: "From a single camera frame, the engine finds which room the robot is in by matching the scene against reference photos.",
  },
  {
    n: "04",
    title: "Context",
    body: "One call turns an instruction into a rich, plain-text navigation context — ready for Robostral, OpenVLA, GR00T and friends.",
  },
]

export default function Landing() {
  return (
    <main className="flex-1 bg-neutral-950 text-neutral-100">
      {/* Nav */}
      <nav className="mx-auto flex max-w-5xl items-center justify-between px-6 py-6">
        <span className="text-lg font-semibold tracking-tight">
          SCE<span className="text-blue-400">.</span>
        </span>
        <div className="flex items-center gap-3 text-sm">
          <Link href="/dashboard/api" className="text-neutral-400 hover:text-white">
            API
          </Link>
          <Link
            href="/dashboard"
            className="rounded-md bg-white px-3 py-1.5 font-medium text-neutral-950 hover:bg-neutral-200"
          >
            Open app
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="mx-auto max-w-5xl px-6 pb-16 pt-16 sm:pt-28">
        <p className="mb-4 text-sm font-medium uppercase tracking-widest text-blue-400">
          Spatial Context Engine
        </p>
        <h1 className="max-w-3xl text-4xl font-semibold leading-tight tracking-tight sm:text-6xl">
          Give robots a{" "}
          <span className="text-blue-400">memory of the building.</span>
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-neutral-400">
          SCE turns a floor plan into a semantic Spatial Graph. At navigation
          time it localizes the robot from a camera frame and returns a rich
          context for any navigation model — no 3D reconstruction required.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/dashboard"
            className="rounded-md bg-blue-500 px-5 py-2.5 font-medium text-white hover:bg-blue-400"
          >
            Get started
          </Link>
          <Link
            href="/dashboard/api"
            className="rounded-md border border-neutral-700 px-5 py-2.5 font-medium text-neutral-200 hover:bg-neutral-900"
          >
            Read the API docs
          </Link>
        </div>
      </section>

      {/* Pipeline */}
      <section className="mx-auto max-w-5xl px-6 pb-20">
        <div className="grid gap-px overflow-hidden rounded-xl border border-neutral-800 bg-neutral-800 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s) => (
            <div key={s.n} className="bg-neutral-950 p-6">
              <div className="mb-3 text-xs font-mono text-blue-400">{s.n}</div>
              <h3 className="mb-2 font-semibold">{s.title}</h3>
              <p className="text-sm leading-relaxed text-neutral-400">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Deliverable */}
      <section className="mx-auto max-w-5xl px-6 pb-24">
        <div className="grid items-center gap-8 lg:grid-cols-2">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">
              One endpoint. Navigation-ready context.
            </h2>
            <p className="mt-3 text-neutral-400">
              <code className="rounded bg-neutral-900 px-1.5 py-0.5 text-sm">
                POST /api/context
              </code>{" "}
              takes an instruction and a camera frame and returns the current
              location, the destination, the path, the landmarks and a
              plain-text context you can drop straight into your model.
            </p>
          </div>
          <pre className="overflow-x-auto rounded-xl border border-neutral-800 bg-black p-5 text-xs leading-relaxed text-neutral-300">
{`{
  "current_location": "Main Lobby",
  "destination": "Supply Room",
  "path": ["Main Lobby", "East Corridor", "Supply Room"],
  "landmarks": ["metal shelves", "SUPPLIES sign"],
  "context": "You are in Main Lobby. Goal: reach Supply Room.
Route: Main Lobby → East Corridor → Supply Room.
Step 1: ..."
}`}
          </pre>
        </div>
      </section>

      <footer className="border-t border-neutral-900">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-8 text-sm text-neutral-500">
          <span>Spatial Context Engine — Open Source</span>
          <span>Model-agnostic · Robostral · OpenVLA · GR00T</span>
        </div>
      </footer>
    </main>
  )
}
