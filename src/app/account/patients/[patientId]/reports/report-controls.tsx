"use client";

import { Printer } from "lucide-react";

export default function PrintReportButton() {
  return <button className="primary-button report-print-button" type="button" onClick={() => window.print()}><Printer size={16} /> Print or save as PDF</button>;
}
