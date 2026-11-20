# Local OCR assets

MedVita self-hosts the OCR worker, WebAssembly core, PDF.js worker, and English trained data so uploaded medical documents and recognized text are processed in the user's browser. No document bytes are sent to an OCR or AI provider by this feature.

- Tesseract.js 7.0.0 worker and tesseract.js-core 7.0.0 runtime: Apache-2.0. See `TESSERACT-JS-LICENSE` and `core/LICENSE`.
- PDF.js 6.5.438 worker: Apache-2.0. See `PDFJS-LICENSE`.
- English trained data (4.0.0): Apache-2.0. See `lang/TESSDATA-LICENSE`. Source distribution: `https://tessdata.projectnaptha.com/4.0.0/eng.traineddata.gz`.

The English model is about 10.4 MB compressed and is downloaded on first OCR use. The browser may cache this static model and runtime assets. OCR text is saved only after an explicit user action and starts in a pending review state.
