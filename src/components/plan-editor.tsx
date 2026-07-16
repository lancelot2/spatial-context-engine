"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import {
  NODE_TYPES,
  type GraphNode,
  type NodeType,
  type Bounds,
} from "@/lib/graph/types"
import { setNodeBounds, addNode } from "@/app/projects/spatial-actions"
import { addNodePhoto } from "@/app/projects/actions"
import { useEditorStore } from "@/lib/store/editor"
import { Button } from "@/components/ui/button"

const TYPE_COLOR: Record<NodeType, string> = {
  room: "#3b82f6",
  entrance: "#22c55e",
  stair: "#f59e0b",
  elevator: "#a855f7",
  landmark: "#ef4444",
  door: "#64748b",
}

const HANDLES = ["nw", "n", "ne", "e", "se", "s", "sw", "w"] as const
type Dir = (typeof HANDLES)[number]

const HANDLE_STYLE: Record<Dir, string> = {
  nw: "left-0 top-0 -translate-x-1/2 -translate-y-1/2 cursor-nwse-resize",
  n: "left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 cursor-ns-resize",
  ne: "right-0 top-0 translate-x-1/2 -translate-y-1/2 cursor-nesw-resize",
  e: "right-0 top-1/2 translate-x-1/2 -translate-y-1/2 cursor-ew-resize",
  se: "right-0 bottom-0 translate-x-1/2 translate-y-1/2 cursor-nwse-resize",
  s: "left-1/2 bottom-0 -translate-x-1/2 translate-y-1/2 cursor-ns-resize",
  sw: "left-0 bottom-0 -translate-x-1/2 translate-y-1/2 cursor-nesw-resize",
  w: "left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 cursor-ew-resize",
}

const clamp = (v: number, min: number, max: number) =>
  Math.min(max, Math.max(min, v))

// Kept at module scope so the zoom level survives the editor remounting.
let persistedZoom = 1

function initialBounds(n: GraphNode): Bounds {
  if (n.metadata.bounds) return n.metadata.bounds
  return {
    x: clamp(n.pos_x / 800 - 0.08, 0, 0.82),
    y: clamp(n.pos_y / 600 - 0.06, 0, 0.86),
    w: 0.16,
    h: 0.12,
  }
}

type Room = {
  id: string
  name: string | null
  type: NodeType
  floor: number
  bounds: Bounds
}

export function PlanEditor({
  projectId,
  planUrl,
  nodes,
  photosByNode,
}: {
  projectId: string
  planUrl: string | null
  nodes: GraphNode[]
  photosByNode: Record<string, string[]>
}) {
  const router = useRouter()
  const containerRef = useRef<HTMLDivElement>(null)
  const [rooms, setRooms] = useState<Room[]>(() =>
    nodes.map((n) => ({
      id: n.id,
      name: n.name,
      type: n.type,
      floor: n.floor,
      bounds: initialBounds(n),
    })),
  )
  const selectedId = useEditorStore((s) => s.selectedId)
  const setSelectedId = useEditorStore((s) => s.setSelectedId)

  const [zoom, setZoom] = useState(() => persistedZoom)
  useEffect(() => {
    persistedZoom = zoom
  }, [zoom])

  // Draw-to-create: pick a type, then drag a rectangle on the plan.
  const [newType, setNewType] = useState<NodeType>("room")
  const [drawType, setDrawType] = useState<NodeType | null>(null)
  const drawStart = useRef<{ x: number; y: number } | null>(null)
  const previewRef = useRef<Bounds | null>(null)
  const [preview, setPreview] = useState<Bounds | null>(null)

  function patch(id: string, next: Partial<Room>) {
    setRooms((rs) => rs.map((r) => (r.id === id ? { ...r, ...next } : r)))
  }

  function relPoint(e: React.PointerEvent) {
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return null
    return {
      x: clamp((e.clientX - rect.left) / rect.width, 0, 1),
      y: clamp((e.clientY - rect.top) / rect.height, 0, 1),
    }
  }
  function drawDown(e: React.PointerEvent) {
    const p = relPoint(e)
    if (!p) return
    drawStart.current = p
    const b = { ...p, w: 0, h: 0 }
    previewRef.current = b
    setPreview(b)
    e.currentTarget.setPointerCapture(e.pointerId)
  }
  function drawMove(e: React.PointerEvent) {
    const s = drawStart.current
    if (!s) return
    const p = relPoint(e)
    if (!p) return
    const b = {
      x: Math.min(p.x, s.x),
      y: Math.min(p.y, s.y),
      w: Math.abs(p.x - s.x),
      h: Math.abs(p.y - s.y),
    }
    previewRef.current = b
    setPreview(b)
  }
  async function drawUp() {
    const p = previewRef.current
    const t = drawType
    drawStart.current = null
    previewRef.current = null
    setPreview(null)
    setDrawType(null)
    if (p && t && p.w > 0.02 && p.h > 0.02) {
      const id = await addNode(projectId, t, p)
      setSelectedId(id) // auto-select the new object so it can be named right away
      router.refresh()
    }
  }

  // Copy/paste the selected object with Cmd/Ctrl+C then Cmd/Ctrl+V.
  const stateRef = useRef({ rooms, selectedId })
  stateRef.current = { rooms, selectedId }
  const clipboard = useRef<{ type: NodeType; bounds: Bounds } | null>(null)
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const el = document.activeElement
      if (el && /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName)) return
      if (!(e.metaKey || e.ctrlKey)) return
      const { rooms, selectedId } = stateRef.current
      if (e.key === "c" && selectedId) {
        const r = rooms.find((x) => x.id === selectedId)
        if (r) {
          clipboard.current = { type: r.type, bounds: r.bounds }
          e.preventDefault()
        }
      } else if (e.key === "v" && clipboard.current) {
        e.preventDefault()
        const c = clipboard.current
        const b: Bounds = {
          ...c.bounds,
          x: clamp(c.bounds.x + 0.03, 0, 1 - c.bounds.w),
          y: clamp(c.bounds.y + 0.03, 0, 1 - c.bounds.h),
        }
        void addNode(projectId, c.type, b).then((id) => {
          setSelectedId(id)
          router.refresh()
        })
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId])

  function handleDropPhoto(nodeId: string, file: File) {
    const fd = new FormData()
    fd.append("photo", file)
    void addNodePhoto(projectId, nodeId, fd).then(() => router.refresh())
  }

  return (
    <div className="relative h-full w-full">
      <div className="absolute left-3 top-3 z-20 flex items-center gap-1 rounded-lg border border-border bg-card/95 p-1 shadow-sm backdrop-blur">
        <button
          onClick={() => setZoom((z) => clamp(z - 0.25, 0.5, 3))}
          className="flex h-7 w-7 items-center justify-center rounded hover:bg-muted"
        >
          −
        </button>
        <span className="w-11 text-center text-xs tabular-nums">
          {Math.round(zoom * 100)}%
        </span>
        <button
          onClick={() => setZoom((z) => clamp(z + 0.25, 0.5, 3))}
          className="flex h-7 w-7 items-center justify-center rounded hover:bg-muted"
        >
          +
        </button>
        <div className="mx-1 h-5 w-px bg-border" />
        {drawType ? (
          <>
            <span className="px-1 text-xs text-muted-foreground">
              Draw the {drawType} on the plan…
            </span>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setDrawType(null)
                setPreview(null)
                drawStart.current = null
              }}
            >
              Cancel
            </Button>
          </>
        ) : (
          <>
            <select
              value={newType}
              onChange={(e) => setNewType(e.target.value as NodeType)}
              className="h-7 rounded border border-input bg-transparent px-1 text-xs"
            >
              {NODE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <Button size="sm" variant="ghost" onClick={() => setDrawType(newType)}>
              Draw
            </Button>
          </>
        )}
      </div>

      <div className="bg-grid h-full w-full overflow-auto bg-secondary/50">
        <div
          ref={containerRef}
          className="relative mx-auto my-4 select-none"
          style={{ width: `${zoom * 100}%`, maxWidth: "none" }}
          onPointerDown={(e) => {
            if (e.target === e.currentTarget) setSelectedId(null)
          }}
        >
          {planUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={planUrl}
              alt="Floor plan"
              className="block w-full rounded border bg-white"
              draggable={false}
            />
          ) : (
            <div className="flex aspect-[4/3] items-center justify-center rounded border bg-white text-sm text-muted-foreground">
              No plan image — upload one to see rooms over the plan.
            </div>
          )}

          {rooms.map((r) => (
            <RoomBox
              key={r.id}
              room={r}
              selected={r.id === selectedId}
              photos={photosByNode[r.id] ?? []}
              containerRef={containerRef}
              onSelect={() => setSelectedId(r.id)}
              onChange={(b) => patch(r.id, { bounds: b })}
              onCommit={(b) => setNodeBounds(projectId, r.id, b)}
              onDropPhoto={(file) => handleDropPhoto(r.id, file)}
            />
          ))}

          {drawType && (
            <div
              className="absolute inset-0 z-10 cursor-crosshair"
              onPointerDown={drawDown}
              onPointerMove={drawMove}
              onPointerUp={drawUp}
            >
              {preview && (
                <div
                  className="absolute rounded border-2 border-dashed"
                  style={{
                    left: `${preview.x * 100}%`,
                    top: `${preview.y * 100}%`,
                    width: `${preview.w * 100}%`,
                    height: `${preview.h * 100}%`,
                    borderColor: TYPE_COLOR[drawType],
                    background: `${TYPE_COLOR[drawType]}22`,
                  }}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function RoomBox({
  room,
  selected,
  photos,
  containerRef,
  onSelect,
  onChange,
  onCommit,
  onDropPhoto,
}: {
  room: Room
  selected: boolean
  photos: string[]
  containerRef: React.RefObject<HTMLDivElement | null>
  onSelect: () => void
  onChange: (b: Bounds) => void
  onCommit: (b: Bounds) => void
  onDropPhoto: (file: File) => void
}) {
  const boxRef = useRef<HTMLDivElement>(null)
  const [dragOver, setDragOver] = useState(false)
  const drag = useRef<{
    dir: Dir | "move"
    px: number
    py: number
    start: Bounds
    rect: DOMRect
  } | null>(null)
  const latest = useRef<Bounds>(room.bounds)
  latest.current = room.bounds
  const color = TYPE_COLOR[room.type]

  // Bring the box into view when selected from the catalogue.
  useEffect(() => {
    if (selected)
      boxRef.current?.scrollIntoView({ block: "center", inline: "center" })
  }, [selected])

  function begin(dir: Dir | "move", e: React.PointerEvent) {
    e.stopPropagation()
    onSelect()
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return
    drag.current = { dir, px: e.clientX, py: e.clientY, start: { ...room.bounds }, rect }
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  function move(e: React.PointerEvent) {
    const d = drag.current
    if (!d) return
    const dx = (e.clientX - d.px) / d.rect.width
    const dy = (e.clientY - d.py) / d.rect.height
    const s = d.start
    const MIN = 0.02
    let b: Bounds
    if (d.dir === "move") {
      b = {
        ...s,
        x: clamp(s.x + dx, 0, 1 - s.w),
        y: clamp(s.y + dy, 0, 1 - s.h),
      }
    } else {
      let { x, y, w, h } = s
      if (d.dir.includes("e")) w = clamp(s.w + dx, MIN, 1 - s.x)
      if (d.dir.includes("s")) h = clamp(s.h + dy, MIN, 1 - s.y)
      if (d.dir.includes("w")) {
        const nx = clamp(s.x + dx, 0, s.x + s.w - MIN)
        w = s.x + s.w - nx
        x = nx
      }
      if (d.dir.includes("n")) {
        const ny = clamp(s.y + dy, 0, s.y + s.h - MIN)
        h = s.y + s.h - ny
        y = ny
      }
      b = { x, y, w, h }
    }
    latest.current = b
    onChange(b)
  }

  function end() {
    if (!drag.current) return
    drag.current = null
    onCommit(latest.current)
  }

  return (
    <div
      ref={boxRef}
      className={`absolute rounded border-2 ${dragOver ? "bg-blue-500/20 ring-2 ring-blue-500" : "bg-white/10"} ${selected ? "z-10 ring-2 ring-offset-1" : ""}`}
      style={{
        left: `${room.bounds.x * 100}%`,
        top: `${room.bounds.y * 100}%`,
        width: `${room.bounds.w * 100}%`,
        height: `${room.bounds.h * 100}%`,
        borderColor: color,
        cursor: "move",
      }}
      onPointerDown={(e) => begin("move", e)}
      onPointerMove={move}
      onPointerUp={end}
      onClick={(e) => {
        e.stopPropagation()
        onSelect()
      }}
      onDragOver={(e) => {
        e.preventDefault()
        if (!dragOver) setDragOver(true)
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault()
        setDragOver(false)
        const file = Array.from(e.dataTransfer.files).find((f) =>
          f.type.startsWith("image/"),
        )
        if (file) onDropPhoto(file)
      }}
    >
      <span
        className="pointer-events-none absolute left-1 top-1 max-w-[95%] truncate rounded bg-white/85 px-1 text-[11px] font-medium leading-tight"
        style={{ color }}
      >
        {room.name?.trim() || `Unnamed ${room.type}`}
      </span>

      {photos.length > 0 && (
        <div className="pointer-events-none absolute bottom-1 left-1 flex gap-1">
          {photos.slice(0, 3).map((url) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={url}
              src={url}
              alt=""
              className="h-6 w-6 rounded object-cover ring-1 ring-white"
            />
          ))}
        </div>
      )}

      {selected &&
        HANDLES.map((dir) => (
          <div
            key={dir}
            className={`absolute h-2.5 w-2.5 rounded-sm border border-white bg-foreground ${HANDLE_STYLE[dir]}`}
            onPointerDown={(e) => begin(dir, e)}
            onPointerMove={move}
            onPointerUp={end}
          />
        ))}
    </div>
  )
}
