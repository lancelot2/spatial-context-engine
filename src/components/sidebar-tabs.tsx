"use client"

import { useState } from "react"

export function SidebarTabs({
  assistant,
  catalogue,
}: {
  assistant: React.ReactNode
  catalogue: React.ReactNode
}) {
  const [tab, setTab] = useState<"assistant" | "catalogue">("catalogue")

  const tabClass = (active: boolean) =>
    `relative flex-1 px-3 py-2.5 text-sm transition-colors ${
      active
        ? "font-medium text-foreground after:absolute after:inset-x-3 after:-bottom-px after:h-0.5 after:rounded-full after:bg-brand"
        : "text-muted-foreground hover:text-foreground"
    }`

  return (
    <div className="flex h-full flex-col">
      <div className="flex shrink-0 border-b border-border bg-card/50">
        <button
          className={tabClass(tab === "catalogue")}
          onClick={() => setTab("catalogue")}
        >
          Catalogue
        </button>
        <button
          className={tabClass(tab === "assistant")}
          onClick={() => setTab("assistant")}
        >
          Assistant
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        {tab === "assistant" ? assistant : catalogue}
      </div>
    </div>
  )
}
