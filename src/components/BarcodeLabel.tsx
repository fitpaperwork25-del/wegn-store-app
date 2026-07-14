import { useEffect, useRef } from "react";
import JsBarcode from "jsbarcode";

/** Default physical label size, in millimeters. */
export const BARCODE_LABEL_WIDTH_MM = 50;
export const BARCODE_LABEL_HEIGHT_MM = 30;

type BarcodeLabelProps = {
  productName: string;
  sku: string | null;
  sellingPrice: number;
  barcode: string;
  widthMm?: number;
  heightMm?: number;
};

/**
 * A single, self-contained Code128 barcode label: product name, machine-
 * readable barcode with its human-readable text baked in (JsBarcode's
 * displayValue), selling price, and SKU. Pure presentation - takes plain
 * props, owns no state beyond rendering the barcode into its own <svg>.
 * Reusable outside of a print context (e.g. an on-screen preview).
 */
export function BarcodeLabel({
  productName,
  sku,
  sellingPrice,
  barcode,
  widthMm = BARCODE_LABEL_WIDTH_MM,
  heightMm = BARCODE_LABEL_HEIGHT_MM,
}: BarcodeLabelProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;
    JsBarcode(svgRef.current, barcode, {
      format: "CODE128",
      displayValue: true,
      width: 1.4,
      height: 24,
      fontSize: 10,
      margin: 0,
      textMargin: 2,
    });
  }, [barcode]);

  return (
    <div
      className="barcode-label"
      style={{
        width: `${widthMm}mm`,
        height: `${heightMm}mm`,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        boxSizing: "border-box",
        padding: "1.5mm",
        overflow: "hidden",
        background: "#fff",
        color: "#000",
        fontFamily: "Arial, Helvetica, sans-serif",
      }}
    >
      <div
        style={{
          fontSize: "7pt",
          fontWeight: "bold",
          lineHeight: 1.1,
          maxWidth: "100%",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {productName}
      </div>
      <svg ref={svgRef} style={{ maxWidth: "100%" }} />
      <div style={{ fontSize: "7pt", fontWeight: "bold", marginTop: "0.5mm" }}>
        ${sellingPrice.toFixed(2)}
      </div>
      {sku && (
        <div style={{ fontSize: "5pt", color: "#555", marginTop: "0.3mm" }}>
          SKU: {sku}
        </div>
      )}
    </div>
  );
}
