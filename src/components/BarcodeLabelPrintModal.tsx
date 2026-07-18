import { BarcodeLabel, BARCODE_LABEL_WIDTH_MM, BARCODE_LABEL_HEIGHT_MM } from "./BarcodeLabel";

export type BarcodeLabelData = {
  productName: string;
  sku: string | null;
  sellingPrice: number;
  barcode: string;
};

type BarcodeLabelPrintModalProps = {
  label: BarcodeLabelData | null;
  /** Business Configuration (v1.2) - display only, never converts amounts. */
  currencySymbol: string;
  onClose: () => void;
};

/**
 * Print orchestration for a single BarcodeLabel: modal chrome, on-screen
 * preview, Print/Close actions, and the @media print rules that isolate the
 * label at its physical size when printed. Browser print only - no printer
 * SDK. Owns no barcode-rendering logic itself; that lives in BarcodeLabel.
 */
export function BarcodeLabelPrintModal({ label, currencySymbol, onClose }: BarcodeLabelPrintModalProps) {
  if (!label) return null;

  return (
    <>
      <style>{`
        @media print {
          @page { size: ${BARCODE_LABEL_WIDTH_MM}mm ${BARCODE_LABEL_HEIGHT_MM}mm; margin: 0; }
          html, body { margin: 0; padding: 0; }
          .app-root > * { display: none !important; }
          #barcode-label-modal {
            display: block !important;
            position: static !important;
            background: none !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          #barcode-label-print {
            box-shadow: none !important;
            margin: 0 !important;
            padding: 0 !important;
            border: none !important;
          }
          #barcode-label-actions { display: none !important; }
        }
      `}</style>
      <div
        id="barcode-label-modal"
        style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1400,
        }}
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <div
          id="barcode-label-print"
          style={{
            background: "#fff", padding: "16px", borderRadius: "8px",
            boxShadow: "0 4px 24px rgba(0,0,0,0.2)",
            display: "flex", flexDirection: "column", alignItems: "center", gap: "16px",
          }}
        >
          <div style={{ border: "1px dashed #cbd5e1" }}>
            <BarcodeLabel
              productName={label.productName}
              sku={label.sku}
              sellingPrice={label.sellingPrice}
              barcode={label.barcode}
              currencySymbol={currencySymbol}
            />
          </div>
          <div id="barcode-label-actions" style={{ display: "flex", gap: "8px" }}>
            <button onClick={() => window.print()} style={{ padding: "8px 20px", cursor: "pointer", fontWeight: "bold" }}>
              Print
            </button>
            <button onClick={onClose} style={{ padding: "8px 20px", cursor: "pointer" }}>
              Close
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
