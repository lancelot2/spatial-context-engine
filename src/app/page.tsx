import Link from "next/link"
import { HeroIllustration } from "@/components/hero-illustration"
import { AnimatedTerminal } from "@/components/animated-terminal"
import { LogoMark, Wordmark } from "@/components/logo"

const RESPONSE = `{
  "current_location": "Receiving Dock",
  "destination": "Packing",
  "path": ["Receiving Dock", "Storage A", "Storage B", "Packing"],
  "landmarks": ["yellow floor lines", "AISLE 4 sign", "blue pallet racks"],
  "distance_m": 42,
  "context": "You are in Receiving Dock. Goal: reach Packing.\\nRoute: Receiving Dock → Storage A → Storage B → Packing (4 nodes, same floor).\\nStep 1: Exit the dock through the roll-up door into Storage A.\\nStep 2: Follow AISLE 4 past the blue pallet racks to Storage B.\\nStep 3: Packing is on your right, by the conveyor.\\nDestination landmarks: conveyor belt, PACKING banner."
}`

const STEPS = [
  {
    n: "01",
    title: "Upload",
    body: "Drop in a floor plan. The vision layer traces rooms, doors, stairs and elevators into an editable graph laid right over the plan.",
  },
  {
    n: "02",
    title: "Enrich",
    body: "Add names, photos and connections. Every room gains landmarks, tags and a semantic embedding.",
  },
  {
    n: "03",
    title: "Localize",
    body: "From a single RGB frame, the engine matches the scene against reference photos to find which room the robot is in.",
  },
  {
    n: "04",
    title: "Navigate",
    body: "One call turns an instruction into a plain-text navigation brief — ready for any vision-language-action model.",
  },
]

const REPO_URL = "https://github.com/lancelot2/spatial-context-engine"

const COMPATIBLE = [
  { name: "Robostral", src: "/Robostral_logo.webp", h: "h-7" },
  { name: "OpenVLA", src: "/OpenVLA_logo.png", h: "h-9" },
  { name: "NVIDIA GR00T", src: "/NVIDIA_GR00T_logo.webp", h: "h-8" },
]

export default function Landing() {
  return (
    <main className="relative flex-1 overflow-hidden">
      {/* One continuous canvas — a subtle grid that dissolves into the paper. */}
      <div
        aria-hidden
        className="bg-grid pointer-events-none absolute inset-x-0 top-0 h-[85vh] [mask-image:linear-gradient(to_bottom,black,transparent)]"
      />

      <div className="relative">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
          <Link href="/" aria-label="NaviGraph">
            <Wordmark />
          </Link>
          <div className="flex items-center gap-5 text-sm">
            <a
              href={REPO_URL}
              target="_blank"
              rel="noreferrer"
              className="text-muted-foreground hover:text-foreground"
            >
              GitHub
            </a>
            <Link href="/dashboard/api" className="text-muted-foreground hover:text-foreground">
              API
            </Link>
            <Link
              href="/dashboard"
              className="rounded-full bg-brand px-4 py-1.5 font-medium text-brand-foreground transition-opacity hover:opacity-90"
            >
              Open studio
            </Link>
          </div>
        </nav>

        {/* Hero */}
        <section className="mx-auto grid max-w-6xl items-center gap-12 px-6 pb-20 pt-8 lg:grid-cols-[1.05fr_0.95fr] lg:pb-28 lg:pt-12">
          <div>
            <h1 className="font-display text-5xl leading-[0.98] tracking-tight sm:text-6xl lg:text-7xl">
              Turn any floor plan into{" "}
              <span className="text-brand">robot memory.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
              Upload any floor plan. A navigation graph gets built automatically.
              Enrich it with pictures for location and landmarks detection.
            </p>
            <div className="mt-8">
              <Link
                href="/dashboard"
                className="inline-block rounded-full bg-brand px-6 py-3 font-medium text-brand-foreground transition-opacity hover:opacity-90"
              >
                Upload your Floor Plan
              </Link>
            </div>
          </div>

          <HeroIllustration />
        </section>

        {/* Pipeline */}
        <section className="mx-auto max-w-6xl px-6 py-20">
          <div className="mb-10 flex items-end justify-between">
            <h2 className="font-display text-3xl tracking-tight sm:text-4xl">
              Build <span className="text-brand">spatial memory</span> in four steps
            </h2>
            <span className="label-mono hidden sm:block">the pipeline</span>
          </div>
          <div className="grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s) => (
              <div key={s.n} className="flex flex-col">
                <div className="mb-4 font-mono text-sm text-brand">{s.n}</div>
                <h3 className="mb-2 text-lg font-medium">{s.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{s.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Why spatial memory */}
        <section className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-20 lg:grid-cols-[1fr_0.8fr]">
          <div>
            <span className="label-mono">why it matters</span>
            <h2 className="mt-3 font-display text-3xl tracking-tight sm:text-4xl">
              Why <span className="text-brand">spatial memory</span> matters
            </h2>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted-foreground">
              Modern vision-language-action models understand what they currently
              see, but they do not retain a persistent understanding of an entire
              building.
            </p>
            <p className="mt-4 max-w-xl text-lg leading-relaxed text-muted-foreground">
              NaviGraph provides this missing{" "}
              <span className="text-brand">memory</span> layer by transforming a
              floor plan into a <span className="text-brand">semantic graph</span>{" "}
              that any robotics model can query using only a single RGB camera
              image.
            </p>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/spatial_graph_illustration.png"
            alt="A floor plan turned into a semantic graph of rooms, connections and photo counts"
            className="w-full"
            draggable={false}
          />
        </section>

        {/* API — request / response flow */}
        <section className="mx-auto max-w-6xl px-6 py-20">
          <div className="mb-10">
            <span className="label-mono">the deliverable</span>
            <h2 className="mt-3 font-display text-3xl tracking-tight sm:text-4xl">
              One endpoint. Navigation-ready <span className="text-brand">context.</span>
            </h2>
            <p className="mt-4 max-w-2xl text-muted-foreground">
              <code className="rounded bg-card px-1.5 py-0.5 font-mono text-sm text-brand">
                POST /context
              </code>{" "}
              takes an instruction and a camera frame, and returns the location,
              destination, path, landmarks and a plain-text{" "}
              <span className="text-brand">context</span> you drop straight into
              your model.
            </p>
          </div>

          <div className="grid items-stretch gap-6 lg:grid-cols-[0.85fr_1.15fr]">
            <FlowDiagram />

            {/* response.json terminal — typewriter loop */}
            <div className="overflow-hidden rounded-xl border border-border bg-[#181713] shadow-[0_20px_50px_-20px_rgba(30,40,90,0.4)]">
              <div className="flex items-center gap-1.5 border-b border-white/10 px-4 py-3">
                <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
                <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
                <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
                <span className="ml-2 font-mono text-xs text-white/40">response.json</span>
              </div>
              <div className="overflow-x-auto p-5 font-mono text-xs leading-relaxed">
                <AnimatedTerminal text={RESPONSE} />
              </div>
            </div>
          </div>
        </section>

        {/* Compatibility */}
        <section className="mx-auto flex max-w-6xl flex-col items-center gap-8 px-6 py-16 text-center">
          <span className="label-mono">compatible with</span>
          <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-8">
            {COMPATIBLE.map((c) => (
              <div key={c.name} className="group flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={c.src}
                  alt={c.name}
                  className={`${c.h} w-auto object-contain opacity-70 grayscale transition duration-300 group-hover:opacity-100 group-hover:grayscale-0`}
                  draggable={false}
                />
                <span className="text-base font-medium text-muted-foreground">{c.name}</span>
              </div>
            ))}
          </div>
        </section>

        <footer className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-3 px-6 pb-10 pt-6 text-sm text-muted-foreground sm:flex-row sm:items-center">
          <span className="flex items-center gap-2 text-foreground">
            <LogoMark className="h-5 w-5" />
            <span className="font-medium">NaviGraph</span>
            <span className="label-mono !text-[10px]">open source</span>
          </span>
          <a
            href={REPO_URL}
            target="_blank"
            rel="noreferrer"
            className="transition-colors hover:text-foreground"
          >
            github.com/lancelot2/spatial-context-engine ↗
          </a>
        </footer>
      </div>
    </main>
  )
}

// Input → NaviGraph → Output flow.
function FlowDiagram() {
  return (
    <div className="flex flex-col justify-center gap-3 rounded-xl border border-border bg-card p-6">
      <FlowBlock label="input" items={["instruction", "RGB camera image"]} />
      <FlowArrow />
      <div className="flex items-center gap-3 rounded-lg border border-brand/30 bg-brand/5 px-4 py-3">
        <LogoMark className="h-5 w-5 text-brand" />
        <span className="font-mono text-sm font-medium">POST /context</span>
      </div>
      <FlowArrow />
      <FlowBlock
        label="output"
        items={[
          "current location",
          "destination",
          "path",
          "landmarks",
          "navigation context",
        ]}
      />
    </div>
  )
}

function FlowBlock({ label, items }: { label: string; items: string[] }) {
  return (
    <div className="rounded-lg border border-border bg-secondary/50 px-4 py-3">
      <div className="label-mono mb-2">{label}</div>
      <div className="flex flex-wrap gap-1.5">
        {items.map((it) => (
          <span key={it} className="rounded-md border border-border bg-card px-2 py-0.5 font-mono text-xs">
            {it}
          </span>
        ))}
      </div>
    </div>
  )
}

function FlowArrow() {
  return <div className="text-center font-mono text-muted-foreground">↓</div>
}
