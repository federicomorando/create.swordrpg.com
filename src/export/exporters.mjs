import { stateToFoundryActor, stateToFoundryCharacterJSON } from "./foundry-adapter.mjs";
import { buildPdfPayload } from "../lib/pdf/pdf-mapper.mjs";

function downloadBlob(blob, filename) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

export function exportFoundryJSON(state) {
  const payload = stateToFoundryCharacterJSON(state);
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const safeName = (payload.name || "character").replace(/[^a-z0-9_\-]+/gi, "_");
  downloadBlob(blob, `${safeName}.foundry-character.json`);
}

export async function exportCharacterPDF(state) {
  const [{ PDFDocument, PDFHexString, PDFName }, mapResp, tplResp] = await Promise.all([
    import("../lib/pdf/vendor/pdf-lib.min.mjs"),
    fetch("./src/lib/pdf/pdf-field-map.json"),
    fetch("./src/assets/TdS-scheda-editabile.pdf")
  ]);

  if (!mapResp.ok) throw new Error(`Cannot load pdf-field-map.json (${mapResp.status})`);
  if (!tplResp.ok) throw new Error(`Cannot load TdS-scheda-editabile.pdf (${tplResp.status})`);

  const [fieldMap, templateBytes] = await Promise.all([mapResp.json(), tplResp.arrayBuffer()]);

  const actorData = stateToFoundryActor(state);
  const payload = buildPdfPayload(actorData, fieldMap);
  const pdfDoc = await PDFDocument.load(templateBytes);
  const form = pdfDoc.getForm();

  const acroForm = pdfDoc.catalog.lookup(PDFName.of("AcroForm"));
  acroForm.set(PDFName.of("NeedAppearances"), pdfDoc.context.obj(true));

  for (const [fieldName, value] of Object.entries(payload)) {
    if (value === "" || value == null) continue;
    try {
      const field = form.getTextField(fieldName);
      field.acroField.setValue(PDFHexString.fromText(String(value)));
      for (const widget of field.acroField.getWidgets()) widget.dict.delete(PDFName.of("AP"));
    } catch {
      // Ignore missing/unexpected form fields to preserve compatibility with map revisions.
    }
  }

  const pdfBytes = await pdfDoc.save();
  const safeName = (actorData.name || "character").replace(/[^a-z0-9_\-]+/gi, "_");
  const blob = new Blob([pdfBytes], { type: "application/pdf" });
  downloadBlob(blob, `${safeName}.pdf`);
}
