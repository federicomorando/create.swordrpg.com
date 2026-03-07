import { stateToFoundryActor, stateToFoundryCharacterJSON } from "./foundry-adapter.mjs";
import { buildPdfPayload } from "../lib/pdf/pdf-mapper.mjs";

const MULTILINE_FIELD_RULES = [
  { pattern: /^Equipaggiamento \d+[SD]$/i, maxLineLength: 18, maxLines: 2 },
  { pattern: /^Pregiarmi\d+$/i, maxLineLength: 20, maxLines: 2 },
  { pattern: /^Note armatura 1$/i, maxLineLength: 20, maxLines: 2 },
  { pattern: /^Note Armatura [23]$/i, maxLineLength: 20, maxLines: 2 },
  { pattern: /^Talenti\d+$/i, maxLineLength: 20, maxLines: 2 },
  { pattern: /^Tratti \d+$/i, maxLineLength: 20, maxLines: 2 },
  { pattern: /^Eventi \d+$/i, maxLineLength: 20, maxLines: 2 },
];

const FONT_SIZE_RULES = [
  { pattern: /^Equipaggiamento \d+[SD]$/i, normal: 9, small: 8, tiny: 7, smallAt: 24, tinyAt: 34 },
  { pattern: /^Pregiarmi\d+$/i, normal: 9, small: 8, tiny: 7, smallAt: 24, tinyAt: 34 },
  { pattern: /^Note armatura 1$/i, normal: 9, small: 8, tiny: 7, smallAt: 24, tinyAt: 34 },
  { pattern: /^Note Armatura [23]$/i, normal: 9, small: 8, tiny: 7, smallAt: 24, tinyAt: 34 },
  { pattern: /^Talenti\d+$/i, normal: 9, small: 8, tiny: 7, smallAt: 24, tinyAt: 34 },
  { pattern: /^Tratti \d+$/i, normal: 9, small: 8, tiny: 7, smallAt: 24, tinyAt: 34 },
  { pattern: /^Eventi \d+$/i, normal: 9, small: 8, tiny: 7, smallAt: 24, tinyAt: 34 },
  { pattern: /^Nome$/i, normal: 10, small: 9, tiny: 8, smallAt: 24, tinyAt: 34 },
];

function wrapTextForPdf(text, maxLineLength, maxLines) {
  const words = String(text).trim().split(/\s+/).filter(Boolean);
  if (!words.length) return "";

  const lines = [];
  let current = "";
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length <= maxLineLength) {
      current = next;
      continue;
    }
    if (current) lines.push(current);
    current = word;
    if (lines.length >= maxLines - 1) break;
  }

  if (lines.length < maxLines && current) lines.push(current);
  if (lines.length > maxLines) lines.length = maxLines;
  return lines.join("\n");
}

function choosePdfFontSize(fieldName, value) {
  const rule = FONT_SIZE_RULES.find((r) => r.pattern.test(fieldName));
  if (!rule) return null;
  const len = String(value ?? "").length;
  if (len >= rule.tinyAt) return rule.tiny;
  if (len >= rule.smallAt) return rule.small;
  return rule.normal;
}

function fitPdfTextByField(fieldName, value) {
  const rule = MULTILINE_FIELD_RULES.find((r) => r.pattern.test(fieldName));
  if (!rule) return String(value);
  return wrapTextForPdf(value, rule.maxLineLength, rule.maxLines);
}

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
      const fittedValue = fitPdfTextByField(fieldName, value);
      const targetFontSize = choosePdfFontSize(fieldName, fittedValue);

      if (MULTILINE_FIELD_RULES.some((r) => r.pattern.test(fieldName))) {
        try {
          field.enableMultiline();
        } catch {
          // Some fields may not accept multiline in the template definition.
        }
      }

      if (targetFontSize != null) {
        try {
          field.setFontSize(targetFontSize);
        } catch {
          // Keep template default if size cannot be overridden.
        }
      }

      field.acroField.setValue(PDFHexString.fromText(String(fittedValue)));
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
