"use client"

import { useEffect, useState } from "react"
import { JsonBlock } from "@/components/json-highlight"

const JSON_TEXT = `{
  "rooms": [
    { "id": "office",    "type": "office" },
    { "id": "warehouse", "type": "storage" },
    { "id": "shipping",  "type": "dock" }
  ],
  "landmarks": [
    "AISLE 4 sign",
    "blue pallet racks",
    "roll-up dock door"
  ],
  "connections": [
    ["office", "warehouse"],
    ["warehouse", "shipping"]
  ]
}`

type Phase = "plan" | "scan" | "json"

export function HeroIllustration() {
  const [phase, setPhase] = useState<Phase>("plan")
  const [chars, setChars] = useState(0)
  const [scanLeft, setScanLeft] = useState(0)

  useEffect(() => {
    let alive = true
    const timers: ReturnType<typeof setTimeout>[] = []
    let typer: ReturnType<typeof setInterval> | undefined
    const at = (ms: number, fn: () => void) =>
      timers.push(setTimeout(() => alive && fn(), ms))

    const typeStep = 22
    const typingMs = JSON_TEXT.length * typeStep

    const run = () => {
      setPhase("plan")
      setChars(0)
      setScanLeft(0)

      // 1) scan sweeps left → right (setTimeout, not rAF, so it fires reliably
      //    even when the tab is throttled/backgrounded)
      at(1200, () => setPhase("scan"))
      at(1320, () => setScanLeft(100))

      // 2) JSON types out, one character at a time
      at(2900, () => {
        setPhase("json")
        let c = 0
        typer = setInterval(() => {
          if (!alive) return
          c += 1
          setChars(c)
          if (c >= JSON_TEXT.length && typer) clearInterval(typer)
        }, typeStep)
      })

      // 3) hold, then loop
      at(2900 + typingMs + 2400, run)
    }

    run()
    return () => {
      alive = false
      timers.forEach(clearTimeout)
      if (typer) clearInterval(typer)
    }
  }, [])

  return (
    <div className="relative aspect-[3/2] overflow-hidden rounded-xl border border-border bg-card shadow-[0_20px_50px_-24px_rgba(30,40,90,0.35)]">
      {/* Warehouse plan */}
      <div
        className="absolute inset-0 transition-opacity duration-500"
        style={{ opacity: phase === "json" ? 0 : 1 }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/warehouse_floorplan.png"
          alt="Warehouse floor plan"
          className="h-full w-full object-cover"
          draggable={false}
        />
      </div>

      {/* Scan line — sweeps across during the scan phase */}
      {phase === "scan" && (
        <div
          className="pointer-events-none absolute top-0 z-10 h-full w-[3px] bg-red-500"
          style={{
            left: `${scanLeft}%`,
            transition: "left 1.5s ease-in-out",
            boxShadow: "0 0 18px 4px rgba(229,72,77,0.75)",
          }}
        >
          <span className="absolute left-1/2 top-1 h-2.5 w-2.5 -translate-x-1/2 rounded-full bg-red-500" />
        </div>
      )}

      {/* JSON readout — typed out character by character */}
      <div
        className="absolute inset-0 bg-[#181713] p-4 font-mono text-[11px] leading-[1.6] transition-opacity duration-500 sm:p-5 sm:text-xs"
        style={{ opacity: phase === "json" ? 1 : 0 }}
      >
        <JsonBlock text={JSON_TEXT} theme="dark" chars={chars} caret />
      </div>
    </div>
  )
}
