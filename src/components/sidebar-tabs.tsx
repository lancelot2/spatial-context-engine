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
    `flex-1 border-b-2 px-3 py-2 text-sm ${
      active
        ? "border-foreground font-medium"
        : "border-transparent text-muted-foreground hover:text-foreground"
    }`

  return (
    <div className="flex h-full flex-col">
      <div className="flex shrink-0 border-b">
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
