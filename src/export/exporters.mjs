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

const SMART_ABBREVIATIONS = {
  normal: [
    [/\bArmatura\b/gi, "Arm."],
    [/\bArmature\b/gi, "Arm."],
    [/\bEquipaggiamento\b/gi, "Equip."],
    [/\bCavalleria\b/gi, "Cav."],
    [/\bFanteria\b/gi, "Fant."],
    [/\bartigiano\b/gi, "artig."],
    [/\bmanualita\b/gi, "man."],
    [/\bfurtivita\b/gi, "furt."],
    [/\bsopravvivenza\b/gi, "sopravv."],
    [/\bstoria e leggende\b/gi, "storia/legg."],
    [/\barti arcane\b/gi, "arti arc."],
    [/\barti liberali\b/gi, "arti lib."],
    [/\baddestramento\b/gi, "addestr."],
    [/\bspirituale\b/gi, "spir."],
  ],
  aggressive: [
    [/\bda\b/gi, "d."],
    [/\bcon\b/gi, "c."],
    [/\bper\b/gi, "x"],
    [/\b e \b/gi, " & "],
    [/\bArm\./g, "A."],
    [/\bEquip\./g, "Eq."],
    [/\baddestr\./gi, "add."],
  ],
};

function applySmartAbbreviations(text, level = "normal") {
  let out = String(text ?? "");
  for (const [pattern, replacement] of SMART_ABBREVIATIONS.normal) out = out.replace(pattern, replacement);
  if (level === "aggressive") {
    for (const [pattern, replacement] of SMART_ABBREVIATIONS.aggressive) out = out.replace(pattern, replacement);
  }
  return out.replace(/\s{2,}/g, " ").trim();
}

function buildTextCandidates(text) {
  const base = String(text ?? "").trim();
  const normal = applySmartAbbreviations(base, "normal");
  const aggressive = applySmartAbbreviations(base, "aggressive");
  return Array.from(new Set([base, normal, aggressive])).filter(Boolean);
}

function wrapTextForPdf(text, maxLineLength, maxLines, { allowEllipsis = false } = {}) {
  const words = String(text).trim().split(/\s+/).filter(Boolean);
  if (!words.length) return { text: "", truncated: false };

  const lines = [];
  let truncated = false;
  let current = "";
  for (let i = 0; i < words.length; i += 1) {
    const word = words[i];
    const next = current ? `${current} ${word}` : word;
    if (next.length <= maxLineLength) {
      current = next;
      continue;
    }
    if (current) lines.push(current);
    current = word;
    if (lines.length >= maxLines - 1) {
      truncated = i < words.length - 1;
      break;
    }
  }

  if (lines.length < maxLines && current) lines.push(current);
  if (lines.length > maxLines) {
    lines.length = maxLines;
    truncated = true;
  }
  if (allowEllipsis && truncated && lines.length) {
    const lastIdx = lines.length - 1;
    const line = lines[lastIdx];
    lines[lastIdx] = line.length >= maxLineLength
      ? `${line.slice(0, Math.max(0, maxLineLength - 3)).trimEnd()}...`
      : `${line}...`;
  }
  return { text: lines.join("\n"), truncated };
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
  const text = String(value ?? "");
  const rule = MULTILINE_FIELD_RULES.find((r) => r.pattern.test(fieldName));
  if (!rule) {
    const sizeRule = FONT_SIZE_RULES.find((r) => r.pattern.test(fieldName));
    if (!sizeRule) return text;
    if (text.length < sizeRule.tinyAt) return text;
    const level = text.length >= sizeRule.tinyAt + 10 ? "aggressive" : "normal";
    return applySmartAbbreviations(text, level);
  }

  for (const candidate of buildTextCandidates(text)) {
    const wrapped = wrapTextForPdf(candidate, rule.maxLineLength, rule.maxLines);
    if (!wrapped.truncated) return wrapped.text;
  }

  const aggressive = applySmartAbbreviations(text, "aggressive");
  return wrapTextForPdf(aggressive, rule.maxLineLength, rule.maxLines, { allowEllipsis: true }).text;
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
