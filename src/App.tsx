import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { supabase } from "./supabase";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { SettingsTab } from "./components/SettingsTab";
import { CustomersTab } from "./components/CustomersTab";
import { ProductResolutionDialog } from "./components/ProductResolutionDialog";
import { ReceiptPrintModal } from "./components/ReceiptPrintModal";
import { POPrintModal } from "./components/POPrintModal";
import { PurchasingTab } from "./components/PurchasingTab";
import { InventoryTab } from "./components/InventoryTab";
import { Dashboard } from "./components/Dashboard";
import { SalesAnalyticsReport } from "./components/SalesAnalyticsReport";
import { InventoryReportsPanel } from "./components/InventoryReportsPanel";
import type { ProductStock, Category } from "./lib/product/types";
import { buildProductIndex, filterProducts, getLowStockProducts, getCategoryChips } from "./lib/product/productHelpers";
import { getSalesTodaySummary } from "./lib/sales/salesHelpers";
import { getPurchasingDashboardSummary } from "./lib/purchasing/purchasingHelpers";
import { getCustomersDashboardSummary } from "./lib/customers/customersHelpers";
import { getInventoryDashboardSummary } from "./lib/inventory/inventoryHelpers";

export type Transaction = {
  id: string;
  created_at: string;
  transaction_type: string;
  quantity_change: number;
  quantity_before: number;
  quantity_after: number;
  product_id: string;
  products: { name: string } | null;
};

export type Supplier = {
  id: string;
  name: string;
  contact_name: string | null;
  phone: string | null;
  email: string | null;
  notes: string | null;
  status: string;
  created_at: string;
};

export type PurchaseOrder = {
  id: string;
  supplier_id: string;
  po_number: string;
  status: string;
  subtotal: number;
  notes: string | null;
  created_at: string;
};

export type POItem = {
  id: string;
  purchase_order_id: string;
  product_id: string;
  quantity: number;
  quantity_received: number;
  unit_cost: number;
  line_total: number;
  created_at: string;
  receive_notes: string | null;
};

export type ReceiptItem = {
  product_id: string;
  quantity: number;
  unit_price: number;
  line_total: number;
};

export type Receipt = {
  sale: Sale;
  items: ReceiptItem[];
  paymentMethod: string;
  paymentReference?: string;
  pointsEarned?: number;
  pointsRedeemed?: number;
};

export type ProductResolutionRequest = {
  barcode?: string;
  description?: string;
  suggestedCost?: number;
  suggestedQuantity?: number;   // invoice line qty — shown as context, not initial stock
  suggestedSupplierId?: string; // pre-select supplier
  onResolved: (productId: string) => Promise<void>;
  onSkipped: () => void;
};

export type SaleItemRecord = {
  sale_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  line_total: number;
};

export type AnalyticsData = {
  revenue: number;
  txCount: number;
  avgTx: number;
  itemsSold: number;
  discounts: number;
  taxCollected: number;
  cashTotal: number;
  cardTotal: number;
  otherTotal: number;
  dailyRows: [string, { revenue: number; count: number }][];
  productRows: { name: string; units: number; revenue: number; product_id: string }[];
  rangeLabel: string;
};

type EodItem = {
  sale_id: string;
  product_id: string;
  quantity: number;
  line_total: number;
};

export type EodPayment = {
  sale_id: string;
  payment_method: string;
  amount: number;
  reference?: string | null;
  payment_type?: string;
};

type CartItem = {
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  line_total: number;
  original_unit_price: number;
  negotiation_reason: string | null;
  negotiated_by: string | null;
};

export type Sale = {
  id: string;
  cashier_id: string | null;
  customer_id: string | null;
  subtotal: number;
  tax: number;
  discount_amount: number;
  total: number;
  status: string;
  created_at: string;
};

export type Customer = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  status: string;
  created_at: string;
};

type ReturnLineItem = {
  product_id: string;
  product_name: string;
  original_qty: number;
  unit_price: number;
  already_returned: number;
  available_qty: number;
  return_qty: number;
};

export type ReturnRecord = {
  id: string;
  sale_id: string;
  product_id: string;
  quantity_returned: number;
  reason: string | null;
  return_number: string | null;
  return_reason: string | null;
  notes: string | null;
  processed_by: string | null;
  created_at: string;
};

export type StockCountLine = {
  product_id: string;
  inventory_id: string;
  business_id: string;
  product_name: string;
  sku: string | null;
  barcode: string | null;
  system_qty: number;
  counted_qty: number;
};

export type StockCountRecord = {
  id: string;
  business_id: string;
  status: string;
  notes: string | null;
  completed_at: string;
  created_at: string;
};

export type StockCountItemDetail = {
  id: string;
  product_id: string;
  system_qty: number;
  counted_qty: number;
  variance: number;
  products: { name: string; sku: string | null } | null;
};

export type DrawerSession = {
  id: string;
  business_id: string;
  cashier_id: string | null;
  status: string;
  opening_float: number;
  opened_at: string;
  closed_at: string | null;
  closing_count: number | null;
  expected_cash: number | null;
  over_short: number | null;
  notes: string | null;
  created_at: string;
};

type DrawerPaidOut = {
  id: string;
  drawer_session_id: string;
  amount: number;
  reason: string | null;
  created_at: string;
};

export type LoyaltyTransaction = {
  id: string;
  customer_id: string;
  sale_id: string | null;
  points: number;
  type: string;
  created_at: string;
};

export type Employee = {
  id: string;
  business_id: string;
  name: string;
  role: string;
  status: string;
  pin: string | null;
  created_at: string;
};

export type BulkRow = {
  name: string;
  selling_price: string;
  sku: string;
  barcode: string;
  cost_price: string;
  reorder_level: string;
  initial_stock: string;
  status: 'valid' | 'missing_name' | 'missing_price' | 'invalid_price' | 'duplicate_barcode';
};

export type InventoryBatch = {
  id: string;
  business_id: string;
  product_id: string;
  receiving_session_id: string | null;
  receiving_session_item_id: string | null;
  supplier_id: string | null;
  supplier_name: string | null;
  batch_number: string | null;
  lot_number: string | null;
  manufactured_date: string | null;
  expiration_date: string | null;
  quantity_received: number;
  quantity_remaining: number;
  unit_cost: number | null;
  status: string;
  created_at: string;
  product_name?: string;
};

type AppProps = {
  userId: string;
  userEmail: string;
  onSignOut: () => void;
};

function App({ userId, userEmail: _userEmail, onSignOut }: AppProps) {
  const [products, setProducts] = useState<ProductStock[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [poStatusFilter, setPoStatusFilter] = useState<"all" | "draft" | "ordered" | "partially_received" | "received" | "cancelled">("all");
  const [showAllPOs, setShowAllPOs] = useState(false);
  const [selectedPoId, setSelectedPoId] = useState("");
  const [poItems, setPoItems] = useState<POItem[]>([]);
  const [itemProductId, setItemProductId] = useState("");
  const [itemQuantity, setItemQuantity] = useState("");
  const [itemUnitCost, setItemUnitCost] = useState("");
  const [receivingPoId, setReceivingPoId] = useState("");
  const [receivingItems, setReceivingItems] = useState<POItem[]>([]);
  const [receiveQtys, setReceiveQtys] = useState<Record<string, string>>({});
  const [receiveUnitCosts, setReceiveUnitCosts] = useState<Record<string, string>>({});
  const [receiveDamagedQtys, setReceiveDamagedQtys] = useState<Record<string, string>>({});
  const [receiveExpiredQtys, setReceiveExpiredQtys] = useState<Record<string, string>>({});
  const [receiveRejectedQtys, setReceiveRejectedQtys] = useState<Record<string, string>>({});
  const [receiveLineNotes, setReceiveLineNotes] = useState<Record<string, string>>({});
  const [isConfirmingReceive, setIsConfirmingReceive] = useState(false);
  const [poSupplierId, setPoSupplierId] = useState("");
  const [poNotes, setPoNotes] = useState("");
  const [poMoreOpen, setPoMoreOpen] = useState<string | null>(null);
  const [supName, setSupName] = useState("");
  const [supContact, setSupContact] = useState("");
  const [supPhone, setSupPhone] = useState("");
  const [supEmail, setSupEmail] = useState("");
  const [supNotes, setSupNotes] = useState("");
  const [businessId, setBusinessId] = useState("");
  const [businessLoaded, setBusinessLoaded] = useState(false);
  const [businessError, setBusinessError] = useState("");
  const [selectedProductId, setSelectedProductId] = useState("");
  const [receiveQuantity, setReceiveQuantity] = useState("");
  const [rapidReceiveInput, setRapidReceiveInput] = useState("");
  const [rapidReceiveItems, setRapidReceiveItems] = useState<{ product_id: string; product_name: string; barcode: string; quantity: number }[]>([]);
  const [rapidReceiveExceptions, setRapidReceiveExceptions] = useState<{ barcode: string; reason: string }[]>([]);
  const [isPostingRapidReceive, setIsPostingRapidReceive] = useState(false);
  const [activeReceivingSession, setActiveReceivingSession] = useState<{ id: string; business_id: string; supplier_id: string | null; received_by: string | null; status: string; notes: string | null; created_at: string; invoice_number?: string | null; supplier_name?: string | null } | null>(null);
  const [sessionItems, setSessionItems] = useState<{ id: string; product_id: string; quantity_received: number; unit_cost: number }[]>([]);
  const [sessionScanInput, setSessionScanInput] = useState("");
  // ── Unified Product Resolution dialog ──
  const [productResolution, setProductResolution] = useState<ProductResolutionRequest | null>(null);
  const [productResolutionMode, setProductResolutionMode] = useState<"link" | "create" | null>(null);
  const [productResolutionLinkId, setProductResolutionLinkId] = useState("");
  const [productResolutionNewName, setProductResolutionNewName] = useState("");
  const [productResolutionNewCost, setProductResolutionNewCost] = useState("");
  const [productResolutionNewSelling, setProductResolutionNewSelling] = useState("");
  const [productResolutionCategoryId, setProductResolutionCategoryId] = useState("");
  const [productResolutionSupplierId, setProductResolutionSupplierId] = useState("");
  const [isSavingProductResolution, setIsSavingProductResolution] = useState(false);
  const sessionScanRef = useRef<HTMLInputElement>(null);
  const [lastScannedProduct, setLastScannedProduct] = useState<{ name: string; qty: number } | null>(null);
  const [highlightedProductId, setHighlightedProductId] = useState<string | null>(null);
  const lastScannedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const highlightTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [newSessionSupplierId, setNewSessionSupplierId] = useState("");
  const [newSessionNotes, setNewSessionNotes] = useState("");
  const [isStartingSession, setIsStartingSession] = useState(false);
  const [smartReceiveSimpleOpen, setSmartReceiveSimpleOpen] = useState(false);
  const [smartReceiveFile, setSmartReceiveFile] = useState<File | null>(null);
  const [smartReceiveProcessing, setSmartReceiveProcessing] = useState(false);
  const [smartReceiveLoading, setSmartReceiveLoading] = useState(false);
  const [smartReceiveResult, setSmartReceiveResult] = useState<{ supplier: string; invoiceNumber: string; invoiceDate: string; items: { description: string; quantity: number; unitCost: number; batchNumber?: string | null; expirationDate?: string | null }[]; freight: number; additionalCost: number; invoiceTotal: number } | null>(null);
  // per-item match: product_id | "" (unresolved)
  const [smartReceiveMatches, setSmartReceiveMatches] = useState<string[]>([]);
  // supplier resolution: "" = not linked, a UUID = linked supplier_id
  const [smartReceiveLinkedSupplierId, setSmartReceiveLinkedSupplierId] = useState<string>("");
  const [isCreatingSmartSupplier, setIsCreatingSmartSupplier] = useState(false);
  const [showSmartSupplierOverridePicker, setShowSmartSupplierOverridePicker] = useState(false);
  const [showSmartSupplierAdvanced, setShowSmartSupplierAdvanced] = useState(false);
  // index of item currently getting a new product created for it
  const [smartReceivePendingIdx, setSmartReceivePendingIdx] = useState<number | null>(null);
  const [smartReceiveNewName, setSmartReceiveNewName] = useState("");
  const [smartReceiveNewSelling, setSmartReceiveNewSelling] = useState("");
  const [smartReceiveNewCost, setSmartReceiveNewCost] = useState("");
  const [isSavingSmartProduct, setIsSavingSmartProduct] = useState(false);
  const [isCreatingSmartSession, setIsCreatingSmartSession] = useState(false);
  const [smartReceiveDuplicateWarning, setSmartReceiveDuplicateWarning] = useState<{
    existingSessionId: string;
    existingStatus: string;
    invoiceNumber: string;
  } | null>(null);
  const [isPostingSession, setIsPostingSession] = useState(false);
  const [sessionHistory, setSessionHistory] = useState<{ id: string; status: string; supplier_id: string | null; supplier_name: string | null; created_at: string; received_date: string; notes: string | null; invoice_number: string | null; invoice_date: string | null; invoice_total: number; freight_cost: number; additional_cost: number; invoice_status: string; calculated_total: number; variance_amount: number; approved_by: string | null; approved_at: string | null; approval_note: string | null }[]>([]);
  const [invoicePanelSessionId, setInvoicePanelSessionId] = useState<string | null>(null);
  const [editInvoiceNumber, setEditInvoiceNumber] = useState("");
  const [editInvoiceDate, setEditInvoiceDate] = useState("");
  const [editInvoiceTotal, setEditInvoiceTotal] = useState("");
  const [editFreightCost, setEditFreightCost] = useState("");
  const [editAdditionalCost, setEditAdditionalCost] = useState("");
  const [isSavingInvoice, setIsSavingInvoice] = useState(false);
  const [sessionHistoryItems, setSessionHistoryItems] = useState<Record<string, { id: string; product_id: string; quantity_received: number; unit_cost: number; total_cost: number | null }[]>>({});
  const [expandedHistorySessionId, setExpandedHistorySessionId] = useState<string | null>(null);
  const [historyExpanded, setHistoryExpanded] = useState(false);
  const [historyHasMore, setHistoryHasMore] = useState(false);
  const [isLoadingMoreHistory, setIsLoadingMoreHistory] = useState(false);
  const [statementSupplierId, setStatementSupplierId] = useState<string | null>(null);
  const [supplierStatement, setSupplierStatement] = useState<{ session_id: string; invoice_number: string; invoice_date: string | null; invoice_total: number; paid: number }[]>([]);
  const [isLoadingStatement, setIsLoadingStatement] = useState(false);
  const [sessionPayments, setSessionPayments] = useState<Record<string, { id: string; amount: number; payment_date: string; payment_method: string; reference: string | null; notes: string | null }[]>>({});
  const [paymentPanelSessionId, setPaymentPanelSessionId] = useState<string | null>(null);
  const [editPaymentDate, setEditPaymentDate] = useState("");
  const [editPaymentAmount, setEditPaymentAmount] = useState("");
  const [editPaymentMethod, setEditPaymentMethod] = useState("cash");
  const [editPaymentReference, setEditPaymentReference] = useState("");
  const [editPaymentNotes, setEditPaymentNotes] = useState("");
  const [isSavingPayment, setIsSavingPayment] = useState(false);
  const [resolvingSupplierSessionId, setResolvingSupplierSessionId] = useState<string | null>(null);
  const [resolveSupplierPickId, setResolveSupplierPickId] = useState("");
  const [resolveNewSupplierName, setResolveNewSupplierName] = useState("");
  const [resolveMode, setResolveMode] = useState<"pick" | "create" | "nolinkconfirm">("pick");
  const [isResolvingSupplier, setIsResolvingSupplier] = useState(false);
  const [noLinkAcknowledgedSessions, setNoLinkAcknowledgedSessions] = useState<Set<string>>(new Set());
  // Expiration / batch tracking
  const [batches, setBatches] = useState<InventoryBatch[]>([]);
  const [isLoadingBatches, setIsLoadingBatches] = useState(false);
  const [sessionItemBatch, setSessionItemBatch] = useState<Record<string, { batch_number: string; lot_number: string; manufactured_date: string; expiration_date: string }>>({});
  const [smartReceiveItemBatch, setSmartReceiveItemBatch] = useState<{ batch_number: string; lot_number: string; manufactured_date: string; expiration_date: string }[]>([]);
  const [writeOffBatchId, setWriteOffBatchId] = useState<string | null>(null);
  const [writeOffQty, setWriteOffQty] = useState("");
  const [isWritingOffBatch, setIsWritingOffBatch] = useState(false);
  const [needsOrderingSelected, setNeedsOrderingSelected] = useState<Set<string>>(new Set());
  const [needsOrderingQtys, setNeedsOrderingQtys] = useState<Record<string, number>>({});
  const [adjustProductId, setAdjustProductId] = useState("");
  const [adjustType, setAdjustType] = useState("damaged");
  const [adjustQuantity, setAdjustQuantity] = useState("");
  const [adjustReason, setAdjustReason] = useState("");
  const [adjustNotes, setAdjustNotes] = useState("");
  // Add Product modal — reused by Smart Receive for pre-filled creation
  const [addProductModalOpen, setAddProductModalOpen] = useState(false);
  const [addProductModalCallback, setAddProductModalCallback] = useState<((productId: string) => Promise<void>) | null>(null);
  const [newName, setNewName] = useState("");
  const [newSku, setNewSku] = useState("");
  const [newBarcode, setNewBarcode] = useState("");
  const [barcodeAutoFill, setBarcodeAutoFill] = useState("");
  const [unmatchedBarcode, setUnmatchedBarcode] = useState("");
  const [linkBarcodeMode, setLinkBarcodeMode] = useState(false);
  const [linkBarcodeProductId, setLinkBarcodeProductId] = useState("");
  const [newCostPrice, setNewCostPrice] = useState("");
  const [newSellingPrice, setNewSellingPrice] = useState("");
  const [newReorderLevel, setNewReorderLevel] = useState("");
  const [newInitialStock, setNewInitialStock] = useState("");
  const [newOverhead, setNewOverhead] = useState("");
  const [newTargetMargin, setNewTargetMargin] = useState("");
  const [newMinMargin, setNewMinMargin] = useState("");
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [movementFilter, setMovementFilter] = useState("all");
  const [txDateRange, setTxDateRange] = useState<'today' | '7d' | '30d' | 'all'>('30d');
  const [txHistoryOpen, setTxHistoryOpen] = useState(false);
  const [productsTableOpen, setProductsTableOpen] = useState(false);
  const [salesHistoryOpen, setSalesHistoryOpen] = useState(false);
  const [poReportOpen, setPoReportOpen] = useState(false);
  const [returnHistoryOpen, setReturnHistoryOpen] = useState(false);
  const [supplierListOpen, setSupplierListOpen] = useState<boolean | null>(null);
  const [poListOpen, setPoListOpen] = useState<boolean | null>(null);
  const [customerListOpen, setCustomerListOpen] = useState<boolean | null>(null);
  const [employeeListOpen, setEmployeeListOpen] = useState<boolean | null>(null);
  const [stockCountHistoryOpen, setStockCountHistoryOpen] = useState<boolean | null>(null);
  const [invValuationOpen, setInvValuationOpen] = useState<boolean | null>(null);
  const [lowStockReportOpen, setLowStockReportOpen] = useState<boolean | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [negotiatingProductId, setNegotiatingProductId] = useState<string | null>(null);
  const [negotiatePrice, setNegotiatePrice] = useState("");
  const [negotiateReason, setNegotiateReason] = useState("");
  const [barcodeInput, setBarcodeInput] = useState("");
  const [cartProductId, setCartProductId] = useState("");
  const [cartQty, setCartQty] = useState("1");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [paymentRef, setPaymentRef] = useState("");
  const [amountTendered, setAmountTendered] = useState("");
  const [posDiscountType, setPosDiscountType] = useState<"percent" | "fixed">("percent");
  const [posDiscountValue, setPosDiscountValue] = useState("");
  const [sales, setSales] = useState<Sale[]>([]);
  const [voidingId, setVoidingId] = useState("");
  const [isCompletingSale, setIsCompletingSale] = useState(false);
  const [reorderSuppliers, setReorderSuppliers] = useState<Record<string, string>>({});
  const [reorderQtys, setReorderQtys] = useState<Record<string, string>>({});
  const [reorderSelected, setReorderSelected] = useState<Set<string>>(new Set());
  const [reorderFilter, setReorderFilter] = useState<"all" | "missing" | "ready">("all");
  const [bulkSupplierId, setBulkSupplierId] = useState("");
  const [collapsedSuppliers, setCollapsedSuppliers] = useState<Set<string>>(new Set());
  const [saleItems, setSaleItems] = useState<SaleItemRecord[]>([]);
  const [showEod, setShowEod] = useState(false);
  const [eodItems, setEodItems] = useState<EodItem[]>([]);
  const [eodPayments, setEodPayments] = useState<EodPayment[]>([]);
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [printPo, setPrintPo] = useState<{ po: PurchaseOrder; items: POItem[]; supplier: Supplier | null } | null>(null);
  const [signPoId, setSignPoId] = useState<string | null>(null);
  const [signRole, setSignRole] = useState<"manager" | "supplier">("manager");
  const sigCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const sigDrawingRef = useRef(false);

  function getPoSignatures(poId: string): { manager?: { dataUrl: string; signedAt: string }; supplier?: { dataUrl: string; signedAt: string } } {
    try { return JSON.parse(localStorage.getItem(`po-sig-${poId}`) || "{}"); } catch { return {}; }
  }
  function savePoSignature(poId: string, role: "manager" | "supplier", dataUrl: string) {
    const sigs = getPoSignatures(poId);
    sigs[role] = { dataUrl, signedAt: new Date().toISOString() };
    localStorage.setItem(`po-sig-${poId}`, JSON.stringify(sigs));
  }
  function clearPoSignature(poId: string, role: "manager" | "supplier") {
    const sigs = getPoSignatures(poId);
    delete sigs[role];
    localStorage.setItem(`po-sig-${poId}`, JSON.stringify(sigs));
  }

  function getPrefQty(productId: string): number | null {
    try { const v = localStorage.getItem(`pref-qty-${productId}`); return v ? Number(v) : null; } catch { return null; }
  }
  function savePrefQty(productId: string, qty: number) {
    localStorage.setItem(`pref-qty-${productId}`, String(qty));
  }

  function getPoEmailLog(poId: string): { lastEmailedAt: string; count: number } | null {
    try { const v = localStorage.getItem(`po-email-${poId}`); return v ? JSON.parse(v) : null; } catch { return null; }
  }
  function savePoEmailLog(poId: string) {
    const prev = getPoEmailLog(poId);
    localStorage.setItem(`po-email-${poId}`, JSON.stringify({ lastEmailedAt: new Date().toISOString(), count: (prev?.count ?? 0) + 1 }));
  }

  async function handleEmailPO(po: PurchaseOrder) {
    const supplier = suppliers.find(s => s.id === po.supplier_id);
    if (!supplier?.email) { setMessage({ text: "Supplier email not configured.", type: "error" }); return; }

    const { data, error } = await supabase
      .from("purchase_order_items")
      .select("id, purchase_order_id, product_id, quantity, quantity_received, unit_cost, line_total, created_at")
      .eq("purchase_order_id", po.id)
      .order("created_at", { ascending: true });
    if (error || !data) { console.error(error); setMessage({ text: "Failed to load PO items", type: "error" }); return; }

    setPrintPo({ po, items: data as POItem[], supplier });

    setTimeout(async () => {
      const el = document.getElementById("po-print-content");
      if (!el) { setMessage({ text: "Failed to render PO", type: "error" }); return; }

      const actionsEl = document.getElementById("po-print-actions");
      if (actionsEl) actionsEl.style.display = "none";

      const canvas = await html2canvas(el, { scale: 2, useCORS: true, backgroundColor: "#fff" });

      if (actionsEl) actionsEl.style.display = "";

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "letter");
      const pdfW = pdf.internal.pageSize.getWidth();
      const pdfH = (canvas.height * pdfW) / canvas.width;
      pdf.addImage(imgData, "PNG", 0, 0, pdfW, Math.min(pdfH, pdf.internal.pageSize.getHeight()));
      pdf.save(`${po.po_number}.pdf`);

      const subject = encodeURIComponent(`Purchase Order ${po.po_number}`);
      const body = encodeURIComponent(
        `Hello ${supplier.name},\n\nPlease find attached Purchase Order ${po.po_number}.\n\nPlease review and confirm receipt.\n\nThank you,\n${businessName || "Management"}`
      );
      window.open(`mailto:${supplier.email}?subject=${subject}&body=${body}`, "_self");

      savePoEmailLog(po.id);
      setMessage({ text: `PDF downloaded and email draft opened for ${po.po_number}`, type: "success" });
      setPrintPo(null);
    }, 800);
  }

  const initSigCanvas = useCallback((canvas: HTMLCanvasElement | null) => {
    sigCanvasRef.current = canvas;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "#0f172a";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    const getPos = (e: MouseEvent | TouchEvent) => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      if ("touches" in e) {
        return { x: (e.touches[0].clientX - rect.left) * scaleX, y: (e.touches[0].clientY - rect.top) * scaleY };
      }
      return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
    };

    const down = (e: MouseEvent | TouchEvent) => { e.preventDefault(); sigDrawingRef.current = true; const p = getPos(e); ctx.beginPath(); ctx.moveTo(p.x, p.y); };
    const move = (e: MouseEvent | TouchEvent) => { if (!sigDrawingRef.current) return; e.preventDefault(); const p = getPos(e); ctx.lineTo(p.x, p.y); ctx.stroke(); };
    const up = () => { sigDrawingRef.current = false; };

    canvas.addEventListener("mousedown", down);
    canvas.addEventListener("mousemove", move);
    canvas.addEventListener("mouseup", up);
    canvas.addEventListener("mouseleave", up);
    canvas.addEventListener("touchstart", down, { passive: false });
    canvas.addEventListener("touchmove", move, { passive: false });
    canvas.addEventListener("touchend", up);
  }, []);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [posCustomerPhone, setPosCustomerPhone] = useState("");
  const [posCustomerId, setPosCustomerId] = useState<string | null>(null);
  const [posCustomerName, setPosCustomerName] = useState("");
  const [newCusName, setNewCusName] = useState("");
  const [newCusPhone, setNewCusPhone] = useState("");
  const [newCusEmail, setNewCusEmail] = useState("");
  const [expandedCustomerId, setExpandedCustomerId] = useState<string | null>(null);
  const [editingCustomerId, setEditingCustomerId] = useState<string | null>(null);
  const [editCusName, setEditCusName] = useState("");
  const [editCusPhone, setEditCusPhone] = useState("");
  const [editCusEmail, setEditCusEmail] = useState("");
  const [returningSaleId, setReturningSaleId] = useState<string | null>(null);
  const [returnLines, setReturnLines] = useState<ReturnLineItem[]>([]);
  const [returnReason, setReturnReason] = useState("");
  const [returnReasonDropdown, setReturnReasonDropdown] = useState("");
  const [returnNotes, setReturnNotes] = useState("");
  const [returnHistory, setReturnHistory] = useState<ReturnRecord[]>([]);
  const [expandedReturnSaleId, setExpandedReturnSaleId] = useState<string | null>(null);
  const [returnLoading, setReturnLoading] = useState(false);
  const [stockCountLines, setStockCountLines] = useState<StockCountLine[]>([]);
  const [stockCountActive, setStockCountActive] = useState(false);
  const [stockCountLoading, setStockCountLoading] = useState(false);
  const [stockCounts, setStockCounts] = useState<StockCountRecord[]>([]);
  const [expandedCountId, setExpandedCountId] = useState<string | null>(null);
  const [countItemsMap, setCountItemsMap] = useState<Record<string, StockCountItemDetail[]>>({});
  const [drawerSession, setDrawerSession] = useState<DrawerSession | null>(null);
  const [drawerPaidOuts, setDrawerPaidOuts] = useState<DrawerPaidOut[]>([]);
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [posDrawerCloseOpen, setPosDrawerCloseOpen] = useState(false);
  const [openingFloat, setOpeningFloat] = useState("");
  const [paidOutAmount, setPaidOutAmount] = useState("");
  const [paidOutReason, setPaidOutReason] = useState("");
  const [closingCount, setClosingCount] = useState("");
  const [loyaltyTransactions, setLoyaltyTransactions] = useState<LoyaltyTransaction[]>([]);
  const [posRedeemPoints, setPosRedeemPoints] = useState("");
  const [analyticsRange, setAnalyticsRange] = useState<'today' | '7d' | '30d' | 'all'>('7d');
  const [allReturnItems, setAllReturnItems] = useState<{ sale_id: string; product_id: string; quantity_returned: number }[]>([]);
  const [allPoItems, setAllPoItems] = useState<POItem[]>([]);
  const [allPayments, setAllPayments] = useState<EodPayment[]>([]);
  const [editingSupplierId, setEditingSupplierId] = useState<string | null>(null);
  const [editSupName, setEditSupName] = useState("");
  const [editSupContact, setEditSupContact] = useState("");
  const [editSupPhone, setEditSupPhone] = useState("");
  const [editSupEmail, setEditSupEmail] = useState("");
  const [editSupNotes, setEditSupNotes] = useState("");
  const [bulkPreview, setBulkPreview] = useState<BulkRow[]>([]);
  const [bulkResults, setBulkResults] = useState<{ imported: number; skipped: number; failed: number } | null>(null);
  const [bulkImporting, setBulkImporting] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [activeCashierId, setActiveCashierId] = useState<string | null>(null);
  const [activeCashierName, setActiveCashierName] = useState("");
  const [newEmpName, setNewEmpName] = useState("");
  const [newEmpPin, setNewEmpPin] = useState("");
  const [newEmpRole, setNewEmpRole] = useState<"cashier" | "manager" | "inventory_clerk">("cashier");
  const [staffSession, setStaffSession] = useState<{ id: string; name: string; role: string } | null>(null);
  const [ownerBypass, setOwnerBypass] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState("");
  const [editingEmpId, setEditingEmpId] = useState<string | null>(null);
  const [editEmpRole, setEditEmpRole] = useState("");
  const [salesCashierFilter, setSalesCashierFilter] = useState<string>("all");
  const [salesSearchQuery, setSalesSearchQuery] = useState("");
  const [salesDateRange, setSalesDateRange] = useState<'today' | '7d' | '30d' | 'all'>('30d');
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [editProdName, setEditProdName] = useState("");
  const [editProdSku, setEditProdSku] = useState("");
  const [editProdBarcode, setEditProdBarcode] = useState("");
  const [editProdPrice, setEditProdPrice] = useState("");
  const [editProdReorder, setEditProdReorder] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCatName, setNewCatName] = useState("");
  const [newCatDesc, setNewCatDesc] = useState("");
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editCatName, setEditCatName] = useState("");
  const [editCatDesc, setEditCatDesc] = useState("");
  const [newProductCategory, setNewProductCategory] = useState("");
  const [editProdCategory, setEditProdCategory] = useState("");
  const [editProdOverhead, setEditProdOverhead] = useState("");
  const [editProdTargetMargin, setEditProdTargetMargin] = useState("");
  const [editProdMinMargin, setEditProdMinMargin] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [productSearch, setProductSearch] = useState("");
  const [debouncedProductSearch, setDebouncedProductSearch] = useState("");
  const productSearchRef = useRef<HTMLInputElement>(null);
  const [businessName, setBusinessName] = useState("");
  const [businessPhone, setBusinessPhone] = useState("");
  const [businessEmail, setBusinessEmail] = useState("");
  const [businessAddress, setBusinessAddress] = useState("");
  const [businessTaxRate, setBusinessTaxRate] = useState(0);
  const [sellingPolicy, setSellingPolicy] = useState<"fixed_pricing" | "negotiated_pricing" | "negotiated_with_approval">("fixed_pricing");
  const [editingBusiness, setEditingBusiness] = useState(false);
  const [editBizName, setEditBizName] = useState("");
  const [editBizPhone, setEditBizPhone] = useState("");
  const [editBizEmail, setEditBizEmail] = useState("");
  const [editBizAddress, setEditBizAddress] = useState("");
  const [editBizTaxRate, setEditBizTaxRate] = useState("");
  const [editBizSellingPolicy, setEditBizSellingPolicy] = useState("fixed_pricing");

  const userRole = staffSession ? staffSession.role : "owner";
  const isOwnerOrManager = userRole === "owner" || userRole === "manager";
  const canDeactivateProducts = isOwnerOrManager;
  const canAdjustInventory = isOwnerOrManager;
  const canEditProducts = isOwnerOrManager;
  const canAddProducts = isOwnerOrManager;
  const canManageCategories = isOwnerOrManager;
  const canBulkImport = isOwnerOrManager;
  const canManageStaff = userRole === "owner";
  const canVoidSales = isOwnerOrManager;

  // Deep-linking: on first load, open whichever tab a ?module= query
  // param requests (used by Platform Admin's Navigation Framework to
  // link directly into a specific module). An invalid or
  // not-yet-authorized value is handled by the existing "Access
  // Restricted" guard below (allowedTabs.includes(activeTab)) — no new
  // validation needed here. Purely additive — normal in-app tab
  // switching is unaffected.
  const [activeTab, setActiveTab] = useState<string>(() => (
    new URLSearchParams(window.location.search).get('module') || 'pos'
  ));
  const [navOpen, setNavOpen] = useState(false);

  const hasStaffPins = employees.some(e => e.pin && e.status === "active");
  const appUnlocked = !hasStaffPins || staffSession !== null || ownerBypass;

  const tabAccess: Record<string, string[]> = {
    owner: ['dashboard', 'pos', 'inventory', 'purchasing', 'customers', 'employees', 'reports', 'settings'],
    manager: ['dashboard', 'pos', 'inventory', 'purchasing', 'customers', 'reports', 'settings'],
    cashier: ['dashboard', 'pos', 'customers'],
    inventory_clerk: ['dashboard', 'inventory', 'purchasing'],
  };
  const allowedTabs = tabAccess[userRole] ?? tabAccess.owner;

  // Keep the URL's ?module= param in sync with the active tab, so each
  // module has a real, shareable, reloadable URL.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('module') !== activeTab) {
      params.set('module', activeTab);
      window.history.replaceState(null, '', `${window.location.pathname}?${params.toString()}`);
    }
  }, [activeTab]);

  useEffect(() => {
    loadBusiness();
    loadProducts();
    loadTransactions();
    loadSuppliers();
    loadPurchaseOrders();
    loadSales();
    loadSaleItems();
    loadAllPayments();
    loadCustomers();
    loadLoyaltyTransactions();
    loadAllReturnItems();
    loadReturnHistory();
    loadAllPoItems();
    loadCategories();
    loadDrawerSession();
    loadEmployees();
    loadStockCounts();
    loadBatches();
  }, []);

  // businessId is set asynchronously by loadBusiness(); these two loaders guard
  // on it being non-empty, so they must re-run once it is available.
  useEffect(() => {
    if (!businessId) return;
    loadActiveReceivingSession();
    loadSessionHistory();
  }, [businessId]);

  useEffect(() => { loadTransactions(); }, [txDateRange]);
  useEffect(() => { loadSales(); }, [salesDateRange]);
  useEffect(() => {
    const t = setTimeout(() => setDebouncedProductSearch(productSearch), 150);
    return () => clearTimeout(t);
  }, [productSearch]);

  useEffect(() => {
    if (cart.length === 0) return;
    const handler = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ""; };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [cart.length]);

  const fmtPhone = (p: string) => { const d = p.replace(/\D/g, ""); return d.length === 10 ? `(${d.slice(0,3)}) ${d.slice(3,6)}-${d.slice(6)}` : p; };

  // Derived from allPayments + sales so it stays current after every sale/void/return.
  // Filters to completed sales only (excludes voided/returned) scoped to current drawer session.
  const drawerCashSales = useMemo(() => {
    if (!drawerSession) return 0;
    const openedAt = new Date(drawerSession.opened_at);
    const validIds = new Set(
      sales
        .filter(s => s.status === 'completed' && new Date(s.created_at) >= openedAt)
        .map(s => s.id)
    );
    const cashIn = allPayments
      .filter(p => p.payment_method === 'cash' && p.payment_type !== 'refund' && validIds.has(p.sale_id))
      .reduce((sum, p) => sum + Number(p.amount), 0);
    const cashRefunds = allPayments
      .filter(p => p.payment_method === 'cash' && p.payment_type === 'refund' && validIds.has(p.sale_id))
      .reduce((sum, p) => sum + Number(p.amount), 0);
    return cashIn - cashRefunds;
  }, [drawerSession, sales, allPayments]);

  const supplierMap = useMemo(() => Object.fromEntries(suppliers.map(s => [s.id, s])) as Record<string, Supplier>, [suppliers]);
  const categoryMap = useMemo(() => Object.fromEntries(categories.map(c => [c.id, c])) as Record<string, Category>, [categories]);

  // AI Smart Reorder — velocity-based demand forecast from in-memory sales history.
  // No API calls; re-derives whenever sales, saleItems, or products change.
  const aiReorderRecs = useMemo((): Record<string, { qty: number; sold7: number; sold30: number; hasData: boolean }> => {
    const now = Date.now();
    const ms7 = 7 * 86_400_000;
    const ms30 = 30 * 86_400_000;
    const saleIds7 = new Set(
      sales.filter(s => s.status === "completed" && now - new Date(s.created_at).getTime() <= ms7).map(s => s.id)
    );
    const saleIds30 = new Set(
      sales.filter(s => s.status === "completed" && now - new Date(s.created_at).getTime() <= ms30).map(s => s.id)
    );
    const sold7: Record<string, number> = {};
    const sold30: Record<string, number> = {};
    for (const si of saleItems) {
      if (saleIds7.has(si.sale_id)) sold7[si.product_id] = (sold7[si.product_id] ?? 0) + si.quantity;
      if (saleIds30.has(si.sale_id)) sold30[si.product_id] = (sold30[si.product_id] ?? 0) + si.quantity;
    }

    const result: Record<string, { qty: number; sold7: number; sold30: number; hasData: boolean }> = {};
    for (const p of products) {
      const s7 = sold7[p.product_id] ?? 0;
      const s30 = sold30[p.product_id] ?? 0;
      const hasData = s30 > 0;
      if (!hasData) { result[p.product_id] = { qty: 0, sold7: s7, sold30: s30, hasData: false }; continue; }
      // Prefer 7-day velocity when available; fall back to 30-day average
      const velocity = s7 > 0 ? s7 / 7 : s30 / 30;
      // Target: 30 days of forward cover above the reorder level
      const targetStock = Math.ceil(velocity * 30) + (p.reorder_level ?? 0);
      const qty = Math.max(1, Math.ceil(targetStock - p.quantity_on_hand));
      result[p.product_id] = { qty, sold7: s7, sold30: s30, hasData: true };
    }
    return result;
  }, [sales, saleItems, products]);
  const employeeMap = useMemo(() => Object.fromEntries(employees.map(e => [e.id, e])) as Record<string, Employee>, [employees]);

  const supplierPOMap = useMemo(() => {
    const map: Record<string, PurchaseOrder[]> = {};
    for (const po of purchaseOrders) {
      if (!map[po.supplier_id]) map[po.supplier_id] = [];
      map[po.supplier_id].push(po);
    }
    return map;
  }, [purchaseOrders]);

  const poItemsByPoId = useMemo(() => {
    const map = new Map<string, POItem[]>();
    for (const item of allPoItems) {
      if (!map.has(item.purchase_order_id)) map.set(item.purchase_order_id, []);
      map.get(item.purchase_order_id)!.push(item);
    }
    return map;
  }, [allPoItems]);

  const lowStockProducts = useMemo(() => getLowStockProducts(products), [products]);

  const filteredProducts = useMemo(
    () => filterProducts(products, categoryFilter, debouncedProductSearch),
    [products, categoryFilter, debouncedProductSearch]
  );

  const categoryChips = useMemo(() => getCategoryChips(products, categories), [products, categories]);

  const recentSales = useMemo(() =>
    [...sales]
      .filter(s => s.status === 'completed')
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5),
    [sales]
  );

  // O(1) lookup maps — used across Sales History, Analytics, and Dashboard IIFEs.
  const customerMap = useMemo(
    () => Object.fromEntries(customers.map(c => [c.id, c])) as Record<string, Customer>,
    [customers]
  );
  const productIdMap = useMemo(() => buildProductIndex(products), [products]);
  const saleItemsBySaleId = useMemo((): Record<string, SaleItemRecord[]> => {
    const m: Record<string, SaleItemRecord[]> = {};
    for (const si of saleItems) {
      if (!m[si.sale_id]) m[si.sale_id] = [];
      m[si.sale_id].push(si);
    }
    return m;
  }, [saleItems]);

  // POS loyalty balance — replaces 3 inline O(n) scans of loyaltyTransactions in POS tab.
  const posCustomerLoyaltyBalance = useMemo(() => {
    if (!posCustomerId) return 0;
    return loyaltyTransactions
      .filter(lt => lt.customer_id === posCustomerId)
      .reduce((s, lt) => s + lt.points, 0);
  }, [loyaltyTransactions, posCustomerId]);

  // Sales History filter — replaces O(n×m) inline filter+search in the Sales History table.
  const filteredSalesHistory = useMemo(() =>
    sales.filter(s => {
      if (s.status === 'open') return false;
      if (salesCashierFilter !== "all") {
        if (salesCashierFilter === "none" && s.cashier_id) return false;
        if (salesCashierFilter !== "none" && s.cashier_id !== salesCashierFilter) return false;
      }
      if (!salesSearchQuery.trim()) return true;
      const q = salesSearchQuery.toLowerCase();
      if (s.id.toLowerCase().includes(q)) return true;
      const customer = customerMap[s.customer_id ?? ""];
      if (customer) {
        if ((customer.name ?? "").toLowerCase().includes(q)) return true;
        if ((customer.phone ?? "").toLowerCase().includes(q)) return true;
      }
      const lineItems = saleItemsBySaleId[s.id] ?? [];
      return lineItems.some(si => {
        const p = productIdMap[si.product_id];
        if (!p) return false;
        if (p.product_name.toLowerCase().includes(q)) return true;
        if (p.barcode && p.barcode.toLowerCase().includes(q)) return true;
        return false;
      });
    }),
    [sales, salesCashierFilter, salesSearchQuery, customerMap, saleItemsBySaleId, productIdMap]
  );

  // Analytics data — replaces the full computation IIFE that ran on every render.
  const analyticsData = useMemo((): AnalyticsData => {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const rangeStart: Date | null =
      analyticsRange === 'today' ? startOfDay :
      analyticsRange === '7d'   ? new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) :
      analyticsRange === '30d'  ? new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) :
      null;
    const periodSales = sales.filter(s =>
      s.status === 'completed' &&
      (rangeStart === null || new Date(s.created_at) >= rangeStart)
    );
    const periodSaleIds = new Set(periodSales.map(s => s.id));
    const periodItems = saleItems.filter(si => periodSaleIds.has(si.sale_id));
    const periodPayments = allPayments.filter(p => periodSaleIds.has(p.sale_id));
    const revenue = periodSales.reduce((sum, s) => sum + Number(s.total), 0);
    const txCount = periodSales.length;
    const avgTx = txCount > 0 ? revenue / txCount : 0;
    const itemsSold = periodItems.reduce((sum, i) => sum + i.quantity, 0);
    const discounts = periodSales.reduce((sum, s) => sum + Number(s.discount_amount), 0);
    const taxCollected = periodSales.reduce((sum, s) => sum + Number(s.tax), 0);
    const periodSaleP = periodPayments.filter(p => p.payment_type !== 'refund');
    const periodRefundP = periodPayments.filter(p => p.payment_type === 'refund');
    const cashTotal =
      periodSaleP.filter(p => p.payment_method === 'cash').reduce((sum, p) => sum + Number(p.amount), 0) -
      periodRefundP.filter(p => p.payment_method === 'cash').reduce((sum, p) => sum + Number(p.amount), 0);
    const cardTotal =
      periodSaleP.filter(p => p.payment_method === 'card').reduce((sum, p) => sum + Number(p.amount), 0) -
      periodRefundP.filter(p => p.payment_method === 'card').reduce((sum, p) => sum + Number(p.amount), 0);
    const otherTotal =
      periodSaleP.filter(p => p.payment_method !== 'cash' && p.payment_method !== 'card').reduce((sum, p) => sum + Number(p.amount), 0) -
      periodRefundP.filter(p => p.payment_method !== 'cash' && p.payment_method !== 'card').reduce((sum, p) => sum + Number(p.amount), 0);
    const byDay: Record<string, { revenue: number; count: number }> = {};
    for (const s of periodSales) {
      const d = new Date(s.created_at);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      if (!byDay[key]) byDay[key] = { revenue: 0, count: 0 };
      byDay[key].revenue += Number(s.total);
      byDay[key].count += 1;
    }
    const dailyRows = Object.entries(byDay).sort((a, b) => b[0].localeCompare(a[0]));
    const byProduct: Record<string, { name: string; units: number; revenue: number }> = {};
    for (const si of periodItems) {
      if (!byProduct[si.product_id]) {
        byProduct[si.product_id] = { name: productIdMap[si.product_id]?.product_name ?? si.product_id, units: 0, revenue: 0 };
      }
      byProduct[si.product_id].units += si.quantity;
      byProduct[si.product_id].revenue += si.line_total;
    }
    const productRows = Object.entries(byProduct)
      .map(([pid, row]) => ({ ...row, product_id: pid }))
      .sort((a, b) => b.units - a.units);
    const rangeLabel =
      analyticsRange === 'today' ? 'Today' :
      analyticsRange === '7d'   ? 'Last 7 Days' :
      analyticsRange === '30d'  ? 'Last 30 Days' : 'All Time';
    return { revenue, txCount, avgTx, itemsSold, discounts, taxCollected, cashTotal, cardTotal, otherTotal, dailyRows, productRows, rangeLabel };
  }, [sales, saleItems, allPayments, productIdMap, analyticsRange]);

  // Dashboard derived values — one memo per owning domain (Sales, Purchasing,
  // Customers, Inventory), each backed by a pure helper in lib/<domain>/.
  // Replaces the single wide-dependency dashboardData memo.
  const salesTodaySummary = useMemo(
    () => getSalesTodaySummary(sales, saleItems, allPayments, products, productIdMap),
    [sales, saleItems, allPayments, products, productIdMap]
  );
  const purchasingDashboardSummary = useMemo(
    () => getPurchasingDashboardSummary(purchaseOrders),
    [purchaseOrders]
  );
  const customersDashboardSummary = useMemo(
    () => getCustomersDashboardSummary(customers, loyaltyTransactions),
    [customers, loyaltyTransactions]
  );
  const inventoryDashboardSummary = useMemo(
    () => getInventoryDashboardSummary(lowStockProducts),
    [lowStockProducts]
  );

  async function loadBusiness() {
    const { data, error } = await supabase
      .from("businesses")
      .select("id, name, phone, email, address, tax_rate, selling_policy")
      .eq("owner_id", userId)
      .limit(1)
      .maybeSingle();
    if (error) {
      console.error("loadBusiness error:", error);
      setBusinessError(error.message);
      setBusinessLoaded(true);
      return;
    }
    if (data) {
      setBusinessId(data.id);
      setBusinessName(data.name ?? "");
      setBusinessPhone(data.phone ?? "");
      setBusinessEmail(data.email ?? "");
      setBusinessAddress(data.address ?? "");
      setBusinessTaxRate(Number(data.tax_rate ?? 0));
      setSellingPolicy(data.selling_policy ?? "fixed_pricing");
      setBusinessError("");
    }
    setBusinessLoaded(true);
  }

  function handlePinLogin() {
    const pin = pinInput.trim();
    if (!pin) return;
    const emp = employees.find(e => e.pin === pin && e.status === "active");
    if (!emp) { setPinError("Invalid PIN or inactive account"); return; }
    setStaffSession({ id: emp.id, name: emp.name, role: emp.role });
    setActiveCashierId(emp.id);
    setActiveCashierName(emp.name);
    setPinInput("");
    setPinError("");
    const tabs = tabAccess[emp.role] ?? tabAccess.owner;
    setActiveTab(tabs[0]);
  }

  function handleStaffLogout() {
    setStaffSession(null);
    setOwnerBypass(false);
    setPinInput("");
    setPinError("");
    setActiveCashierId(null);
    setActiveCashierName("");
    setActiveTab("dashboard");
  }

  async function handleCreateBusiness(e: React.FormEvent) {
    e.preventDefault();
    const name = editBizName.trim();
    if (!name) return;
    const { error } = await supabase.from("businesses").insert({
      owner_id: userId,
      name,
      phone: editBizPhone.trim() || null,
      email: editBizEmail.trim() || null,
      address: editBizAddress.trim() || null,
      tax_rate: Math.min(100, Math.max(0, parseFloat(editBizTaxRate) || 0)),
    });
    if (error) { console.error(error); setMessage({ text: "Failed to create business: " + error.message, type: "error" }); return; }
    setEditBizName("");
    setEditBizPhone("");
    setEditBizEmail("");
    setEditBizAddress("");
    setEditBizTaxRate("");
    setMessage({ text: "Business created", type: "success" });
    await loadBusiness();
  }

  async function handleSaveBusiness(e: React.FormEvent) {
    e.preventDefault();
    if (!editBizName.trim() || !businessId) return;
    const parsedTaxRate = Math.min(100, Math.max(0, parseFloat(editBizTaxRate) || 0));
    const updatePayload: Record<string, unknown> = {
      name: editBizName.trim(),
      phone: editBizPhone.trim() || null,
      email: editBizEmail.trim() || null,
      address: editBizAddress.trim() || null,
      tax_rate: parsedTaxRate,
    };
    if (userRole === "owner") {
      updatePayload.selling_policy = editBizSellingPolicy;
    }
    const { error } = await supabase
      .from("businesses")
      .update(updatePayload)
      .eq("id", businessId);
    if (error) { console.error(error); setMessage({ text: "Failed to update business: " + error.message, type: "error" }); return; }
    setEditingBusiness(false);
    setMessage({ text: "Business profile updated", type: "success" });
    await loadBusiness();
  }

  async function loadSaleItems() {
    const cutoff = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString();
    const { data, error } = await supabase
      .from("sale_items")
      .select("sale_id, product_id, quantity, unit_price, line_total")
      .gte("created_at", cutoff);
    if (error) { console.error(error); return; }
    setSaleItems((data as SaleItemRecord[]) || []);
  }

  async function handleOpenReturn(sale: Sale) {
    if (returningSaleId === sale.id) { setReturningSaleId(null); setReturnLines([]); return; }
    const productMap = Object.fromEntries(products.map(p => [p.product_id, p.product_name]));
    const { data: items, error: itemsErr } = await supabase
      .from('sale_items')
      .select('product_id, quantity, unit_price')
      .eq('sale_id', sale.id);
    if (itemsErr || !items) { console.error(itemsErr); return; }
    const { data: prior } = await supabase
      .from('return_items')
      .select('product_id, quantity_returned')
      .eq('sale_id', sale.id);
    const priorMap: Record<string, number> = {};
    (prior ?? []).forEach((r: any) => { priorMap[r.product_id] = (priorMap[r.product_id] ?? 0) + r.quantity_returned; });
    const lines: ReturnLineItem[] = items
      .map((i: any) => ({
        product_id: i.product_id,
        product_name: productMap[i.product_id] ?? i.product_id,
        original_qty: i.quantity,
        unit_price: i.unit_price ?? 0,
        already_returned: priorMap[i.product_id] ?? 0,
        available_qty: i.quantity - (priorMap[i.product_id] ?? 0),
        return_qty: 0,
      }))
      .filter(l => l.available_qty > 0);
    setReturnLines(lines);
    setReturnReason("");
    setReturnReasonDropdown("");
    setReturnNotes("");
    setReturningSaleId(sale.id);
  }

  async function handleConfirmReturn() {
    if (!returningSaleId) return;
    if (!returnReasonDropdown) { setMessage({ text: "Please select a return reason", type: "error" }); return; }
    const toReturn = returnLines.filter(l => l.return_qty > 0);
    if (toReturn.length === 0) return;
    setReturnLoading(true);
    const retNum = nextReturnNumber();
    const reasonText = returnReasonDropdown === "Other" ? (returnReason || "Other") : returnReasonDropdown;
    const processedBy = staffSession ? staffSession.id : null;
    for (const line of toReturn) {
      const product = products.find(p => p.product_id === line.product_id);
      if (!product) continue;
      await supabase.from('return_items').insert({
        business_id: businessId,
        sale_id: returningSaleId,
        product_id: line.product_id,
        quantity_returned: line.return_qty,
        reason: reasonText,
        return_number: retNum,
        return_reason: returnReasonDropdown,
        notes: returnNotes || null,
        processed_by: processedBy,
      });
      const newQty = product.quantity_on_hand + line.return_qty;
      await supabase.from('inventory').update({ quantity_on_hand: newQty }).eq('id', product.inventory_id);
      await supabase.from('inventory_transactions').insert({
        business_id: product.business_id,
        product_id: line.product_id,
        transaction_type: 'return',
        quantity_change: line.return_qty,
        quantity_before: product.quantity_on_hand,
        quantity_after: newQty,
        reason: `Return for sale ${returningSaleId.slice(0, 8)}${returnReason ? ': ' + returnReason : ''}`,
      });
    }
    const refundAmount = toReturn.reduce((sum, line) => sum + line.return_qty * line.unit_price, 0);
    if (refundAmount > 0) {
      const originalPayment = allPayments.find(p => p.sale_id === returningSaleId && p.payment_type !== 'refund');
      await supabase.from('payments').insert({
        business_id: businessId,
        sale_id: returningSaleId,
        payment_method: originalPayment?.payment_method ?? 'cash',
        amount: refundAmount,
        payment_type: 'refund',
        reference: retNum,
      });
    }
    // Mark fully returned when every returnable line has been exhausted
    const allFullyReturned = returnLines.every(l => (l.already_returned + l.return_qty) >= l.original_qty);
    if (allFullyReturned) {
      await supabase.from('sales').update({ status: 'returned' }).eq('id', returningSaleId);
    }

    // Loyalty reversal — reverse earned points once per sale, prevent duplicate
    const returnedSale = sales.find(s => s.id === returningSaleId);
    if (returnedSale?.customer_id) {
      const alreadyReversed = loyaltyTransactions.some(
        lt => lt.sale_id === returningSaleId && lt.type === 'earn' && lt.points < 0
      );
      if (!alreadyReversed) {
        const totalEarned = loyaltyTransactions
          .filter(lt => lt.sale_id === returningSaleId && lt.type === 'earn' && lt.points > 0)
          .reduce((sum, lt) => sum + lt.points, 0);
        if (totalEarned > 0) {
          await supabase.from('loyalty_transactions').insert({
            business_id: businessId,
            customer_id: returnedSale.customer_id,
            sale_id: returningSaleId,
            points: -totalEarned,
            type: 'earn',
          });
        }
      }
    }

    setReturningSaleId(null);
    setReturnLines([]);
    setReturnReason("");
    setReturnReasonDropdown("");
    setReturnNotes("");
    setReturnLoading(false);
    setMessage({ text: `Return ${retNum} processed`, type: "success" });
    await loadProducts();
    await loadTransactions();
    await loadSales();
    await loadLoyaltyTransactions();
    await loadAllPayments();
    await loadAllReturnItems();
    await loadReturnHistory();
  }

  function handleStartCount() {
    const lines: StockCountLine[] = products.map(p => ({
      product_id: p.product_id,
      inventory_id: p.inventory_id,
      business_id: p.business_id,
      product_name: p.product_name,
      sku: p.sku,
      barcode: p.barcode,
      system_qty: p.quantity_on_hand,
      counted_qty: p.quantity_on_hand,
    }));
    setStockCountLines(lines);
    setStockCountActive(true);
  }

  async function handleConfirmCount() {
    if (stockCountLines.length === 0) return;
    setStockCountLoading(true);
    const bid = stockCountLines[0].business_id;
    const { data: sc, error: scErr } = await supabase.from('stock_counts').insert({
      business_id: bid,
      status: 'completed',
      notes: `Stock take on ${new Date().toLocaleString()}`,
      completed_at: new Date().toISOString(),
    }).select('id').single();
    if (scErr || !sc) {
      setMessage({ text: 'Failed to save stock count: ' + scErr?.message, type: "error" });
      setStockCountLoading(false);
      return;
    }
    let varianceCount = 0;
    for (const line of stockCountLines) {
      const variance = line.counted_qty - line.system_qty;
      await supabase.from('stock_count_items').insert({
        business_id: businessId,
        stock_count_id: sc.id,
        product_id: line.product_id,
        system_qty: line.system_qty,
        counted_qty: line.counted_qty,
        variance,
      });
      if (variance !== 0) {
        varianceCount++;
        await supabase.from('inventory').update({ quantity_on_hand: line.counted_qty }).eq('id', line.inventory_id);
        await supabase.from('inventory_transactions').insert({
          business_id: line.business_id,
          product_id: line.product_id,
          transaction_type: 'correction',
          quantity_change: variance,
          quantity_before: line.system_qty,
          quantity_after: line.counted_qty,
          reason: `Stock take count adjustment (count #${sc.id.slice(0, 8)})`,
        });
      }
    }
    setStockCountActive(false);
    setStockCountLines([]);
    setStockCountLoading(false);
    setMessage({ text: `Stock count completed — ${varianceCount} variance(s) corrected.`, type: "success" });
    await loadProducts();
    await loadTransactions();
    await loadStockCounts();
  }

  async function loadStockCounts() {
    const { data } = await supabase
      .from("stock_counts")
      .select("id, business_id, status, notes, completed_at, created_at")
      .order("completed_at", { ascending: false });
    if (data) setStockCounts(data);
  }

  async function loadCountItems(countId: string) {
    if (countItemsMap[countId]) return;
    const { data } = await supabase
      .from("stock_count_items")
      .select("id, product_id, system_qty, counted_qty, variance, products(name, sku)")
      .eq("stock_count_id", countId)
      .order("created_at", { ascending: true });
    if (data) setCountItemsMap(prev => ({ ...prev, [countId]: data as unknown as StockCountItemDetail[] }));
  }

  async function loadDrawerSession() {
    const { data } = await supabase
      .from('drawer_sessions')
      .select('*')
      .eq('status', 'open')
      .limit(1)
      .maybeSingle();
    setDrawerSession(data ?? null);
    if (data) {
      const { data: pos } = await supabase
        .from('drawer_paid_outs')
        .select('*')
        .eq('drawer_session_id', data.id)
        .order('created_at', { ascending: false });
      setDrawerPaidOuts((pos as DrawerPaidOut[]) ?? []);
    } else {
      setDrawerPaidOuts([]);
    }
  }

  async function handleOpenDrawer(e: React.FormEvent) {
    e.preventDefault();
    const float = Number(openingFloat);
    if (isNaN(float) || float < 0 || !businessId) return;
    setDrawerLoading(true);
    const { data, error } = await supabase
      .from('drawer_sessions')
      .insert({ business_id: businessId, opening_float: float, status: 'open', opened_at: new Date().toISOString(), cashier_id: activeCashierId || null })
      .select('*')
      .single();
    if (error) { setMessage({ text: 'Failed to open drawer: ' + error.message, type: "error" }); setDrawerLoading(false); return; }
    setDrawerSession(data as DrawerSession);
    setDrawerPaidOuts([]);
    setOpeningFloat('');
    setPosDrawerCloseOpen(false);
    setDrawerLoading(false);
    setMessage({ text: 'Cash drawer opened', type: "success" });
  }

  async function handlePaidOut(e: React.FormEvent) {
    e.preventDefault();
    if (!drawerSession) return;
    const amount = Number(paidOutAmount);
    if (isNaN(amount) || amount <= 0) return;
    setDrawerLoading(true);
    const { error } = await supabase
      .from('drawer_paid_outs')
      .insert({ business_id: businessId, drawer_session_id: drawerSession.id, amount, reason: paidOutReason || null });
    if (error) { setMessage({ text: 'Paid out failed: ' + error.message, type: "error" }); setDrawerLoading(false); return; }
    setPaidOutAmount('');
    setPaidOutReason('');
    setDrawerLoading(false);
    setMessage({ text: 'Paid out recorded', type: "success" });
    const { data: pos } = await supabase
      .from('drawer_paid_outs').select('*')
      .eq('drawer_session_id', drawerSession.id)
      .order('created_at', { ascending: false });
    setDrawerPaidOuts((pos as DrawerPaidOut[]) ?? []);
  }

  async function handleCloseDrawer(e: React.FormEvent) {
    e.preventDefault();
    if (!drawerSession) return;
    const counted = Number(closingCount);
    if (isNaN(counted) || counted < 0) return;
    setDrawerLoading(true);
    const totalPaidOuts = drawerPaidOuts.reduce((sum, p) => sum + Number(p.amount), 0);
    const expectedCash = Number(drawerSession.opening_float) + drawerCashSales - totalPaidOuts;
    const overShort = counted - expectedCash;
    const { error } = await supabase
      .from('drawer_sessions')
      .update({ status: 'closed', closed_at: new Date().toISOString(), closing_count: counted, expected_cash: expectedCash, over_short: overShort })
      .eq('id', drawerSession.id);
    if (error) { setMessage({ text: 'Failed to close drawer: ' + error.message, type: "error" }); setDrawerLoading(false); return; }
    setDrawerSession(null);
    setDrawerPaidOuts([]);
    setClosingCount('');
    setDrawerLoading(false);
    const sign = overShort >= 0 ? 'Over' : 'Short';
    setMessage({ text: `Drawer closed — Expected: $${expectedCash.toFixed(2)} | Counted: $${counted.toFixed(2)} | ${sign}: $${Math.abs(overShort).toFixed(2)}`, type: "success" });
  }

  function downloadCsvTemplate() {
    const headers = 'name,selling_price,sku,barcode,cost_price,reorder_level,initial_stock';
    const example = 'Example Product,2.99,SKU-001,123456789,1.50,10,50';
    const blob = new Blob([headers + '\n' + example], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'product_import_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleCsvUpload(e: React.ChangeEvent<HTMLInputElement>) {
    setBulkPreview([]);
    setBulkResults(null);
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = (evt.target?.result as string) ?? '';
      const lines = text.split('\n').map(l => l.replace(/\r/g, '').trim()).filter(l => l.length > 0);
      if (lines.length < 2) return;
      const headers = lines[0].toLowerCase().split(',').map(h => h.trim());
      const idx = (name: string) => headers.indexOf(name);
      const existingBarcodes = new Set(products.map(p => p.barcode).filter(Boolean));
      const rows: BulkRow[] = lines.slice(1).map(line => {
        const cells = line.split(',').map(c => c.trim());
        const get = (col: string) => cells[idx(col)] ?? '';
        const name = get('name');
        const selling_price = get('selling_price');
        const barcode = get('barcode');
        let status: BulkRow['status'] = 'valid';
        if (!name) status = 'missing_name';
        else if (!selling_price) status = 'missing_price';
        else if (isNaN(Number(selling_price)) || Number(selling_price) <= 0) status = 'invalid_price';
        else if (barcode && existingBarcodes.has(barcode)) status = 'duplicate_barcode';
        return {
          name, selling_price,
          sku: get('sku'),
          barcode,
          cost_price: get('cost_price'),
          reorder_level: get('reorder_level'),
          initial_stock: get('initial_stock'),
          status,
        };
      });
      setBulkPreview(rows);
    };
    reader.readAsText(file);
  }

  async function handleBulkImport() {
    const validRows = bulkPreview.filter(r => r.status === 'valid');
    if (validRows.length === 0) return;
    setBulkImporting(true);
    let imported = 0, skipped = 0, failed = 0;
    for (const row of bulkPreview) {
      if (row.status !== 'valid') { skipped++; continue; }
      const initialStock = Number(row.initial_stock) || 0;
      const costPrice = Number(row.cost_price) || null;
      const { data: prod, error: prodErr } = await supabase.from('products').insert({
        business_id: businessId,
        name: row.name,
        sku: row.sku || null,
        barcode: row.barcode || null,
        cost_price: costPrice,
        selling_price: Number(row.selling_price),
        reorder_level: Number(row.reorder_level) || 10,
        average_cost: costPrice ?? 0,
        status: 'active',
      }).select('id').single();
      if (prodErr || !prod) { failed++; continue; }
      const { error: invErr } = await supabase.from('inventory').insert({
        business_id: businessId,
        product_id: prod.id,
        quantity_on_hand: initialStock,
      });
      if (invErr) { failed++; continue; }
      if (initialStock > 0) {
        await supabase.from('inventory_transactions').insert({
          business_id: businessId,
          product_id: prod.id,
          transaction_type: 'receiving',
          quantity_change: initialStock,
          quantity_before: 0,
          quantity_after: initialStock,
          reason: 'Bulk import initial stock',
        });
      }
      imported++;
    }
    setBulkResults({ imported, skipped, failed });
    setBulkImporting(false);
    setBulkPreview([]);
    await loadProducts();
  }

  async function loadCustomers() {
    const { data, error } = await supabase
      .from("customers")
      .select("id, name, phone, email, status, created_at")
      .order("created_at", { ascending: false });
    if (error) { console.error(error); return; }
    setCustomers((data as Customer[]) || []);
  }

  async function loadLoyaltyTransactions() {
    const { data } = await supabase
      .from('loyalty_transactions')
      .select('id, customer_id, sale_id, points, type, created_at')
      .order('created_at', { ascending: false })
      .limit(3000);
    setLoyaltyTransactions((data as LoyaltyTransaction[]) ?? []);
  }

  async function loadAllReturnItems() {
    const { data } = await supabase
      .from('return_items')
      .select('sale_id, product_id, quantity_returned');
    setAllReturnItems((data as { sale_id: string; product_id: string; quantity_returned: number }[]) ?? []);
  }

  async function loadReturnHistory() {
    const { data } = await supabase
      .from('return_items')
      .select('id, sale_id, product_id, quantity_returned, reason, return_number, return_reason, notes, processed_by, created_at')
      .order('created_at', { ascending: false });
    setReturnHistory((data as ReturnRecord[]) ?? []);
  }

  function nextReturnNumber(): string {
    const existing = returnHistory.filter(r => r.return_number).map(r => {
      const m = r.return_number!.match(/^RET-(\d+)$/);
      return m ? Number(m[1]) : 0;
    });
    const max = existing.length > 0 ? Math.max(...existing) : 0;
    return `RET-${String(max + 1).padStart(6, '0')}`;
  }

  async function loadAllPoItems() {
    const { data } = await supabase
      .from('purchase_order_items')
      .select('id, purchase_order_id, product_id, quantity, quantity_received, unit_cost, line_total, created_at, receive_notes');
    const items = (data || []).map((item: any) => ({
      ...item,
      quantity_received: item.quantity_received ?? 0,
    }));
    setAllPoItems(items as POItem[]);
  }

  async function loadCategories() {
    const { data } = await supabase
      .from('categories')
      .select('id, business_id, name, description, status, created_at')
      .order('name', { ascending: true });
    setCategories((data as Category[]) ?? []);
  }

  async function handleAddCategory(e: React.FormEvent) {
    e.preventDefault();
    if (!canManageCategories) return;
    if (!newCatName.trim()) return;
    const { error } = await supabase.from('categories').insert({
      business_id: businessId,
      name: newCatName.trim(),
      description: newCatDesc.trim() || null,
      status: 'active',
    });
    if (error) { setMessage({ text: "Failed to add category: " + error.message, type: "error" }); return; }
    setNewCatName("");
    setNewCatDesc("");
    setMessage({ text: "Category added", type: "success" });
    await loadCategories();
  }

  async function handleEditCategory(e: React.FormEvent) {
    e.preventDefault();
    if (!canManageCategories) return;
    if (!editingCatId || !editCatName.trim()) return;
    const { error } = await supabase.from('categories').update({
      name: editCatName.trim(),
      description: editCatDesc.trim() || null,
    }).eq('id', editingCatId);
    if (error) { setMessage({ text: "Failed to update category: " + error.message, type: "error" }); return; }
    setEditingCatId(null);
    setMessage({ text: "Category updated", type: "success" });
    await loadCategories();
  }

  async function handleDeleteCategory(cat: Category) {
    if (!canManageCategories) return;
    const assigned = products.filter(p => p.category_id === cat.id).length;
    if (assigned > 0) { setMessage({ text: `Cannot delete "${cat.name}" — ${assigned} product${assigned !== 1 ? "s" : ""} still assigned. Remove or reassign products first.`, type: "error" }); return; }
    if (!window.confirm(`Permanently delete category "${cat.name}"?`)) return;
    const { error } = await supabase.from('categories').delete().eq('id', cat.id);
    if (error) { setMessage({ text: "Failed to delete category: " + error.message, type: "error" }); return; }
    setMessage({ text: `Category "${cat.name}" deleted`, type: "success" });
    await loadCategories();
  }

  async function handleToggleCategoryStatus(cat: Category) {
    if (!canManageCategories) return;
    const newStatus = cat.status === "active" ? "inactive" : "active";
    if (newStatus === "inactive") {
      const assigned = products.filter(p => p.category_id === cat.id).length;
      if (assigned > 0) { setMessage({ text: `Cannot deactivate "${cat.name}" — ${assigned} product${assigned !== 1 ? "s" : ""} still assigned.`, type: "error" }); return; }
    }
    const { error } = await supabase.from('categories').update({ status: newStatus }).eq('id', cat.id);
    if (error) { setMessage({ text: "Failed to update category status: " + error.message, type: "error" }); return; }
    setMessage({ text: `Category "${cat.name}" ${newStatus === "active" ? "activated" : "deactivated"}`, type: "success" });
    await loadCategories();
  }

  function handleLookupCustomer() {
    const query = posCustomerPhone.trim();
    if (!query) return;
    const queryLower = query.toLowerCase();
    const match = customers.find(c => c.status === "active" && (c.phone.trim() === query || c.name.trim().toLowerCase() === queryLower));
    if (match) {
      setPosCustomerId(match.id);
      setPosCustomerName(match.name);
      const balance = loyaltyTransactions
        .filter(lt => lt.customer_id === match.id)
        .reduce((sum, lt) => sum + lt.points, 0);
      setMessage({ text: `Customer: ${match.name} — ${balance} pts`, type: "success" });
    } else {
      setPosCustomerId(null);
      setPosCustomerName("");
      setMessage({ text: `No customer found for ${query} — sale will be anonymous`, type: "error" });
    }
  }

  async function handleAddCustomer(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    if (!newCusName || !newCusPhone) return;
    const { error } = await supabase.from("customers").insert({
      business_id: businessId,
      name: newCusName,
      phone: newCusPhone,
      email: newCusEmail || null,
    });
    if (error) { console.error(error); setMessage({ text: error.message.includes("duplicate") ? "Phone number already registered." : "Failed to add customer: " + error.message, type: "error" }); return; }
    setNewCusName("");
    setNewCusPhone("");
    setNewCusEmail("");
    setMessage({ text: "Customer added", type: "success" });
    await loadCustomers();
  }

  async function handleEditCustomer(e: React.FormEvent, customerId: string) {
    e.preventDefault();
    if (!editCusName.trim() || !editCusPhone.trim()) return;
    const { error } = await supabase
      .from("customers")
      .update({ name: editCusName.trim(), phone: editCusPhone.trim(), email: editCusEmail.trim() || null })
      .eq("id", customerId);
    if (error) { console.error(error); setMessage({ text: "Failed to update customer: " + error.message, type: "error" }); return; }
    setEditingCustomerId(null);
    setMessage({ text: "Customer updated", type: "success" });
    await loadCustomers();
  }

  async function handleToggleCustomerStatus(customer: Customer) {
    const newStatus = customer.status === "active" ? "inactive" : "active";
    if (newStatus === "inactive" && !window.confirm(`Deactivate customer "${customer.name}"?`)) return;
    const { error } = await supabase.from("customers").update({ status: newStatus }).eq("id", customer.id);
    if (error) { console.error(error); setMessage({ text: "Status update failed", type: "error" }); return; }
    if (posCustomerId === customer.id && newStatus === "inactive") {
      setPosCustomerId(null);
      setPosCustomerName("");
      setMessage({ text: "Customer deactivated — removed from current sale", type: "success" });
    } else {
      setMessage({ text: newStatus === "active" ? "Customer activated" : "Customer deactivated", type: "success" });
    }
    await loadCustomers();
  }

  async function loadSales() {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const rangeStart: string | null =
      salesDateRange === 'today' ? startOfDay.toISOString() :
      salesDateRange === '7d'   ? new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString() :
      salesDateRange === '30d'  ? new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString() :
      null;
    let query = supabase
      .from("sales")
      .select("id, cashier_id, customer_id, subtotal, tax, discount_amount, total, status, created_at")
      .order("created_at", { ascending: false });
    if (rangeStart) query = query.gte("created_at", rangeStart);
    else query = query.limit(2000);
    const { data, error } = await query;
    if (error) { console.error(error); return; }
    setSales((data as Sale[]) || []);
  }

  async function loadAllPayments() {
    const cutoff = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString();
    const { data, error } = await supabase
      .from("payments")
      .select("sale_id, payment_method, amount, reference, payment_type")
      .gte("created_at", cutoff);
    if (error) {
      const { data: fallback } = await supabase
        .from("payments")
        .select("sale_id, payment_method, amount")
        .gte("created_at", cutoff);
      setAllPayments((fallback as EodPayment[]) ?? []);
      return;
    }
    setAllPayments((data as EodPayment[]) ?? []);
  }

  async function loadEmployees() {
    const { data, error } = await supabase
      .from("employees")
      .select("id, business_id, name, role, status, pin, created_at")
      .order("created_at", { ascending: false });
    if (error) { console.error(error); return; }
    setEmployees((data as Employee[]) || []);
  }

  async function loadPurchaseOrders() {
    const { data, error } = await supabase
      .from("purchase_orders")
      .select("id, supplier_id, po_number, status, subtotal, notes, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      return;
    }

    setPurchaseOrders((data as PurchaseOrder[]) || []);
  }

  async function loadPOItems(poId: string) {
    const { data, error } = await supabase
      .from("purchase_order_items")
      .select("id, purchase_order_id, product_id, quantity, quantity_received, unit_cost, line_total, created_at, receive_notes")
      .eq("purchase_order_id", poId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error(error);
      return;
    }

    const items = (data || []).map((item: any) => ({
      ...item,
      quantity_received: item.quantity_received ?? 0,
    }));
    setPoItems(items as POItem[]);
  }

  async function handleSelectPO(po: PurchaseOrder) {
    if (selectedPoId === po.id) {
      setSelectedPoId("");
      setPoItems([]);
      return;
    }
    setSelectedPoId(po.id);
    setItemProductId("");
    setItemQuantity("");
    setItemUnitCost("");
    await loadPOItems(po.id);
  }

  async function handleAddPOItem(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);

    const qty = Number(itemQuantity);
    const cost = Number(itemUnitCost);

    if (!selectedPoId || !itemProductId || !qty || !cost) return;

    const lineTotal = qty * cost;

    const { error: insertError } = await supabase
      .from("purchase_order_items")
      .insert({
        business_id: businessId,
        purchase_order_id: selectedPoId,
        product_id: itemProductId,
        quantity: qty,
        unit_cost: cost,
        line_total: lineTotal,
      });

    if (insertError) {
      console.error(insertError);
      return;
    }

    const { data: freshItems, error: itemsError } = await supabase
      .from("purchase_order_items")
      .select("line_total")
      .eq("purchase_order_id", selectedPoId);

    if (itemsError) {
      console.error(itemsError);
      return;
    }

    const newSubtotal = (freshItems || []).reduce(
      (sum, item: any) => sum + Number(item.line_total),
      0
    );

    const { error: updateError } = await supabase
      .from("purchase_orders")
      .update({ subtotal: newSubtotal })
      .eq("id", selectedPoId);

    if (updateError) {
      console.error(updateError);
      return;
    }

    setItemProductId("");
    setItemQuantity("");
    setItemUnitCost("");
    await loadPOItems(selectedPoId);
    await loadPurchaseOrders();
  }

  async function handleOpenReceive(po: PurchaseOrder) {
    if (receivingPoId === po.id) {
      setReceivingPoId("");
      setReceivingItems([]);
      setReceiveQtys({});
      setReceiveUnitCosts({});
      setReceiveDamagedQtys({});
      setReceiveExpiredQtys({});
      setReceiveRejectedQtys({});
      setReceiveLineNotes({});
      return;
    }

    const { data, error } = await supabase
      .from("purchase_order_items")
      .select("id, purchase_order_id, product_id, quantity, quantity_received, unit_cost, line_total, created_at, receive_notes")
      .eq("purchase_order_id", po.id)
      .order("created_at", { ascending: true });

    if (error) {
      console.error(error);
      return;
    }

    const items = (data || []).map((item: any) => ({
      ...item,
      quantity_received: item.quantity_received ?? 0,
    })) as POItem[];
    setReceivingPoId(po.id);
    setReceivingItems(items);

    const qtys: Record<string, string> = {};
    const costs: Record<string, string> = {};
    const damaged: Record<string, string> = {};
    const expired: Record<string, string> = {};
    const rejected: Record<string, string> = {};
    const notes: Record<string, string> = {};
    items.forEach((item) => {
      const remaining = item.quantity - (item.quantity_received ?? 0);
      qtys[item.id] = String(Math.max(0, remaining));
      costs[item.id] = String(item.unit_cost);
      damaged[item.id] = "0";
      expired[item.id] = "0";
      rejected[item.id] = "0";
      notes[item.id] = item.receive_notes ?? "";
    });
    setReceiveQtys(qtys);
    setReceiveUnitCosts(costs);
    setReceiveDamagedQtys(damaged);
    setReceiveExpiredQtys(expired);
    setReceiveRejectedQtys(rejected);
    setReceiveLineNotes(notes);
  }

  async function handleConfirmReceive() {
    const po = purchaseOrders.find((p) => p.id === receivingPoId);
    if (!po) return;
    if (isConfirmingReceive) return;
    setIsConfirmingReceive(true);

    try {
      const receiveNotes: string[] = [];
      const exceptionParts: string[] = [];

      for (const item of receivingItems) {
        const receiveQty = Number(receiveQtys[item.id] ?? 0);
        const remaining = item.quantity - (item.quantity_received ?? 0);
        const clampedQty = Math.min(Math.max(0, receiveQty), remaining);
        if (clampedQty <= 0) continue;

        const product = products.find((p) => p.product_id === item.product_id);
        if (!product) continue;

        const damagedQty = Math.max(0, Number(receiveDamagedQtys[item.id] ?? 0));
        const expiredQty = Math.max(0, Number(receiveExpiredQtys[item.id] ?? 0));
        const rejectedQty = Math.max(0, Number(receiveRejectedQtys[item.id] ?? 0));
        const excParts: string[] = [];
        if (damagedQty > 0) excParts.push(`${damagedQty} damaged`);
        if (expiredQty > 0) excParts.push(`${expiredQty} expired`);
        if (rejectedQty > 0) excParts.push(`${rejectedQty} rejected`);
        if (excParts.length > 0) exceptionParts.push(`${product.product_name}: ${excParts.join(", ")}`);

        const lineNote = (receiveLineNotes[item.id] ?? "").trim();

        const quantityBefore = product.quantity_on_hand;
        const quantityAfter = quantityBefore + clampedQty;
        const receivedUnitCost = Number(receiveUnitCosts[item.id] ?? item.unit_cost);
        const oldAvgCost = product.average_cost ?? 0;
        const newAvgCost = (quantityBefore + clampedQty) > 0
          ? ((quantityBefore * oldAvgCost) + (clampedQty * receivedUnitCost)) / (quantityBefore + clampedQty)
          : receivedUnitCost;

        // Phase 1: inventory gate — must succeed before remaining writes fire
        const { error: invError } = await supabase
          .from("inventory")
          .update({ quantity_on_hand: quantityAfter })
          .eq("id", product.inventory_id);

        if (invError) { console.error(invError); continue; }

        // Phase 2: remaining writes in parallel (all values computed from pre-receive snapshot)
        const newReceived = (item.quantity_received ?? 0) + clampedQty;
        const poiPayload: Record<string, unknown> = { quantity_received: newReceived };
        if (lineNote) poiPayload.receive_notes = lineNote;

        const [avgCostRes, txRes] = await Promise.all([
          supabase.from("products").update({ average_cost: newAvgCost }).eq("id", item.product_id),
          supabase.from("inventory_transactions").insert({
            business_id: product.business_id,
            product_id: item.product_id,
            transaction_type: "receiving",
            quantity_change: clampedQty,
            quantity_before: quantityBefore,
            quantity_after: quantityAfter,
            reason: `PO ${po.po_number}`,
          }),
          supabase.from("purchase_order_items").update(poiPayload).eq("id", item.id),
        ]);

        const { error: avgCostError } = avgCostRes;
        const { error: txError } = txRes;
        if (avgCostError) { console.error(avgCostError); }
        if (txError) { console.error(txError); }

        const productName = product.product_name;
        receiveNotes.push(`${productName}: +${clampedQty} (${newReceived}/${item.quantity})`);
      }

      if (receiveNotes.length === 0) {
        setMessage({ text: "No quantities to receive", type: "error" });
        return;
      }

      const { data: updatedItemsData } = await supabase
        .from("purchase_order_items")
        .select("quantity, quantity_received")
        .eq("purchase_order_id", receivingPoId);

      const allItems = (updatedItemsData || []) as { quantity: number; quantity_received: number | null }[];
      const totalOrdered = allItems.reduce((s, i) => s + i.quantity, 0);
      const totalReceived = allItems.reduce((s, i) => s + (i.quantity_received ?? 0), 0);

      let newStatus: string;
      if (totalReceived >= totalOrdered) {
        newStatus = "received";
      } else if (totalReceived > 0) {
        newStatus = "partially_received";
      } else {
        newStatus = po.status;
      }

      const timestamp = new Date().toLocaleString();
      let historyLine = `[Received ${timestamp}] ${receiveNotes.join("; ")}`;
      if (exceptionParts.length > 0) historyLine += ` | Exceptions: ${exceptionParts.join("; ")}`;
      const updatedNotes = po.notes ? `${po.notes}\n${historyLine}` : historyLine;

      const { error: statusError } = await supabase
        .from("purchase_orders")
        .update({ status: newStatus, notes: updatedNotes })
        .eq("id", receivingPoId);

      if (statusError) { console.error(statusError); setMessage({ text: "Failed to update PO status", type: "error" }); return; }

      const statusLabel = newStatus === "received" ? "fully received" : "partially received";
      setReceivingPoId("");
      setReceivingItems([]);
      setReceiveQtys({});
      setReceiveUnitCosts({});
      setReceiveDamagedQtys({});
      setReceiveExpiredQtys({});
      setReceiveRejectedQtys({});
      setReceiveLineNotes({});
      setMessage({ text: `${po.po_number} ${statusLabel} — inventory updated`, type: "success" });
      await Promise.all([loadProducts(), loadPurchaseOrders(), loadAllPoItems(), loadTransactions()]);
    } catch (err) {
      console.error(err);
      setMessage({ text: "Receive failed unexpectedly", type: "error" });
    } finally {
      setIsConfirmingReceive(false);
    }
  }

  function handleBarcodeSubmit(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key !== "Enter") return;
    e.preventDefault();
    const code = barcodeInput.trim();
    setBarcodeInput("");
    if (!code) return;

    const product = products.find((p) => String(p.barcode || "").trim() === code);
    if (!product) { setUnmatchedBarcode(code); setLinkBarcodeMode(false); setLinkBarcodeProductId(""); setMessage({ text: `Scanner worked. Barcode not found in catalog: ${code}`, type: "error" }); return; }
    if (product.status !== "active") { setMessage({ text: "Product is inactive and cannot be sold.", type: "error" }); return; }
    if (product.quantity_on_hand <= 0) { setMessage({ text: `${product.product_name} is out of stock`, type: "error" }); return; }

    const existing = cart.find((c) => c.product_id === product.product_id);
    const alreadyInCart = existing?.quantity ?? 0;
    if (alreadyInCart + 1 > product.quantity_on_hand) {
      setMessage({ text: `Not enough stock for ${product.product_name}`, type: "error" });
      return;
    }

    if (existing) {
      setCart(cart.map((c) =>
        c.product_id === product.product_id
          ? { ...c, quantity: c.quantity + 1, line_total: (c.quantity + 1) * c.unit_price }
          : c
      ));
    } else {
      setCart([...cart, {
        product_id: product.product_id,
        product_name: product.product_name,
        quantity: 1,
        unit_price: product.selling_price,
        line_total: product.selling_price,
        original_unit_price: product.selling_price,
        negotiation_reason: null,
        negotiated_by: null,
      }]);
    }
    setMessage({ text: `${product.product_name} added to cart`, type: "success" });
    setUnmatchedBarcode("");
  }

  async function handleLinkBarcode() {
    if (!linkBarcodeProductId || !unmatchedBarcode) return;
    const conflict = products.find(p => p.barcode === unmatchedBarcode && p.product_id !== linkBarcodeProductId);
    if (conflict) { setMessage({ text: `Barcode already assigned to ${conflict.product_name}`, type: "error" }); return; }
    const { error } = await supabase.from("products").update({ barcode: unmatchedBarcode }).eq("id", linkBarcodeProductId);
    if (error) { console.error(error); setMessage({ text: "Failed to link barcode: " + error.message, type: "error" }); return; }
    setMessage({ text: `Barcode ${unmatchedBarcode} linked successfully`, type: "success" });
    setUnmatchedBarcode("");
    setLinkBarcodeMode(false);
    setLinkBarcodeProductId("");
    await loadProducts();
  }

  function handleAddToCart(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    if (!cartProductId) return;
    const qty = Number(cartQty);
    if (!qty || qty <= 0) return;

    const product = products.find((p) => p.product_id === cartProductId);
    if (!product) return;

    const existing = cart.find((c) => c.product_id === cartProductId);
    const alreadyInCart = existing?.quantity ?? 0;
    if (alreadyInCart + qty > product.quantity_on_hand) {
      setMessage({ text: `Not enough stock. Available: ${product.quantity_on_hand}`, type: "error" });
      return;
    }

    if (existing) {
      setCart(cart.map((c) =>
        c.product_id === cartProductId
          ? { ...c, quantity: c.quantity + qty, line_total: (c.quantity + qty) * c.unit_price }
          : c
      ));
    } else {
      setCart([...cart, {
        product_id: product.product_id,
        product_name: product.product_name,
        quantity: qty,
        unit_price: product.selling_price,
        line_total: qty * product.selling_price,
        original_unit_price: product.selling_price,
        negotiation_reason: null,
        negotiated_by: null,
      }]);
    }
    setCartProductId("");
    setCartQty("1");
  }

  function handleRemoveFromCart(productId: string) {
    setCart(cart.filter((c) => c.product_id !== productId));
  }

  async function handlePrintReceipt(sale: Sale) {
    const { data: items, error: itemsErr } = await supabase
      .from("sale_items")
      .select("product_id, quantity, unit_price, line_total")
      .eq("sale_id", sale.id);

    if (itemsErr || !items) { console.error(itemsErr); return; }

    let payMethod = "—";
    let payRef: string | undefined;
    const { data: payFull } = await supabase
      .from("payments")
      .select("payment_method, reference")
      .eq("sale_id", sale.id)
      .limit(1)
      .maybeSingle();
    if (payFull) {
      payMethod = payFull.payment_method ?? "—";
      payRef = payFull.reference ?? undefined;
    } else {
      const { data: payFallback } = await supabase
        .from("payments")
        .select("payment_method")
        .eq("sale_id", sale.id)
        .limit(1)
        .maybeSingle();
      if (payFallback) payMethod = payFallback.payment_method ?? "—";
    }

    const saleLoyalty = loyaltyTransactions.filter(lt => lt.sale_id === sale.id);
    const earnRow = saleLoyalty.find(lt => lt.type === 'earn');
    const redeemRow = saleLoyalty.find(lt => lt.type === 'redeem');

    setReceipt({
      sale,
      items: items as ReceiptItem[],
      paymentMethod: payMethod,
      paymentReference: payRef,
      pointsEarned: earnRow ? earnRow.points : undefined,
      pointsRedeemed: redeemRow ? Math.abs(redeemRow.points) : undefined,
    });
  }

  async function handlePrintPO(po: PurchaseOrder) {
    const { data, error } = await supabase
      .from("purchase_order_items")
      .select("id, purchase_order_id, product_id, quantity, quantity_received, unit_cost, line_total, created_at")
      .eq("purchase_order_id", po.id)
      .order("created_at", { ascending: true });
    if (error || !data) { console.error(error); return; }
    const supplier = suppliers.find(s => s.id === po.supplier_id) ?? null;
    setPrintPo({ po, items: data as POItem[], supplier });
  }

  async function handleVoidSale(saleId: string) {
    if (!canVoidSales) return;
    const sale = sales.find((s) => s.id === saleId);
    if (!sale || sale.status !== "completed") return;
    if (!window.confirm(`Void sale $${Number(sale.total).toFixed(2)}? This will reverse inventory.`)) return;

    setVoidingId(saleId);
    setMessage(null);

    const { data: items, error: itemsErr } = await supabase
      .from("sale_items")
      .select("product_id, quantity, unit_price")
      .eq("sale_id", saleId);

    if (itemsErr || !items) { console.error(itemsErr); setMessage({ text: "Void failed", type: "error" }); return; }

    const { error: statusErr } = await supabase
      .from("sales")
      .update({ status: "voided" })
      .eq("id", saleId);

    if (statusErr) { console.error(statusErr); setMessage({ text: "Void failed", type: "error" }); return; }

    for (const item of items) {
      const product = products.find((p) => p.product_id === item.product_id);
      if (!product) continue;

      const quantityBefore = product.quantity_on_hand;
      const quantityAfter = quantityBefore + item.quantity;

      await supabase
        .from("inventory")
        .update({ quantity_on_hand: quantityAfter })
        .eq("id", product.inventory_id);

      await supabase
        .from("inventory_transactions")
        .insert({
          business_id: product.business_id,
          product_id: item.product_id,
          transaction_type: "void",
          quantity_change: item.quantity,
          quantity_before: quantityBefore,
          quantity_after: quantityAfter,
          reason: `Void sale ${saleId.slice(0, 8)}`,
        });
    }

    // Loyalty reversal — reverse earned points once per void, prevent duplicate
    if (sale.customer_id) {
      const alreadyReversed = loyaltyTransactions.some(
        lt => lt.sale_id === saleId && lt.type === 'earn' && lt.points < 0
      );
      if (!alreadyReversed) {
        const totalEarned = loyaltyTransactions
          .filter(lt => lt.sale_id === saleId && lt.type === 'earn' && lt.points > 0)
          .reduce((sum, lt) => sum + lt.points, 0);
        if (totalEarned > 0) {
          await supabase.from('loyalty_transactions').insert({
            business_id: businessId,
            customer_id: sale.customer_id,
            sale_id: saleId,
            points: -totalEarned,
            type: 'earn',
          });
        }
      }
    }

    setVoidingId("");
    setMessage({ text: "Sale voided", type: "success" });
    await loadProducts();
    await loadTransactions();
    await loadSales();
    await loadSaleItems();
    await loadLoyaltyTransactions();
  }

  async function handleCompleteSale() {
    if (cart.length === 0) return;
    setMessage(null);

    if (employees.filter(e => e.status === "active").length > 0 && !activeCashierId) {
      setMessage({ text: "Select a cashier before completing the sale", type: "error" });
      return;
    }

    if (paymentMethod === "other" && !paymentRef.trim()) {
      setMessage({ text: "Please specify the payment method", type: "error" });
      return;
    }

    for (const item of cart) {
      const product = products.find((p) => p.product_id === item.product_id);
      if (!product || item.quantity > product.quantity_on_hand) {
        setMessage({ text: `Insufficient stock for ${item.product_name}`, type: "error" });
        return;
      }
    }

    const subtotal = cart.reduce((sum, c) => sum + c.line_total, 0);
    const discountVal = Math.max(0, Number(posDiscountValue) || 0);
    const rawDiscountAmount = posDiscountType === "percent"
      ? subtotal * (discountVal / 100)
      : discountVal;
    if (rawDiscountAmount > subtotal) {
      setMessage({ text: "Discount exceeds sale amount.", type: "error" });
      return;
    }
    const discountAmount = Math.min(rawDiscountAmount, subtotal);
    const discountedSubtotal = Math.max(0, subtotal - discountAmount);
    const taxAmount = Math.round(discountedSubtotal * (businessTaxRate / 100) * 100) / 100;
    const customerLoyaltyBal = posCustomerId
      ? loyaltyTransactions.filter(lt => lt.customer_id === posCustomerId).reduce((s, lt) => s + lt.points, 0)
      : 0;
    const rawRedeemPts = posCustomerId
      ? Math.max(0, Math.floor(Number(posRedeemPoints) || 0))
      : 0;
    if (rawRedeemPts > customerLoyaltyBal) {
      setMessage({ text: `Cannot redeem ${rawRedeemPts} points — customer only has ${customerLoyaltyBal}`, type: "error" });
      return;
    }
    const redeemPts = rawRedeemPts;
    const redeemDollar = redeemPts / 100;
    const finalTotal = Math.max(0, discountedSubtotal + taxAmount - redeemDollar);

    if (isCompletingSale) return;
    setIsCompletingSale(true);

    const { data: sale, error: saleErr } = await supabase
      .from("sales")
      .insert({ business_id: businessId, subtotal, tax: taxAmount, discount_amount: discountAmount, total: finalTotal, status: "open", customer_id: posCustomerId || null, cashier_id: activeCashierId || null })
      .select("id")
      .single();

    if (saleErr || !sale) { console.error(saleErr); setIsCompletingSale(false); setMessage({ text: "Sale failed", type: "error" }); return; }

    // FEFO: fetch all active batches for cart products in one query before touching any data
    const cartProductIds = cart.map(c => c.product_id);
    const { data: cartBatchData } = await supabase
      .from("inventory_batches")
      .select("id, product_id, quantity_remaining, unit_cost, expiration_date, status")
      .eq("business_id", businessId)
      .eq("status", "active")
      .gt("quantity_remaining", 0)
      .in("product_id", cartProductIds)
      .order("expiration_date", { ascending: true, nullsFirst: false });

    type FefoBatch = { id: string; product_id: string; quantity_remaining: number; unit_cost: number | null; expiration_date: string | null; status: string };
    const batchesByProduct: Record<string, FefoBatch[]> = {};
    for (const b of (cartBatchData ?? []) as FefoBatch[]) {
      if (!batchesByProduct[b.product_id]) batchesByProduct[b.product_id] = [];
      batchesByProduct[b.product_id].push({ ...b });
    }

    const { data: rawSaleItems, error: itemsErr } = await supabase
      .from("sale_items")
      .insert(cart.map((c) => ({
        business_id: businessId,
        sale_id: sale.id,
        product_id: c.product_id,
        quantity: c.quantity,
        unit_price: c.unit_price,
        line_total: c.line_total,
        original_unit_price: c.original_unit_price,
        negotiation_reason: c.negotiation_reason,
        negotiated_by: c.negotiated_by,
      })))
      .select("id, product_id");

    if (itemsErr) { console.error(itemsErr); await supabase.from("sales").delete().eq("id", sale.id); setIsCompletingSale(false); setMessage({ text: "Sale items failed. Sale was not saved.", type: "error" }); return; }

    const insertedSaleItems = (rawSaleItems ?? []) as { id: string; product_id: string }[];

    const { error: payErr } = await supabase
      .from("payments")
      .insert({ business_id: businessId, sale_id: sale.id, payment_method: paymentMethod, amount: finalTotal, reference: paymentRef.trim() || null });

    if (payErr) { console.error(payErr); setMessage({ text: "Payment recording failed: " + payErr.message, type: "error" }); }

    const fefoUpdates: { id: string; quantity_remaining: number; status: string }[] = [];
    const saleItemBatchInserts: { business_id: string; sale_id: string; sale_item_id: string; product_id: string; inventory_batch_id: string; quantity: number; unit_cost: number | null; expiration_date: string | null }[] = [];

    for (const item of cart) {
      const product = products.find((p) => p.product_id === item.product_id);
      if (!product) continue;

      const quantityBefore = product.quantity_on_hand;
      const quantityAfter = quantityBefore - item.quantity;

      await supabase
        .from("inventory")
        .update({ quantity_on_hand: quantityAfter })
        .eq("id", product.inventory_id);

      await supabase
        .from("inventory_transactions")
        .insert({
          business_id: product.business_id,
          product_id: item.product_id,
          transaction_type: "sale",
          quantity_change: -item.quantity,
          quantity_before: quantityBefore,
          quantity_after: quantityAfter,
          reason: `Sale ${sale.id.slice(0, 8)}`,
        });

      // FEFO: deduct from earliest-expiring batches first; null expiry batches last
      const saleItem = insertedSaleItems.find(si => si.product_id === item.product_id);
      const productBatches = batchesByProduct[item.product_id] ?? [];
      let toDeduct = item.quantity;
      for (const batch of productBatches) {
        if (toDeduct <= 0) break;
        const deduct = Math.min(toDeduct, batch.quantity_remaining);
        toDeduct -= deduct;
        const newRemaining = batch.quantity_remaining - deduct;
        batch.quantity_remaining = newRemaining; // keep in-memory state accurate across multi-batch deductions
        fefoUpdates.push({ id: batch.id, quantity_remaining: newRemaining, status: newRemaining <= 0 ? "depleted" : batch.status });
        if (saleItem) {
          saleItemBatchInserts.push({
            business_id: businessId,
            sale_id: sale.id,
            sale_item_id: saleItem.id,
            product_id: item.product_id,
            inventory_batch_id: batch.id,
            quantity: deduct,
            unit_cost: batch.unit_cost,
            expiration_date: batch.expiration_date,
          });
        }
        // toDeduct > 0 after loop = partial batch coverage; inventory.quantity_on_hand covers remainder
      }
    }

    // Apply all FEFO batch deductions in parallel
    if (fefoUpdates.length > 0) {
      await Promise.all(fefoUpdates.map(u =>
        supabase.from("inventory_batches")
          .update({ quantity_remaining: u.quantity_remaining, status: u.status })
          .eq("id", u.id)
      ));
    }

    // Record batch consumption audit trail
    if (saleItemBatchInserts.length > 0) {
      await supabase.from("sale_item_batches").insert(saleItemBatchInserts);
    }

    if (posCustomerId) {
      if (redeemPts === 0) {
        const earnedPoints = Math.floor(Math.max(0, discountedSubtotal));
        if (earnedPoints > 0) {
          const { error: earnErr } = await supabase.from('loyalty_transactions').insert({
            business_id: businessId,
            customer_id: posCustomerId,
            sale_id: sale.id,
            points: earnedPoints,
            type: 'earn',
          });
          if (earnErr) console.error('loyalty earn insert error:', earnErr);
        }
      }
      if (redeemPts > 0) {
        const { error: redeemErr } = await supabase.from('loyalty_transactions').insert({
          business_id: businessId,
          customer_id: posCustomerId,
          sale_id: sale.id,
          points: -redeemPts,
          type: 'redeem',
        });
        if (redeemErr) console.error('loyalty redeem insert error:', redeemErr);
      }
    }

    await supabase.from("sales").update({ status: "completed" }).eq("id", sale.id);
    setIsCompletingSale(false);
    setCart([]);
    setAmountTendered("");
    setPaymentRef("");
    setPosDiscountValue("");
    setPosDiscountType("percent");
    setPosCustomerPhone("");
    setPosCustomerId(null);
    setPosCustomerName("");
    setPosRedeemPoints("");
    setMessage({ text: "Sale completed", type: "success" });
    await loadProducts();
    await loadTransactions();
    await loadSales();
    await loadSaleItems();
    await loadAllPayments();
    await loadCustomers();
    await loadLoyaltyTransactions();
  }

  async function handleToggleEod() {
    if (showEod) { setShowEod(false); return; }

    const today = new Date();
    const isToday = (d: string) => {
      const dt = new Date(d);
      return dt.getFullYear() === today.getFullYear() &&
        dt.getMonth() === today.getMonth() &&
        dt.getDate() === today.getDate();
    };

    const todaySaleIds = sales
      .filter((s) => s.status === "completed" && isToday(s.created_at))
      .map((s) => s.id);

    if (todaySaleIds.length > 0) {
      const { data: items } = await supabase
        .from("sale_items")
        .select("sale_id, product_id, quantity, line_total")
        .in("sale_id", todaySaleIds);

      const { data: payments } = await supabase
        .from("payments")
        .select("sale_id, payment_method, amount, payment_type")
        .in("sale_id", todaySaleIds);

      setEodItems((items as EodItem[]) || []);
      setEodPayments((payments as EodPayment[]) || []);
    } else {
      setEodItems([]);
      setEodPayments([]);
    }

    setShowEod(true);
  }

  // Shared PO-number format, used by every draft-PO creation path below.
  function generatePoNumber(offsetMs = 0): string {
    const ts = new Date(Date.now() + offsetMs);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `PO-${ts.getFullYear()}${pad(ts.getMonth() + 1)}${pad(ts.getDate())}-${pad(ts.getHours())}${pad(ts.getMinutes())}${pad(ts.getSeconds())}`;
  }

  // Shared "insert one draft PO + chunk-insert its items" primitive, used by every
  // draft-PO creation path below. Callers retain their own supplier-grouping, quantity
  // defaulting, confirmation, and partial-failure messaging — this only factors out the
  // insert/chunk-insert mechanics that were previously duplicated at each call site.
  async function insertDraftPurchaseOrder(
    supplierId: string,
    items: { product_id: string; quantity: number; unit_cost: number }[],
    notes: string | null,
    poNumberOverride?: string
  ): Promise<{ poId: string; poNumber: string; itemsInserted: number } | null> {
    const poNumber = poNumberOverride ?? generatePoNumber();
    const subtotal = items.reduce((sum, i) => sum + i.quantity * i.unit_cost, 0);

    const { data: po, error: poErr } = await supabase
      .from("purchase_orders")
      .insert({ business_id: businessId, supplier_id: supplierId, po_number: poNumber, status: "draft", subtotal, notes })
      .select("id")
      .single();

    if (poErr || !po) { console.error(poErr); return null; }

    if (items.length === 0) return { poId: po.id, poNumber, itemsInserted: 0 };

    const CHUNK = 30;
    const rows = items.map(i => ({ business_id: businessId, purchase_order_id: po.id, product_id: i.product_id, quantity: i.quantity, unit_cost: i.unit_cost, line_total: i.quantity * i.unit_cost }));
    let inserted = 0;
    for (let ci = 0; ci < rows.length; ci += CHUNK) {
      const { error: chunkErr } = await supabase.from("purchase_order_items").insert(rows.slice(ci, ci + CHUNK));
      if (chunkErr) { console.error(chunkErr); break; }
      inserted += Math.min(CHUNK, rows.length - ci);
    }

    return { poId: po.id, poNumber, itemsInserted: inserted };
  }

  async function handleBatchReorderPO(overrideSelected?: Set<string>) {
    const selected = Array.from(overrideSelected ?? reorderSelected);
    if (selected.length === 0) { setMessage({ text: "No products selected", type: "error" }); return; }

    if (selected.length > 25 && !window.confirm(`Create PO with ${selected.length} products?`)) return;

    const missing = selected.filter(pid => {
      const prod = products.find(p => p.product_id === pid);
      return !reorderSuppliers[pid] && !prod?.supplier_id;
    });
    if (missing.length > 0) {
      const names = missing.map(pid => products.find(p => p.product_id === pid)?.product_name ?? pid.slice(0, 8));
      setMessage({ text: `Select a supplier for: ${names.join(", ")}`, type: "error" });
      return;
    }

    const bySupplier: Record<string, string[]> = {};
    for (const pid of selected) {
      const prod = products.find(p => p.product_id === pid);
      const sid = reorderSuppliers[pid] || prod?.supplier_id || "";
      if (!sid) continue;
      if (!bySupplier[sid]) bySupplier[sid] = [];
      bySupplier[sid].push(pid);
    }

    let poCount = 0;
    let itemCount = 0;

    for (const [supplierId, productIds] of Object.entries(bySupplier)) {
      const items = productIds.map(pid => {
        const product = products.find(p => p.product_id === pid)!;
        const qty = Math.max(1, Number(reorderQtys[pid] ?? ((product.reorder_level ?? 0) - product.quantity_on_hand)));
        const unitCost = product.cost_price ?? product.average_cost ?? 0;
        return { product_id: pid, quantity: qty, unit_cost: unitCost };
      });
      const productNames = productIds.map(pid => products.find(p => p.product_id === pid)!.product_name);
      const notes = items.length === 1
        ? `Reorder: ${productNames[0]}`
        : `Reorder: ${items.length} products`;

      const result = await insertDraftPurchaseOrder(supplierId, items, notes, generatePoNumber(poCount * 1000));
      if (!result) { setMessage({ text: "Failed to create PO", type: "error" }); return; }

      if (result.itemsInserted === 0) {
        await supabase.from("purchase_orders").delete().eq("id", result.poId);
        continue;
      }

      poCount++;
      itemCount += result.itemsInserted;
    }

    setReorderSelected(prev => { const n = new Set(prev); selected.forEach(pid => n.delete(pid)); return n; });
    const clearedSuppliers = { ...reorderSuppliers };
    const clearedQtys = { ...reorderQtys };
    for (const pid of selected) { delete clearedSuppliers[pid]; delete clearedQtys[pid]; }
    setReorderSuppliers(clearedSuppliers);
    setReorderQtys(clearedQtys);
    setMessage({ text: `Created ${poCount} purchase order${poCount !== 1 ? "s" : ""} containing ${itemCount} product${itemCount !== 1 ? "s" : ""}.`, type: "success" });
    await loadPurchaseOrders();
  }

  // Inventory's "Needs Ordering Today" reorder flow — moved here from InventoryTab.tsx
  // so that component no longer performs a direct database write.
  async function handleCreatePOFromNeedsOrdering() {
    const selectedProducts = lowStockProducts.filter(p => needsOrderingSelected.has(p.product_id));
    if (selectedProducts.length === 0) return;

    const withSupplier = selectedProducts.filter(p => !!p.supplier_id);
    const skippedCount = selectedProducts.length - withSupplier.length;

    const bySupplier: Record<string, typeof withSupplier> = {};
    for (const p of withSupplier) {
      const sid = p.supplier_id!;
      if (!bySupplier[sid]) bySupplier[sid] = [];
      bySupplier[sid].push(p);
    }

    let poCount = 0;
    let itemCount = 0;
    let firstPoId = "";

    for (const [supplierId, prods] of Object.entries(bySupplier)) {
      const items = prods.map(p => {
        const qty = needsOrderingQtys[p.product_id] ?? Math.max(1, (p.reorder_level ?? 0) - p.quantity_on_hand);
        const unitCost = p.cost_price ?? p.average_cost ?? 0;
        return { product_id: p.product_id, quantity: qty, unit_cost: unitCost };
      });
      const notes = items.length === 1
        ? `Reorder: ${prods[0].product_name}`
        : `Reorder: ${items.length} products`;

      const result = await insertDraftPurchaseOrder(supplierId, items, notes, generatePoNumber(poCount * 1000));
      if (!result) { setMessage({ text: "Failed to create purchase order", type: "error" }); return; }

      if (!firstPoId) firstPoId = result.poId;

      if (result.itemsInserted === 0) {
        await supabase.from("purchase_orders").delete().eq("id", result.poId);
        continue;
      }

      poCount++;
      itemCount += result.itemsInserted;
    }

    setNeedsOrderingSelected(new Set());
    setNeedsOrderingQtys({});
    await loadPurchaseOrders();
    await loadAllPoItems();
    if (firstPoId) setSelectedPoId(firstPoId);
    setActiveTab("purchasing");

    const msg = [
      `Created ${poCount} draft Purchase Order${poCount !== 1 ? "s" : ""} for ${itemCount} product${itemCount !== 1 ? "s" : ""}.`,
      skippedCount > 0 ? ` ${skippedCount} product${skippedCount !== 1 ? "s were" : " was"} skipped because no supplier is assigned.` : "",
    ].join("");
    setMessage({ text: msg, type: "success" });
  }

  async function handleBulkAssignSupplier() {
    if (!bulkSupplierId || reorderSelected.size === 0) return;
    const selected = Array.from(reorderSelected);
    let count = 0;
    for (const pid of selected) {
      const { error } = await supabase.from("products").update({ supplier_id: bulkSupplierId }).eq("id", pid);
      if (!error) count++;
    }
    setReorderSelected(new Set());
    setBulkSupplierId("");
    setMessage({ text: `Supplier assigned to ${count} product${count !== 1 ? "s" : ""}`, type: "success" });
    await loadProducts();
  }

  async function handleCreateCatalogPO(supplierId: string) {
    const supProducts = products.filter(p => p.supplier_id === supplierId && p.status === "active");
    if (supProducts.length === 0) { setMessage({ text: "No products assigned to this supplier", type: "error" }); return; }

    const items = supProducts.map(p => {
      const prefQty = getPrefQty(p.product_id);
      const defaultQty = Math.max(1, (p.reorder_level ?? 0) - p.quantity_on_hand);
      const qty = prefQty ?? defaultQty;
      const unitCost = p.average_cost ?? 0;
      return { product_id: p.product_id, quantity: qty, unit_cost: unitCost };
    });

    const supplierName = suppliers.find(s => s.id === supplierId)?.name ?? "Unknown";
    const notes = items.length === 1 ? `Catalog: ${supProducts[0].product_name}` : `Catalog: ${items.length} products`;

    const result = await insertDraftPurchaseOrder(supplierId, items, notes);
    if (!result) { setMessage({ text: "Failed to create PO", type: "error" }); return; }
    const { poId, poNumber, itemsInserted } = result;

    if (itemsInserted === 0) {
      await supabase.from("purchase_orders").delete().eq("id", poId);
      setMessage({ text: "Failed to add items — PO was not created", type: "error" });
      await loadPurchaseOrders();
      return;
    }

    if (itemsInserted < items.length) {
      await supabase.from("purchase_orders").update({ subtotal: 0, notes: `${notes} (PARTIAL: ${itemsInserted}/${items.length} items)` }).eq("id", poId);
      setMessage({ text: `PO ${poNumber} created with only ${itemsInserted} of ${items.length} items — some inserts failed`, type: "error" });
    } else {
      setMessage({ text: `Draft PO ${poNumber} created from ${supplierName} catalog (${items.length} products)`, type: "success" });
    }
    await loadPurchaseOrders();
  }

  async function handleCreatePO(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);

    if (!poSupplierId) return;
    const supName = suppliers.find(s => s.id === poSupplierId)?.name ?? "this supplier";
    if (!window.confirm(`Create an empty draft PO for ${supName}? You will need to add items manually via View/Edit.`)) return;

    const result = await insertDraftPurchaseOrder(poSupplierId, [], poNotes || null);
    if (!result) return;

    setPoSupplierId("");
    setPoNotes("");
    setMessage({ text: "Empty draft PO created — use View/Edit to add items", type: "success" });
    await loadPurchaseOrders();
  }

  async function handleDeletePO(po: PurchaseOrder) {
    if (!window.confirm(`Delete ${po.po_number}? This will permanently remove the PO and all its line items.`)) return;
    const { error: itemsError } = await supabase
      .from("purchase_order_items")
      .delete()
      .eq("purchase_order_id", po.id);
    if (itemsError) { console.error(itemsError); setMessage({ text: "Failed to delete PO items", type: "error" }); return; }
    const { error: poError } = await supabase
      .from("purchase_orders")
      .delete()
      .eq("id", po.id);
    if (poError) { console.error(poError); setMessage({ text: "Failed to delete purchase order", type: "error" }); return; }
    if (selectedPoId === po.id) { setSelectedPoId(""); setPoItems([]); }
    if (receivingPoId === po.id) { setReceivingPoId(""); setReceivingItems([]); setReceiveQtys({}); setReceiveUnitCosts({}); setReceiveDamagedQtys({}); setReceiveExpiredQtys({}); setReceiveRejectedQtys({}); setReceiveLineNotes({}); }
    setMessage({ text: `PO ${po.po_number} deleted`, type: "success" });
    await loadPurchaseOrders();
  }

  async function handleCancelPO(po: PurchaseOrder) {
    if (!window.confirm(`Cancel ${po.po_number}? This cannot be undone.`)) return;
    const { error } = await supabase
      .from("purchase_orders")
      .update({ status: "cancelled" })
      .eq("id", po.id);
    if (error) { console.error(error); setMessage({ text: "Failed to cancel purchase order", type: "error" }); return; }
    if (selectedPoId === po.id) { setSelectedPoId(""); setPoItems([]); }
    if (receivingPoId === po.id) { setReceivingPoId(""); setReceivingItems([]); setReceiveQtys({}); setReceiveUnitCosts({}); setReceiveDamagedQtys({}); setReceiveExpiredQtys({}); setReceiveRejectedQtys({}); setReceiveLineNotes({}); }
    setMessage({ text: `PO ${po.po_number} cancelled`, type: "success" });
    await loadPurchaseOrders();
  }

  async function handleMarkOrdered(po: PurchaseOrder) {
    const { error } = await supabase
      .from("purchase_orders")
      .update({ status: "ordered" })
      .eq("id", po.id);
    if (error) { console.error(error); setMessage({ text: "Failed to mark as ordered: " + error.message, type: "error" }); return; }
    setMessage({ text: `PO ${po.po_number} marked as ordered`, type: "success" });
    await loadPurchaseOrders();
  }

  async function handleRemovePOItem(itemId: string) {
    if (!window.confirm("Remove this line item from the purchase order?")) return;
    const { error } = await supabase
      .from("purchase_order_items")
      .delete()
      .eq("id", itemId);
    if (error) { console.error(error); setMessage({ text: "Failed to remove item", type: "error" }); return; }
    const remaining = poItems.filter((i) => i.id !== itemId);
    setPoItems(remaining);
    const newSubtotal = remaining.reduce((sum, i) => sum + Number(i.line_total), 0);
    await supabase.from("purchase_orders").update({ subtotal: newSubtotal }).eq("id", selectedPoId);
    await loadPurchaseOrders();
  }

  async function loadSuppliers() {
    const { data, error } = await supabase
      .from("suppliers")
      .select("id, name, contact_name, phone, email, notes, status, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      return;
    }

    setSuppliers((data as Supplier[]) || []);
  }

  async function handleAddSupplier(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);

    if (!supName) return;

    const { error } = await supabase.from("suppliers").insert({
      business_id: businessId,
      name: supName,
      contact_name: supContact || null,
      phone: supPhone || null,
      email: supEmail || null,
      notes: supNotes || null,
      status: "active",
    });

    if (error) {
      console.error(error);
      return;
    }

    setSupName("");
    setSupContact("");
    setSupPhone("");
    setSupEmail("");
    setSupNotes("");
    setMessage({ text: "Supplier added successfully", type: "success" });
    await loadSuppliers();
  }

  function handleStartEditSupplier(s: Supplier) {
    setEditingSupplierId(s.id);
    setEditSupName(s.name);
    setEditSupContact(s.contact_name ?? "");
    setEditSupPhone(s.phone ?? "");
    setEditSupEmail(s.email ?? "");
    setEditSupNotes(s.notes ?? "");
  }

  function handleCancelEditSupplier() {
    setEditingSupplierId(null);
  }

  async function handleSaveSupplier() {
    if (!editingSupplierId || !editSupName.trim()) return;
    const { error } = await supabase.from("suppliers").update({
      name: editSupName.trim(),
      contact_name: editSupContact.trim() || null,
      phone: editSupPhone.trim() || null,
      email: editSupEmail.trim() || null,
      notes: editSupNotes.trim() || null,
    }).eq("id", editingSupplierId);
    if (error) { console.error(error); setMessage({ text: "Update failed", type: "error" }); return; }
    setEditingSupplierId(null);
    setMessage({ text: "Supplier updated", type: "success" });
    await loadSuppliers();
  }

  async function handleToggleSupplierStatus(s: Supplier) {
    const newStatus = s.status === "active" ? "inactive" : "active";
    if (newStatus === "inactive" && !window.confirm(`Deactivate supplier "${s.name}"?`)) return;
    const { error } = await supabase.from("suppliers").update({ status: newStatus }).eq("id", s.id);
    if (error) { console.error(error); setMessage({ text: "Status update failed", type: "error" }); return; }
    await loadSuppliers();
  }

  async function handleDeleteSupplier(id: string, name: string) {
    const hasPOs = purchaseOrders.some(po => po.supplier_id === id);
    if (hasPOs) { setMessage({ text: `Cannot delete "${name}" — they have existing purchase orders.`, type: "error" }); return; }
    if (!window.confirm(`Permanently delete supplier "${name}"?`)) return;
    const { error } = await supabase.from("suppliers").delete().eq("id", id);
    if (error) { console.error(error); setMessage({ text: "Delete failed", type: "error" }); return; }
    setMessage({ text: `Supplier "${name}" deleted`, type: "success" });
    await loadSuppliers();
  }

  async function handleAddEmployee(e: React.FormEvent) {
    e.preventDefault();
    if (!canManageStaff) return;
    if (!newEmpName.trim() || !newEmpPin.trim() || !businessId) return;
    const pin = newEmpPin.trim();
    if (!/^\d{4,6}$/.test(pin)) { setMessage({ text: "PIN must be 4–6 digits", type: "error" }); return; }
    const duplicate = employees.find(emp => emp.pin === pin);
    if (duplicate) { setMessage({ text: `PIN already assigned to ${duplicate.name}`, type: "error" }); return; }
    const { error } = await supabase.from("employees").insert({
      business_id: businessId,
      name: newEmpName.trim(),
      pin,
      role: newEmpRole,
      status: "active",
    });
    if (error) { console.error(error); setMessage({ text: "Failed to add employee: " + error.message, type: "error" }); return; }
    setNewEmpName("");
    setNewEmpPin("");
    setNewEmpRole("cashier");
    setOwnerBypass(true);
    setMessage({ text: `Employee added — PIN: ${pin}`, type: "success" });
    await loadEmployees();
  }

  async function handleToggleEmployeeStatus(emp: Employee) {
    if (!canManageStaff) return;
    const newStatus = emp.status === "active" ? "inactive" : "active";
    if (newStatus === "inactive" && !window.confirm(`Deactivate employee "${emp.name}"?`)) return;
    const { error } = await supabase.from("employees").update({ status: newStatus }).eq("id", emp.id);
    if (error) { console.error(error); setMessage({ text: "Status update failed", type: "error" }); return; }
    if (activeCashierId === emp.id && newStatus === "inactive") {
      setActiveCashierId(null);
      setActiveCashierName("");
      setMessage({ text: "Employee deactivated — cashier deselected", type: "success" });
    } else {
      setMessage({ text: newStatus === "active" ? "Employee activated" : "Employee deactivated", type: "success" });
    }
    await loadEmployees();
  }

  async function handleSaveEmployeeRole(emp: Employee) {
    if (!canManageStaff) return;
    if (!editEmpRole || editEmpRole === emp.role) { setEditingEmpId(null); return; }
    const { error } = await supabase.from("employees").update({ role: editEmpRole }).eq("id", emp.id);
    if (error) { console.error(error); setMessage({ text: "Failed to update role: " + error.message, type: "error" }); return; }
    setEditingEmpId(null);
    setEditEmpRole("");
    setMessage({ text: `${emp.name} role updated to ${editEmpRole}`, type: "success" });
    await loadEmployees();
  }

  async function loadProducts() {
    const { data, error } = await supabase
      .from("inventory")
      .select(`
        id,
        business_id,
        product_id,
        quantity_on_hand,
        products (
          name,
          sku,
          barcode,
          selling_price,
          reorder_level,
          status,
          average_cost,
          cost_price,
          estimated_overhead_pct,
          target_margin_percent,
          minimum_margin_percent,
          supplier_id,
          category_id
        )
      `);

    if (error) {
      console.error(error);
      return;
    }

    const formatted =
      data?.map((item: any) => ({
        inventory_id: item.id,
        business_id: item.business_id,
        product_id: item.product_id,
        product_name: item.products?.name,
        sku: item.products?.sku,
        barcode: item.products?.barcode,
        selling_price: item.products?.selling_price,
        quantity_on_hand: item.quantity_on_hand,
        reorder_level: item.products?.reorder_level ?? null,
        status: item.products?.status,
        average_cost: item.products?.average_cost ?? 0,
        cost_price: item.products?.cost_price ?? null,
        estimated_overhead_pct: item.products?.estimated_overhead_pct ?? 0,
        target_margin_percent: item.products?.target_margin_percent ?? null,
        minimum_margin_percent: item.products?.minimum_margin_percent ?? null,
        supplier_id: item.products?.supplier_id ?? null,
        category_id: item.products?.category_id ?? null,
      })) || [];

    setProducts(formatted);
  }

  async function loadTransactions() {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const rangeStart: string | null =
      txDateRange === 'today' ? startOfDay.toISOString() :
      txDateRange === '7d'   ? new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString() :
      txDateRange === '30d'  ? new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString() :
      null;
    let query = supabase
      .from("inventory_transactions")
      .select("id, created_at, transaction_type, quantity_change, quantity_before, quantity_after, product_id")
      .order("created_at", { ascending: false });
    if (rangeStart) query = query.gte("created_at", rangeStart);
    const { data: txData, error: txError } = await query;

    if (txError) {
      console.error(txError);
      return;
    }

    const { data: productData } = await supabase
      .from("products")
      .select("id, name");

    const productMap = Object.fromEntries(
      (productData || []).map((p: any) => [p.id, p.name])
    );

    const merged = (txData || []).map((tx: any) => ({
      ...tx,
      products: { name: productMap[tx.product_id] ?? "Unknown" },
    }));

    setTransactions(merged as Transaction[]);
  }

  function handleBarcodeLookup() {
    const barcode = newBarcode.trim();
    if (!barcode) return;
    const match = products.find(p => p.barcode === barcode);
    if (match) {
      setNewName(match.product_name);
      setNewSku(match.sku ?? "");
      setBarcodeAutoFill(`Auto-filled from existing product: ${match.product_name}`);
    } else {
      setBarcodeAutoFill("");
    }
  }

  async function handleAddProduct(e: React.FormEvent) {
    e.preventDefault();
    if (!canAddProducts) return;
    setMessage(null);

    if (!newName || !newSellingPrice || !newInitialStock) return;

    const barcode = newBarcode.trim();
    if (barcode) {
      const conflict = products.find(p => p.barcode === barcode);
      if (conflict) { setMessage({ text: `Barcode already assigned to ${conflict.product_name}`, type: "error" }); return; }
    }

    const initialStock = Number(newInitialStock);

    const costPrice = newCostPrice ? Number(newCostPrice) : 0;

    const { data: productData, error: productError } = await supabase
      .from("products")
      .insert({
        business_id: businessId,
        name: newName,
        sku: newSku || null,
        barcode: newBarcode || null,
        cost_price: costPrice || null,
        selling_price: Number(newSellingPrice),
        reorder_level: newReorderLevel ? Number(newReorderLevel) : 10,
        average_cost: costPrice,
        estimated_overhead_pct: newOverhead ? Number(newOverhead) : 0,
        target_margin_percent: newTargetMargin ? Number(newTargetMargin) : null,
        minimum_margin_percent: newMinMargin ? Number(newMinMargin) : null,
        status: "active",
        category_id: newProductCategory || null,
      })
      .select("id")
      .single();

    if (productError) {
      console.error(productError);
      return;
    }

    const productId = productData.id;

    const { error: invError } = await supabase
      .from("inventory")
      .insert({
        business_id: businessId,
        product_id: productId,
        quantity_on_hand: initialStock,
      });

    if (invError) {
      console.error(invError);
      return;
    }

    const { error: txError } = await supabase
      .from("inventory_transactions")
      .insert({
        business_id: businessId,
        product_id: productId,
        transaction_type: "receiving",
        quantity_change: initialStock,
        quantity_before: 0,
        quantity_after: initialStock,
        reason: "Initial product stock",
      });

    if (txError) {
      console.error(txError);
      return;
    }

    // If opened from Smart Receive modal, call callback then close modal
    if (addProductModalCallback) {
      await loadProducts();
      await addProductModalCallback(productId);
      setAddProductModalOpen(false);
      setAddProductModalCallback(null);
    } else {
      await loadProducts();
      await loadTransactions();
    }
    setNewName("");
    setNewSku("");
    setNewBarcode("");
    setNewCostPrice("");
    setNewSellingPrice("");
    setNewReorderLevel("");
    setNewInitialStock("");
    setNewOverhead("");
    setNewTargetMargin("");
    setNewMinMargin("");
    setNewProductCategory("");
    setBarcodeAutoFill("");
    setMessage({ text: "Product added successfully", type: "success" });
  }

  async function handleEditProduct(e: React.FormEvent, productId: string) {
    e.preventDefault();
    if (!canEditProducts) return;
    if (!editProdName.trim() || !editProdPrice) return;
    const editBarcode = editProdBarcode.trim();
    if (editBarcode) {
      const conflict = products.find(p => p.barcode === editBarcode && p.product_id !== productId);
      if (conflict) { setMessage({ text: `Barcode already assigned to ${conflict.product_name}`, type: "error" }); return; }
    }
    const { error } = await supabase
      .from("products")
      .update({
        name: editProdName.trim(),
        sku: editProdSku.trim() || null,
        barcode: editProdBarcode.trim() || null,
        selling_price: Number(editProdPrice),
        reorder_level: editProdReorder ? Number(editProdReorder) : 10,
        estimated_overhead_pct: editProdOverhead ? Number(editProdOverhead) : 0,
        target_margin_percent: editProdTargetMargin ? Number(editProdTargetMargin) : null,
        minimum_margin_percent: editProdMinMargin ? Number(editProdMinMargin) : null,
        category_id: editProdCategory || null,
      })
      .eq("id", productId);
    if (error) { console.error(error); setMessage({ text: "Failed to update product: " + error.message, type: "error" }); return; }
    setEditingProductId(null);
    setMessage({ text: "Product updated", type: "success" });
    await loadProducts();
  }

  async function handleToggleProductStatus(product: ProductStock) {
    if (!canDeactivateProducts) return;
    const newStatus = product.status === "active" ? "inactive" : "active";
    if (newStatus === "inactive" && !window.confirm(`Deactivate product "${product.product_name}"? It will no longer appear in POS.`)) return;
    const { error } = await supabase
      .from("products")
      .update({ status: newStatus })
      .eq("id", product.product_id);
    if (error) { console.error(error); setMessage({ text: "Status update failed", type: "error" }); return; }
    setMessage({ text: newStatus === "active" ? "Product activated" : "Product deactivated", type: "success" });
    await loadProducts();
  }

  function computeInvoiceVariance(
    items: { quantity_received: number; unit_cost: number; total_cost: number | null }[],
    freightCost: number,
    additionalCost: number,
    invoiceTotal: number,
  ) {
    const itemsTotal = items.reduce((s, i) => s + (i.total_cost != null ? Number(i.total_cost) : Number(i.unit_cost) * Number(i.quantity_received)), 0);
    const calculatedTotal = itemsTotal + freightCost + additionalCost;
    const varianceAmount = Math.round((invoiceTotal - calculatedTotal) * 100) / 100;
    const invoiceStatus = Math.abs(varianceAmount) <= 0.01 ? "matched" : "variance";
    return { calculatedTotal: Math.round(calculatedTotal * 100) / 100, varianceAmount, invoiceStatus };
  }

  async function handleSaveInvoice(sessionId: string) {
    if (isSavingInvoice) return;
    setIsSavingInvoice(true);
    const invoiceTotal = parseFloat(editInvoiceTotal) || 0;
    const freightCost = parseFloat(editFreightCost) || 0;
    const additionalCost = parseFloat(editAdditionalCost) || 0;
    const items = sessionHistoryItems[sessionId] ?? [];
    const { calculatedTotal, varianceAmount, invoiceStatus } = computeInvoiceVariance(items, freightCost, additionalCost, invoiceTotal);
    const autoApprovedAt = invoiceStatus === "matched" ? new Date().toISOString() : null;
    const { error } = await supabase.from("receiving_sessions").update({
      invoice_number: editInvoiceNumber.trim() || null,
      invoice_date: editInvoiceDate || null,
      invoice_total: invoiceTotal,
      freight_cost: freightCost,
      additional_cost: additionalCost,
      calculated_total: calculatedTotal,
      variance_amount: varianceAmount,
      invoice_status: invoiceStatus,
      approved_by: invoiceStatus === "matched" ? "auto" : null,
      approved_at: autoApprovedAt,
      approval_note: invoiceStatus === "matched" ? "Automatically approved — invoice matched" : null,
    }).eq("id", sessionId);
    if (error) {
      console.error("[Invoice] Save error:", error);
      setMessage({ text: "Failed to save invoice: " + error.message, type: "error" });
      setIsSavingInvoice(false);
      return;
    }
    setSessionHistory(prev => prev.map(s => s.id === sessionId ? {
      ...s,
      invoice_number: editInvoiceNumber.trim() || null,
      invoice_date: editInvoiceDate || null,
      invoice_total: invoiceTotal,
      freight_cost: freightCost,
      additional_cost: additionalCost,
      calculated_total: calculatedTotal,
      variance_amount: varianceAmount,
      invoice_status: invoiceStatus,
      approved_by: invoiceStatus === "matched" ? "auto" : null,
      approved_at: autoApprovedAt,
      approval_note: invoiceStatus === "matched" ? "Automatically approved — invoice matched" : null,
    } : s));
    setInvoicePanelSessionId(null);
    await loadSessionHistory();
    setMessage({ text: "Invoice saved", type: "success" });
    setIsSavingInvoice(false);
  }

  async function loadSupplierStatement(supplierId: string) {
    setIsLoadingStatement(true);
    setSupplierStatement([]);
    const supplierName = suppliers.find(s => s.id === supplierId)?.name ?? "";
    // Query 1: sessions FK-linked to this supplier
    const { data: linked, error: sessErr } = await supabase
      .from("receiving_sessions")
      .select("id, invoice_number, invoice_date, invoice_total")
      .eq("business_id", businessId)
      .eq("supplier_id", supplierId)
      .eq("status", "completed")
      .not("invoice_number", "is", null)
      .order("created_at", { ascending: false });
    if (sessErr) { console.error("[Statement] sessions error:", sessErr); setIsLoadingStatement(false); return; }
    // Query 2: sessions received before the supplier existed in catalog (supplier_id = null,
    // supplier_name matches). Shown without a badge — the statement context implies association.
    const { data: byName } = supplierName
      ? await supabase
          .from("receiving_sessions")
          .select("id, invoice_number, invoice_date, invoice_total")
          .eq("business_id", businessId)
          .is("supplier_id", null)
          .ilike("supplier_name", supplierName)
          .eq("status", "completed")
          .not("invoice_number", "is", null)
          .order("created_at", { ascending: false })
      : { data: [] };
    // FK-linked sessions are listed first so they win the deduplication when an invoice
    // number appears in both result sets (edge case: same invoice received twice, once
    // linked and once unlinked).
    const allSessions = [...(linked ?? []), ...(byName ?? [])];
    if (allSessions.length === 0) { setIsLoadingStatement(false); return; }
    // Deduplicate by invoice_number (Supabase REST has no DISTINCT ON).
    // Payments are aggregated across ALL session IDs sharing an invoice_number so the
    // paid total is accurate even when a payment was recorded against a duplicate session.
    const byInvoice = new Map<string, typeof allSessions[0]>();
    const sessionToInvoice: Record<string, string> = {};
    for (const s of allSessions) {
      if (!byInvoice.has(s.invoice_number)) byInvoice.set(s.invoice_number, s);
      sessionToInvoice[s.id] = s.invoice_number;
    }
    const { data: payments } = await supabase
      .from("supplier_payments")
      .select("receiving_session_id, amount")
      .in("receiving_session_id", allSessions.map(s => s.id));
    const paidByInvoice: Record<string, number> = {};
    for (const p of (payments ?? [])) {
      const inv = sessionToInvoice[p.receiving_session_id];
      if (inv) paidByInvoice[inv] = (paidByInvoice[inv] ?? 0) + Number(p.amount);
    }
    setSupplierStatement([...byInvoice.values()].map(s => ({
      session_id: s.id,
      invoice_number: s.invoice_number,
      invoice_date: s.invoice_date,
      invoice_total: Number(s.invoice_total),
      paid: Math.round((paidByInvoice[s.invoice_number] ?? 0) * 100) / 100,
    })));
    setIsLoadingStatement(false);
  }

  async function loadSessionPayments(sessionId: string) {
    const { data, error } = await supabase
      .from("supplier_payments")
      .select("id, amount, payment_date, payment_method, reference, notes")
      .eq("receiving_session_id", sessionId)
      .order("created_at", { ascending: true });
    if (error) { console.error("[SupplierPayment] Load error:", error); return; }
    setSessionPayments(prev => ({ ...prev, [sessionId]: (data ?? []) as { id: string; amount: number; payment_date: string; payment_method: string; reference: string | null; notes: string | null }[] }));
  }

  async function handleSavePayment(sessionId: string, supplierId: string, remaining: number) {
    if (isSavingPayment) return;
    const amount = parseFloat(editPaymentAmount) || 0;
    if (amount <= 0 || !editPaymentDate || !editPaymentMethod) {
      setMessage({ text: "Payment date, amount, and method are required", type: "error" });
      return;
    }
    if (amount > remaining + 0.01) {
      setMessage({ text: `Payment amount ($${amount.toFixed(2)}) exceeds remaining balance ($${remaining.toFixed(2)})`, type: "error" });
      return;
    }
    setIsSavingPayment(true);
    const { data, error } = await supabase.from("supplier_payments").insert({
      business_id: businessId,
      supplier_id: supplierId,
      receiving_session_id: sessionId,
      payment_date: editPaymentDate,
      amount,
      payment_method: editPaymentMethod,
      reference: editPaymentReference.trim() || null,
      notes: editPaymentNotes.trim() || null,
    }).select("id, amount, payment_date, payment_method, reference, notes").single();
    if (error) {
      console.error("[SupplierPayment] Save error:", error);
      setMessage({ text: "Failed to record payment: " + error.message, type: "error" });
      setIsSavingPayment(false);
      return;
    }
    setSessionPayments(prev => ({ ...prev, [sessionId]: [...(prev[sessionId] ?? []), data as { id: string; amount: number; payment_date: string; payment_method: string; reference: string | null; notes: string | null }] }));
    setPaymentPanelSessionId(null);
    setEditPaymentDate("");
    setEditPaymentAmount("");
    setEditPaymentMethod("cash");
    setEditPaymentReference("");
    setEditPaymentNotes("");
    setMessage({ text: `Payment of $${amount.toFixed(2)} recorded`, type: "success" });
    setIsSavingPayment(false);
  }

  async function handleLinkSessionSupplier(sessionId: string, supplierId: string) {
    setIsResolvingSupplier(true);
    const { error } = await supabase
      .from("receiving_sessions")
      .update({ supplier_id: supplierId })
      .eq("id", sessionId);
    if (error) {
      setMessage({ text: "Failed to link supplier: " + error.message, type: "error" });
      setIsResolvingSupplier(false);
      return;
    }
    setSessionHistory(prev => prev.map(s => s.id === sessionId ? { ...s, supplier_id: supplierId } : s));
    setResolvingSupplierSessionId(null);
    setResolveSupplierPickId("");
    setResolveNewSupplierName("");
    setResolveMode("pick");
    setIsResolvingSupplier(false);
    setMessage({ text: "Supplier linked. Payment recording is now available.", type: "success" });
  }

  async function handleCreateAndLinkSupplier(sessionId: string, name: string) {
    if (!name.trim()) return;
    setIsResolvingSupplier(true);
    const { data: newSup, error: supErr } = await supabase
      .from("suppliers")
      .insert({ business_id: businessId, name: name.trim(), status: "active" })
      .select("id")
      .single();
    if (supErr || !newSup) {
      setMessage({ text: "Failed to create supplier: " + (supErr?.message ?? ""), type: "error" });
      setIsResolvingSupplier(false);
      return;
    }
    await loadSuppliers();
    const { error } = await supabase
      .from("receiving_sessions")
      .update({ supplier_id: newSup.id })
      .eq("id", sessionId);
    if (error) {
      setMessage({ text: "Failed to link new supplier: " + error.message, type: "error" });
      setIsResolvingSupplier(false);
      return;
    }
    setSessionHistory(prev => prev.map(s => s.id === sessionId ? { ...s, supplier_id: newSup.id } : s));
    setResolvingSupplierSessionId(null);
    setResolveNewSupplierName("");
    setResolveMode("pick");
    setIsResolvingSupplier(false);
    setMessage({ text: "Supplier created and linked. Payment recording is now available.", type: "success" });
  }

  async function loadSessionHistory() {
    if (!businessId) return;
    const { data, error } = await supabase
      .from("receiving_sessions")
      .select("id, status, supplier_id, supplier_name, created_at, received_date, notes, invoice_number, invoice_date, invoice_total, freight_cost, additional_cost, invoice_status, calculated_total, variance_amount, approved_by, approved_at, approval_note")
      .eq("business_id", businessId)
      .in("status", ["completed", "cancelled"])
      .order("created_at", { ascending: false })
      .limit(20);
    if (error) { console.error("[SessionHistory] Load error:", error); return; }
    const rows = (data ?? []) as typeof sessionHistory;
    setSessionHistory(rows);
    setHistoryHasMore(rows.length === 20);
  }

  async function handleLoadMoreHistory() {
    if (!businessId || isLoadingMoreHistory) return;
    setIsLoadingMoreHistory(true);
    const offset = sessionHistory.length;
    const { data, error } = await supabase
      .from("receiving_sessions")
      .select("id, status, supplier_id, supplier_name, created_at, received_date, notes, invoice_number, invoice_date, invoice_total, freight_cost, additional_cost, invoice_status, calculated_total, variance_amount, approved_by, approved_at, approval_note")
      .eq("business_id", businessId)
      .in("status", ["completed", "cancelled"])
      .order("created_at", { ascending: false })
      .range(offset, offset + 19);
    setIsLoadingMoreHistory(false);
    if (error) { console.error("[SessionHistory] Load more error:", error); return; }
    const rows = (data ?? []) as typeof sessionHistory;
    setSessionHistory(prev => [...prev, ...rows]);
    setHistoryHasMore(rows.length === 20);
  }

  async function loadSessionHistoryItems(sessionId: string) {
    if (sessionHistoryItems[sessionId]) { return sessionHistoryItems[sessionId]; }
    const { data, error } = await supabase
      .from("receiving_items")
      .select("id, product_id, quantity_received, unit_cost, total_cost")
      .eq("receiving_session_id", sessionId)
      .order("created_at", { ascending: true });
    if (error) { console.error("[SessionHistory] Load items error:", error); return; }
    const items = (data ?? []) as { id: string; product_id: string; quantity_received: number; unit_cost: number; total_cost: number | null }[];
    setSessionHistoryItems(prev => ({ ...prev, [sessionId]: items }));
    const session = sessionHistory.find(s => s.id === sessionId);
    if (session && session.invoice_total > 0) {
      const { calculatedTotal, varianceAmount, invoiceStatus } = computeInvoiceVariance(items, session.freight_cost, session.additional_cost, session.invoice_total);
      if (Math.abs(calculatedTotal - session.calculated_total) > 0.01 || invoiceStatus !== session.invoice_status) {
        await supabase.from("receiving_sessions").update({ calculated_total: calculatedTotal, variance_amount: varianceAmount, invoice_status: invoiceStatus }).eq("id", sessionId);
        setSessionHistory(prev => prev.map(s => s.id === sessionId ? { ...s, calculated_total: calculatedTotal, variance_amount: varianceAmount, invoice_status: invoiceStatus } : s));
      }
    }
    return items;
  }

  async function loadActiveReceivingSession() {
    if (!businessId) return;
    const { data, error } = await supabase
      .from("receiving_sessions")
      .select("id, business_id, supplier_id, received_by, status, notes, created_at, invoice_number, supplier_name")
      .eq("business_id", businessId)
      .eq("status", "draft")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) { console.error("[ReceivingSession] Load error:", error); return; }
    setActiveReceivingSession(data ?? null);
    if (data) { await loadSessionItems(data.id); } else { setSessionItems([]); }
  }

  async function loadSessionItems(sessionId: string) {
    const { data, error } = await supabase
      .from("receiving_items")
      .select("id, product_id, quantity_received, unit_cost")
      .eq("receiving_session_id", sessionId)
      .order("created_at", { ascending: true });
    if (error) { console.error("[ReceivingSession] Load items error:", error); return; }
    setSessionItems((data ?? []) as { id: string; product_id: string; quantity_received: number; unit_cost: number }[]);
  }

  async function handleStartReceivingSession() {
    if (!businessId || isStartingSession) return;
    setIsStartingSession(true);
    const { data, error } = await supabase
      .from("receiving_sessions")
      .insert({
        business_id: businessId,
        supplier_id: newSessionSupplierId || null,
        status: "draft",
        notes: newSessionNotes.trim() || null,
      })
      .select("id, business_id, supplier_id, received_by, status, notes, created_at, supplier_name")
      .single();
    if (error) {
      console.error("[ReceivingSession] Start error:", error);
      setMessage({ text: "Failed to start session: " + error.message, type: "error" });
      setIsStartingSession(false);
      return;
    }
    setActiveReceivingSession(data);
    setSessionItems([]);
    closeProductResolution();
    setNewSessionSupplierId("");
    setNewSessionNotes("");
    setIsStartingSession(false);
    setMessage({ text: "Receiving session started", type: "success" });
  }

  async function handleCancelReceivingSession() {
    if (!activeReceivingSession || activeReceivingSession.status !== 'draft') return;
    const { error: delError } = await supabase
      .from("receiving_items")
      .delete()
      .eq("receiving_session_id", activeReceivingSession.id);
    if (delError) { console.error("[ReceivingSession] Delete items error:", delError); }
    const { error } = await supabase
      .from("receiving_sessions")
      .update({ status: "cancelled" })
      .eq("id", activeReceivingSession.id);
    if (error) {
      console.error("[ReceivingSession] Cancel error:", error);
      setMessage({ text: "Failed to cancel session: " + error.message, type: "error" });
      return;
    }
    setActiveReceivingSession(null);
    setSessionItems([]);
    closeProductResolution();
    setMessage({ text: "Receiving session cancelled", type: "success" });
    await loadSessionHistory();
  }

  function playScanBeep(success: boolean) {
    try {
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = success ? 880 : 220;
      osc.type = success ? "sine" : "square";
      gain.gain.value = 0.15;
      osc.start();
      osc.stop(ctx.currentTime + (success ? 0.1 : 0.25));
      osc.onended = () => ctx.close();
    } catch (_) { /* audio not available */ }
  }

  function openProductResolution(req: ProductResolutionRequest) {
    setProductResolution(req);
    setProductResolutionMode(null);
    setProductResolutionLinkId("");
    setProductResolutionNewName(req.description ?? "");
    setProductResolutionNewCost(req.suggestedCost != null ? String(req.suggestedCost) : "");
    setProductResolutionNewSelling("");
    setProductResolutionCategoryId("");
    setProductResolutionSupplierId(req.suggestedSupplierId ?? "");
  }

  function closeProductResolution() {
    setProductResolution(null);
    setProductResolutionMode(null);
    setProductResolutionLinkId("");
    setProductResolutionNewName("");
    setProductResolutionNewCost("");
    setProductResolutionNewSelling("");
    setProductResolutionCategoryId("");
    setProductResolutionSupplierId("");
    setIsSavingProductResolution(false);
  }

  async function handleProductResolutionLink() {
    if (!productResolution || !productResolutionLinkId || isSavingProductResolution) return;
    setIsSavingProductResolution(true);
    // Save barcode to product if one was scanned
    if (productResolution.barcode) {
      const { error } = await supabase.from("products").update({ barcode: productResolution.barcode }).eq("id", productResolutionLinkId);
      if (error) { setMessage({ text: "Failed to link barcode: " + error.message, type: "error" }); setIsSavingProductResolution(false); return; }
      loadProducts();
    }
    const product = products.find(p => p.product_id === productResolutionLinkId);
    await productResolution.onResolved(productResolutionLinkId);
    closeProductResolution();
    setMessage({ text: `Linked to ${product?.product_name ?? "product"} and added`, type: "success" });
    setTimeout(() => sessionScanRef.current?.focus(), 50);
  }

  async function handleProductResolutionCreate() {
    if (!productResolution || !productResolutionNewName.trim() || !productResolutionNewSelling || isSavingProductResolution) return;
    setIsSavingProductResolution(true);
    const costPrice = parseFloat(productResolutionNewCost) || 0;
    const sellingPrice = parseFloat(productResolutionNewSelling) || 0;
    const { data: prod, error: prodErr } = await supabase.from("products")
      .insert({
        business_id: businessId,
        name: productResolutionNewName.trim(),
        barcode: productResolution.barcode ?? null,
        selling_price: sellingPrice,
        cost_price: costPrice,
        average_cost: costPrice,
        status: "active",
        category_id: productResolutionCategoryId || null,
        supplier_id: productResolutionSupplierId || null,
      })
      .select("id").single();
    if (prodErr) { setMessage({ text: "Failed to create product: " + prodErr.message, type: "error" }); setIsSavingProductResolution(false); return; }
    await supabase.from("inventory").insert({ business_id: businessId, product_id: prod.id, quantity_on_hand: 0 });
    await loadProducts();
    await productResolution.onResolved(prod.id);
    closeProductResolution();
    setMessage({ text: `"${productResolutionNewName.trim()}" created and added`, type: "success" });
    setTimeout(() => sessionScanRef.current?.focus(), 50);
  }

  async function handleSessionScan(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key !== "Enter" || !activeReceivingSession) return;
    e.preventDefault();
    const code = e.currentTarget.value.trim();
    setSessionScanInput("");
    setTimeout(() => sessionScanRef.current?.focus(), 0);
    if (!code) return;

    const product = products.find(p => String(p.barcode || "").trim() === code);
    if (!product) {
      playScanBeep(false);
      openProductResolution({
        barcode: code,
        onResolved: async (productId) => {
          // Add the resolved product to this session
          const resolved = products.find(p => p.product_id === productId);
          const ex = sessionItems.find(i => i.product_id === productId);
          if (ex) {
            const newQty = ex.quantity_received + 1;
            const { error } = await supabase.from("receiving_items").update({ quantity_received: newQty }).eq("id", ex.id);
            if (!error) setSessionItems(prev => prev.map(i => i.id === ex.id ? { ...i, quantity_received: newQty } : i));
          } else {
            const { data: itemData, error: itemErr } = await supabase.from("receiving_items").insert({
              business_id: businessId,
              receiving_session_id: activeReceivingSession!.id,
              product_id: productId,
              quantity_received: 1,
              unit_cost: resolved?.cost_price ?? 0,
            }).select("id, product_id, quantity_received, unit_cost").single();
            if (!itemErr && itemData) setSessionItems(prev => [...prev, itemData as { id: string; product_id: string; quantity_received: number; unit_cost: number }]);
          }
          playScanBeep(true);
        },
        onSkipped: () => {},
      });
      return;
    }

    playScanBeep(true);
    setHighlightedProductId(product.product_id);
    if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current);
    highlightTimerRef.current = setTimeout(() => setHighlightedProductId(null), 1000);
    if (lastScannedTimerRef.current) clearTimeout(lastScannedTimerRef.current);

    const existing = sessionItems.find(i => i.product_id === product.product_id);
    if (existing) {
      const newQty = existing.quantity_received + 1;
      setSessionItems(prev => prev.map(i => i.id === existing.id ? { ...i, quantity_received: newQty } : i));
      setLastScannedProduct({ name: product.product_name, qty: newQty });
      lastScannedTimerRef.current = setTimeout(() => setLastScannedProduct(null), 2000);
      setMessage({ text: `${product.product_name} scanned (+1, total: ${newQty})`, type: "success" });
      const { error } = await supabase.from("receiving_items").update({ quantity_received: newQty }).eq("id", existing.id);
      if (error) {
        console.error("[ReceivingSession] Update qty error:", error);
        setSessionItems(prev => prev.map(i => i.id === existing.id ? { ...i, quantity_received: newQty - 1 } : i));
        setMessage({ text: "Failed to save quantity: " + error.message, type: "error" });
      }
    } else {
      const tempId = `temp-${Date.now()}`;
      const itemCost = product.cost_price ?? 0;
      setSessionItems(prev => [...prev, { id: tempId, product_id: product.product_id, quantity_received: 1, unit_cost: itemCost }]);
      setLastScannedProduct({ name: product.product_name, qty: 1 });
      lastScannedTimerRef.current = setTimeout(() => setLastScannedProduct(null), 2000);
      setMessage({ text: `${product.product_name} scanned (+1)`, type: "success" });
      const { data, error } = await supabase.from("receiving_items").insert({
        business_id: businessId,
        receiving_session_id: activeReceivingSession.id,
        product_id: product.product_id,
        quantity_received: 1,
        unit_cost: itemCost,
      }).select("id, product_id, quantity_received, unit_cost").single();
      if (error) {
        console.error("[ReceivingSession] Insert item error:", error);
        setSessionItems(prev => prev.filter(i => i.id !== tempId));
        setMessage({ text: "Failed to add item: " + error.message, type: "error" });
      } else {
        setSessionItems(prev => prev.map(i => i.id === tempId ? { ...i, id: (data as { id: string }).id } : i));
      }
    }
  }

  async function handleSessionItemCostChange(itemId: string, newCost: number) {
    const item = sessionItems.find(i => i.id === itemId);
    if (!item) return;
    const totalCost = newCost * item.quantity_received;
    setSessionItems(prev => prev.map(i => i.id === itemId ? { ...i, unit_cost: newCost } : i));
    const { error } = await supabase.from("receiving_items").update({ unit_cost: newCost, total_cost: totalCost }).eq("id", itemId);
    if (error) {
      console.error("[ReceivingSession] Cost update error:", error);
      setSessionItems(prev => prev.map(i => i.id === itemId ? { ...i, unit_cost: item.unit_cost } : i));
      setMessage({ text: "Failed to save cost: " + error.message, type: "error" });
    }
  }

  async function handleSessionItemQty(itemId: string, delta: number) {
    const item = sessionItems.find(i => i.id === itemId);
    if (!item) return;
    const newQty = item.quantity_received + delta;
    if (newQty <= 0) { await handleSessionItemRemove(itemId); return; }
    const { error } = await supabase.from("receiving_items").update({ quantity_received: newQty }).eq("id", itemId);
    if (error) { console.error("[ReceivingSession] Qty update error:", error); setMessage({ text: "Failed to update quantity: " + error.message, type: "error" }); return; }
    setSessionItems(prev => prev.map(i => i.id === itemId ? { ...i, quantity_received: newQty } : i));
  }

  async function handleSessionItemRemove(itemId: string) {
    const { error } = await supabase.from("receiving_items").delete().eq("id", itemId);
    if (error) { console.error("[ReceivingSession] Remove item error:", error); setMessage({ text: "Failed to remove item: " + error.message, type: "error" }); return; }
    setSessionItems(prev => prev.filter(i => i.id !== itemId));
  }

  async function loadBatches() {
    setIsLoadingBatches(true);
    // Show batches from any non-cancelled session, plus manually-entered batches (no session).
    // Cancelled sessions are excluded to prevent phantom dashboard entries from aborted receives.
    // RLS scopes both queries to the authenticated user's business — no explicit businessId filter needed.
    const { data: liveSessions } = await supabase
      .from("receiving_sessions")
      .select("id")
      .neq("status", "cancelled");
    const liveIds = (liveSessions ?? []).map(s => s.id);
    const orFilter = liveIds.length > 0
      ? `receiving_session_id.is.null,receiving_session_id.in.(${liveIds.join(",")})`
      : "receiving_session_id.is.null";
    const { data, error } = await supabase
      .from("inventory_batches")
      .select("*, products(name)")
      .or(orFilter)
      .order("expiration_date", { ascending: true, nullsFirst: false });
    if (error) { console.error("[Batches] Load error:", error); setIsLoadingBatches(false); return; }
    const rows = ((data as (InventoryBatch & { products: { name: string } | null })[]) || []).map(r => ({
      ...r,
      product_name: r.products?.name ?? "",
    }));
    setBatches(rows);
    setIsLoadingBatches(false);
  }

  async function handleWriteOffBatch(batch: InventoryBatch, qtyToWriteOff: number) {
    if (!businessId || qtyToWriteOff <= 0 || qtyToWriteOff > batch.quantity_remaining) return;
    setIsWritingOffBatch(true);
    const newRemaining = batch.quantity_remaining - qtyToWriteOff;
    const newStatus = newRemaining <= 0 ? "expired" : batch.status;
    const { error: batchErr } = await supabase
      .from("inventory_batches")
      .update({ quantity_remaining: newRemaining, status: newStatus })
      .eq("id", batch.id);
    if (batchErr) { console.error("[WriteOff] Batch update error:", batchErr); setMessage({ text: "Failed to update batch: " + batchErr.message, type: "error" }); setIsWritingOffBatch(false); return; }
    const product = products.find(p => p.product_id === batch.product_id);
    if (product) {
      const qtyBefore = product.quantity_on_hand;
      const qtyAfter = Math.max(0, qtyBefore - qtyToWriteOff);
      const { error: invErr } = await supabase.from("inventory").update({ quantity_on_hand: qtyAfter }).eq("id", product.inventory_id);
      if (invErr) { console.error("[WriteOff] Inventory update error:", invErr); }
      const reasonParts: string[] = ["Batch expiry write-off"];
      if (batch.lot_number) reasonParts.push(`Lot: ${batch.lot_number}`);
      if (batch.batch_number) reasonParts.push(`Batch: ${batch.batch_number}`);
      if (batch.expiration_date) reasonParts.push(`Exp: ${batch.expiration_date}`);
      await supabase.from("inventory_transactions").insert({
        business_id: businessId,
        product_id: batch.product_id,
        transaction_type: "expired",
        quantity_change: -qtyToWriteOff,
        quantity_before: qtyBefore,
        quantity_after: qtyAfter,
        reason: reasonParts.join(" — "),
        reference_id: batch.id,
      });
    }
    setWriteOffBatchId(null);
    setWriteOffQty("");
    setIsWritingOffBatch(false);
    setMessage({ text: `Write-off recorded: ${qtyToWriteOff} units expired`, type: "success" });
    await loadBatches();
    await loadProducts();
    await loadTransactions();
  }

  async function handlePostReceivingSession() {
    if (!activeReceivingSession || sessionItems.length === 0 || isPostingSession) return;
    // Guard 2: check for a completed session with the same invoice_number + supplier (req 5)
    if (activeReceivingSession.invoice_number) {
      let dupQ = supabase
        .from("receiving_sessions")
        .select("id, invoice_number")
        .eq("business_id", businessId)
        .eq("invoice_number", activeReceivingSession.invoice_number)
        .eq("status", "completed")
        .neq("id", activeReceivingSession.id);
      if (activeReceivingSession.supplier_id) dupQ = dupQ.eq("supplier_id", activeReceivingSession.supplier_id);
      const { data: dupCompleted } = await dupQ.limit(1).maybeSingle();
      if (dupCompleted) {
        const confirmed = window.confirm(`Invoice ${activeReceivingSession.invoice_number} has already been received in a completed session. Post this duplicate receiving anyway?`);
        if (!confirmed) return;
      }
    }
    // Guard 1: verify receiving_items on screen belong to the active session
    const { data: dbItems, error: verifyErr } = await supabase
      .from("receiving_items")
      .select("id, receiving_session_id")
      .in("id", sessionItems.map(i => i.id));
    if (verifyErr) { setMessage({ text: "Could not verify session items before posting", type: "error" }); return; }
    const wrongSession = (dbItems ?? []).find(r => r.receiving_session_id !== activeReceivingSession.id);
    if (wrongSession) {
      console.error("[PostReceiving] Session mismatch — items belong to", wrongSession.receiving_session_id, "not", activeReceivingSession.id);
      setMessage({ text: "Session mismatch detected — please refresh and try again", type: "error" });
      return;
    }
    setIsPostingSession(true);
    try {
      // Flush any in-memory cost edits that onBlur may have missed (e.g. if the user
      // typed a cost and immediately clicked Post without leaving the field).
      await Promise.all(
        sessionItems.map(item =>
          supabase
            .from("receiving_items")
            .update({ unit_cost: item.unit_cost, total_cost: item.unit_cost * item.quantity_received })
            .eq("id", item.id)
        )
      );

      const { data: existingBatches } = await supabase
        .from("inventory_batches")
        .select("receiving_session_item_id")
        .eq("receiving_session_id", activeReceivingSession.id);
      const alreadyBatched = new Set((existingBatches ?? []).map(r => r.receiving_session_item_id).filter(Boolean) as string[]);
      const notes: string[] = [];
      for (const item of sessionItems) {
        const product = products.find(p => p.product_id === item.product_id);
        if (!product) {
          console.error("[ReceivingSession] Post: product not found", item.product_id);
          setMessage({ text: `Product not found for item ${item.product_id.slice(0, 8)}`, type: "error" });
          setIsPostingSession(false);
          return;
        }
        const qtyBefore = product.quantity_on_hand;
        const qtyAfter = qtyBefore + item.quantity_received;
        const oldAvgCost = product.average_cost ?? 0;
        const newAvgCost = qtyAfter > 0
          ? ((qtyBefore * oldAvgCost) + (item.quantity_received * item.unit_cost)) / qtyAfter
          : item.unit_cost;

        const { error: invError } = await supabase.from("inventory").update({ quantity_on_hand: qtyAfter }).eq("id", product.inventory_id);
        if (invError) {
          console.error("[ReceivingSession] Post: inventory update failed", { product_id: item.product_id, error: invError });
          setMessage({ text: `Failed to update stock for ${product.product_name}: ${invError.message}`, type: "error" });
          setIsPostingSession(false);
          return;
        }

        const { error: avgCostError } = await supabase.from("products").update({ average_cost: newAvgCost }).eq("id", item.product_id);
        if (avgCostError) { console.error("[ReceivingSession] Post: avg cost update failed", avgCostError); }

        const { error: txError } = await supabase.from("inventory_transactions").insert({
          business_id: product.business_id,
          product_id: item.product_id,
          transaction_type: "receiving",
          quantity_change: item.quantity_received,
          quantity_before: qtyBefore,
          quantity_after: qtyAfter,
          reason: "Receiving Session",
          reference_id: activeReceivingSession.id,
          created_by: null, // profiles table is empty; employee context tracked via reference_id
        });
        if (txError) {
          console.error("[ReceivingSession] Post: transaction insert failed", { product_id: item.product_id, error: txError });
          setMessage({ text: `Failed to record transaction for ${product.product_name}: ${txError.message}`, type: "error" });
          setIsPostingSession(false);
          return;
        }
        notes.push(`${product.product_name}: +${item.quantity_received}`);
        // Create batch record if any batch/expiry fields were provided and not already created
        const batchFields = sessionItemBatch[item.id] ?? {};
        if ((batchFields.expiration_date || batchFields.lot_number || batchFields.batch_number) && !alreadyBatched.has(item.id)) {
          const { error: batchErr } = await supabase.from("inventory_batches").insert({
            business_id: businessId,
            product_id: item.product_id,
            receiving_session_id: activeReceivingSession.id,
            receiving_session_item_id: item.id,
            supplier_id: activeReceivingSession.supplier_id ?? null,
            supplier_name: activeReceivingSession.supplier_name ?? null,
            batch_number: batchFields.batch_number || null,
            lot_number: batchFields.lot_number || null,
            manufactured_date: batchFields.manufactured_date || null,
            expiration_date: batchFields.expiration_date || null,
            quantity_received: item.quantity_received,
            quantity_remaining: item.quantity_received,
            unit_cost: item.unit_cost,
            status: "active",
          });
          if (batchErr) { console.error("[ReceivingSession] Post: batch insert failed", batchErr); setMessage({ text: "Warning: batch record not saved — " + batchErr.message, type: "error" }); }
        }
      }

      const { error: statusError } = await supabase.from("receiving_sessions").update({ status: "completed" }).eq("id", activeReceivingSession.id);
      if (statusError) {
        console.error("[ReceivingSession] Post: status update failed", statusError);
        setMessage({ text: "Inventory updated but failed to mark session as posted: " + statusError.message, type: "error" });
        setIsPostingSession(false);
        return;
      }

      setActiveReceivingSession(null);
      setSessionItems([]);
      setSessionItemBatch({});
      closeProductResolution();
      setMessage({ text: `Session posted: ${notes.join(", ")}`, type: "success" });
      await loadProducts();
      await loadTransactions();
      await loadSessionHistory();
      await loadBatches();
    } catch (err) {
      console.error("[ReceivingSession] Post: unexpected error", err);
      setMessage({ text: "Post receiving failed unexpectedly", type: "error" });
    } finally {
      setIsPostingSession(false);
    }
  }

  async function processSmartReceiveInvoice(file: File): Promise<{ supplier: string; invoiceNumber: string; invoiceDate: string; items: { description: string; quantity: number; unitCost: number; batchNumber?: string | null; expirationDate?: string | null }[]; freight: number; additionalCost: number; invoiceTotal: number }> {
    // Read file as base64 in the browser
    const base64Data = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve((reader.result as string).split(",")[1]);
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsDataURL(file);
    });

    const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
    const mediaType = isPdf ? "application/pdf" : (file.type || "image/jpeg");

    // Call the Supabase Edge Function — API key stays server-side
    const { data, error } = await supabase.functions.invoke("process-invoice", {
      body: { base64Data, mediaType, isPdf },
    });

    if (error) throw new Error(`Edge Function error: ${error.message}`);
    if (data?.error) throw new Error(`Invoice processing failed: ${data.error}`);

    return data as { supplier: string; invoiceNumber: string; invoiceDate: string; items: { description: string; quantity: number; unitCost: number; batchNumber?: string | null; expirationDate?: string | null }[]; freight: number; additionalCost: number; invoiceTotal: number };
  }

  async function handleCreateSmartProduct() {
    if (smartReceivePendingIdx === null || !smartReceiveNewName.trim()) return;
    setIsSavingSmartProduct(true);
    const costPrice = parseFloat(smartReceiveNewCost) || 0;
    const sellingPrice = parseFloat(smartReceiveNewSelling) || 0;
    const { data: prod, error: prodErr } = await supabase
      .from("products")
      .insert({ business_id: businessId, name: smartReceiveNewName.trim(), selling_price: sellingPrice, cost_price: costPrice, average_cost: costPrice, status: "active" })
      .select("id")
      .single();
    if (prodErr) { console.error("[SmartReceive] create product error:", prodErr); setMessage({ text: "Failed to create product: " + prodErr.message, type: "error" }); setIsSavingSmartProduct(false); return; }
    const { error: invErr } = await supabase.from("inventory").insert({ business_id: businessId, product_id: prod.id, quantity_on_hand: 0 });
    if (invErr) { console.error("[SmartReceive] create inventory error:", invErr); }
    await loadProducts();
    setSmartReceiveMatches(prev => prev.map((m, j) => j === smartReceivePendingIdx ? prod.id : m));
    setSmartReceivePendingIdx(null);
    setSmartReceiveNewName("");
    setSmartReceiveNewSelling("");
    setSmartReceiveNewCost("");
    setIsSavingSmartProduct(false);
    setMessage({ text: `Product "${smartReceiveNewName.trim()}" created and matched`, type: "success" });
  }

  async function handleCreateSmartReceivingSession(forceCreate = false) {
    if (!smartReceiveResult || isCreatingSmartSession) return;
    setIsCreatingSmartSession(true);
    // Use only the explicitly resolved supplier (auto-matched or manually selected by the user).
    // No name-match fallback — that would silently override "Continue Unlinked" intent.
    const resolvedSupplierId = smartReceiveLinkedSupplierId || null;
    // ── Duplicate invoice guard (req 1 & 2) ──
    if (!forceCreate && smartReceiveResult.invoiceNumber) {
      let dupQuery = supabase
        .from("receiving_sessions")
        .select("id, status")
        .eq("business_id", businessId)
        .eq("invoice_number", smartReceiveResult.invoiceNumber)
        .in("status", ["draft", "completed"]);
      if (resolvedSupplierId) dupQuery = dupQuery.eq("supplier_id", resolvedSupplierId);
      const { data: dupRows } = await dupQuery.limit(1).maybeSingle();
      if (dupRows) {
        setSmartReceiveDuplicateWarning({ existingSessionId: dupRows.id, existingStatus: dupRows.status, invoiceNumber: smartReceiveResult.invoiceNumber });
        setIsCreatingSmartSession(false);
        return;
      }
    }
    // Compute totals for the session invoice fields
    const itemsTotal = smartReceiveResult.items.reduce((s, item) => s + item.quantity * item.unitCost, 0);
    const calculatedTotal = Math.round((itemsTotal + smartReceiveResult.freight + smartReceiveResult.additionalCost) * 100) / 100;
    const varianceAmount = Math.round((smartReceiveResult.invoiceTotal - calculatedTotal) * 100) / 100;
    const invoiceStatus = Math.abs(varianceAmount) <= 0.01 ? "matched" : "variance";
    const { data: session, error: sessErr } = await supabase
      .from("receiving_sessions")
      .insert({
        business_id: businessId,
        supplier_id: resolvedSupplierId,
        supplier_name: smartReceiveResult.supplier || null, // always preserve extracted name
        status: "draft",
        invoice_number: smartReceiveResult.invoiceNumber || null,
        invoice_date: smartReceiveResult.invoiceDate || null,
        invoice_total: smartReceiveResult.invoiceTotal || 0,
        freight_cost: smartReceiveResult.freight || 0,
        additional_cost: smartReceiveResult.additionalCost || 0,
        calculated_total: calculatedTotal,
        variance_amount: varianceAmount,
        invoice_status: invoiceStatus,
        approved_by: invoiceStatus === "matched" ? "auto" : null,
        approved_at: invoiceStatus === "matched" ? new Date().toISOString() : null,
        approval_note: invoiceStatus === "matched" ? "Automatically approved — invoice matched" : null,
      })
      .select("id, business_id, supplier_id, received_by, status, notes, created_at, invoice_number, supplier_name")
      .single();
    if (sessErr) { console.error("[SmartReceive] session create error:", sessErr); setMessage({ text: "Failed to create session: " + sessErr.message, type: "error" }); setIsCreatingSmartSession(false); return; }
    // Insert receiving items for every matched product — return IDs so we can key sessionItemBatch
    const itemsWithIdx = smartReceiveResult.items
      .map((item, i) => ({ item, matchId: smartReceiveMatches[i], origIdx: i }))
      .filter(({ matchId }) => matchId && matchId !== "new");
    const itemsToInsert = itemsWithIdx.map(({ item, matchId }) => ({
      business_id: businessId,
      receiving_session_id: session.id,
      product_id: matchId,
      quantity_received: item.quantity,
      unit_cost: item.unitCost,
    }));
    const { error: itemsErr } = await supabase
      .from("receiving_items")
      .insert(itemsToInsert);
    if (itemsErr) { console.error("[SmartReceive] items insert error:", itemsErr); setMessage({ text: "Failed to create session items: " + itemsErr.message, type: "error" }); setIsCreatingSmartSession(false); return; }
    // Fetch created receiving_items by session ID (product_id match avoids positional ordering
    // assumptions and bypasses any RETURNING/RLS issue). Insert inventory_batches rows immediately
    // so the data is persisted regardless of React state lifetime. Also populate sessionItemBatch
    // so the session view can display the expiry fields.
    if (smartReceiveItemBatch.length > 0) {
      const { data: createdItems } = await supabase
        .from("receiving_items")
        .select("id, product_id")
        .eq("receiving_session_id", session.id);
      if (createdItems && createdItems.length > 0) {
        const batchTransfer: Record<string, { batch_number: string; lot_number: string; manufactured_date: string; expiration_date: string }> = {};
        const batchInserts: { business_id: string; product_id: string; receiving_session_id: string; receiving_session_item_id: string; supplier_id: string | null; supplier_name: string | null; batch_number: string | null; lot_number: string | null; manufactured_date: string | null; expiration_date: string | null; quantity_received: number; quantity_remaining: number; unit_cost: number; status: string }[] = [];
        itemsWithIdx.forEach(({ item, matchId, origIdx }) => {
          const bf = smartReceiveItemBatch[origIdx];
          const ri = createdItems.find(r => r.product_id === matchId);
          if (ri && bf && (bf.expiration_date || bf.lot_number || bf.batch_number || bf.manufactured_date)) {
            batchTransfer[ri.id] = bf;
            batchInserts.push({
              business_id: businessId,
              product_id: ri.product_id,
              receiving_session_id: session.id,
              receiving_session_item_id: ri.id,
              supplier_id: (session as { supplier_id?: string | null }).supplier_id ?? null,
              supplier_name: (session as { supplier_name?: string | null }).supplier_name ?? null,
              batch_number: bf.batch_number || null,
              lot_number: bf.lot_number || null,
              manufactured_date: bf.manufactured_date || null,
              expiration_date: bf.expiration_date || null,
              quantity_received: item.quantity,
              quantity_remaining: item.quantity,
              unit_cost: item.unitCost,
              status: "active",
            });
          }
        });
        if (batchInserts.length > 0) {
          const { error: batchErr } = await supabase.from("inventory_batches").insert(batchInserts);
          if (batchErr) { console.error("[SmartReceive] batch insert error:", batchErr); }
        }
        if (Object.keys(batchTransfer).length > 0) {
          setSessionItemBatch(batchTransfer);
        }
      }
    }
    // Directly set the session we just created — never query by "newest draft"
    // which could silently return a different/older draft if timing is off
    setActiveReceivingSession({
      id: session.id,
      business_id: session.business_id,
      supplier_id: session.supplier_id ?? null,
      received_by: session.received_by ?? null,
      status: session.status,
      notes: session.notes ?? null,
      created_at: session.created_at,
      invoice_number: (session as { invoice_number?: string | null }).invoice_number ?? null,
      supplier_name: (session as { supplier_name?: string | null }).supplier_name ?? null,
    });
    // Reset all other session state
    closeProductResolution();
    setLastScannedProduct(null);
    setHighlightedProductId(null);
    // Close Smart Receive modal and navigate to Inventory
    setSmartReceiveSimpleOpen(false);
    setSmartReceiveFile(null);
    setSmartReceiveProcessing(false);
    setSmartReceiveResult(null);
    setSmartReceiveLoading(false);
    setSmartReceiveMatches([]);
    setSmartReceivePendingIdx(null);
    setSmartReceiveLinkedSupplierId("");
    setShowSmartSupplierOverridePicker(false);
    setShowSmartSupplierAdvanced(false);
    setSmartReceiveItemBatch([]);
    setActiveTab("inventory");
    setIsCreatingSmartSession(false);
    setMessage({ text: `Draft receiving session created — review and click Post Receiving`, type: "success" });
    // Load items for exactly the session we just created (not the newest draft)
    await loadSessionItems(session.id);
    await loadSessionHistory();
    await loadBatches();
  }

  function handleRapidReceiveScan(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key !== "Enter") return;
    e.preventDefault();
    const code = e.currentTarget.value.trim();
    setRapidReceiveInput("");
    if (!code) return;

    const product = products.find((p) => String(p.barcode || "").trim() === code);
    if (!product) {
      playScanBeep(false);
      openProductResolution({
        barcode: code,
        onResolved: async (productId) => {
          const resolved = products.find(p => p.product_id === productId);
          if (!resolved || (resolved.average_cost ?? 0) <= 0) {
            setRapidReceiveExceptions(prev => prev.some(ex => ex.barcode === code) ? prev : [...prev, { barcode: code, reason: `${resolved?.product_name ?? "Product"} — no cost price configured` }]);
            return;
          }
          setRapidReceiveItems(prev => {
            const existing = prev.find(i => i.product_id === productId);
            if (existing) return prev.map(i => i.product_id === productId ? { ...i, quantity: i.quantity + 1 } : i);
            return [...prev, { product_id: productId, product_name: resolved.product_name, barcode: code, quantity: 1 }];
          });
          playScanBeep(true);
        },
        onSkipped: () => {},
      });
      return;
    }
    if ((product.average_cost ?? 0) <= 0) {
      setRapidReceiveExceptions(prev => {
        if (prev.some(ex => ex.barcode === code)) return prev;
        return [...prev, { barcode: code, reason: `${product.product_name} — no cost price configured` }];
      });
      setMessage({ text: `${product.product_name} has no cost price — add to exception list`, type: "error" });
      return;
    }

    setRapidReceiveItems(prev => {
      const existing = prev.find(i => i.product_id === product.product_id);
      if (existing) return prev.map(i => i.product_id === product.product_id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { product_id: product.product_id, product_name: product.product_name, barcode: code, quantity: 1 }];
    });
    setMessage({ text: `${product.product_name} scanned (+1)`, type: "success" });
  }

  async function handlePostRapidReceive() {
    if (rapidReceiveItems.length === 0 || isPostingRapidReceive) return;
    setIsPostingRapidReceive(true);
    try {
      const notes: string[] = [];
      for (const item of rapidReceiveItems) {
        const product = products.find(p => p.product_id === item.product_id);
        if (!product) {
          console.error("[RapidReceive] Product not found in local state:", item.product_id, item.product_name);
          continue;
        }
        const qtyBefore = product.quantity_on_hand;
        const qtyAfter = qtyBefore + item.quantity;

        const { error: invError } = await supabase.from("inventory").update({ quantity_on_hand: qtyAfter }).eq("id", product.inventory_id);
        if (invError) {
          console.error("[RapidReceive] Inventory update failed:", { product_id: item.product_id, business_id: product.business_id, inventory_id: product.inventory_id, qtyBefore, qtyAfter, error: invError });
          setMessage({ text: `Failed to update stock for ${item.product_name}: ${invError.message}`, type: "error" });
          setIsPostingRapidReceive(false);
          return;
        }

        const { error: txError } = await supabase.from("inventory_transactions").insert({
          business_id: product.business_id,
          product_id: item.product_id,
          transaction_type: "receiving",
          quantity_change: item.quantity,
          quantity_before: qtyBefore,
          quantity_after: qtyAfter,
          reason: "Rapid Receive",
          created_by: null, // profiles table is empty; employee context not applicable here
        });
        if (txError) {
          console.error("[RapidReceive] Transaction insert failed:", { product_id: item.product_id, business_id: product.business_id, quantity: item.quantity, qtyBefore, qtyAfter, error: txError });
          setMessage({ text: `Failed to record transaction for ${item.product_name}: ${txError.message}`, type: "error" });
          setIsPostingRapidReceive(false);
          return;
        }

        notes.push(`${item.product_name}: +${item.quantity}`);
      }
      setRapidReceiveItems([]);
      setRapidReceiveExceptions([]);
      setMessage({ text: `Received: ${notes.join(", ")}`, type: "success" });
      await loadProducts();
      await loadTransactions();
    } catch (err) {
      console.error("[RapidReceive] Unexpected error:", err);
      setMessage({ text: "Rapid receive failed unexpectedly", type: "error" });
    } finally {
      setIsPostingRapidReceive(false);
    }
  }

  async function handleReceive(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);

    const quantity = Number(receiveQuantity);

    if (!selectedProductId || !quantity || quantity <= 0) {
      return;
    }

    const product = products.find((p) => p.product_id === selectedProductId);

    if (!product) {
      return;
    }

    const { error: txError } = await supabase
      .from("inventory_transactions")
      .insert({
        business_id: product.business_id,
        product_id: product.product_id,
        transaction_type: "receiving",
        quantity_change: quantity,
        quantity_before: product.quantity_on_hand,
        quantity_after: product.quantity_on_hand + quantity,
        reason: null,
      });

    if (txError) {
      console.error(txError);
      return;
    }

    const { error: updateError } = await supabase
      .from("inventory")
      .update({ quantity_on_hand: product.quantity_on_hand + quantity })
      .eq("id", product.inventory_id);

    if (updateError) {
      console.error(updateError);
      return;
    }

    setReceiveQuantity("");
    setMessage({ text: "Inventory received successfully", type: "success" });
    await loadProducts();
    await loadTransactions();
  }

  async function handleAdjust(e: React.FormEvent) {
    e.preventDefault();
    if (!canAdjustInventory) return;
    setMessage(null);

    const qty = Number(adjustQuantity);

    if (!adjustProductId || !adjustQuantity || isNaN(qty) || qty === 0) {
      return;
    }

    const product = products.find((p) => p.product_id === adjustProductId);

    if (!product) {
      return;
    }

    const reductionTypes = ["damaged", "expired", "lost"];
    const increaseTypes = ["found"];
    const delta = reductionTypes.includes(adjustType) ? -Math.abs(qty)
      : increaseTypes.includes(adjustType) ? Math.abs(qty)
      : qty;

    const quantityBefore = product.quantity_on_hand;
    const quantityAfter = quantityBefore + delta;

    if (quantityAfter < 0) {
      setMessage({ text: `Cannot adjust: resulting stock would be ${quantityAfter}. Current stock: ${quantityBefore}.`, type: "error" });
      return;
    }

    const txType = adjustType === "found" ? "correction" : adjustType;
    const reasonParts = [adjustType === "found" ? "Found/correction" : adjustType];
    if (adjustReason) reasonParts.push(adjustReason);
    if (adjustNotes) reasonParts.push(`Notes: ${adjustNotes}`);

    const { error: txError } = await supabase
      .from("inventory_transactions")
      .insert({
        business_id: product.business_id,
        product_id: product.product_id,
        transaction_type: txType,
        quantity_change: delta,
        quantity_before: quantityBefore,
        quantity_after: quantityAfter,
        reason: reasonParts.join(" — "),
      });

    if (txError) {
      console.error(txError);
      setMessage({ text: "Adjustment failed: " + txError.message, type: "error" });
      return;
    }

    const { error: updateError } = await supabase
      .from("inventory")
      .update({ quantity_on_hand: quantityAfter })
      .eq("id", product.inventory_id);

    if (updateError) {
      console.error(updateError);
      setMessage({ text: "Inventory update failed: " + updateError.message, type: "error" });
      return;
    }

    setAdjustQuantity("");
    setAdjustReason("");
    setAdjustNotes("");
    setMessage({ text: `Inventory adjusted: ${product.product_name} ${delta > 0 ? "+" : ""}${delta} (${quantityBefore} → ${quantityAfter})`, type: "success" });
    await loadProducts();
    await loadTransactions();
  }

  return (
    <div className="app-root">
      <div className="app-header">
        <div className="app-header-brand">
          <img
            src="/logo.png"
            alt={businessName || "Wegn-Store"}
            className="app-logo"
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
          />
          <div className="app-brand-text">
            <span className="app-brand-name">{businessName || "Wegn-Store"}</span>
          </div>
        </div>
        <button
          className="hamburger-btn"
          onClick={() => setNavOpen(o => !o)}
          aria-label="Toggle navigation"
          aria-expanded={navOpen}
        >
          {navOpen ? '✕' : '☰'}
        </button>
        <nav className={`app-nav${navOpen ? ' app-nav-open' : ''}`}>
          {([
            ['dashboard', 'Dashboard'],
            ['pos', 'POS'],
            ['inventory', 'Inventory'],
            ['purchasing', 'Purchasing'],
            ['customers', 'Customers'],
            ['employees', 'Staff'],
            ['reports', 'Reports'],
            ['settings', 'Settings'],
          ] as [string, string][]).filter(([key]) => allowedTabs.includes(key)).map(([key, label]) => (
            <button
              key={key}
              onClick={() => { setActiveTab(key); setNavOpen(false); }}
              style={{
                padding: "8px 14px",
                background: activeTab === key ? "#1d4ed8" : "transparent",
                color: activeTab === key ? "#fff" : "#64748b",
                border: "1px solid",
                borderColor: activeTab === key ? "#1d4ed8" : "transparent",
                borderRadius: "6px",
                cursor: "pointer",
                fontWeight: activeTab === key ? "600" : "normal",
                fontSize: "14px",
                transition: "background 0.15s, color 0.15s, border-color 0.15s",
                boxShadow: activeTab === key ? "0 1px 4px rgba(29,78,216,0.2)" : "none",
              }}
            >
              {label}
            </button>
          ))}
          <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: "8px", marginTop: "4px", display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            <span style={{ fontSize: "11px", fontWeight: 600, padding: "2px 8px", borderRadius: "12px", background: "#eff6ff", color: "#1d4ed8", whiteSpace: "nowrap", textTransform: "uppercase", letterSpacing: "0.05em" }}>{userRole.replace('_', ' ')}</span>
            {staffSession && <span style={{ fontSize: "12px", color: "#64748b" }}>{staffSession.name}</span>}
            {staffSession ? (
              <button
                onClick={() => { handleStaffLogout(); setNavOpen(false); }}
                style={{ padding: "6px 14px", fontSize: "13px", cursor: "pointer", background: "#fef3c7", color: "#92400e", border: "1px solid #fde68a", borderRadius: "5px", fontWeight: 500, whiteSpace: "nowrap" }}
              >
                Switch User
              </button>
            ) : (
              <button
                onClick={onSignOut}
                style={{ padding: "6px 14px", fontSize: "13px", cursor: "pointer", background: "#fee2e2", color: "#b91c1c", border: "1px solid #fca5a5", borderRadius: "5px", fontWeight: 500, whiteSpace: "nowrap" }}
              >
                Sign Out
              </button>
            )}
          </div>
        </nav>
      </div>

      {message && (
        <div style={{
          padding: "10px 16px",
          background: message.type === "error" ? "#fef2f2" : "#f0fdf4",
          color: message.type === "error" ? "#b91c1c" : "#15803d",
          border: `1px solid ${message.type === "error" ? "#fecaca" : "#bbf7d0"}`,
          borderRadius: "6px", fontSize: "14px", marginBottom: "16px",
        }}>
          {message.text}
        </div>
      )}

      {businessLoaded && !businessId && (
        <div style={{ maxWidth: "480px", margin: "40px auto", padding: "32px", background: "#fff", border: "1px solid #e2e8f0", borderRadius: "12px", boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}>
          <h2 style={{ margin: "0 0 8px", fontSize: "22px", color: "#0f172a" }}>Set Up Your Business</h2>
          <p style={{ margin: "0 0 24px", color: "#64748b", fontSize: "14px" }}>
            {businessError
              ? `Unable to load business data: ${businessError}`
              : "Create your business profile to get started."}
          </p>
          <form onSubmit={handleCreateBusiness} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <input type="text" placeholder="Business name *" value={editBizName} onChange={(e) => setEditBizName(e.target.value)} required style={{ padding: "10px 12px", border: "1px solid #d1d5db", borderRadius: "6px", fontSize: "14px" }} />
            <input type="text" placeholder="Phone (optional)" value={editBizPhone} onChange={(e) => setEditBizPhone(e.target.value)} style={{ padding: "10px 12px", border: "1px solid #d1d5db", borderRadius: "6px", fontSize: "14px" }} />
            <input type="email" placeholder="Email (optional)" value={editBizEmail} onChange={(e) => setEditBizEmail(e.target.value)} style={{ padding: "10px 12px", border: "1px solid #d1d5db", borderRadius: "6px", fontSize: "14px" }} />
            <input type="text" placeholder="Address (optional)" value={editBizAddress} onChange={(e) => setEditBizAddress(e.target.value)} style={{ padding: "10px 12px", border: "1px solid #d1d5db", borderRadius: "6px", fontSize: "14px" }} />
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <input type="number" min="0" max="100" step="0.01" placeholder="Tax rate %" value={editBizTaxRate} onChange={(e) => setEditBizTaxRate(e.target.value)} style={{ padding: "10px 12px", border: "1px solid #d1d5db", borderRadius: "6px", fontSize: "14px", width: "150px" }} />
              <span style={{ fontSize: "13px", color: "#64748b" }}>% Sales tax (0 = no tax)</span>
            </div>
            <button type="submit" style={{ padding: "10px", background: "#1d4ed8", color: "#fff", border: "none", borderRadius: "6px", fontSize: "15px", fontWeight: 600, cursor: "pointer", marginTop: "4px" }}>Create Business</button>
          </form>
        </div>
      )}

      {businessId && !staffSession && !ownerBypass && employees.some(e => e.pin && e.status === "active") && (
        <div style={{ maxWidth: "380px", margin: "40px auto", padding: "32px", background: "#fff", border: "1px solid #e2e8f0", borderRadius: "12px", boxShadow: "0 4px 24px rgba(0,0,0,0.06)", textAlign: "center" }}>
          <h2 style={{ margin: "0 0 4px", fontSize: "22px", color: "#0f172a" }}>Staff Login</h2>
          <p style={{ margin: "0 0 24px", color: "#64748b", fontSize: "14px" }}>Enter your PIN to start your shift</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px", alignItems: "center" }}>
            <input
              type="password"
              inputMode="numeric"
              maxLength={6}
              placeholder="Enter PIN"
              value={pinInput}
              onChange={(e) => { setPinInput(e.target.value.replace(/\D/g, "")); setPinError(""); }}
              onKeyDown={(e) => { if (e.key === "Enter") handlePinLogin(); }}
              autoFocus
              style={{ padding: "12px 16px", border: "1px solid #d1d5db", borderRadius: "8px", fontSize: "24px", textAlign: "center", width: "180px", letterSpacing: "0.3em" }}
            />
            {pinError && <p style={{ margin: 0, color: "#b91c1c", fontSize: "13px" }}>{pinError}</p>}
            <button onClick={handlePinLogin} disabled={!pinInput} style={{ padding: "10px 32px", background: pinInput ? "#1d4ed8" : "#ccc", color: "#fff", border: "none", borderRadius: "6px", fontSize: "15px", fontWeight: 600, cursor: pinInput ? "pointer" : "not-allowed" }}>
              Clock In
            </button>
            <button onClick={() => setOwnerBypass(true)} style={{ padding: "8px 20px", background: "none", border: "none", color: "#64748b", cursor: "pointer", fontSize: "13px", marginTop: "8px" }}>
              Continue as Owner
            </button>
          </div>
        </div>
      )}

      {businessId && !allowedTabs.includes(activeTab) && (
        <div style={{ maxWidth: "480px", margin: "60px auto", textAlign: "center", padding: "32px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "12px" }}>
          <h2 style={{ margin: "0 0 8px", fontSize: "20px", color: "#b91c1c" }}>Access Restricted</h2>
          <p style={{ margin: 0, color: "#7f1d1d", fontSize: "14px" }}>You do not have permission to access this area.</p>
        </div>
      )}

      {/* ── POS TAB ── */}
      <div style={{ display: activeTab === 'pos' && businessId && appUnlocked ? '' : 'none' }}>

      <div className="page-header">
        <h2 className="page-title">Point of Sale</h2>
        <p className="page-subtitle">Scan items, process sales, manage returns and receipts</p>
      </div>

      {/* Drawer status bar — always visible */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "10px 16px", borderRadius: "8px", marginBottom: "16px", flexWrap: "wrap", gap: "8px",
        background: drawerSession ? "#f0fdf4" : "#fef2f2",
        border: `1px solid ${drawerSession ? "#bbf7d0" : "#fecaca"}`,
      }}>
        {!drawerSession ? (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#dc2626", display: "inline-block", flexShrink: 0 }} />
              <span style={{ fontWeight: 600, color: "#dc2626", fontSize: "14px" }}>Drawer Closed</span>
            </div>
            <form onSubmit={handleOpenDrawer} style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
              <input
                type="number" min="0" step="0.01" placeholder="Opening float ($)"
                value={openingFloat} onChange={(e) => setOpeningFloat(e.target.value)}
                style={{ padding: "6px 10px", width: "150px", fontSize: "13px", border: "1px solid #fca5a5", borderRadius: "6px" }}
              />
              <button type="submit" disabled={drawerLoading || !openingFloat}
                style={{ padding: "6px 16px", fontWeight: 600, fontSize: "13px", background: drawerLoading || !openingFloat ? "#fca5a5" : "#dc2626", color: "#fff", border: "none", borderRadius: "6px", cursor: drawerLoading || !openingFloat ? "not-allowed" : "pointer" }}
              >
                {drawerLoading ? "Opening…" : "Open Drawer"}
              </button>
            </form>
          </>
        ) : (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#16a34a", display: "inline-block", flexShrink: 0 }} />
                <span style={{ fontWeight: 600, color: "#15803d", fontSize: "14px" }}>Drawer Open</span>
              </div>
              {drawerSession.cashier_id && (
                <span style={{ fontSize: "13px", color: "#374151" }}>
                  Cashier: <strong>{employees.find(e => e.id === drawerSession.cashier_id)?.name ?? "Unknown"}</strong>
                </span>
              )}
              <span style={{ fontSize: "13px", color: "#374151" }}>
                Opened: <strong>{new Date(drawerSession.opened_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</strong>
              </span>
              <span style={{ fontSize: "13px", color: "#374151" }}>
                Float: <strong>${Number(drawerSession.opening_float).toFixed(2)}</strong>
              </span>
            </div>
            {!posDrawerCloseOpen ? (
              <button onClick={() => setPosDrawerCloseOpen(true)}
                style={{ padding: "6px 14px", fontSize: "13px", fontWeight: 600, background: "#fff", color: "#374151", border: "1px solid #d1d5db", borderRadius: "6px", cursor: "pointer" }}
              >
                Close Drawer
              </button>
            ) : (
              <form onSubmit={handleCloseDrawer} style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
                <input
                  type="number" min="0" step="0.01" placeholder="Counted cash ($)"
                  value={closingCount} onChange={(e) => setClosingCount(e.target.value)}
                  style={{ padding: "6px 10px", width: "150px", fontSize: "13px", border: "1px solid #d1d5db", borderRadius: "6px" }}
                />
                <button type="submit" disabled={drawerLoading || !closingCount}
                  style={{ padding: "6px 14px", fontWeight: 600, fontSize: "13px", background: drawerLoading || !closingCount ? "#9ca3af" : "#15803d", color: "#fff", border: "none", borderRadius: "6px", cursor: drawerLoading || !closingCount ? "not-allowed" : "pointer" }}
                >
                  {drawerLoading ? "Closing…" : "Confirm Close"}
                </button>
                <button type="button" onClick={() => { setPosDrawerCloseOpen(false); setClosingCount(""); }}
                  style={{ padding: "6px 12px", fontSize: "13px", background: "none", border: "1px solid #d1d5db", borderRadius: "6px", cursor: "pointer", color: "#374151" }}
                >
                  Cancel
                </button>
              </form>
            )}
          </>
        )}
      </div>

      <div className="pos-card">
      <input
        type="text"
        autoFocus
        placeholder="Scan barcode or type and press Enter"
        value={barcodeInput}
        onChange={(e) => setBarcodeInput(e.target.value)}
        onKeyDown={handleBarcodeSubmit}
        className="pos-barcode-input"
      />

      {unmatchedBarcode && (() => {
        const selectedProduct = linkBarcodeProductId ? products.find(p => p.product_id === linkBarcodeProductId) : null;
        return (
        <div style={{ padding: "12px 16px", marginBottom: "12px", background: "#fffbeb", border: "1px solid #fde68a", borderRadius: "8px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: linkBarcodeMode ? "12px" : "0" }}>
            <span style={{ fontSize: "14px", color: "#92400e" }}>Scanner worked. Barcode not found in catalog: <strong>{unmatchedBarcode}</strong></span>
            <button onClick={() => { setUnmatchedBarcode(""); setLinkBarcodeMode(false); setLinkBarcodeProductId(""); }} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "16px", color: "#6b7280" }}>✕</button>
          </div>
          {!linkBarcodeMode ? (
            <div style={{ display: "flex", gap: "8px", marginTop: "10px" }}>
              <button
                onClick={() => { setBarcodeAutoFill(unmatchedBarcode); setNewBarcode(unmatchedBarcode); setUnmatchedBarcode(""); setActiveTab("inventory"); }}
                style={{ padding: "6px 16px", background: "#1d4ed8", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: 600, fontSize: "13px" }}
              >Add New Product</button>
              <button
                onClick={() => setLinkBarcodeMode(true)}
                style={{ padding: "6px 16px", background: "#fff", color: "#1d4ed8", border: "1px solid #1d4ed8", borderRadius: "6px", cursor: "pointer", fontWeight: 600, fontSize: "13px" }}
              >Link to Existing Product</button>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
                <select value={linkBarcodeProductId} onChange={(e) => setLinkBarcodeProductId(e.target.value)} style={{ padding: "8px", flex: "1 1 200px", fontSize: "13px" }}>
                  <option value="">Select product...</option>
                  {products.map(p => (
                    <option key={p.product_id} value={p.product_id}>{p.product_name}{p.sku ? ` — ${p.sku}` : ""}{p.barcode ? ` — barcode: ${p.barcode}` : ""}</option>
                  ))}
                </select>
                <button onClick={handleLinkBarcode} disabled={!linkBarcodeProductId} style={{ padding: "6px 16px", background: linkBarcodeProductId ? "#1d4ed8" : "#ccc", color: "#fff", border: "none", borderRadius: "6px", cursor: linkBarcodeProductId ? "pointer" : "not-allowed", fontWeight: 600, fontSize: "13px" }}>Save</button>
                <button onClick={() => { setLinkBarcodeMode(false); setLinkBarcodeProductId(""); }} style={{ padding: "6px 16px", background: "#fff", border: "1px solid #ccc", borderRadius: "6px", cursor: "pointer", fontSize: "13px" }}>Cancel</button>
              </div>
              {selectedProduct?.barcode && (
                <div style={{ padding: "8px 12px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "6px", fontSize: "13px", color: "#b91c1c" }}>
                  This product already has barcode: <strong>{selectedProduct.barcode}</strong>. Linking will replace it with: <strong>{unmatchedBarcode}</strong>.
                </div>
              )}
            </div>
          )}
        </div>
        );
      })()}

      <form
        onSubmit={handleAddToCart}
        style={{ display: "flex", flexWrap: "wrap", gap: "12px", alignItems: "center", marginBottom: "16px" }}
      >
        <select
          value={cartProductId}
          onChange={(e) => setCartProductId(e.target.value)}
          style={{ flex: "2 1 200px", padding: "8px" }}
        >
          <option value="">Select product...</option>
          {products.filter((p) => p.quantity_on_hand > 0 && p.status === "active").map((p) => (
            <option key={p.product_id} value={p.product_id}>
              {p.product_name} — ${p.selling_price.toFixed(2)} (stock: {p.quantity_on_hand})
            </option>
          ))}
        </select>
        <input
          type="number"
          min="1"
          placeholder="Qty"
          value={cartQty}
          onChange={(e) => setCartQty(e.target.value)}
          style={{ flex: "0 1 80px", padding: "8px" }}
        />
        <button type="submit" className="pos-add-btn" style={{ flex: "0 1 120px" }}>
          Add to Cart
        </button>
      </form>

      {employees.filter(e => e.status === "active").length > 0 && (
        <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "16px" }}>
          <select
            value={activeCashierId ?? ""}
            onChange={(e) => {
              const emp = employees.find(em => em.id === e.target.value);
              setActiveCashierId(emp ? emp.id : null);
              setActiveCashierName(emp ? emp.name : "");
            }}
            style={{ padding: "8px", flex: "1 1 200px", borderColor: !activeCashierId ? "#dc2626" : "#ccc" }}
          >
            <option value="">— Select cashier —</option>
            {employees.filter(e => e.status === "active").map(e => (
              <option key={e.id} value={e.id}>{e.name} ({e.role})</option>
            ))}
          </select>
          {activeCashierName && (
            <span style={{ color: "#1d4ed8", fontWeight: "bold" }}>Cashier: {activeCashierName}</span>
          )}
        </div>
      )}

      <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "16px" }}>
        <input
          type="text"
          placeholder="Customer name or phone"
          value={posCustomerPhone}
          onChange={(e) => { setPosCustomerPhone(e.target.value); setPosCustomerId(null); setPosCustomerName(""); }}
          style={{ padding: "8px", width: "220px" }}
        />
        <button type="button" onClick={handleLookupCustomer} style={{ padding: "8px 14px" }}>
          Lookup
        </button>
        {posCustomerName && (
          <span style={{ color: "#15803d", fontWeight: "bold" }}>
            {posCustomerName}
            {` — ${posCustomerLoyaltyBalance} pts`}
          </span>
        )}
      </div>
      </div>

      {cart.length > 0 && (
        <div style={{ marginBottom: "32px" }}>
          <div style={{ overflowX: "auto", marginBottom: "12px" }}>
            <table border={1} cellPadding={10} style={{ width: "100%" }}>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Qty</th>
                  <th>Unit Price</th>
                  <th>Line Total</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {cart.map((item) => {
                  const product = products.find(p => p.product_id === item.product_id);
                  const isNegotiating = negotiatingProductId === item.product_id;
                  const wasNegotiated = item.unit_price !== item.original_unit_price;
                  const avgCost = product?.average_cost ?? 0;
                  const hasCost = avgCost > 0;
                  const overheadPct = product?.estimated_overhead_pct ?? 0;
                  const breakEven = avgCost * (1 + overheadPct / 100);
                  const minMarginPct = product?.minimum_margin_percent;
                  const targetMarginPct = product?.target_margin_percent;
                  const minSafe = minMarginPct != null ? breakEven * (1 + minMarginPct / 100) : breakEven;
                  const targetPrice = targetMarginPct != null ? breakEven * (1 + targetMarginPct / 100) : item.original_unit_price;
                  return (
                  <React.Fragment key={item.product_id}>
                  <tr>
                    <td>{item.product_name}</td>
                    <td>{item.quantity}</td>
                    <td>
                      ${item.unit_price.toFixed(2)}
                      {wasNegotiated && (() => {
                        const diff = item.unit_price - item.original_unit_price;
                        const diffColor = diff < 0 ? "#dc2626" : diff > 0 ? "#15803d" : "#64748b";
                        const diffLabel = diff < 0 ? `-$${Math.abs(diff).toFixed(2)}` : diff > 0 ? `+$${diff.toFixed(2)}` : "$0.00";
                        return (
                        <div style={{ fontSize: "11px", color: "#64748b" }}>
                          <span style={{ textDecoration: "line-through" }}>${item.original_unit_price.toFixed(2)}</span>
                          {" "}
                          <span style={{ color: diffColor }}>{diffLabel}</span>
                        </div>
                        );
                      })()}
                    </td>
                    <td>${item.line_total.toFixed(2)}</td>
                    <td style={{ whiteSpace: "nowrap" }}>
                      <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                      {sellingPolicy !== "fixed_pricing" && (
                        <button
                          onClick={() => {
                            if (isNegotiating) { setNegotiatingProductId(null); setNegotiatePrice(""); setNegotiateReason(""); }
                            else { setNegotiatingProductId(item.product_id); setNegotiatePrice(String(item.unit_price)); setNegotiateReason(item.negotiation_reason ?? ""); }
                          }}
                          title="Negotiate price"
                          style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "6px 12px", fontSize: "12px", fontWeight: 500, cursor: "pointer", background: isNegotiating ? "#1d4ed8" : wasNegotiated ? "#dbeafe" : "none", color: isNegotiating ? "#fff" : "#1d4ed8", border: "1px solid #93c5fd", borderRadius: "6px", transition: "background 0.15s" }}
                          onMouseEnter={(e) => { if (!isNegotiating) e.currentTarget.style.background = "#eff6ff"; }}
                          onMouseLeave={(e) => { if (!isNegotiating) e.currentTarget.style.background = wasNegotiated ? "#dbeafe" : "none"; }}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                          {wasNegotiated ? "Edit Negotiation" : "Negotiate"}
                        </button>
                      )}
                      <button
                        onClick={() => handleRemoveFromCart(item.product_id)}
                        title="Remove from cart"
                        style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "6px 12px", fontSize: "12px", fontWeight: 500, cursor: "pointer", background: "none", color: "#dc2626", border: "1px solid #fca5a5", borderRadius: "6px", transition: "background 0.15s" }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "#fef2f2")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
                        Remove
                      </button>
                      </div>
                    </td>
                  </tr>
                  {isNegotiating && (() => {
                    const np = Number(negotiatePrice) || 0;
                    const expectedProfit = hasCost ? np - breakEven : null;
                    const marginPct = hasCost && np > 0 ? ((np - breakEven) / np) * 100 : null;
                    const statusColor = !hasCost ? "#64748b" : np >= targetPrice ? "#15803d" : np >= minSafe ? "#b45309" : np >= breakEven ? "#ea580c" : "#dc2626";
                    const statusBg = !hasCost ? "#f8fafc" : np >= targetPrice ? "#f0fdf4" : np >= minSafe ? "#fffbeb" : np >= breakEven ? "#fff7ed" : "#fef2f2";
                    const statusBorder = !hasCost ? "#e2e8f0" : np >= targetPrice ? "#86efac" : np >= minSafe ? "#fde68a" : np >= breakEven ? "#fdba74" : "#fecaca";
                    const statusLabel = !hasCost ? "No cost data" : np >= targetPrice ? "Target Achieved" : np >= minSafe ? "Safe Margin" : np >= breakEven ? "Low Margin" : "Below Cost";
                    return (
                    <tr>
                      <td colSpan={5} style={{ padding: 0, border: "none" }}>
                        <div style={{ padding: "16px 20px", background: "#fff", borderTop: "2px solid #e2e8f0", borderBottom: "2px solid #e2e8f0" }}>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                            <div style={{ fontWeight: 700, fontSize: "15px", color: "#0f172a" }}>Pricing Coach — {item.product_name}</div>
                            <button
                              onClick={() => { setNegotiatingProductId(null); setNegotiatePrice(""); setNegotiateReason(""); }}
                              style={{ padding: "4px 10px", fontSize: "12px", cursor: "pointer", background: "none", border: "1px solid #cbd5e1", borderRadius: "6px", color: "#64748b" }}
                            >Close</button>
                          </div>

                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
                            <div>
                              <label style={{ fontSize: "13px", fontWeight: 700, color: "#334155", display: "block", marginBottom: "6px" }}>Negotiated Unit Price</label>
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={negotiatePrice}
                                onChange={(e) => setNegotiatePrice(e.target.value)}
                                autoFocus
                                style={{ width: "100%", padding: "12px 14px", fontSize: "20px", fontWeight: 700, border: `2px solid ${statusBorder}`, borderRadius: "8px", background: statusBg, color: statusColor, outline: "none", boxSizing: "border-box" }}
                              />
                              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "8px", padding: "8px 12px", background: statusBg, border: `1px solid ${statusBorder}`, borderRadius: "6px" }}>
                                <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: statusColor, flexShrink: 0 }} />
                                <span style={{ fontSize: "13px", fontWeight: 600, color: statusColor }}>{statusLabel}</span>
                                {hasCost && expectedProfit != null && marginPct != null && (
                                  <span style={{ fontSize: "12px", color: "#64748b", marginLeft: "auto" }}>
                                    Profit ${expectedProfit.toFixed(2)} &middot; Margin {marginPct.toFixed(1)}%
                                  </span>
                                )}
                              </div>

                              <div style={{ marginTop: "12px" }}>
                                <label style={{ fontSize: "13px", fontWeight: 600, color: "#334155", display: "block", marginBottom: "4px" }}>Reason</label>
                                <select
                                  value={["Bulk discount", "Loyal customer", "Price match", "Damaged packaging", "Clearance"].includes(negotiateReason) ? negotiateReason : negotiateReason ? "__custom__" : ""}
                                  onChange={(e) => { if (e.target.value === "__custom__") { setNegotiateReason(""); } else { setNegotiateReason(e.target.value); } }}
                                  style={{ width: "100%", padding: "8px 10px", fontSize: "13px", border: "1px solid #cbd5e1", borderRadius: "6px", marginBottom: "4px", background: "#fff" }}
                                >
                                  <option value="">Select a reason...</option>
                                  <option value="Bulk discount">Bulk discount</option>
                                  <option value="Loyal customer">Loyal customer</option>
                                  <option value="Price match">Price match</option>
                                  <option value="Damaged packaging">Damaged packaging</option>
                                  <option value="Clearance">Clearance</option>
                                  <option value="__custom__">Other (type below)</option>
                                </select>
                                {!["Bulk discount", "Loyal customer", "Price match", "Damaged packaging", "Clearance", ""].includes(negotiateReason) && (
                                  <input
                                    type="text"
                                    placeholder="Enter custom reason"
                                    value={negotiateReason}
                                    onChange={(e) => setNegotiateReason(e.target.value)}
                                    style={{ width: "100%", padding: "8px 10px", fontSize: "13px", border: "1px solid #cbd5e1", borderRadius: "6px", boxSizing: "border-box" }}
                                  />
                                )}
                              </div>
                            </div>

                            <div style={{ padding: "12px 14px", background: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                              <div style={{ fontSize: "12px", fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px" }}>Price Reference</div>
                              {!hasCost && (
                                <div style={{ padding: "8px 10px", background: "#fffbeb", border: "1px solid #fde68a", borderRadius: "6px", marginBottom: "8px", fontSize: "12px", color: "#92400e" }}>
                                  Cost price not configured. Pricing guidance is unavailable.
                                </div>
                              )}
                              <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "6px 16px", fontSize: "13px", color: "#475569" }}>
                                <div>Listed price</div><div style={{ textAlign: "right", fontWeight: 600, color: "#0f172a" }}>${item.original_unit_price.toFixed(2)}</div>
                                <div>Average cost</div><div style={{ textAlign: "right", fontWeight: 600 }}>{hasCost ? `$${avgCost.toFixed(2)}` : "Not set"}</div>
                                <div>Overhead</div><div style={{ textAlign: "right", fontWeight: 600 }}>{overheadPct}%</div>
                                {hasCost && <>
                                  <div>Break-even</div><div style={{ textAlign: "right", fontWeight: 600 }}>${breakEven.toFixed(2)}</div>
                                  <div>Minimum safe</div><div style={{ textAlign: "right", fontWeight: 600 }}>${minSafe.toFixed(2)}</div>
                                  <div>Target price</div><div style={{ textAlign: "right", fontWeight: 600 }}>${targetPrice.toFixed(2)}</div>
                                </>}
                              </div>
                            </div>
                          </div>

                          <div style={{ display: "flex", gap: "8px" }}>
                            <button
                              onClick={() => {
                                const price = Math.max(0, Number(negotiatePrice) || 0);
                                const reason = negotiateReason.trim() || null;
                                const isNeg = price !== item.original_unit_price;
                                setCart(cart.map(c => c.product_id === item.product_id ? {
                                  ...c,
                                  unit_price: price,
                                  line_total: c.quantity * price,
                                  negotiation_reason: isNeg ? reason : null,
                                  negotiated_by: isNeg ? (activeCashierId || null) : null,
                                } : c));
                                setNegotiatingProductId(null);
                                setNegotiatePrice("");
                                setNegotiateReason("");
                              }}
                              style={{ flex: 1, padding: "10px 16px", fontSize: "13px", fontWeight: 600, cursor: "pointer", background: "#1d4ed8", color: "#fff", border: "none", borderRadius: "6px" }}
                            >Apply Price</button>
                            <button
                              onClick={() => {
                                setCart(cart.map(c => c.product_id === item.product_id ? {
                                  ...c,
                                  unit_price: c.original_unit_price,
                                  line_total: c.quantity * c.original_unit_price,
                                  negotiation_reason: null,
                                  negotiated_by: null,
                                } : c));
                                setNegotiatingProductId(null);
                                setNegotiatePrice("");
                                setNegotiateReason("");
                              }}
                              style={{ padding: "10px 16px", fontSize: "13px", cursor: "pointer", background: "none", border: "1px solid #cbd5e1", borderRadius: "6px" }}
                            >Reset to Listed</button>
                            <button
                              onClick={() => { setNegotiatingProductId(null); setNegotiatePrice(""); setNegotiateReason(""); }}
                              style={{ padding: "10px 16px", fontSize: "13px", cursor: "pointer", background: "none", border: "1px solid #cbd5e1", borderRadius: "6px" }}
                            >Cancel</button>
                          </div>
                        </div>
                      </td>
                    </tr>
                    );
                  })()}
                  </React.Fragment>
                  );
                })}
              </tbody>
              <tfoot>
                {(() => {
                  const subtotal = cart.reduce((s, c) => s + c.line_total, 0);
                  const discountVal = Math.max(0, Number(posDiscountValue) || 0);
                  const rawDiscountAmt = posDiscountType === "percent"
                    ? subtotal * (discountVal / 100)
                    : discountVal;
                  const discountAmt = rawDiscountAmt > subtotal ? 0 : rawDiscountAmt;
                  const tfDiscountedSubtotal = subtotal - discountAmt;
                  const tfTaxAmt = Math.round(tfDiscountedSubtotal * (businessTaxRate / 100) * 100) / 100;
                  const tfCustBal = posCustomerId
                    ? loyaltyTransactions.filter(lt => lt.customer_id === posCustomerId).reduce((s, lt) => s + lt.points, 0)
                    : 0;
                  const tfRedeemPts = posCustomerId
                    ? Math.min(Math.max(0, Math.floor(Number(posRedeemPoints) || 0)), tfCustBal)
                    : 0;
                  const redeemDollar = tfRedeemPts / 100;
                  const finalTotal = Math.max(0, tfDiscountedSubtotal + tfTaxAmt - redeemDollar);
                  return (
                    <>
                      <tr>
                        <td colSpan={3} style={{ textAlign: "right" }}>Subtotal</td>
                        <td>${subtotal.toFixed(2)}</td>
                        <td></td>
                      </tr>
                      {discountAmt > 0 && (
                        <tr>
                          <td colSpan={3} style={{ textAlign: "right", color: "#16a34a" }}>Discount</td>
                          <td style={{ color: "#16a34a" }}>−${discountAmt.toFixed(2)}</td>
                          <td></td>
                        </tr>
                      )}
                      {tfTaxAmt > 0 && (
                        <tr>
                          <td colSpan={3} style={{ textAlign: "right", color: "#b45309" }}>Tax ({businessTaxRate}%)</td>
                          <td style={{ color: "#b45309" }}>${tfTaxAmt.toFixed(2)}</td>
                          <td></td>
                        </tr>
                      )}
                      {tfRedeemPts > 0 && (
                        <tr>
                          <td colSpan={3} style={{ textAlign: "right", color: "#7c3aed" }}>Points ({tfRedeemPts} pts)</td>
                          <td style={{ color: "#7c3aed" }}>−${redeemDollar.toFixed(2)}</td>
                          <td></td>
                        </tr>
                      )}
                      <tr>
                        <td colSpan={3} style={{ fontWeight: "bold", textAlign: "right" }}>Total</td>
                        <td style={{ fontWeight: "bold" }}>${finalTotal.toFixed(2)}</td>
                        <td></td>
                      </tr>
                    </>
                  );
                })()}
              </tfoot>
            </table>
          </div>

          {/* Discount controls */}
          {(() => {
            const dSubtotal = cart.reduce((s, c) => s + c.line_total, 0);
            const dVal = Math.max(0, Number(posDiscountValue) || 0);
            const dAmt = posDiscountType === "percent" ? dSubtotal * (dVal / 100) : dVal;
            const discountExceeds = posDiscountValue !== "" && dAmt > dSubtotal;
            return (
              <div style={{ display: "flex", gap: "10px", alignItems: "center", marginBottom: "12px", flexWrap: "wrap" }}>
                <span style={{ fontWeight: "bold", fontSize: "13px" }}>Discount:</span>
                <select
                  value={posDiscountType}
                  onChange={(e) => { setPosDiscountType(e.target.value as "percent" | "fixed"); setPosDiscountValue(""); }}
                  style={{ padding: "6px 8px", fontSize: "13px" }}
                >
                  <option value="percent">% Off</option>
                  <option value="fixed">$ Off</option>
                </select>
                <input
                  type="number"
                  min="0"
                  step={posDiscountType === "percent" ? "1" : "0.01"}
                  max={posDiscountType === "percent" ? "100" : undefined}
                  placeholder={posDiscountType === "percent" ? "e.g. 10" : "e.g. 2.00"}
                  value={posDiscountValue}
                  onChange={(e) => setPosDiscountValue(e.target.value)}
                  style={{ width: "110px", padding: "6px 8px", fontSize: "13px", borderColor: discountExceeds ? "#dc2626" : undefined }}
                />
                {discountExceeds && (
                  <span style={{ fontSize: "13px", color: "#dc2626", fontWeight: "bold" }}>Discount exceeds sale amount.</span>
                )}
                {posDiscountValue && (
                  <button onClick={() => setPosDiscountValue("")} style={{ padding: "4px 10px", fontSize: "12px", cursor: "pointer" }}>
                    Clear
                  </button>
                )}
              </div>
            );
          })()}

          {/* Redeem loyalty points */}
          {posCustomerId && (() => {
            const custBal = posCustomerLoyaltyBalance;
            const rawRedeem = Math.max(0, Math.floor(Number(posRedeemPoints) || 0));
            const redeemExceeds = posRedeemPoints !== "" && rawRedeem > custBal;
            const redeemVal = Math.min(rawRedeem, custBal);
            return (
              <div style={{ display: "flex", gap: "10px", alignItems: "center", marginBottom: "12px", flexWrap: "wrap" }}>
                <span style={{ fontWeight: "bold", fontSize: "13px", color: "#7c3aed" }}>Redeem Points:</span>
                <span style={{ fontSize: "12px", color: "#888" }}>{custBal} available · 100 pts = $1.00</span>
                <input
                  type="number"
                  min="0"
                  max={custBal}
                  step="1"
                  placeholder="e.g. 100"
                  value={posRedeemPoints}
                  onChange={(e) => setPosRedeemPoints(e.target.value)}
                  style={{ width: "100px", padding: "6px 8px", fontSize: "13px", borderColor: redeemExceeds ? "#dc2626" : undefined }}
                />
                {redeemExceeds && (
                  <span style={{ fontSize: "13px", color: "#dc2626", fontWeight: "bold" }}>Exceeds available points ({custBal})</span>
                )}
                {!redeemExceeds && redeemVal > 0 && (
                  <span style={{ fontSize: "13px", color: "#7c3aed" }}>= −${(redeemVal / 100).toFixed(2)}</span>
                )}
                {posRedeemPoints && (
                  <button onClick={() => setPosRedeemPoints("")} style={{ padding: "4px 10px", fontSize: "12px", cursor: "pointer" }}>
                    Clear
                  </button>
                )}
              </div>
            );
          })()}

          <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", alignItems: "center" }}>
            <span style={{ fontWeight: "bold" }}>Payment:</span>
            <select
              value={paymentMethod}
              onChange={(e) => { setPaymentMethod(e.target.value); setPaymentRef(""); }}
              style={{ padding: "8px", fontSize: "14px" }}
            >
              <option value="cash">Cash</option>
              <option value="card">Card</option>
              <option value="telebirr">Telebirr</option>
              <option value="cbe_birr">CBE Birr</option>
              <option value="chapa">Chapa</option>
              <option value="mtn_mobile">MTN Mobile Money</option>
              <option value="airtel_money">Airtel Money</option>
              <option value="other">Other (specify)</option>
            </select>
            {paymentMethod !== "cash" && paymentMethod !== "card" && (
              <input
                type="text"
                placeholder={paymentMethod === "other" ? "Specify payment method *" : "Reference / phone (optional)"}
                value={paymentRef}
                onChange={(e) => setPaymentRef(e.target.value)}
                required={paymentMethod === "other"}
                style={{ width: "200px", padding: "8px" }}
              />
            )}
            {paymentMethod === "cash" && (() => {
              const subtotal = cart.reduce((s, c) => s + c.line_total, 0);
              const discountVal = Math.max(0, Number(posDiscountValue) || 0);
              const rawDiscountAmt = posDiscountType === "percent"
                ? subtotal * (discountVal / 100)
                : discountVal;
              const discountAmt = rawDiscountAmt > subtotal ? 0 : rawDiscountAmt;
              const cashDiscountedSubtotal = subtotal - discountAmt;
              const cashTaxAmt = Math.round(cashDiscountedSubtotal * (businessTaxRate / 100) * 100) / 100;
              const cashCustBal = posCustomerLoyaltyBalance;
              const cashRedeemPts = posCustomerId
                ? Math.min(Math.max(0, Math.floor(Number(posRedeemPoints) || 0)), cashCustBal)
                : 0;
              const finalTotal = Math.max(0, cashDiscountedSubtotal + cashTaxAmt - cashRedeemPts / 100);
              return (
                <>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Amount tendered"
                    value={amountTendered}
                    onChange={(e) => setAmountTendered(e.target.value)}
                    style={{ width: "150px", padding: "8px" }}
                  />
                  {Number(amountTendered) >= finalTotal && amountTendered !== "" && (
                    <span style={{ fontWeight: "bold", color: "#15803d" }}>
                      Change: ${(Number(amountTendered) - finalTotal).toFixed(2)}
                    </span>
                  )}
                </>
              );
            })()}
            {(() => {
              const btnSubtotal = cart.reduce((s, c) => s + c.line_total, 0);
              const btnDVal = Math.max(0, Number(posDiscountValue) || 0);
              const btnDAmt = posDiscountType === "percent" ? btnSubtotal * (btnDVal / 100) : btnDVal;
              const discountInvalid = posDiscountValue !== "" && btnDAmt > btnSubtotal;
              const redeemInvalid = posCustomerId && posRedeemPoints !== "" &&
                Math.max(0, Math.floor(Number(posRedeemPoints) || 0)) >
                loyaltyTransactions.filter(lt => lt.customer_id === posCustomerId).reduce((s, lt) => s + lt.points, 0);
              const blocked = cart.length === 0 || isCompletingSale || !!redeemInvalid || discountInvalid;
              return (
                <button
                  onClick={handleCompleteSale}
                  disabled={blocked}
                  style={{
                    padding: "10px 28px",
                    background: blocked ? "#94a3b8" : "#1d4ed8",
                    color: "#fff",
                    border: "none",
                    borderRadius: "6px",
                    cursor: blocked ? "not-allowed" : "pointer",
                    fontWeight: "bold",
                    fontSize: "15px",
                  }}
                >
                  Complete Sale
                </button>
              );
            })()}
          </div>
        </div>
      )}

      </div>{/* end pos */}

      {/* ── INVENTORY TAB ── */}
      <InventoryTab
        visible={activeTab === 'inventory' && !!businessId && appUnlocked}
        activeTab={activeTab}
        products={products}
        suppliers={suppliers}
        supplierMap={supplierMap}
        categories={categories}
        categoryMap={categoryMap}
        activeReceivingSession={activeReceivingSession}
        newSessionSupplierId={newSessionSupplierId} setNewSessionSupplierId={setNewSessionSupplierId}
        newSessionNotes={newSessionNotes} setNewSessionNotes={setNewSessionNotes}
        onStartReceivingSession={handleStartReceivingSession}
        isStartingSession={isStartingSession}
        setSmartReceiveSimpleOpen={setSmartReceiveSimpleOpen}
        sessionScanRef={sessionScanRef}
        sessionScanInput={sessionScanInput} setSessionScanInput={setSessionScanInput}
        onSessionScan={handleSessionScan}
        lastScannedProduct={lastScannedProduct}
        sessionItems={sessionItems} setSessionItems={setSessionItems}
        highlightedProductId={highlightedProductId}
        onSessionItemCostChange={handleSessionItemCostChange}
        onSessionItemQty={handleSessionItemQty}
        onSessionItemRemove={handleSessionItemRemove}
        sessionItemBatch={sessionItemBatch} setSessionItemBatch={setSessionItemBatch}
        productResolution={productResolution}
        onPostReceivingSession={handlePostReceivingSession}
        isPostingSession={isPostingSession}
        onCancelReceivingSession={handleCancelReceivingSession}
        onLoadBatches={loadBatches}
        isLoadingBatches={isLoadingBatches}
        batches={batches}
        writeOffBatchId={writeOffBatchId} setWriteOffBatchId={setWriteOffBatchId}
        writeOffQty={writeOffQty} setWriteOffQty={setWriteOffQty}
        isWritingOffBatch={isWritingOffBatch}
        onWriteOffBatch={handleWriteOffBatch}
        sessionHistory={sessionHistory}
        historyExpanded={historyExpanded} setHistoryExpanded={setHistoryExpanded}
        sessionHistoryItems={sessionHistoryItems}
        expandedHistorySessionId={expandedHistorySessionId} setExpandedHistorySessionId={setExpandedHistorySessionId}
        invoicePanelSessionId={invoicePanelSessionId} setInvoicePanelSessionId={setInvoicePanelSessionId}
        onLoadSessionHistoryItems={loadSessionHistoryItems}
        noLinkAcknowledgedSessions={noLinkAcknowledgedSessions} setNoLinkAcknowledgedSessions={setNoLinkAcknowledgedSessions}
        resolvingSupplierSessionId={resolvingSupplierSessionId} setResolvingSupplierSessionId={setResolvingSupplierSessionId}
        resolveMode={resolveMode} setResolveMode={setResolveMode}
        resolveSupplierPickId={resolveSupplierPickId} setResolveSupplierPickId={setResolveSupplierPickId}
        sessionPayments={sessionPayments}
        paymentPanelSessionId={paymentPanelSessionId} setPaymentPanelSessionId={setPaymentPanelSessionId}
        editPaymentDate={editPaymentDate} setEditPaymentDate={setEditPaymentDate}
        editPaymentAmount={editPaymentAmount} setEditPaymentAmount={setEditPaymentAmount}
        editPaymentMethod={editPaymentMethod} setEditPaymentMethod={setEditPaymentMethod}
        editPaymentReference={editPaymentReference} setEditPaymentReference={setEditPaymentReference}
        editPaymentNotes={editPaymentNotes} setEditPaymentNotes={setEditPaymentNotes}
        onLoadSessionPayments={loadSessionPayments}
        onSavePayment={handleSavePayment}
        isSavingPayment={isSavingPayment}
        resolveNewSupplierName={resolveNewSupplierName} setResolveNewSupplierName={setResolveNewSupplierName}
        onLinkSessionSupplier={handleLinkSessionSupplier}
        onCreateAndLinkSupplier={handleCreateAndLinkSupplier}
        isResolvingSupplier={isResolvingSupplier}
        editInvoiceNumber={editInvoiceNumber} setEditInvoiceNumber={setEditInvoiceNumber}
        editInvoiceDate={editInvoiceDate} setEditInvoiceDate={setEditInvoiceDate}
        editInvoiceTotal={editInvoiceTotal} setEditInvoiceTotal={setEditInvoiceTotal}
        editFreightCost={editFreightCost} setEditFreightCost={setEditFreightCost}
        editAdditionalCost={editAdditionalCost} setEditAdditionalCost={setEditAdditionalCost}
        onSaveInvoice={handleSaveInvoice}
        isSavingInvoice={isSavingInvoice}
        historyHasMore={historyHasMore}
        onLoadMoreHistory={handleLoadMoreHistory}
        isLoadingMoreHistory={isLoadingMoreHistory}
        rapidReceiveInput={rapidReceiveInput} setRapidReceiveInput={setRapidReceiveInput}
        onRapidReceiveScan={handleRapidReceiveScan}
        rapidReceiveItems={rapidReceiveItems} setRapidReceiveItems={setRapidReceiveItems}
        rapidReceiveExceptions={rapidReceiveExceptions} setRapidReceiveExceptions={setRapidReceiveExceptions}
        onPostRapidReceive={handlePostRapidReceive}
        isPostingRapidReceive={isPostingRapidReceive}
        onReceive={handleReceive}
        selectedProductId={selectedProductId} setSelectedProductId={setSelectedProductId}
        receiveQuantity={receiveQuantity} setReceiveQuantity={setReceiveQuantity}
        canAdjustInventory={canAdjustInventory}
        onAdjust={handleAdjust}
        adjustProductId={adjustProductId} setAdjustProductId={setAdjustProductId}
        adjustType={adjustType} setAdjustType={setAdjustType}
        adjustQuantity={adjustQuantity} setAdjustQuantity={setAdjustQuantity}
        adjustReason={adjustReason} setAdjustReason={setAdjustReason}
        adjustNotes={adjustNotes} setAdjustNotes={setAdjustNotes}
        canAddProducts={canAddProducts}
        onAddProduct={handleAddProduct}
        newName={newName} setNewName={setNewName}
        newSku={newSku} setNewSku={setNewSku}
        newBarcode={newBarcode} setNewBarcode={setNewBarcode}
        setBarcodeAutoFill={setBarcodeAutoFill}
        onBarcodeLookup={handleBarcodeLookup}
        newCostPrice={newCostPrice} setNewCostPrice={setNewCostPrice}
        newSellingPrice={newSellingPrice} setNewSellingPrice={setNewSellingPrice}
        newReorderLevel={newReorderLevel} setNewReorderLevel={setNewReorderLevel}
        newProductCategory={newProductCategory} setNewProductCategory={setNewProductCategory}
        newOverhead={newOverhead} setNewOverhead={setNewOverhead}
        newTargetMargin={newTargetMargin} setNewTargetMargin={setNewTargetMargin}
        newMinMargin={newMinMargin} setNewMinMargin={setNewMinMargin}
        newInitialStock={newInitialStock} setNewInitialStock={setNewInitialStock}
        barcodeAutoFill={barcodeAutoFill}
        canBulkImport={canBulkImport}
        onDownloadCsvTemplate={downloadCsvTemplate}
        onCsvUpload={handleCsvUpload}
        bulkPreview={bulkPreview}
        bulkImporting={bulkImporting}
        onBulkImport={handleBulkImport}
        bulkResults={bulkResults}
        lowStockProducts={lowStockProducts}
        needsOrderingSelected={needsOrderingSelected} setNeedsOrderingSelected={setNeedsOrderingSelected}
        needsOrderingQtys={needsOrderingQtys} setNeedsOrderingQtys={setNeedsOrderingQtys}
        onCreatePOFromNeedsOrdering={handleCreatePOFromNeedsOrdering}
        canManageCategories={canManageCategories}
        onAddCategory={handleAddCategory}
        newCatName={newCatName} setNewCatName={setNewCatName}
        newCatDesc={newCatDesc} setNewCatDesc={setNewCatDesc}
        editingCatId={editingCatId} setEditingCatId={setEditingCatId}
        onEditCategory={handleEditCategory}
        editCatName={editCatName} setEditCatName={setEditCatName}
        editCatDesc={editCatDesc} setEditCatDesc={setEditCatDesc}
        onToggleCategoryStatus={handleToggleCategoryStatus}
        onDeleteCategory={handleDeleteCategory}
        productsTableOpen={productsTableOpen} setProductsTableOpen={setProductsTableOpen}
        productSearchRef={productSearchRef}
        productSearch={productSearch} setProductSearch={setProductSearch}
        categoryChips={categoryChips}
        categoryFilter={categoryFilter} setCategoryFilter={setCategoryFilter}
        filteredProducts={filteredProducts}
        editingProductId={editingProductId} setEditingProductId={setEditingProductId}
        canEditProducts={canEditProducts}
        setEditProdName={setEditProdName}
        setEditProdSku={setEditProdSku}
        setEditProdBarcode={setEditProdBarcode}
        setEditProdPrice={setEditProdPrice}
        setEditProdReorder={setEditProdReorder}
        setEditProdOverhead={setEditProdOverhead}
        setEditProdTargetMargin={setEditProdTargetMargin}
        setEditProdMinMargin={setEditProdMinMargin}
        setEditProdCategory={setEditProdCategory}
        canDeactivateProducts={canDeactivateProducts}
        onToggleProductStatus={handleToggleProductStatus}
        onEditProduct={handleEditProduct}
        editProdName={editProdName}
        editProdSku={editProdSku}
        editProdBarcode={editProdBarcode}
        editProdPrice={editProdPrice}
        editProdReorder={editProdReorder}
        editProdCategory={editProdCategory}
        editProdOverhead={editProdOverhead}
        editProdTargetMargin={editProdTargetMargin}
        editProdMinMargin={editProdMinMargin}
        txHistoryOpen={txHistoryOpen} setTxHistoryOpen={setTxHistoryOpen}
        txDateRange={txDateRange} setTxDateRange={setTxDateRange}
        transactions={transactions}
        movementFilter={movementFilter} setMovementFilter={setMovementFilter}
        stockCountActive={stockCountActive}
        onStartCount={handleStartCount}
        stockCountLines={stockCountLines} setStockCountLines={setStockCountLines}
        onConfirmCount={handleConfirmCount}
        stockCountLoading={stockCountLoading}
        setStockCountActive={setStockCountActive}
        stockCountHistoryOpen={stockCountHistoryOpen} setStockCountHistoryOpen={setStockCountHistoryOpen}
        stockCounts={stockCounts}
        expandedCountId={expandedCountId} setExpandedCountId={setExpandedCountId}
        countItemsMap={countItemsMap}
        onLoadCountItems={loadCountItems}
      />{/* end inventory */}

      {/* ── DASHBOARD TAB ── */}
      <Dashboard
        visible={activeTab === 'dashboard' && !!businessId && appUnlocked}
        salesSummary={salesTodaySummary}
        purchasingSummary={purchasingDashboardSummary}
        customersSummary={customersDashboardSummary}
        inventorySummary={inventoryDashboardSummary}
        lowStockCount={lowStockProducts.length}
        recentSales={recentSales}
        drawerSession={drawerSession}
        employeeMap={employeeMap}
        onGoToReorderCenter={() => setActiveTab("purchasing")}
        onOpenPurchasing={() => setActiveTab("purchasing")}
        onViewInventory={() => setActiveTab("inventory")}
        onViewEodReport={() => { setActiveTab("employees"); if (!showEod) handleToggleEod(); }}
      />{/* end dashboard */}


      {/* ── PURCHASING TAB ── */}
      <PurchasingTab
        visible={activeTab === 'purchasing' && !!businessId && appUnlocked}
        suppliers={suppliers}
        supName={supName} setSupName={setSupName}
        supContact={supContact} setSupContact={setSupContact}
        supPhone={supPhone} setSupPhone={setSupPhone}
        supEmail={supEmail} setSupEmail={setSupEmail}
        supNotes={supNotes} setSupNotes={setSupNotes}
        onAddSupplier={handleAddSupplier}
        supplierListOpen={supplierListOpen} setSupplierListOpen={setSupplierListOpen}
        editingSupplierId={editingSupplierId}
        expandedCustomerId={expandedCustomerId} setExpandedCustomerId={setExpandedCustomerId}
        supplierPOMap={supplierPOMap}
        products={products}
        poItemsByPoId={poItemsByPoId}
        fmtPhone={fmtPhone}
        onStartEditSupplier={handleStartEditSupplier}
        onCancelEditSupplier={handleCancelEditSupplier}
        onToggleSupplierStatus={handleToggleSupplierStatus}
        onDeleteSupplier={handleDeleteSupplier}
        statementSupplierId={statementSupplierId} setStatementSupplierId={setStatementSupplierId}
        onLoadSupplierStatement={loadSupplierStatement}
        editSupName={editSupName} setEditSupName={setEditSupName}
        editSupContact={editSupContact} setEditSupContact={setEditSupContact}
        editSupPhone={editSupPhone} setEditSupPhone={setEditSupPhone}
        editSupEmail={editSupEmail} setEditSupEmail={setEditSupEmail}
        editSupNotes={editSupNotes} setEditSupNotes={setEditSupNotes}
        onSaveSupplier={handleSaveSupplier}
        isLoadingStatement={isLoadingStatement}
        supplierStatement={supplierStatement}
        getPrefQty={getPrefQty}
        savePrefQty={savePrefQty}
        onCreateCatalogPO={handleCreateCatalogPO}
        reorderSuppliers={reorderSuppliers} setReorderSuppliers={setReorderSuppliers}
        reorderFilter={reorderFilter} setReorderFilter={setReorderFilter}
        reorderSelected={reorderSelected} setReorderSelected={setReorderSelected}
        reorderQtys={reorderQtys} setReorderQtys={setReorderQtys}
        aiReorderRecs={aiReorderRecs}
        collapsedSuppliers={collapsedSuppliers} setCollapsedSuppliers={setCollapsedSuppliers}
        bulkSupplierId={bulkSupplierId} setBulkSupplierId={setBulkSupplierId}
        onBulkAssignSupplier={handleBulkAssignSupplier}
        onBatchReorderPO={handleBatchReorderPO}
        poSupplierId={poSupplierId} setPoSupplierId={setPoSupplierId}
        poNotes={poNotes} setPoNotes={setPoNotes}
        onCreatePO={handleCreatePO}
        poListOpen={poListOpen} setPoListOpen={setPoListOpen}
        purchaseOrders={purchaseOrders}
        poStatusFilter={poStatusFilter} setPoStatusFilter={setPoStatusFilter}
        showAllPOs={showAllPOs} setShowAllPOs={setShowAllPOs}
        selectedPoId={selectedPoId}
        poMoreOpen={poMoreOpen} setPoMoreOpen={setPoMoreOpen}
        onSelectPO={handleSelectPO}
        onMarkOrdered={handleMarkOrdered}
        receivingPoId={receivingPoId}
        onOpenReceive={handleOpenReceive}
        onDeletePO={handleDeletePO}
        onPrintPO={handlePrintPO}
        onEmailPO={handleEmailPO}
        setSignPoId={setSignPoId}
        setSignRole={setSignRole}
        onCancelPO={handleCancelPO}
        poItems={poItems}
        itemProductId={itemProductId} setItemProductId={setItemProductId}
        itemQuantity={itemQuantity} setItemQuantity={setItemQuantity}
        itemUnitCost={itemUnitCost} setItemUnitCost={setItemUnitCost}
        onAddPOItem={handleAddPOItem}
        onRemovePOItem={handleRemovePOItem}
        receivingItems={receivingItems}
        receiveQtys={receiveQtys} setReceiveQtys={setReceiveQtys}
        receiveDamagedQtys={receiveDamagedQtys} setReceiveDamagedQtys={setReceiveDamagedQtys}
        receiveExpiredQtys={receiveExpiredQtys} setReceiveExpiredQtys={setReceiveExpiredQtys}
        receiveRejectedQtys={receiveRejectedQtys} setReceiveRejectedQtys={setReceiveRejectedQtys}
        receiveUnitCosts={receiveUnitCosts} setReceiveUnitCosts={setReceiveUnitCosts}
        receiveLineNotes={receiveLineNotes} setReceiveLineNotes={setReceiveLineNotes}
        onConfirmReceive={handleConfirmReceive}
        isConfirmingReceive={isConfirmingReceive}
      />{/* end purchasing */}

      {/* ── CUSTOMERS TAB ── */}
      <CustomersTab
        visible={activeTab === 'customers' && !!businessId && appUnlocked}
        customers={customers}
        sales={sales}
        saleItems={saleItems}
        allPayments={allPayments}
        allReturnItems={allReturnItems}
        products={products}
        loyaltyTransactions={loyaltyTransactions}
        newCusName={newCusName}
        setNewCusName={setNewCusName}
        newCusPhone={newCusPhone}
        setNewCusPhone={setNewCusPhone}
        newCusEmail={newCusEmail}
        setNewCusEmail={setNewCusEmail}
        onAddCustomer={handleAddCustomer}
        customerListOpen={customerListOpen}
        setCustomerListOpen={setCustomerListOpen}
        expandedCustomerId={expandedCustomerId}
        setExpandedCustomerId={setExpandedCustomerId}
        editingCustomerId={editingCustomerId}
        setEditingCustomerId={setEditingCustomerId}
        editCusName={editCusName}
        setEditCusName={setEditCusName}
        editCusPhone={editCusPhone}
        setEditCusPhone={setEditCusPhone}
        editCusEmail={editCusEmail}
        setEditCusEmail={setEditCusEmail}
        onEditCustomer={handleEditCustomer}
        onToggleCustomerStatus={handleToggleCustomerStatus}
        onPrintReceipt={handlePrintReceipt}
      />{/* end customers */}



      {/* ── POS TAB (2) ── */}
      <div style={{ display: activeTab === 'pos' && businessId && appUnlocked ? '' : 'none' }}>

      <button
        onClick={() => setSalesHistoryOpen(o => !o)}
        style={{ marginTop: "32px", marginBottom: "8px", background: "none", border: "1px solid #e2e8f0", borderRadius: "6px", padding: "8px 16px", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", width: "100%" }}
      >
        <span style={{ fontSize: "16px" }}>{salesHistoryOpen ? "▼" : "▶"}</span>
        <h3 style={{ margin: 0 }}>Sales History</h3>
        <span style={{ fontSize: "13px", color: "#64748b" }}>
          ({salesDateRange === 'today' ? 'Today' : salesDateRange === '7d' ? 'Last 7 Days' : salesDateRange === '30d' ? 'Last 30 Days' : 'All Time'} — {sales.filter(s => s.status !== 'open').length} sales)
        </span>
      </button>
      {salesHistoryOpen && <>
      <input
        type="text"
        placeholder="Search receipt, product, barcode, or customer..."
        value={salesSearchQuery}
        onChange={e => setSalesSearchQuery(e.target.value)}
        style={{ width: "100%", padding: "9px 12px", fontSize: "13px", border: "1px solid #cbd5e1", borderRadius: "6px", marginBottom: "10px", boxSizing: "border-box" }}
      />
      <div style={{ marginBottom: "8px", display: "flex", gap: "8px", flexWrap: "wrap" }}>
        {([['today', 'Today'], ['7d', 'Last 7 Days'], ['30d', 'Last 30 Days'], ['all', 'All Time']] as [string, string][]).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setSalesDateRange(key as typeof salesDateRange)}
            style={{
              padding: "6px 14px", borderRadius: "6px", cursor: "pointer", fontSize: "13px",
              background: salesDateRange === key ? "#1d4ed8" : "#fff",
              color: salesDateRange === key ? "#fff" : "#333",
              border: salesDateRange === key ? "1px solid #1d4ed8" : "1px solid #ccc",
              fontWeight: salesDateRange === key ? "bold" : "normal",
            }}
          >{label}</button>
        ))}
      </div>

      {employees.length > 0 && (
        <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "12px" }}>
          <label style={{ fontSize: "14px", color: "#555" }}>Filter by cashier:</label>
          <select
            value={salesCashierFilter}
            onChange={(e) => setSalesCashierFilter(e.target.value)}
            style={{ padding: "6px 10px" }}
          >
            <option value="all">All cashiers</option>
            <option value="none">No cashier</option>
            {employees.map(e => (
              <option key={e.id} value={e.id}>{e.name}</option>
            ))}
          </select>
        </div>
      )}

      <div style={{ overflowX: "auto", marginBottom: "40px" }}>
        <table border={0} cellPadding={0} className="sh-table">
          <thead>
            <tr>
              <th>Sale ID</th>
              <th>Products</th>
              <th>Total</th>
              <th>Tax</th>
              <th>Status</th>
              <th>Cashier</th>
              <th>Created At</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {sales.length === 0 ? (
              <tr><td colSpan={8}>No sales yet</td></tr>
            ) : (
              filteredSalesHistory.map((s) => {
                const cashierName = s.cashier_id ? (employeeMap[s.cashier_id]?.name ?? s.cashier_id.slice(0, 8)) : "—";
                const rowClass = s.status === "voided" ? "sh-row-voided" : s.status === "returned" ? "sh-row-returned" : "";
                const lineItems = saleItemsBySaleId[s.id] ?? [];
                const productNames = lineItems.map(si => productIdMap[si.product_id]?.product_name ?? "—");
                const productsLabel = productNames.length === 0 ? "—"
                  : productNames.length === 1 ? productNames[0]
                  : `${productNames[0]} (+${productNames.length - 1} more)`;
                return (
                  <React.Fragment key={s.id}>
                    <tr className={rowClass}>
                      <td style={{ fontFamily: "monospace" }}>{s.id.slice(0, 8)}…</td>
                      <td style={{ fontSize: "12px", color: "#475569", maxWidth: "180px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={productNames.join(", ")}>{productsLabel}</td>
                      <td>${Number(s.total).toFixed(2)}</td>
                      <td>${Number(s.tax).toFixed(2)}</td>
                      <td><span className={`status-pill sp-${s.status}`}>{s.status}</span></td>
                      <td>{cashierName}</td>
                      <td>{new Date(s.created_at).toLocaleString()}</td>
                      <td style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                        <button onClick={() => handlePrintReceipt(s)} className="sh-btn sh-btn-print">Print</button>
                        {s.status === "completed" && canVoidSales && (
                          <button
                            onClick={() => handleVoidSale(s.id)}
                            disabled={voidingId === s.id}
                            className="sh-btn sh-btn-void"
                          >Void</button>
                        )}
                        {(s.status === "completed" || s.status === "returned") && (
                          <button
                            onClick={() => handleOpenReturn(s)}
                            className="sh-btn sh-btn-return"
                          >Return</button>
                        )}
                      </td>
                    </tr>
                    {returningSaleId === s.id && (
                      <tr key={`${s.id}-return`}>
                        <td colSpan={8} style={{ background: "#faf5ff", padding: "16px", border: "1px solid #c4b5fd" }}>
                          <strong style={{ color: "#7c3aed" }}>Process Return — Sale {s.id.slice(0, 8)}</strong>
                          {returnLines.length === 0 ? (
                            <p style={{ margin: "8px 0 0", color: "#888" }}>All items from this sale have already been returned.</p>
                          ) : (
                            <>
                              <table border={1} cellPadding={8} style={{ width: "100%", marginTop: "10px", fontSize: "13px" }}>
                                <thead>
                                  <tr><th>Product</th><th>Original Qty</th><th>Already Returned</th><th>Available</th><th>Return Qty</th></tr>
                                </thead>
                                <tbody>
                                  {returnLines.map(line => (
                                    <tr key={line.product_id}>
                                      <td>{line.product_name}</td>
                                      <td>{line.original_qty}</td>
                                      <td>{line.already_returned}</td>
                                      <td>{line.available_qty}</td>
                                      <td>
                                        <input
                                          type="number"
                                          min={0}
                                          max={line.available_qty}
                                          value={line.return_qty}
                                          onChange={(e) => {
                                            const val = Math.min(Math.max(0, Number(e.target.value)), line.available_qty);
                                            setReturnLines(prev => prev.map(l => l.product_id === line.product_id ? { ...l, return_qty: val } : l));
                                          }}
                                          style={{ width: "60px", padding: "4px" }}
                                        />
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                              <div style={{ display: "flex", gap: "12px", alignItems: "flex-start", marginTop: "10px", flexWrap: "wrap" }}>
                                <div style={{ display: "flex", flexDirection: "column", gap: "8px", flex: "1 1 200px" }}>
                                  <select
                                    value={returnReasonDropdown}
                                    onChange={(e) => setReturnReasonDropdown(e.target.value)}
                                    style={{ padding: "7px", fontSize: "13px" }}
                                    required
                                  >
                                    <option value="">Select reason *</option>
                                    <option value="Damaged">Damaged</option>
                                    <option value="Expired">Expired</option>
                                    <option value="Customer changed mind">Customer changed mind</option>
                                    <option value="Wrong item sold">Wrong item sold</option>
                                    <option value="Pricing issue">Pricing issue</option>
                                    <option value="Other">Other</option>
                                  </select>
                                  {returnReasonDropdown === "Other" && (
                                    <input
                                      type="text"
                                      placeholder="Specify reason"
                                      value={returnReason}
                                      onChange={(e) => setReturnReason(e.target.value)}
                                      style={{ padding: "7px" }}
                                    />
                                  )}
                                  <input
                                    type="text"
                                    placeholder="Notes (optional)"
                                    value={returnNotes}
                                    onChange={(e) => setReturnNotes(e.target.value)}
                                    style={{ padding: "7px" }}
                                  />
                                </div>
                                <button
                                  onClick={handleConfirmReturn}
                                  disabled={returnLoading || returnLines.every(l => l.return_qty === 0)}
                                  style={{
                                    padding: "7px 20px",
                                    background: returnLines.every(l => l.return_qty === 0) ? "#ccc" : "#7c3aed",
                                    color: "#fff", border: "none", borderRadius: "5px",
                                    cursor: returnLines.every(l => l.return_qty === 0) ? "not-allowed" : "pointer",
                                    fontWeight: "bold",
                                  }}
                                >{returnLoading ? "Processing…" : "Confirm Return"}</button>
                                <button onClick={() => { setReturningSaleId(null); setReturnLines([]); }} style={{ padding: "7px 14px", cursor: "pointer" }}>Cancel</button>
                              </div>
                            </>
                          )}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      </>}

      </div>{/* end pos */}

      {/* ── REPORTS TAB ── */}
      <div style={{ display: activeTab === 'reports' && businessId && appUnlocked ? '' : 'none' }}>

      <div className="page-header">
        <h2 className="page-title">Reports</h2>
        <p className="page-subtitle">Review sales, tax, inventory, loyalty, and operational performance</p>
      </div>

      <SalesAnalyticsReport
        analyticsData={analyticsData}
        analyticsRange={analyticsRange}
        setAnalyticsRange={setAnalyticsRange}
      />

      <InventoryReportsPanel
        products={products}
        lowStockProducts={lowStockProducts}
        purchaseOrders={purchaseOrders}
        suppliers={suppliers}
        sales={sales}
        saleItems={saleItems}
        allReturnItems={allReturnItems}
        returnHistory={returnHistory}
        customerMap={customerMap}
        employeeMap={employeeMap}
        productIdMap={productIdMap}
        analyticsRange={analyticsRange}
        setAnalyticsRange={setAnalyticsRange}
        invValuationOpen={invValuationOpen}
        setInvValuationOpen={setInvValuationOpen}
        lowStockReportOpen={lowStockReportOpen}
        setLowStockReportOpen={setLowStockReportOpen}
        poReportOpen={poReportOpen}
        setPoReportOpen={setPoReportOpen}
        returnHistoryOpen={returnHistoryOpen}
        setReturnHistoryOpen={setReturnHistoryOpen}
        expandedReturnSaleId={expandedReturnSaleId}
        setExpandedReturnSaleId={setExpandedReturnSaleId}
      />

      </div>{/* end reports */}

      {/* ── EMPLOYEES TAB (2) ── */}
      <div style={{ display: activeTab === 'employees' && businessId && appUnlocked ? '' : 'none' }}>

      {/* Cash Drawer Management */}
      <h2 style={{ marginTop: "40px" }}>Cash Drawer</h2>

      {!drawerSession ? (
        <div style={{ marginBottom: "32px" }}>
          <p style={{ color: "#555", fontSize: "14px", marginBottom: "12px" }}>No drawer is currently open.</p>
          <form onSubmit={handleOpenDrawer} style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="Opening float ($)"
              value={openingFloat}
              onChange={(e) => setOpeningFloat(e.target.value)}
              style={{ padding: "8px", width: "180px" }}
              required
            />
            <button
              type="submit"
              disabled={drawerLoading || !openingFloat}
              style={{ padding: "8px 22px", fontWeight: "bold", background: "#15803d", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer" }}
            >
              Open Drawer
            </button>
          </form>
        </div>
      ) : (
        <div style={{ border: "1px solid #16a34a", borderRadius: "8px", padding: "20px", marginBottom: "32px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "8px" }}>
            <strong style={{ color: "#15803d", fontSize: "16px" }}>Drawer Open</strong>
            <span style={{ fontSize: "13px", color: "#888" }}>Opened: {new Date(drawerSession.opened_at).toLocaleString()}</span>
          </div>

          {/* Session summary cards */}
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "20px" }}>
            {[
              { label: "Opening Float", value: `$${Number(drawerSession.opening_float).toFixed(2)}` },
              { label: "Cash Sales", value: `$${drawerCashSales.toFixed(2)}` },
              { label: "Paid Outs", value: `−$${drawerPaidOuts.reduce((s, p) => s + Number(p.amount), 0).toFixed(2)}` },
              { label: "Expected Cash", value: `$${(Number(drawerSession.opening_float) + drawerCashSales - drawerPaidOuts.reduce((s, p) => s + Number(p.amount), 0)).toFixed(2)}`, bold: true },
            ].map(card => (
              <div key={card.label} style={{ border: "1px solid #ccc", borderRadius: "8px", padding: "12px 16px", minWidth: "140px" }}>
                <div style={{ fontSize: "12px", color: "#888" }}>{card.label}</div>
                <div style={{ fontSize: "20px", fontWeight: card.bold ? "bold" : "normal" }}>{card.value}</div>
              </div>
            ))}
          </div>

          {/* Paid out form */}
          <h4 style={{ margin: "0 0 8px" }}>Record Paid Out</h4>
          <form onSubmit={handlePaidOut} style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap", marginBottom: "16px" }}>
            <input
              type="number"
              min="0.01"
              step="0.01"
              placeholder="Amount"
              value={paidOutAmount}
              onChange={(e) => setPaidOutAmount(e.target.value)}
              style={{ padding: "7px", width: "120px" }}
              required
            />
            <input
              type="text"
              placeholder="Reason (e.g. safe drop)"
              value={paidOutReason}
              onChange={(e) => setPaidOutReason(e.target.value)}
              style={{ padding: "7px", flex: "1 1 180px" }}
            />
            <button
              type="submit"
              disabled={drawerLoading || !paidOutAmount}
              style={{ padding: "7px 18px", cursor: "pointer", borderRadius: "5px" }}
            >
              Record Paid Out
            </button>
          </form>

          {/* Paid outs log */}
          {drawerPaidOuts.length > 0 && (
            <div style={{ marginBottom: "16px" }}>
              <strong style={{ fontSize: "13px" }}>Paid Outs This Session</strong>
              <table border={1} cellPadding={6} style={{ width: "100%", marginTop: "6px", fontSize: "13px" }}>
                <thead><tr><th>Time</th><th>Amount</th><th>Reason</th></tr></thead>
                <tbody>
                  {drawerPaidOuts.map(po => (
                    <tr key={po.id}>
                      <td>{new Date(po.created_at).toLocaleTimeString()}</td>
                      <td>${Number(po.amount).toFixed(2)}</td>
                      <td>{po.reason ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Close drawer form */}
          <h4 style={{ margin: "0 0 8px" }}>Close Drawer</h4>
          <form onSubmit={handleCloseDrawer} style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="Counted cash ($)"
              value={closingCount}
              onChange={(e) => setClosingCount(e.target.value)}
              style={{ padding: "7px", width: "160px" }}
              required
            />
            {closingCount && (() => {
              const counted = Number(closingCount);
              const totalPo = drawerPaidOuts.reduce((s, p) => s + Number(p.amount), 0);
              const expected = Number(drawerSession.opening_float) + drawerCashSales - totalPo;
              const os = counted - expected;
              return (
                <span style={{ fontWeight: "bold", color: os >= 0 ? "#15803d" : "#dc2626" }}>
                  {os >= 0 ? `Over $${os.toFixed(2)}` : `Short $${Math.abs(os).toFixed(2)}`}
                </span>
              );
            })()}
            <button
              type="submit"
              disabled={drawerLoading || !closingCount}
              style={{ padding: "7px 18px", fontWeight: "bold", background: "#b91c1c", color: "#fff", border: "none", borderRadius: "5px", cursor: "pointer" }}
            >
              {drawerLoading ? "Closing…" : "Close Drawer"}
            </button>
          </form>
        </div>
      )}

      <button
        onClick={handleToggleEod}
        style={{ marginBottom: "24px", padding: "9px 22px", cursor: "pointer", fontWeight: "bold", background: showEod ? "#333" : "#fff", color: showEod ? "#fff" : "#333", border: "1px solid #333", borderRadius: "6px" }}
      >
        {showEod ? "Hide Summary" : "End-of-Day Summary"}
      </button>

      {showEod && (() => {
        const today = new Date();
        const isToday = (d: string) => {
          const dt = new Date(d);
          return dt.getFullYear() === today.getFullYear() && dt.getMonth() === today.getMonth() && dt.getDate() === today.getDate();
        };
        const todaySales = sales.filter((s) => s.status === "completed" && isToday(s.created_at));
        const voidedToday = sales.filter((s) => s.status === "voided" && isToday(s.created_at)).length;
        const returnedToday = sales.filter((s) => s.status === "returned" && isToday(s.created_at)).length;
        const grossRevenue = todaySales.reduce((sum, s) => sum + Number(s.total), 0);
        const avgSale = todaySales.length > 0 ? grossRevenue / todaySales.length : 0;
        const itemsSold = eodItems.reduce((sum, i) => sum + i.quantity, 0);
        const discountsTotal = todaySales.reduce((sum, s) => sum + Number(s.discount_amount), 0);
        const eodSalePayments = eodPayments.filter(p => p.payment_type !== 'refund');
        const eodRefundPayments = eodPayments.filter(p => p.payment_type === 'refund');
        const cashTotal = eodSalePayments.filter(p => p.payment_method === "cash").reduce((sum, p) => sum + Number(p.amount), 0) - eodRefundPayments.filter(p => p.payment_method === "cash").reduce((sum, p) => sum + Number(p.amount), 0);
        const cardTotal = eodSalePayments.filter(p => p.payment_method === "card").reduce((sum, p) => sum + Number(p.amount), 0) - eodRefundPayments.filter(p => p.payment_method === "card").reduce((sum, p) => sum + Number(p.amount), 0);
        const otherTotal = eodSalePayments.filter(p => p.payment_method !== "cash" && p.payment_method !== "card").reduce((sum, p) => sum + Number(p.amount), 0) - eodRefundPayments.filter(p => p.payment_method !== "cash" && p.payment_method !== "card").reduce((sum, p) => sum + Number(p.amount), 0);

        const allTodaySaleIds = new Set(sales.filter(s => isToday(s.created_at) && (s.status === "completed" || s.status === "returned")).map(s => s.id));
        const todayReturns = allReturnItems.filter(ri => allTodaySaleIds.has(ri.sale_id));
        const returnedUnits = todayReturns.reduce((sum, ri) => sum + ri.quantity_returned, 0);
        const productNameMap = Object.fromEntries(products.map(p => [p.product_id, p.product_name]));
        const returnedValue = todayReturns.reduce((sum, ri) => {
          const si = saleItems.find(s => s.sale_id === ri.sale_id && s.product_id === ri.product_id);
          return sum + (si ? ri.quantity_returned * si.unit_price : 0);
        }, 0);

        const todayLoyalty = loyaltyTransactions.filter(lt => isToday(lt.created_at));
        const loyaltyEarned = todayLoyalty.filter(lt => lt.type === "earn" && lt.points > 0).reduce((sum, lt) => sum + lt.points, 0);
        const loyaltyRedeemed = todayLoyalty.filter(lt => lt.type === "redeem").reduce((sum, lt) => sum + Math.abs(lt.points), 0);

        const productTotals: Record<string, { units: number; revenue: number }> = {};
        for (const item of eodItems) {
          if (!productTotals[item.product_id]) productTotals[item.product_id] = { units: 0, revenue: 0 };
          productTotals[item.product_id].units += item.quantity;
          productTotals[item.product_id].revenue += Number(item.line_total);
        }
        const topProducts = Object.entries(productTotals)
          .map(([pid, v]) => ({ name: productNameMap[pid] ?? pid.slice(0, 8), ...v }))
          .sort((a, b) => b.units - a.units);

        const latestSession = drawerSession ?? (() => {
          const closed = sales.length > 0 ? null : null;
          return closed;
        })();
        const sessionPaidOuts = drawerPaidOuts.reduce((sum, p) => sum + Number(p.amount), 0);
        const openingFloat = latestSession ? Number(latestSession.opening_float) : 0;
        const expectedCash = openingFloat + cashTotal - sessionPaidOuts;

        return (
          <div style={{ border: "1px solid #333", borderRadius: "8px", padding: "24px", marginBottom: "32px" }}>
            <h3 style={{ margin: "0 0 20px" }}>
              End-of-Day Summary — {today.toLocaleDateString()}
            </h3>

            {/* Sales KPI Cards */}
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "24px" }}>
              {[
                { label: "Transactions", value: String(todaySales.length) },
                { label: "Gross Revenue", value: `$${grossRevenue.toFixed(2)}`, color: "#1d4ed8" },
                { label: "Avg Sale", value: `$${avgSale.toFixed(2)}` },
                { label: "Items Sold", value: String(itemsSold) },
                { label: "Discounts", value: `−$${discountsTotal.toFixed(2)}`, color: discountsTotal > 0 ? "#b45309" : "#888" },
                { label: "Returns", value: `${returnedUnits} items (−$${returnedValue.toFixed(2)})`, color: returnedUnits > 0 ? "#dc2626" : "#888" },
              ].map((card) => (
                <div key={card.label} style={{ padding: "12px 18px", border: "1px solid #e5e7eb", borderRadius: "8px", minWidth: "120px", flex: 1 }}>
                  <div style={{ fontSize: "11px", color: "#888", textTransform: "uppercase", letterSpacing: "0.5px" }}>{card.label}</div>
                  <div style={{ fontSize: "22px", fontWeight: "bold", color: (card as any).color ?? "#0f172a", marginTop: "2px" }}>{card.value}</div>
                </div>
              ))}
            </div>

            {/* Payment & Loyalty Cards */}
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "24px" }}>
              {[
                { label: "Cash Sales", value: `$${cashTotal.toFixed(2)}`, color: "#15803d" },
                { label: "Card Sales", value: `$${cardTotal.toFixed(2)}`, color: "#1d4ed8" },
                ...(otherTotal > 0 ? [{ label: "Other Payments", value: `$${otherTotal.toFixed(2)}`, color: "#6b7280" }] : []),
                { label: "Loyalty Earned", value: `+${loyaltyEarned} pts`, color: loyaltyEarned > 0 ? "#15803d" : "#888" },
                { label: "Loyalty Redeemed", value: `${loyaltyRedeemed} pts`, color: loyaltyRedeemed > 0 ? "#7c3aed" : "#888" },
              ].map((card) => (
                <div key={card.label} style={{ padding: "12px 18px", border: "1px solid #e5e7eb", borderRadius: "8px", minWidth: "120px", flex: 1 }}>
                  <div style={{ fontSize: "11px", color: "#888", textTransform: "uppercase", letterSpacing: "0.5px" }}>{card.label}</div>
                  <div style={{ fontSize: "22px", fontWeight: "bold", color: card.color, marginTop: "2px" }}>{card.value}</div>
                </div>
              ))}
            </div>

            {/* Drawer Reconciliation */}
            {latestSession && (
              <div style={{ border: "1px solid #e2e8f0", borderRadius: "8px", padding: "16px", marginBottom: "24px", background: "#f8fafc" }}>
                <h4 style={{ margin: "0 0 12px" }}>Drawer Reconciliation {latestSession.status === "closed" ? "(Closed)" : "(Open)"}</h4>
                <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                  {[
                    { label: "Opening Float", value: `$${openingFloat.toFixed(2)}` },
                    { label: "Cash Sales", value: `+$${cashTotal.toFixed(2)}`, color: "#15803d" },
                    { label: "Paid Outs", value: `−$${sessionPaidOuts.toFixed(2)}`, color: sessionPaidOuts > 0 ? "#dc2626" : "#888" },
                    { label: "Expected Cash", value: `$${expectedCash.toFixed(2)}`, color: "#1d4ed8" },
                    ...(latestSession.status === "closed" ? [
                      { label: "Actual Cash", value: `$${Number(latestSession.closing_count ?? 0).toFixed(2)}` },
                      { label: "Over/Short", value: (() => {
                        const os = Number(latestSession.over_short ?? 0);
                        return os >= 0 ? `+$${os.toFixed(2)}` : `−$${Math.abs(os).toFixed(2)}`;
                      })(), color: Number(latestSession.over_short ?? 0) >= 0 ? "#15803d" : "#dc2626" },
                    ] : []),
                  ].map((card) => (
                    <div key={card.label} style={{ border: "1px solid #e2e8f0", borderRadius: "6px", padding: "10px 14px", minWidth: "110px", flex: 1, background: "#fff" }}>
                      <div style={{ fontSize: "10px", color: "#888", textTransform: "uppercase", letterSpacing: "0.5px" }}>{card.label}</div>
                      <div style={{ fontSize: "20px", fontWeight: "bold", color: (card as any).color ?? "#0f172a", marginTop: "2px" }}>{card.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <h4 style={{ margin: "0 0 8px" }}>Top Products Today</h4>
            <div style={{ overflowX: "auto", marginBottom: "20px" }}>
              <table border={1} cellPadding={8} style={{ width: "100%" }}>
                <thead>
                  <tr><th>Product</th><th>Units Sold</th><th>Revenue</th></tr>
                </thead>
                <tbody>
                  {topProducts.length === 0 ? (
                    <tr><td colSpan={3}>No items sold today</td></tr>
                  ) : (
                    topProducts.map((p, i) => (
                      <tr key={i}>
                        <td>{p.name}</td>
                        <td>{p.units}</td>
                        <td>${p.revenue.toFixed(2)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <h4 style={{ margin: "0 0 8px" }}>Sales Breakdown</h4>
            <div style={{ overflowX: "auto", marginBottom: "12px" }}>
              <table border={1} cellPadding={8} style={{ width: "100%" }}>
                <thead>
                  <tr><th>Time</th><th>Sale ID</th><th>Total</th><th>Discount</th><th>Payment</th></tr>
                </thead>
                <tbody>
                  {todaySales.length === 0 ? (
                    <tr><td colSpan={5}>No sales today</td></tr>
                  ) : (
                    todaySales.map((s) => {
                      const method = eodPayments.find((p) => p.sale_id === s.id && p.payment_type !== 'refund')?.payment_method ?? "—";
                      const disc = Number(s.discount_amount);
                      return (
                        <tr key={s.id}>
                          <td>{new Date(s.created_at).toLocaleTimeString()}</td>
                          <td style={{ fontFamily: "monospace" }}>{s.id.slice(0, 8)}…</td>
                          <td>${Number(s.total).toFixed(2)}</td>
                          <td style={{ color: disc > 0 ? "#b45309" : "#ccc" }}>{disc > 0 ? `−$${disc.toFixed(2)}` : "—"}</td>
                          <td>{method}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {employees.length > 0 && (() => {
              const cashierMap = Object.fromEntries(employees.map(e => [e.id, e.name]));
              const byEmployee: Record<string, { name: string; count: number; revenue: number }> = {};
              for (const s of todaySales) {
                const key = s.cashier_id ?? "__none__";
                if (!byEmployee[key]) byEmployee[key] = { name: s.cashier_id ? (cashierMap[s.cashier_id] ?? s.cashier_id.slice(0, 8)) : "No cashier", count: 0, revenue: 0 };
                byEmployee[key].count++;
                byEmployee[key].revenue += Number(s.total);
              }
              const rows = Object.values(byEmployee).sort((a, b) => b.revenue - a.revenue);
              if (rows.length === 0) return null;
              return (
                <>
                  <h4 style={{ margin: "0 0 8px" }}>Cashier Breakdown</h4>
                  <div style={{ overflowX: "auto", marginBottom: "20px" }}>
                    <table border={1} cellPadding={8} style={{ width: "100%" }}>
                      <thead>
                        <tr style={{ background: "#f3f4f6" }}>
                          <th style={{ textAlign: "left" }}>Cashier</th>
                          <th>Sales</th>
                          <th>Revenue</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((r, i) => (
                          <tr key={i}>
                            <td>{r.name}</td>
                            <td style={{ textAlign: "center" }}>{r.count}</td>
                            <td>${r.revenue.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              );
            })()}

            {(voidedToday > 0 || returnedToday > 0) && (
              <p style={{ color: "#999", fontSize: "13px", margin: 0 }}>
                {voidedToday > 0 && `${voidedToday} voided sale(s)`}
                {voidedToday > 0 && returnedToday > 0 && ", "}
                {returnedToday > 0 && `${returnedToday} returned sale(s)`}
                {" "}excluded from revenue totals.
              </p>
            )}
          </div>
        );
      })()}

      </div>{/* end employees */}

      {/* ── EMPLOYEES TAB ── */}
      <div style={{ display: activeTab === 'employees' && businessId && appUnlocked ? '' : 'none' }}>

      <div className="page-header">
        <h2 className="page-title">Staff</h2>
        <p className="page-subtitle">Manage employees, roles, and cash drawer operations</p>
      </div>

      {canManageStaff && (
        <form onSubmit={handleAddEmployee} style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap", marginBottom: "20px" }}>
          <input
            type="text"
            placeholder="Employee name *"
            value={newEmpName}
            onChange={(e) => setNewEmpName(e.target.value)}
            style={{ padding: "8px", flex: "1 1 150px" }}
            required
          />
          <input
            type="text"
            inputMode="numeric"
            placeholder="PIN (4–6 digits) *"
            value={newEmpPin}
            onChange={(e) => setNewEmpPin(e.target.value.replace(/\D/g, ""))}
            maxLength={6}
            style={{ padding: "8px", width: "140px" }}
            required
          />
          <select
            value={newEmpRole}
            onChange={(e) => setNewEmpRole(e.target.value as "cashier" | "manager" | "inventory_clerk")}
            style={{ padding: "8px" }}
          >
            <option value="cashier">Cashier</option>
            <option value="manager">Manager</option>
            <option value="inventory_clerk">Inventory Clerk</option>
          </select>
          <button
            type="submit"
            disabled={!newEmpName.trim() || !newEmpPin.trim()}
            style={{ padding: "8px 20px", background: "#1d4ed8", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "bold" }}
          >
            Add Employee
          </button>
        </form>
      )}

      <button
        onClick={() => setEmployeeListOpen(!(employeeListOpen ?? (employees.length < 10)))}
        style={{ marginBottom: "12px", background: "none", border: "1px solid #e2e8f0", borderRadius: "6px", padding: "8px 16px", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", width: "100%" }}
      >
        <span style={{ fontSize: "16px" }}>{(employeeListOpen ?? (employees.length < 10)) ? "▼" : "▶"}</span>
        <h3 style={{ margin: 0 }}>Employees</h3>
        <span style={{ fontSize: "13px", color: "#64748b" }}>({employees.length} employees)</span>
      </button>
      <div style={{ display: (employeeListOpen ?? (employees.length < 10)) ? '' : 'none', overflowX: "auto", marginBottom: "40px" }}>
        <table border={1} cellPadding={10} style={{ width: "100%" }}>
          <thead>
            <tr style={{ background: "#f3f4f6" }}>
              <th style={{ textAlign: "left" }}>Name</th>
              <th>PIN</th>
              <th>Role</th>
              <th>Status</th>
              {canManageStaff && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {employees.length === 0 ? (
              <tr><td colSpan={canManageStaff ? 5 : 4} style={{ color: "#888" }}>No employees yet</td></tr>
            ) : (
              employees.map(emp => {
                const rowStyle = emp.status === "inactive" ? { backgroundColor: "#f5f5f5", color: "#999" } : {};
                const isEditing = editingEmpId === emp.id;
                const roleBg = emp.role === "manager" ? "#fef3c7" : emp.role === "inventory_clerk" ? "#f0fdfa" : "#dbeafe";
                const roleColor = emp.role === "manager" ? "#92400e" : emp.role === "inventory_clerk" ? "#0d9488" : "#1e40af";
                return (
                  <tr key={emp.id} style={rowStyle}>
                    <td style={{ fontWeight: "bold" }}>{emp.name}</td>
                    <td style={{ fontFamily: "monospace", fontSize: "13px", color: "#64748b" }}>{emp.pin ? "****" : "—"}</td>
                    <td>
                      {isEditing ? (
                        <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                          <select value={editEmpRole} onChange={(e) => setEditEmpRole(e.target.value)} style={{ padding: "4px 8px", fontSize: "13px" }}>
                            <option value="cashier">Cashier</option>
                            <option value="manager">Manager</option>
                            <option value="inventory_clerk">Inventory Clerk</option>
                          </select>
                          <button onClick={() => handleSaveEmployeeRole(emp)} style={{ padding: "2px 10px", cursor: "pointer", background: "#1d4ed8", color: "#fff", border: "none", borderRadius: "4px", fontSize: "12px", fontWeight: "bold" }}>Save</button>
                          <button onClick={() => setEditingEmpId(null)} style={{ padding: "2px 10px", cursor: "pointer", border: "1px solid #ccc", borderRadius: "4px", fontSize: "12px", background: "#fff" }}>Cancel</button>
                        </div>
                      ) : (
                        <span style={{ padding: "2px 8px", borderRadius: "12px", fontSize: "12px", background: roleBg, color: roleColor }}>{emp.role.replace('_', ' ')}</span>
                      )}
                    </td>
                    <td>
                      <span style={{
                        padding: "2px 8px", borderRadius: "12px", fontSize: "12px",
                        background: emp.status === "active" ? "#dcfce7" : "#f3f4f6",
                        color: emp.status === "active" ? "#15803d" : "#6b7280",
                      }}>{emp.status}</span>
                    </td>
                    {canManageStaff && (
                      <td>
                        <div style={{ display: "flex", gap: "6px" }}>
                          {!isEditing && (
                            <button
                              onClick={() => { setEditingEmpId(emp.id); setEditEmpRole(emp.role); }}
                              style={{ padding: "3px 12px", cursor: "pointer", borderRadius: "4px", background: "#eff6ff", color: "#1d4ed8", border: "none", fontWeight: "bold" }}
                            >
                              Edit Role
                            </button>
                          )}
                          <button
                            onClick={() => handleToggleEmployeeStatus(emp)}
                            style={{
                              padding: "3px 12px", cursor: "pointer", borderRadius: "4px",
                              background: emp.status === "active" ? "#fee2e2" : "#dcfce7",
                              color: emp.status === "active" ? "#b91c1c" : "#15803d",
                              border: "none", fontWeight: "bold",
                            }}
                          >
                            {emp.status === "active" ? "Deactivate" : "Activate"}
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      </div>{/* end employees */}

      {/* ── SETTINGS TAB ── */}
      <SettingsTab
        visible={activeTab === 'settings' && !!businessId && appUnlocked}
        businessName={businessName}
        businessPhone={businessPhone}
        businessEmail={businessEmail}
        businessAddress={businessAddress}
        businessTaxRate={businessTaxRate}
        sellingPolicy={sellingPolicy}
        editingBusiness={editingBusiness}
        setEditingBusiness={setEditingBusiness}
        editBizName={editBizName}
        setEditBizName={setEditBizName}
        editBizPhone={editBizPhone}
        setEditBizPhone={setEditBizPhone}
        editBizEmail={editBizEmail}
        setEditBizEmail={setEditBizEmail}
        editBizAddress={editBizAddress}
        setEditBizAddress={setEditBizAddress}
        editBizTaxRate={editBizTaxRate}
        setEditBizTaxRate={setEditBizTaxRate}
        editBizSellingPolicy={editBizSellingPolicy}
        setEditBizSellingPolicy={setEditBizSellingPolicy}
        userRole={userRole}
        onSave={handleSaveBusiness}
      />{/* end settings */}

      {/* Smart Receive — Receive Inventory Modal */}
      {/* Backdrop: z-index 1099, sibling of panel */}
      {smartReceiveSimpleOpen && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1099 }}
          onClick={() => { setSmartReceiveSimpleOpen(false); setSmartReceiveFile(null); setSmartReceiveProcessing(false); setSmartReceiveResult(null); setSmartReceiveLoading(false); setSmartReceiveMatches([]); setSmartReceivePendingIdx(null); setSmartReceiveLinkedSupplierId(""); setShowSmartSupplierOverridePicker(false); setShowSmartSupplierAdvanced(false); setSmartReceiveItemBatch([]); }}
        />
      )}
      {/* Panel: directly positioned via transform — no full-screen wrapper, no pointerEvents:none ancestor */}
      {smartReceiveSimpleOpen && (
        <div
          style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)", zIndex: 1100, background: "#fff", borderRadius: "12px", width: "460px", maxWidth: "95vw", maxHeight: "90vh", display: "flex", flexDirection: "column", boxShadow: "0 8px 32px rgba(0,0,0,0.18)", pointerEvents: "auto", overflow: "hidden" }}>
          {/* Sticky header */}
          <div style={{ padding: "20px 24px 0", flexShrink: 0 }}>
            <h2 style={{ margin: "0 0 4px", fontSize: "18px", fontWeight: 700, color: "#0f172a" }}>⭐ Smart Receive</h2>
            <p style={{ fontSize: "14px", color: "#475569", margin: "0 0 12px", lineHeight: 1.5 }}>
              Receive inventory from a supplier invoice.
            </p>
          </div>
          {/* Scrollable body — wraps all modal content except the action buttons */}
          <div style={{ overflowY: "auto", flex: 1, padding: "0 24px" }}>

            {!smartReceiveProcessing ? (
              <>
                {/* File selection status */}
                {smartReceiveFile ? (
                  <div style={{ marginBottom: "14px", padding: "10px 12px", background: "#f0fdf4", border: "1px solid #86efac", borderRadius: "8px", fontSize: "13px", color: "#15803d" }}>
                    ✅ <strong>{smartReceiveFile.name}</strong> —{" "}
                    {smartReceiveFile.size < 1024 * 1024
                      ? `${(smartReceiveFile.size / 1024).toFixed(1)} KB`
                      : `${(smartReceiveFile.size / (1024 * 1024)).toFixed(1)} MB`}
                  </div>
                ) : (
                  <div style={{ marginBottom: "14px", padding: "20px", background: "#f8fafc", border: "2px dashed #cbd5e1", borderRadius: "8px", textAlign: "center", fontSize: "13px", color: "#64748b" }}>
                    No file selected
                  </div>
                )}

                {/* Upload Invoice — transparent input overlays the button, direct click activates picker */}
                <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
                  <div style={{ flex: 1, position: "relative" }}>
                    <div style={{ padding: "10px", fontSize: "13px", fontWeight: 600, background: "#7c3aed", color: "#fff", border: "none", borderRadius: "8px", textAlign: "center", userSelect: "none" }}>
                      📄 Upload Invoice
                    </div>
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png,.heic,image/*,application/pdf"
                      title=""
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) setSmartReceiveFile(f);
                        e.target.value = "";
                      }}
                      style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer", width: "100%", height: "100%" }}
                    />
                  </div>
                  <div style={{ flex: 1, position: "relative" }}>
                    <div style={{ padding: "10px", fontSize: "13px", fontWeight: 600, background: "#f1f5f9", color: "#334155", border: "1px solid #cbd5e1", borderRadius: "8px", textAlign: "center", userSelect: "none" }}>
                      📋 Upload Packing Slip
                    </div>
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png,.heic,image/*,application/pdf"
                      title=""
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) setSmartReceiveFile(f);
                        e.target.value = "";
                      }}
                      style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer", width: "100%", height: "100%" }}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: "16px" }}>
                  <button
                    type="button"
                    onClick={() => { alert("Camera capture coming soon."); }}
                    style={{ width: "100%", padding: "10px", fontSize: "13px", fontWeight: 600, cursor: "pointer", background: "#f8fafc", color: "#64748b", border: "1px dashed #cbd5e1", borderRadius: "8px" }}
                  >📷 Take Photo</button>
                </div>

                <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end", paddingBottom: "8px" }}>
                  <button
                    type="button"
                    onClick={() => { setSmartReceiveSimpleOpen(false); setSmartReceiveFile(null); setSmartReceiveProcessing(false); setSmartReceiveResult(null); setSmartReceiveLoading(false); setSmartReceiveMatches([]); setSmartReceivePendingIdx(null); setSmartReceiveLinkedSupplierId(""); setShowSmartSupplierOverridePicker(false); setShowSmartSupplierAdvanced(false); setSmartReceiveItemBatch([]); }}
                    style={{ padding: "9px 18px", fontSize: "13px", cursor: "pointer", background: "none", border: "1px solid #cbd5e1", borderRadius: "6px", color: "#475569" }}
                  >Cancel</button>
                  <button
                    type="button"
                    onClick={async () => {
                      if (!smartReceiveFile) return;
                      setSmartReceiveProcessing(true);
                      setSmartReceiveLoading(true);
                      setSmartReceiveResult(null);
                      const result = await processSmartReceiveInvoice(smartReceiveFile);
                      setSmartReceiveResult(result);
                      // Auto-match each item against the product catalog
                      const matches = result.items.map(item => {
                        const desc = item.description.toLowerCase().trim();
                        const found = products.find(p =>
                          p.product_name.toLowerCase().trim() === desc ||
                          (p.barcode && p.barcode.trim() === desc)
                        );
                        return found ? found.product_id : "";
                      });
                      setSmartReceiveMatches(matches);
                      setSmartReceiveItemBatch(result.items.map(item => ({ batch_number: item.batchNumber ?? "", lot_number: "", manufactured_date: "", expiration_date: item.expirationDate ?? "" })));
                      // Auto-match supplier (exact case-insensitive)
                      const autoSupplier = suppliers.find(s => s.name.toLowerCase().trim() === result.supplier.toLowerCase().trim());
                      setSmartReceiveLinkedSupplierId(autoSupplier?.id ?? "");
                      setSmartReceiveLoading(false);
                    }}
                    disabled={!smartReceiveFile}
                    style={{ padding: "9px 18px", fontSize: "13px", fontWeight: 600, cursor: smartReceiveFile ? "pointer" : "not-allowed", background: smartReceiveFile ? "#7c3aed" : "#e2e8f0", color: smartReceiveFile ? "#fff" : "#94a3b8", border: "none", borderRadius: "6px" }}
                  >Continue</button>
                </div>
              </>
            ) : smartReceiveLoading ? (
              <div style={{ textAlign: "center", padding: "32px 16px" }}>
                <div style={{ fontSize: "32px", marginBottom: "12px" }}>⏳</div>
                <div style={{ fontSize: "15px", fontWeight: 600, color: "#334155", marginBottom: "4px" }}>Reading invoice...</div>
                <div style={{ fontSize: "13px", color: "#64748b" }}>{smartReceiveFile?.name}</div>
              </div>
            ) : smartReceiveResult ? (() => {
                const allMatched = smartReceiveMatches.length === smartReceiveResult.items.length && smartReceiveMatches.every(m => !!m);
                const unmatchedCount = smartReceiveMatches.filter(m => !m).length;
                const clearSupplierState = () => { setSmartReceiveLinkedSupplierId(""); setShowSmartSupplierOverridePicker(false); setShowSmartSupplierAdvanced(false); };
                const resetAll = () => { setSmartReceiveProcessing(false); setSmartReceiveResult(null); setSmartReceiveLoading(false); setSmartReceiveMatches([]); setSmartReceivePendingIdx(null); clearSupplierState(); };
                const closeAll = () => { setSmartReceiveSimpleOpen(false); setSmartReceiveFile(null); setSmartReceiveProcessing(false); setSmartReceiveResult(null); setSmartReceiveLoading(false); setSmartReceiveMatches([]); setSmartReceivePendingIdx(null); clearSupplierState(); };
                // ── Create New Product mini-form ──
                if (smartReceivePendingIdx !== null) {
                  const pendingItem = smartReceiveResult.items[smartReceivePendingIdx];
                  return (
                    <>
                      <div style={{ marginBottom: "14px" }}>
                        <div style={{ fontWeight: 600, fontSize: "14px", color: "#0f172a", marginBottom: "4px" }}>Create New Product</div>
                        <div style={{ fontSize: "12px", color: "#64748b", marginBottom: "12px" }}>For: <strong>{pendingItem.description}</strong></div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                          <div>
                            <label style={{ fontSize: "12px", fontWeight: 600, color: "#334155", display: "block", marginBottom: "3px" }}>Product Name *</label>
                            <input type="text" value={smartReceiveNewName} onChange={e => setSmartReceiveNewName(e.target.value)} style={{ width: "100%", padding: "7px 10px", fontSize: "13px", border: "1px solid #cbd5e1", borderRadius: "6px", boxSizing: "border-box" }} />
                          </div>
                          <div style={{ display: "flex", gap: "8px" }}>
                            <div style={{ flex: 1 }}>
                              <label style={{ fontSize: "12px", fontWeight: 600, color: "#334155", display: "block", marginBottom: "3px" }}>Cost Price ($)</label>
                              <input type="number" step="0.01" min="0" value={smartReceiveNewCost} onChange={e => setSmartReceiveNewCost(e.target.value)} placeholder={pendingItem.unitCost.toFixed(2)} style={{ width: "100%", padding: "7px 10px", fontSize: "13px", border: "1px solid #cbd5e1", borderRadius: "6px", boxSizing: "border-box" }} />
                            </div>
                            <div style={{ flex: 1 }}>
                              <label style={{ fontSize: "12px", fontWeight: 600, color: "#334155", display: "block", marginBottom: "3px" }}>Selling Price ($) *</label>
                              <input type="number" step="0.01" min="0" value={smartReceiveNewSelling} onChange={e => setSmartReceiveNewSelling(e.target.value)} placeholder="0.00" style={{ width: "100%", padding: "7px 10px", fontSize: "13px", border: "1px solid #cbd5e1", borderRadius: "6px", boxSizing: "border-box" }} />
                            </div>
                          </div>
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                        <button type="button" onClick={() => { setSmartReceivePendingIdx(null); setSmartReceiveNewName(""); setSmartReceiveNewSelling(""); setSmartReceiveNewCost(""); }} style={{ padding: "9px 18px", fontSize: "13px", cursor: "pointer", background: "none", border: "1px solid #cbd5e1", borderRadius: "6px", color: "#475569" }}>Cancel</button>
                        <button type="button" onClick={handleCreateSmartProduct} disabled={isSavingSmartProduct || !smartReceiveNewName.trim() || !smartReceiveNewSelling} style={{ padding: "9px 18px", fontSize: "13px", fontWeight: 600, cursor: isSavingSmartProduct || !smartReceiveNewName.trim() || !smartReceiveNewSelling ? "not-allowed" : "pointer", background: !smartReceiveNewName.trim() || !smartReceiveNewSelling ? "#e2e8f0" : "#15803d", color: !smartReceiveNewName.trim() || !smartReceiveNewSelling ? "#94a3b8" : "#fff", border: "none", borderRadius: "6px", opacity: isSavingSmartProduct ? 0.6 : 1 }}>
                          {isSavingSmartProduct ? "Creating..." : "Create & Match"}
                        </button>
                      </div>
                    </>
                  );
                }
                // ── Main review screen ──
                return (
                  <>
                    <div style={{ marginBottom: "14px" }}>
                      {/* Invoice header */}
                      <div style={{ fontSize: "13px", padding: "10px 12px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "8px", marginBottom: "10px" }}>
                        <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "4px 12px", marginBottom: "8px" }}>
                          <span style={{ color: "#64748b" }}>Invoice #</span><span style={{ fontWeight: 600 }}>{smartReceiveResult.invoiceNumber}</span>
                          <span style={{ color: "#64748b" }}>Date</span><span>{smartReceiveResult.invoiceDate}</span>
                        </div>
                        {/* Supplier resolution — redesigned 3-case UX */}
                        {(() => {
                          const linked = smartReceiveLinkedSupplierId
                            ? suppliers.find(s => s.id === smartReceiveLinkedSupplierId)
                            : null;
                          const extractedName = smartReceiveResult.supplier;
                          return (
                            <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: "8px" }}>
                              <div style={{ fontSize: "12px", color: "#64748b", marginBottom: "6px" }}>
                                Supplier: <strong style={{ color: "#0f172a" }}>{extractedName}</strong>
                              </div>

                              {/* CASE 1 — Matched */}
                              {linked ? (
                                <div>
                                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                    <span style={{ fontSize: "12px", fontWeight: 600, color: "#15803d" }}>✓ Supplier matched: {linked.name}</span>
                                    <button type="button" onClick={() => { setSmartReceiveLinkedSupplierId(""); setShowSmartSupplierOverridePicker(false); }} style={{ fontSize: "10px", cursor: "pointer", background: "none", border: "none", color: "#94a3b8", marginLeft: "auto", textDecoration: "underline", padding: 0 }}>The supplier name is incorrect?</button>
                                  </div>
                                </div>
                              ) : (
                                /* CASE 2 — Not in catalog */
                                <div>
                                  <div style={{ fontSize: "12px", color: "#64748b", marginBottom: "8px" }}>This supplier is not yet in your catalog.</div>
                                  <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
                                    <button
                                      type="button"
                                      disabled={isCreatingSmartSupplier}
                                      onClick={async () => {
                                        setIsCreatingSmartSupplier(true);
                                        const { data: newSup, error: supErr } = await supabase
                                          .from("suppliers")
                                          .insert({ business_id: businessId, name: extractedName, status: "active" })
                                          .select("id, name")
                                          .single();
                                        if (supErr) { setMessage({ text: "Failed to create supplier: " + supErr.message, type: "error" }); }
                                        else if (newSup) { setSmartReceiveLinkedSupplierId(newSup.id); await loadSuppliers(); }
                                        setIsCreatingSmartSupplier(false);
                                      }}
                                      style={{ padding: "8px 16px", fontSize: "13px", fontWeight: 600, cursor: isCreatingSmartSupplier ? "not-allowed" : "pointer", background: "#1d4ed8", color: "#fff", border: "none", borderRadius: "6px", opacity: isCreatingSmartSupplier ? 0.6 : 1 }}
                                    >{isCreatingSmartSupplier ? "Creating..." : "Create Supplier"}</button>
                                    <button type="button" onClick={resetAll} style={{ padding: "8px 14px", fontSize: "13px", cursor: "pointer", background: "none", border: "1px solid #e2e8f0", borderRadius: "6px", color: "#475569" }}>Cancel</button>
                                  </div>

                                  {/* CASE 3 — AI extracted wrong name */}
                                  <div style={{ marginTop: "8px" }}>
                                    <button type="button" onClick={() => setShowSmartSupplierOverridePicker(p => !p)} style={{ fontSize: "11px", cursor: "pointer", background: "none", border: "none", color: "#64748b", textDecoration: "underline", padding: 0 }}>The supplier name is incorrect?</button>
                                    {showSmartSupplierOverridePicker && (
                                      <div style={{ marginTop: "6px", padding: "8px 10px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "6px" }}>
                                        <div style={{ fontSize: "11px", color: "#64748b", marginBottom: "4px" }}>Select the correct supplier to fix an AI extraction error:</div>
                                        <select
                                          value=""
                                          onChange={e => { setSmartReceiveLinkedSupplierId(e.target.value); setShowSmartSupplierOverridePicker(false); }}
                                          style={{ width: "100%", padding: "6px 8px", fontSize: "12px", border: "1px solid #cbd5e1", borderRadius: "6px" }}
                                        >
                                          <option value="">Select existing supplier…</option>
                                          {suppliers.filter(s => s.status === "active").map(s => (
                                            <option key={s.id} value={s.id}>{s.name}</option>
                                          ))}
                                        </select>
                                      </div>
                                    )}
                                  </div>

                                  {/* Advanced — receive unlinked */}
                                  <div style={{ marginTop: "6px" }}>
                                    <button type="button" onClick={() => setShowSmartSupplierAdvanced(p => !p)} style={{ fontSize: "10px", cursor: "pointer", background: "none", border: "none", color: "#94a3b8", textDecoration: "underline", padding: 0 }}>Advanced options</button>
                                    {showSmartSupplierAdvanced && (
                                      <div style={{ marginTop: "6px", padding: "8px 10px", background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: "6px" }}>
                                        <div style={{ fontSize: "11px", color: "#92400e", fontWeight: 600, marginBottom: "4px" }}>⚠ Receive without creating a supplier</div>
                                        <div style={{ fontSize: "11px", color: "#92400e", marginBottom: "6px" }}>The invoice will be stored using the extracted supplier name but will not be linked to a supplier record. Use only for exceptional situations.</div>
                                        <button type="button" onClick={() => { setShowSmartSupplierAdvanced(false); setShowSmartSupplierOverridePicker(false); }} style={{ fontSize: "11px", cursor: "pointer", padding: "4px 10px", background: "none", border: "1px solid #fed7aa", borderRadius: "4px", color: "#92400e" }}>Continue Unlinked</button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                      {/* Per-item matching cards */}
                      <div style={{ fontWeight: 600, fontSize: "13px", color: "#334155", marginBottom: "6px" }}>
                        Product Matching
                        {unmatchedCount > 0 && <span style={{ marginLeft: "8px", fontSize: "11px", color: "#b45309", background: "#fef3c7", padding: "1px 7px", borderRadius: "10px" }}>{unmatchedCount} unmatched</span>}
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "10px" }}>
                        {smartReceiveResult.items.map((item, i) => {
                          const matchId = smartReceiveMatches[i] ?? "";
                          const matched = products.find(p => p.product_id === matchId);
                          const isUnmatched = !matchId;
                          const currentCost = matched ? (matched.cost_price ?? matched.average_cost ?? 0) : null;
                          const costDiff = currentCost != null ? ((item.unitCost - currentCost) / (currentCost || 1)) * 100 : null;
                          const costDiffers = costDiff != null && Math.abs(item.unitCost - (currentCost ?? 0)) > 0.01;
                          return (
                            <div key={i} style={{ border: `1px solid ${isUnmatched ? "#fde68a" : "#86efac"}`, borderRadius: "8px", padding: "10px 12px", background: isUnmatched ? "#fffbeb" : "#f0fdf4" }}>
                              {/* Item header */}
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "6px", flexWrap: "wrap", gap: "4px" }}>
                                <span style={{ fontSize: "13px", fontWeight: 600, color: "#0f172a" }}>{item.description}</span>
                                <span style={{ fontSize: "12px", color: "#64748b" }}>{item.quantity} × ${item.unitCost.toFixed(2)} = <strong>${(item.quantity * item.unitCost).toFixed(2)}</strong></span>
                              </div>
                              {/* Matched state — no dropdown */}
                              {matched ? (
                                <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                                  <span style={{ fontSize: "12px", fontWeight: 600, color: "#15803d" }}>✓ Matched</span>
                                  <span style={{ fontSize: "12px", color: "#334155" }}>{matched.product_name}</span>
                                  <button type="button" onClick={() => setSmartReceiveMatches(prev => prev.map((m, j) => j === i ? "" : m))} style={{ fontSize: "11px", cursor: "pointer", background: "none", border: "1px solid #cbd5e1", borderRadius: "4px", padding: "1px 6px", color: "#64748b", marginLeft: "auto" }}>Change</button>
                                </div>
                              ) : (
                                <div style={{ display: "flex", gap: "6px", alignItems: "center", flexWrap: "wrap" }}>
                                  <span style={{ fontSize: "11px", color: "#92400e", background: "#fef3c7", padding: "2px 7px", borderRadius: "10px", fontWeight: 600 }}>⚠ Unmatched</span>
                                  <select
                                    value=""
                                    onChange={e => setSmartReceiveMatches(prev => prev.map((m, j) => j === i ? e.target.value : m))}
                                    style={{ flex: 1, minWidth: "140px", padding: "4px 6px", fontSize: "12px", border: "1px solid #fde68a", borderRadius: "6px", background: "#fff" }}
                                  >
                                    <option value="">Select existing product</option>
                                    {products.filter(p => p.status === "active").map(p => (
                                      <option key={p.product_id} value={p.product_id}>{p.product_name}</option>
                                    ))}
                                  </select>
                                  <button type="button" onClick={() => {
                                    const supplierMatch = suppliers.find(s => s.name.toLowerCase().trim() === smartReceiveResult!.supplier.toLowerCase().trim());
                                    // Pre-fill existing Add Product state from invoice data
                                    setNewName(item.description);
                                    setNewBarcode("");
                                    setNewSku("");
                                    setNewCostPrice(item.unitCost.toFixed(2));
                                    setNewSellingPrice("");
                                    setNewInitialStock("0"); // receiving session handles qty via Post Receiving
                                    setNewReorderLevel("");
                                    setNewOverhead("");
                                    setNewTargetMargin("");
                                    setNewMinMargin("");
                                    setNewProductCategory("");
                                    setBarcodeAutoFill("");
                                    // If supplier matched, find their supplier_id — set via callback after product is created
                                    const idx = i;
                                    setAddProductModalCallback(() => async (productId: string) => {
                                      // Link supplier if matched
                                      if (supplierMatch?.id) {
                                        await supabase.from("products").update({ supplier_id: supplierMatch.id }).eq("id", productId);
                                      }
                                      setSmartReceiveMatches(prev => prev.map((m, j) => j === idx ? productId : m));
                                    });
                                    setAddProductModalOpen(true);
                                  }} style={{ padding: "4px 10px", fontSize: "12px", fontWeight: 600, cursor: "pointer", background: "#1d4ed8", color: "#fff", border: "none", borderRadius: "6px", whiteSpace: "nowrap" }}>+ Create New</button>
                                </div>
                              )}
                              {/* Product details when matched */}
                              {matched && (
                                <div style={{ marginTop: "8px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2px 12px", fontSize: "11px", color: "#64748b", padding: "6px 8px", background: "#f8fafc", borderRadius: "6px" }}>
                                  <span>Current Stock</span><span style={{ fontWeight: 600 }}>{matched.quantity_on_hand}</span>
                                  <span>Current Cost</span><span style={{ fontWeight: 600 }}>{currentCost != null ? `$${currentCost.toFixed(2)}` : "—"}</span>
                                  <span>Average Cost</span><span style={{ fontWeight: 600 }}>${matched.average_cost.toFixed(2)}</span>
                                  {matched.reorder_level != null && <><span>Reorder Level</span><span style={{ fontWeight: 600 }}>{matched.reorder_level}</span></>}
                                  {costDiffers && costDiff != null && (
                                    <span style={{ gridColumn: "1 / -1", color: costDiff > 0 ? "#b45309" : "#15803d", fontWeight: 600, marginTop: "2px" }}>
                                      {costDiff > 0 ? "▲" : "▼"} Invoice cost ${item.unitCost.toFixed(2)} ({costDiff > 0 ? "+" : ""}{costDiff.toFixed(1)}% vs current)
                                    </span>
                                  )}
                                </div>
                              )}
                              {/* Batch / Expiry fields */}
                              <div style={{ marginTop: "8px", padding: "8px 10px", background: "#fafafa", border: "1px solid #e2e8f0", borderRadius: "6px" }}>
                                <div style={{ fontSize: "10px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "5px" }}>
                                  Batch / Expiry
                                  {smartReceiveItemBatch[i]?.expiration_date && <span style={{ marginLeft: "6px", fontWeight: 400, textTransform: "none", color: "#15803d" }}>✓ extracted</span>}
                                </div>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "3px" }}>
                                  <input type="text" placeholder="Batch #" value={smartReceiveItemBatch[i]?.batch_number ?? ""} onChange={e => setSmartReceiveItemBatch(prev => { const next = [...prev]; next[i] = { ...(next[i] ?? { lot_number: "", manufactured_date: "", expiration_date: "" }), batch_number: e.target.value }; return next; })} style={{ padding: "3px 7px", fontSize: "11px", border: "1px solid #e2e8f0", borderRadius: "4px", color: "#475569" }} />
                                  <input type="text" placeholder="Lot #" value={smartReceiveItemBatch[i]?.lot_number ?? ""} onChange={e => setSmartReceiveItemBatch(prev => { const next = [...prev]; next[i] = { ...(next[i] ?? { batch_number: "", manufactured_date: "", expiration_date: "" }), lot_number: e.target.value }; return next; })} style={{ padding: "3px 7px", fontSize: "11px", border: "1px solid #e2e8f0", borderRadius: "4px", color: "#475569" }} />
                                  <input type="date" title="Manufactured date" value={smartReceiveItemBatch[i]?.manufactured_date ?? ""} onChange={e => setSmartReceiveItemBatch(prev => { const next = [...prev]; next[i] = { ...(next[i] ?? { batch_number: "", lot_number: "", expiration_date: "" }), manufactured_date: e.target.value }; return next; })} style={{ padding: "3px 7px", fontSize: "11px", border: "1px solid #e2e8f0", borderRadius: "4px", color: "#475569" }} />
                                  <input type="date" title="Expiry date" value={smartReceiveItemBatch[i]?.expiration_date ?? ""} onChange={e => setSmartReceiveItemBatch(prev => { const next = [...prev]; next[i] = { ...(next[i] ?? { batch_number: "", lot_number: "", manufactured_date: "" }), expiration_date: e.target.value }; return next; })} style={{ padding: "3px 7px", fontSize: "11px", border: "1px solid #e2e8f0", borderRadius: "4px", color: "#475569", fontWeight: smartReceiveItemBatch[i]?.expiration_date ? 600 : 400 }} />
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      {/* Cost summary */}
                      <div style={{ fontSize: "13px", borderTop: "1px solid #e2e8f0", paddingTop: "8px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 600, color: "#334155", marginBottom: "4px" }}>
                          <span>Items Subtotal</span><span>${smartReceiveResult.items.reduce((s, item) => s + item.quantity * item.unitCost, 0).toFixed(2)}</span>
                        </div>
                        <div style={{ padding: "8px 10px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "6px" }}>
                          <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "3px 16px", fontSize: "12px", color: "#475569" }}>
                            {smartReceiveResult.freight > 0 && <><span>Freight</span><span>+${smartReceiveResult.freight.toFixed(2)}</span></>}
                            {smartReceiveResult.additionalCost > 0 && <><span>Additional Costs</span><span>+${smartReceiveResult.additionalCost.toFixed(2)}</span></>}
                            {smartReceiveResult.invoiceTotal > 0 && <><span style={{ fontWeight: 700, color: "#0f172a" }}>Invoice Total</span><span style={{ fontWeight: 700, color: "#0f172a" }}>${smartReceiveResult.invoiceTotal.toFixed(2)}</span></>}
                          </div>
                        </div>
                      </div>
                      {!allMatched && <p style={{ fontSize: "11px", color: "#b45309", marginTop: "8px" }}>Resolve all unmatched items to create the receiving session.</p>}
                    </div>
                    <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end", flexWrap: "wrap" }}>
                      <button type="button" onClick={resetAll} style={{ padding: "9px 18px", fontSize: "13px", cursor: "pointer", background: "none", border: "1px solid #cbd5e1", borderRadius: "6px", color: "#475569" }}>Back</button>
                      <button type="button" onClick={closeAll} style={{ padding: "9px 18px", fontSize: "13px", cursor: "pointer", background: "none", border: "1px solid #cbd5e1", borderRadius: "6px", color: "#475569" }}>Close</button>
                      <button
                        type="button"
                        onClick={() => handleCreateSmartReceivingSession()}
                        disabled={!allMatched || isCreatingSmartSession}
                        style={{ padding: "9px 18px", fontSize: "13px", fontWeight: 600, cursor: allMatched && !isCreatingSmartSession ? "pointer" : "not-allowed", background: allMatched ? "#15803d" : "#e2e8f0", color: allMatched ? "#fff" : "#94a3b8", border: "none", borderRadius: "6px", opacity: isCreatingSmartSession ? 0.6 : 1 }}
                      >{isCreatingSmartSession ? "Creating..." : "Create Receiving Session"}</button>
                    </div>
                  </>
                );
              })()
            : null}
          </div>
        </div>
      )}

      {/* ── Duplicate Invoice Warning Dialog ── */}
      {smartReceiveDuplicateWarning && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1300, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "#fff", borderRadius: "12px", padding: "28px", width: "440px", maxWidth: "95vw", boxShadow: "0 8px 32px rgba(0,0,0,0.2)" }}>
            <div style={{ fontSize: "20px", marginBottom: "8px" }}>⚠️</div>
            <div style={{ fontWeight: 700, fontSize: "16px", color: "#0f172a", marginBottom: "8px" }}>Invoice Already Received</div>
            <div style={{ fontSize: "14px", color: "#475569", marginBottom: "20px", lineHeight: 1.6 }}>
              Invoice <strong>{smartReceiveDuplicateWarning.invoiceNumber}</strong> was already received (status: <strong>{smartReceiveDuplicateWarning.existingStatus}</strong>).
              <br /><br />
              Opening the existing session is safer than creating a duplicate.
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <button
                type="button"
                onClick={async () => {
                  const { data: existingSession } = await supabase
                    .from("receiving_sessions")
                    .select("id, business_id, supplier_id, received_by, status, notes, created_at, invoice_number, supplier_name")
                    .eq("id", smartReceiveDuplicateWarning.existingSessionId)
                    .single();
                  setSmartReceiveDuplicateWarning(null);
                  setSmartReceiveSimpleOpen(false);
                  setSmartReceiveFile(null);
                  setSmartReceiveProcessing(false);
                  setSmartReceiveResult(null);
                  setSmartReceiveLoading(false);
                  setSmartReceiveMatches([]);
                  setActiveTab("inventory");
                  if (!existingSession) return;
                  if (existingSession.status === 'draft') {
                    // Resume the in-progress draft
                    const { data: existingItems } = await supabase
                      .from("receiving_items")
                      .select("id, product_id, quantity_received, unit_cost")
                      .eq("receiving_session_id", existingSession.id)
                      .order("created_at", { ascending: true });
                    setActiveReceivingSession({ ...existingSession, invoice_number: (existingSession as { invoice_number?: string | null }).invoice_number ?? null, supplier_name: (existingSession as { supplier_name?: string | null }).supplier_name ?? null });
                    setSessionItems((existingItems ?? []) as { id: string; product_id: string; quantity_received: number; unit_cost: number }[]);
                  } else {
                    // Completed/cancelled — route to history, never activate as draft
                    setMessage({ text: `Session ${existingSession.id.slice(0, 8)} is already ${existingSession.status}. View it in Receiving History below.`, type: "success" });
                  }
                }}
                style={{ padding: "11px 16px", fontSize: "14px", fontWeight: 600, cursor: "pointer", background: "#1d4ed8", color: "#fff", border: "none", borderRadius: "8px" }}
              >{smartReceiveDuplicateWarning.existingStatus === 'draft' ? 'Open Existing Session' : 'View in History'}</button>
              <button
                type="button"
                onClick={() => setSmartReceiveDuplicateWarning(null)}
                style={{ padding: "11px 16px", fontSize: "14px", cursor: "pointer", background: "none", border: "1px solid #e2e8f0", borderRadius: "8px", color: "#475569" }}
              >Cancel</button>
              <button
                type="button"
                onClick={() => { setSmartReceiveDuplicateWarning(null); void handleCreateSmartReceivingSession(true); }}
                style={{ padding: "11px 16px", fontSize: "13px", cursor: "pointer", background: "none", border: "1px solid #fca5a5", borderRadius: "8px", color: "#dc2626" }}
              >Create Duplicate Anyway</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Add Product Modal — reused by Smart Receive (same form, same handler) ── */}
      {addProductModalOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1200 }} onClick={(e) => { if (e.target === e.currentTarget) { setAddProductModalOpen(false); setAddProductModalCallback(null); } }} />
      )}
      {addProductModalOpen && (
        <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)", zIndex: 1201, background: "#fff", borderRadius: "12px", width: "560px", maxWidth: "95vw", maxHeight: "90vh", display: "flex", flexDirection: "column", boxShadow: "0 8px 32px rgba(0,0,0,0.2)", overflow: "hidden" }}>
          <div style={{ padding: "20px 24px 14px", borderBottom: "1px solid #f1f5f9", flexShrink: 0 }}>
            <div style={{ fontWeight: 700, fontSize: "16px", color: "#0f172a", marginBottom: "2px" }}>Add Product</div>
            <div style={{ fontSize: "12px", color: "#64748b" }}>Pre-filled from invoice. Review and save.</div>
          </div>
          <div style={{ overflowY: "auto", flex: 1, padding: "16px 24px 20px" }}>
            <form onSubmit={handleAddProduct} style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
              <input type="text" placeholder="Product Name *" required value={newName} onChange={e => setNewName(e.target.value)} style={{ flex: "2 1 200px", padding: "8px 10px", fontSize: "13px", border: "1px solid #cbd5e1", borderRadius: "6px" }} />
              <input type="text" placeholder="SKU" value={newSku} onChange={e => setNewSku(e.target.value)} style={{ flex: "1 1 110px", padding: "8px 10px", fontSize: "13px", border: "1px solid #cbd5e1", borderRadius: "6px" }} />
              <input type="text" placeholder="Barcode" value={newBarcode} onChange={e => setNewBarcode(e.target.value)} style={{ flex: "1 1 120px", padding: "8px 10px", fontSize: "13px", border: "1px solid #cbd5e1", borderRadius: "6px" }} />
              <input type="number" placeholder="Cost Price" value={newCostPrice} onChange={e => setNewCostPrice(e.target.value)} style={{ flex: "1 1 110px", padding: "8px 10px", fontSize: "13px", border: "1px solid #cbd5e1", borderRadius: "6px" }} />
              <input type="number" placeholder="Selling Price *" required value={newSellingPrice} onChange={e => setNewSellingPrice(e.target.value)} style={{ flex: "1 1 110px", padding: "8px 10px", fontSize: "13px", border: "1px solid #cbd5e1", borderRadius: "6px" }} />
              <input type="number" min="0" placeholder="Initial Stock *" required value={newInitialStock} onChange={e => setNewInitialStock(e.target.value)} style={{ flex: "1 1 110px", padding: "8px 10px", fontSize: "13px", border: "1px solid #cbd5e1", borderRadius: "6px" }} />
              <input type="number" placeholder="Reorder Level" value={newReorderLevel} onChange={e => setNewReorderLevel(e.target.value)} style={{ flex: "1 1 110px", padding: "8px 10px", fontSize: "13px", border: "1px solid #cbd5e1", borderRadius: "6px" }} />
              <select value={newProductCategory} onChange={e => setNewProductCategory(e.target.value)} style={{ flex: "1 1 140px", padding: "8px 10px", fontSize: "13px", border: "1px solid #cbd5e1", borderRadius: "6px" }}>
                <option value="">No Category</option>
                {categories.filter(c => c.status === "active").map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <input type="number" min="0" step="0.1" placeholder="Overhead %" value={newOverhead} onChange={e => setNewOverhead(e.target.value)} style={{ flex: "1 1 100px", padding: "8px 10px", fontSize: "13px", border: "1px solid #cbd5e1", borderRadius: "6px" }} />
              <input type="number" min="0" step="0.1" placeholder="Target Margin %" value={newTargetMargin} onChange={e => setNewTargetMargin(e.target.value)} style={{ flex: "1 1 110px", padding: "8px 10px", fontSize: "13px", border: "1px solid #cbd5e1", borderRadius: "6px" }} />
              <input type="number" min="0" step="0.1" placeholder="Min Margin %" value={newMinMargin} onChange={e => setNewMinMargin(e.target.value)} style={{ flex: "1 1 110px", padding: "8px 10px", fontSize: "13px", border: "1px solid #cbd5e1", borderRadius: "6px" }} />
              <div style={{ width: "100%", display: "flex", gap: "8px", paddingTop: "4px" }}>
                <button type="submit" style={{ flex: 1, padding: "10px", fontSize: "14px", fontWeight: 600, cursor: "pointer", background: "#15803d", color: "#fff", border: "none", borderRadius: "6px" }}>Add Product</button>
                <button type="button" onClick={() => { setAddProductModalOpen(false); setAddProductModalCallback(null); }} style={{ padding: "10px 18px", fontSize: "14px", cursor: "pointer", background: "none", border: "1px solid #e2e8f0", borderRadius: "6px", color: "#475569" }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Product Resolution Dialog (global, reusable) ── */}
      <ProductResolutionDialog
        request={productResolution}
        mode={productResolutionMode}
        setMode={setProductResolutionMode}
        linkId={productResolutionLinkId}
        setLinkId={setProductResolutionLinkId}
        newName={productResolutionNewName}
        setNewName={setProductResolutionNewName}
        newCost={productResolutionNewCost}
        setNewCost={setProductResolutionNewCost}
        newSelling={productResolutionNewSelling}
        setNewSelling={setProductResolutionNewSelling}
        categoryId={productResolutionCategoryId}
        setCategoryId={setProductResolutionCategoryId}
        supplierId={productResolutionSupplierId}
        setSupplierId={setProductResolutionSupplierId}
        isSaving={isSavingProductResolution}
        products={products}
        categories={categories}
        suppliers={suppliers}
        onLink={handleProductResolutionLink}
        onCreate={handleProductResolutionCreate}
        onClose={closeProductResolution}
      />

      {/* Signature Modal */}
      {signPoId && (() => {
        const po = purchaseOrders.find(p => p.id === signPoId);
        if (!po) return null;
        const sigs = getPoSignatures(signPoId);
        const hasMgr = !!sigs.manager;
        const hasSup = !!sigs.supplier;
        return (
          <div
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}
            onClick={(e) => { if (e.target === e.currentTarget) setSignPoId(null); }}
          >
            <div style={{ background: "#fff", padding: "28px 32px", width: "480px", borderRadius: "8px", boxShadow: "0 4px 24px rgba(0,0,0,0.2)", fontFamily: "'Segoe UI', Arial, sans-serif" }}>
              <div style={{ fontWeight: 700, fontSize: "18px", marginBottom: "4px", color: "#0f172a" }}>Sign Purchase Order</div>
              <div style={{ fontSize: "14px", color: "#64748b", marginBottom: "16px" }}>{po.po_number}</div>

              {/* Role tabs */}
              <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
                <button
                  onClick={() => setSignRole("manager")}
                  style={{ flex: 1, padding: "8px", borderRadius: "6px", border: signRole === "manager" ? "2px solid #1d4ed8" : "1px solid #d1d5db", background: signRole === "manager" ? "#eff6ff" : "#fff", fontWeight: signRole === "manager" ? 600 : 400, cursor: "pointer", fontSize: "14px", color: signRole === "manager" ? "#1d4ed8" : "#475569" }}
                >
                  Manager {hasMgr ? " (signed)" : ""}
                </button>
                <button
                  onClick={() => setSignRole("supplier")}
                  style={{ flex: 1, padding: "8px", borderRadius: "6px", border: signRole === "supplier" ? "2px solid #1d4ed8" : "1px solid #d1d5db", background: signRole === "supplier" ? "#eff6ff" : "#fff", fontWeight: signRole === "supplier" ? 600 : 400, cursor: "pointer", fontSize: "14px", color: signRole === "supplier" ? "#1d4ed8" : "#475569" }}
                >
                  Supplier {hasSup ? " (signed)" : ""}
                </button>
              </div>

              {/* Existing signature preview */}
              {sigs[signRole] && (
                <div style={{ marginBottom: "12px", padding: "10px", border: "1px solid #bbf7d0", borderRadius: "6px", background: "#f0fdf4", textAlign: "center" }}>
                  <img src={sigs[signRole]!.dataUrl} alt="Saved signature" style={{ height: "56px", maxWidth: "100%", objectFit: "contain" }} />
                  <div style={{ fontSize: "12px", color: "#15803d", marginTop: "4px" }}>Signed: {new Date(sigs[signRole]!.signedAt).toLocaleString()}</div>
                  <button
                    onClick={() => { clearPoSignature(signPoId, signRole); setSignPoId(null); setTimeout(() => setSignPoId(po.id), 0); }}
                    style={{ marginTop: "8px", padding: "4px 14px", fontSize: "13px", cursor: "pointer", color: "#b91c1c", background: "#fee2e2", border: "1px solid #fca5a5", borderRadius: "4px" }}
                  >Clear Signature</button>
                </div>
              )}

              {/* Canvas */}
              {!sigs[signRole] && (
                <>
                  <div style={{ fontSize: "13px", color: "#64748b", marginBottom: "6px" }}>Draw your signature below:</div>
                  <canvas
                    ref={initSigCanvas}
                    width={400}
                    height={150}
                    style={{ width: "100%", height: "150px", border: "1px solid #cbd5e1", borderRadius: "6px", cursor: "crosshair", touchAction: "none" }}
                  />
                  <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
                    <button
                      onClick={() => {
                        const c = sigCanvasRef.current;
                        if (!c) return;
                        const ctx = c.getContext("2d");
                        if (ctx) { ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, c.width, c.height); }
                      }}
                      style={{ padding: "8px 16px", cursor: "pointer", borderRadius: "5px", border: "1px solid #d1d5db" }}
                    >Clear</button>
                    <button
                      onClick={() => {
                        const c = sigCanvasRef.current;
                        if (!c) return;
                        const dataUrl = c.toDataURL("image/png");
                        savePoSignature(signPoId, signRole, dataUrl);
                        setMessage({ text: `${signRole === "manager" ? "Manager" : "Supplier"} signature saved for ${po.po_number}`, type: "success" });
                        setSignPoId(null);
                      }}
                      style={{ padding: "8px 20px", cursor: "pointer", borderRadius: "5px", border: "none", background: "#1d4ed8", color: "#fff", fontWeight: 600 }}
                    >Save Signature</button>
                    <button
                      onClick={() => setSignPoId(null)}
                      style={{ padding: "8px 16px", cursor: "pointer", borderRadius: "5px", border: "1px solid #d1d5db", marginLeft: "auto" }}
                    >Cancel</button>
                  </div>
                </>
              )}

              {sigs[signRole] && (
                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "8px" }}>
                  <button onClick={() => setSignPoId(null)} style={{ padding: "8px 20px", cursor: "pointer", borderRadius: "5px", border: "1px solid #d1d5db" }}>Close</button>
                </div>
              )}
            </div>
          </div>
        );
      })()}

      <POPrintModal
        printPo={printPo}
        products={products}
        businessName={businessName}
        businessAddress={businessAddress}
        businessPhone={businessPhone}
        businessEmail={businessEmail}
        fmtPhone={fmtPhone}
        getPoSignatures={getPoSignatures}
        onClose={() => setPrintPo(null)}
      />

      <ReceiptPrintModal
        receipt={receipt}
        products={products}
        businessName={businessName}
        businessPhone={businessPhone}
        businessAddress={businessAddress}
        onClose={() => setReceipt(null)}
      />
    </div>
  );
}

export default App;
