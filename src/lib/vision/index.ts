import { MockVisionProvider } from "./mock"
import { OpenAIVisionProvider } from "./openai"
import type { VisionProvider } from "./types"

export type { VisionProvider, ParsedGraph, FloorPlanInput } from "./types"

// Selects the vision backend from VISION_PROVIDER. Defaults to the mock so the
// app runs with no API key. Swap by setting VISION_PROVIDER=openai.
export function getVisionProvider(): VisionProvider {
  switch (process.env.VISION_PROVIDER) {
    case "openai":
      return new OpenAIVisionProvider()
    default:
      return new MockVisionProvider()
  }
}
