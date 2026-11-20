import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import PrintReportButton from "./report-controls";

describe("patient report print control", () => {
  afterEach(() => vi.restoreAllMocks());

  it("opens the browser print dialog for saving the report as a PDF", () => {
    const print = vi.spyOn(window, "print").mockImplementation(() => undefined);
    render(<PrintReportButton />);
    fireEvent.click(screen.getByRole("button", { name: /print or save as pdf/i }));
    expect(print).toHaveBeenCalledOnce();
  });
});
