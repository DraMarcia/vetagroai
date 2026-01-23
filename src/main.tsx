import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

import { ensureFreshDesktopBuild } from "@/lib/buildGuard";

// Best-effort cache-bust for desktop stale bundles (wrapped in IIFE for browser compat).
(async () => {
  await ensureFreshDesktopBuild();
  createRoot(document.getElementById("root")!).render(<App />);
})();
