import { describe, expect, it } from "vitest";
import { parseDocumentOCRCandidates } from "./document-ocr-candidates";

describe("local OCR candidate-field extraction", () => {
  it("uses explicit labels for dates, patient details, medication and doctor names", () => {
    const result = parseDocumentOCRCandidates([
      "Report Date: 2026-10-14",
      "Date of Birth: 2000-01-02",
      "Patient Name: Fictional Patient",
      "Medication: Fictional sample drug 5 mg",
      "Doctor name: Dr. Fictional Example",
    ].join("\n"));

    expect(result.documentDate).toBe("2026-10-14");
    expect(result.patientDetails).toBe("Fictional Patient");
    expect(result.medicineNames).toBe("Fictional sample drug 5 mg");
    expect(result.doctorDetails).toBe("Dr. Fictional Example");
    expect(result.relevantFindings).toBe("");
  });

  it("collects labeled findings and reference lines plus recognizable lab-value lines", () => {
    const result = parseDocumentOCRCandidates([
      "Hemoglobin 13.2 g/dL",
      "Glucose: 98 mg/dL",
      "Reference range: 12-16 g/dL",
      "Findings: Fictional sample text only",
    ].join("\n"));

    expect(result.laboratoryValues).toBe("Hemoglobin 13.2 g/dL\nGlucose: 98 mg/dL");
    expect(result.referenceRanges).toBe("12-16 g/dL");
    expect(result.relevantFindings).toBe("Fictional sample text only");
  });

  it("does not guess unlabeled dates or details from unrelated text", () => {
    const result = parseDocumentOCRCandidates("Fictional Patient\n2026-10-14\nDr. Fictional Example\nA result may be mentioned here.");
    expect(Object.values(result).every((value) => value === "")).toBe(true);
  });

  it("limits the number of candidate lines and output size", () => {
    const lines = Array.from({ length: 30 }, (_, index) => `Glucose ${index} mg/dL`);
    const result = parseDocumentOCRCandidates(lines.join("\n"));
    expect(result.laboratoryValues.split("\n")).toHaveLength(20);
    expect(Object.values(result).every((value) => value.length <= 4_000)).toBe(true);
  });
});
