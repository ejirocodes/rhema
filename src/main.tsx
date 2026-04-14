import { StrictMode } from "react"
import { createRoot } from "react-dom/client"

import "./index.css"
import App from "./App.tsx"
import { ThemeProvider } from "@/components/theme-provider.tsx"
import { TooltipProvider } from "@/components/ui/tooltip.tsx"
import { hydrateBibleStore, initBiblePersistence } from "@/stores/bible-store"

async function boot() {
  await hydrateBibleStore()
  initBiblePersistence()

  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <App />
        </TooltipProvider>
      </ThemeProvider>
    </StrictMode>
  )
}

boot()
