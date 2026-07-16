"use client"

import { useEffect, useState } from "react"
import { JsonBlock } from "@/components/json-highlight"

// Typewriter terminal: reveals the JSON character by character, keeps a blinking
// caret, holds briefly once complete, then loops.
export function AnimatedTerminal({ text }: { text: string }) {
  const [chars, setChars] = useState(0)

  useEffect(() => {
    let alive = true
    let typer: ReturnType<typeof setInterval> | undefined
    let restart: ReturnType<typeof setTimeout> | undefined

    const run = () => {
      setChars(0)
      let c = 0
      typer = setInterval(() => {
        if (!alive) return
        c += 2
        setChars(c)
        if (c >= text.length) {
          if (typer) clearInterval(typer)
          restart = setTimeout(run, 2800) // hold, then loop
        }
      }, 18)
    }

    run()
    return () => {
      alive = false
      if (typer) clearInterval(typer)
      if (restart) clearTimeout(restart)
    }
  }, [text])

  return <JsonBlock text={text} theme="dark" chars={chars} caret />
}
