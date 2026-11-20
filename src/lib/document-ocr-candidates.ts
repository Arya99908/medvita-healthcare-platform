export const documentOCRFieldDefinitions = [
  { name: "documentDate", label: "Document or test date" },
  { name: "patientDetails", label: "Patient details" },
  { name: "medicineNames", label: "Medicine names and strengths" },
  { name: "laboratoryValues", label: "Laboratory value lines" },
  { name: "referenceRanges", label: "Reference range lines" },
  { name: "doctorDetails", label: "Doctor details" },
  { name: "relevantFindings", label: "Findings or impression" },
] as const;

export type DocumentOCRCandidates = Record<(typeof documentOCRFieldDefinitions)[number]["name"], string>;

const maxLinesPerCandidate = 20;
const maxCharactersPerCandidate = 4_000;

function normalizeLine(line: string) {
  return line.replace(/\s+/g, " ").replace(/^[|\s:;•*-]+|[|\s]+$/g, "").trim();
}

function labelledValues(lines: string[], expression: RegExp) {
  const values: string[] = [];
  for (let index = 0; index < lines.length && values.length < maxLinesPerCandidate; index += 1) {
    const match = expression.exec(lines[index]);
    if (!match) continue;
    const sameLineValue = normalizeLine(match[1] ?? "");
    if (sameLineValue) {
      values.push(sameLineValue);
      continue;
    }
    const next = lines[index + 1] ?? "";
    if (next && !/^(?:---\s*page break\s*---|[A-Z][A-Z\s/&-]{3,}:?)$/i.test(next)) values.push(next);
  }
  return values;
}

function candidateText(values: string[]) {
  return [...new Set(values.map(normalizeLine).filter(Boolean))].join("\n").slice(0, maxCharactersPerCandidate);
}

export function parseDocumentOCRCandidates(rawText: string): DocumentOCRCandidates {
  const lines = rawText.split(/\r?\n/).map(normalizeLine).filter(Boolean);
  const dateValues = labelledValues(lines, /^(?:report date|document date|date of (?:report|test|service|visit)|test date|collection date|specimen date|visit date)\s*[:=\-]?\s*(.*)$/i);
  const patientValues = labelledValues(lines, /^(?:patient\s+(?:name|details|id|number|no\.?|mrn)|medical record (?:number|no\.?))\s*[:=\-]?\s*(.*)$/i);
  const medicineValues = labelledValues(lines, /^(?:medications?|medicines?|drugs?|prescriptions?|rx)(?:\s+(?:name|details))?\s*[:=\-]\s*(.*)$/i);
  const referenceValues = labelledValues(lines, /^(?:reference range|ref(?:erence)?\.? range|normal range|expected range)\s*[:=\-]?\s*(.*)$/i);
  const doctorValues = labelledValues(lines, /^(?:(?:(?:attending|referring|treating)\s+)?(?:doctor|physician|consultant)(?:\s+name)?|reported by)\s*[:=\-]?\s*(.*)$/i);
  const findingValues = labelledValues(lines, /^(?:relevant )?(?:findings?|impression|conclusion|summary)\s*[:=\-]?\s*(.*)$/i);

  const labValues = lines.filter((line) => !/(?:reference|normal|expected) range/i.test(line) && (
    /^(?:test(?:\s+result)?|lab(?:oratory)?\s+result|investigation)\s*[:=\-]/i.test(line)
    || /\b(?:ha?emoglobin|wbc|rbc|platelets?|glucose|creatinine|hba1c|tsh|cholesterol|sodium|potassium|bilirubin)\b/i.test(line)
    || /\b\d+(?:[.,]\d+)?\s*(?:mg\/?d?l|g\/?d?l|mmol\/?l|µ?mol\/?l|mcg\/?ml|ng\/?ml|u\/?l|iu\/?l|m?l\/?min|%)\b/i.test(line)),
  ).slice(0, maxLinesPerCandidate);

  return {
    documentDate: candidateText(dateValues),
    patientDetails: candidateText(patientValues),
    medicineNames: candidateText(medicineValues),
    laboratoryValues: candidateText(labValues),
    referenceRanges: candidateText(referenceValues),
    doctorDetails: candidateText(doctorValues),
    relevantFindings: candidateText(findingValues),
  };
}
