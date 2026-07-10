import { create } from "zustand"

// Shared selection between the Catalogue panel and the PlanEditor so clicking a
// row highlights the object on the plan and vice-versa. Module-level singleton,
// so it survives the editor remounting after a revalidate.
type EditorState = {
  selectedId: string | null
  setSelectedId: (id: string | null) => void
}

export const useEditorStore = create<EditorState>((set) => ({
  selectedId: null,
  setSelectedId: (id) => set({ selectedId: id }),
}))
