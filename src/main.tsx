import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "@fontsource/sora/400.css";
import "@fontsource/sora/600.css";
import "@fontsource/sora/700.css";
import "@fontsource/manrope/400.css";
import "@fontsource/manrope/500.css";
import "@fontsource/manrope/600.css";
import "@fontsource/manrope/700.css";

// Font Loading API — flag the document once webfonts are ready, or fallback gracefully
const docEl = document.documentElement;
const anyDoc = document as Document & { fonts?: { load: (s: string) => Promise<unknown> } };
if (anyDoc.fonts?.load) {
  Promise.all([anyDoc.fonts.load("400 1em Sora"), anyDoc.fonts.load("400 1em Manrope")])
    .then(() => docEl.classList.add("fonts-loaded"))
    .catch(() => docEl.classList.add("fonts-fallback"));
} else {
  docEl.classList.add("fonts-fallback");
}

createRoot(document.getElementById("root")!).render(<App />);
