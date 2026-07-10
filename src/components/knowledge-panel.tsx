import type { Knowledge, IssueType } from "@/lib/knowledge/score"

const SECTIONS: { type: IssueType; heading: string }[] = [
  { type: "no_main_entrance", heading: "Main entrance" },
  { type: "no_name", heading: "Unnamed nodes" },
  { type: "no_photo", heading: "Missing photos" },
  { type: "uncertain_connection", heading: "Uncertain connections" },
]

function scoreColor(score: number) {
  if (score >= 80) return "text-green-600"
  if (score >= 50) return "text-amber-600"
  return "text-red-600"
}

function barColor(score: number) {
  if (score >= 80) return "bg-green-500"
  if (score >= 50) return "bg-amber-500"
  return "bg-red-500"
}

export function KnowledgePanel({ knowledge }: { knowledge: Knowledge }) {
  const { score, issues } = knowledge

  return (
    <div className="flex flex-col gap-4 p-4">
      <div>
        <h2 className="text-sm font-medium text-muted-foreground">
          Knowledge Score
        </h2>
        <div className="mt-1 flex items-baseline gap-1">
          <span className={`text-4xl font-semibold ${scoreColor(score)}`}>
            {score}
          </span>
          <span className="text-lg text-muted-foreground">/ 100</span>
        </div>
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className={`h-full ${barColor(score)}`}
            style={{ width: `${score}%` }}
          />
        </div>
      </div>

      {issues.length === 0 ? (
        <p className="text-sm text-green-600">
          Complete — the engine has everything it needs. 🎉
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          <p className="text-xs text-muted-foreground">
            {issues.length} thing{issues.length > 1 ? "s" : ""} the engine still
            needs:
          </p>
          {SECTIONS.map(({ type, heading }) => {
            const items = issues.filter((i) => i.type === type)
            if (items.length === 0) return null
            return (
              <div key={type}>
                <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {heading} ({items.length})
                </h3>
                <ul className="flex flex-col gap-1">
                  {items.map((i) => (
                    <li
                      key={i.id}
                      className="rounded-md border border-border/60 bg-muted/40 px-2 py-1.5 text-xs"
                    >
                      {i.label}
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
