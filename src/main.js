import { render } from "./render.js";
import { onAction, onChange, onImportFile } from "./events.js";

const app = document.getElementById("app");

app.addEventListener("click", (e) => {
  const el = e.target.closest("[data-action]");
  if (el) onAction({ currentTarget: el });
});

app.addEventListener("change", (e) => {
  const el = e.target.closest("[data-change]");
  if (el) {
    onChange({ currentTarget: el });
    return;
  }
  const importEl = e.target.closest("[data-import-file]");
  if (importEl) onImportFile({ currentTarget: importEl });
});

render();
