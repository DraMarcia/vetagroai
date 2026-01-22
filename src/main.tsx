import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

import { ensureFreshDesktopBuild } from "@/lib/buildGuard";

// Best-effort cache-bust for desktop stale bundles.
await ensureFreshDesktopBuild();

createRoot(document.getElementById("root")!).render(<App />);
