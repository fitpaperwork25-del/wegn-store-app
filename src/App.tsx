import React, { useEffect, useRef, useState, useCallback } from "react";
import { supabase } from "./supabase";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

type Transaction = {
  id: string;
  created_at: string;
  transaction_type: string;
  quantity_change: number;
  quantity_before: number;
  quantity_after: number;
  product_id: string;
  products: { name: string } | null;
};

type Supplier = {
  id: string;
  name: string;
  contact_name: string | null;
  phone: string | null;
  email: string | null;
  notes: string | null;
  status: string;
  created_at: string;
};

type PurchaseOrder = {
  id: string;
  supplier_id: string;
  po_number: string;
  status: string;
  subtotal: number;
  notes: string | null;
  created_at: string;
};

type POItem = {
  id: string;
  purchase_order_id: string;
  product_id: string;
  quantity: number;
  quantity_received: number;
  unit_cost: number;
  line_total: number;
  created_at: string;
};

type ReceiptItem = {
  product_id: string;
  quantity: number;
  unit_price: number;
  line_total: number;
};

type Receipt = {
  sale: Sale;
  items: ReceiptItem[];
  paymentMethod: string;
  pointsEarned?: number;
  pointsRedeemed?: number;
};

type SaleItemRecord = {
  sale_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  line_total: number;
};

type EodItem = {
  sale_id: string;
  product_id: string;
  quantity: number;
  line_total: number;
};

type EodPayment = {
  sale_id: string;
  payment_method: string;
  amount: number;
};

type CartItem = {
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  line_total: number;
};

type Sale = {
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

type Customer = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  status: string;
  created_at: string;
};

type ProductStock = {
  inventory_id: string;
  business_id: string;
  product_id: string;
  product_name: string;
  sku: string | null;
  barcode: string | null;
  selling_price: number;
  quantity_on_hand: number;
  reorder_level: number;
  status: string;
  average_cost: number;
  supplier_id: string | null;
  category_id: string | null;
};

type Category = {
  id: string;
  business_id: string;
  name: string;
  description: string | null;
  status: string;
  created_at: string;
};

type ReturnLineItem = {
  product_id: string;
  product_name: string;
  original_qty: number;
  already_returned: number;
  available_qty: number;
  return_qty: number;
};

type StockCountLine = {
  product_id: string;
  inventory_id: string;
  business_id: string;
  product_name: string;
  sku: string | null;
  barcode: string | null;
  system_qty: number;
  counted_qty: number;
};

type StockCountRecord = {
  id: string;
  business_id: string;
  status: string;
  notes: string | null;
  completed_at: string;
  created_at: string;
};

type StockCountItemDetail = {
  id: string;
  product_id: string;
  system_qty: number;
  counted_qty: number;
  variance: number;
  products: { name: string; sku: string | null } | null;
};

type DrawerSession = {
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

type LoyaltyTransaction = {
  id: string;
  customer_id: string;
  sale_id: string | null;
  points: number;
  type: string;
  created_at: string;
};

type Employee = {
  id: string;
  business_id: string;
  name: string;
  role: string;
  status: string;
  created_at: string;
};

type BulkRow = {
  name: string;
  selling_price: string;
  sku: string;
  barcode: string;
  cost_price: string;
  reorder_level: string;
  initial_stock: string;
  status: 'valid' | 'missing_name' | 'missing_price' | 'invalid_price' | 'duplicate_barcode';
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
  const [selectedPoId, setSelectedPoId] = useState("");
  const [poItems, setPoItems] = useState<POItem[]>([]);
  const [itemProductId, setItemProductId] = useState("");
  const [itemQuantity, setItemQuantity] = useState("");
  const [itemUnitCost, setItemUnitCost] = useState("");
  const [receivingPoId, setReceivingPoId] = useState("");
  const [receivingItems, setReceivingItems] = useState<POItem[]>([]);
  const [receiveQtys, setReceiveQtys] = useState<Record<string, string>>({});
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
  const [adjustProductId, setAdjustProductId] = useState("");
  const [adjustType, setAdjustType] = useState("damaged");
  const [adjustQuantity, setAdjustQuantity] = useState("");
  const [adjustReason, setAdjustReason] = useState("");
  const [newName, setNewName] = useState("");
  const [newSku, setNewSku] = useState("");
  const [newBarcode, setNewBarcode] = useState("");
  const [barcodeAutoFill, setBarcodeAutoFill] = useState("");
  const [newCostPrice, setNewCostPrice] = useState("");
  const [newSellingPrice, setNewSellingPrice] = useState("");
  const [newReorderLevel, setNewReorderLevel] = useState("");
  const [newInitialStock, setNewInitialStock] = useState("");
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [movementFilter, setMovementFilter] = useState("all");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [barcodeInput, setBarcodeInput] = useState("");
  const [cartProductId, setCartProductId] = useState("");
  const [cartQty, setCartQty] = useState("1");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card">("cash");
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
  const [newEmpRole, setNewEmpRole] = useState<"cashier" | "manager">("cashier");
  const [salesCashierFilter, setSalesCashierFilter] = useState<string>("all");
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
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [businessName, setBusinessName] = useState("");
  const [businessPhone, setBusinessPhone] = useState("");
  const [businessEmail, setBusinessEmail] = useState("");
  const [businessAddress, setBusinessAddress] = useState("");
  const [businessTaxRate, setBusinessTaxRate] = useState(0);
  const [editingBusiness, setEditingBusiness] = useState(false);
  const [editBizName, setEditBizName] = useState("");
  const [editBizPhone, setEditBizPhone] = useState("");
  const [editBizEmail, setEditBizEmail] = useState("");
  const [editBizAddress, setEditBizAddress] = useState("");
  const [editBizTaxRate, setEditBizTaxRate] = useState("");

  const [activeTab, setActiveTab] = useState<string>('pos');
  const [navOpen, setNavOpen] = useState(false);

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
    loadAllPoItems();
    loadCategories();
    loadDrawerSession();
    loadEmployees();
    loadStockCounts();
  }, []);

  useEffect(() => {
    if (cart.length === 0) return;
    const handler = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ""; };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [cart.length]);

  const fmtPhone = (p: string) => { const d = p.replace(/\D/g, ""); return d.length === 10 ? `(${d.slice(0,3)}) ${d.slice(3,6)}-${d.slice(6)}` : p; };

  // Derived from allPayments + sales so it stays current after every sale/void/return.
  // Filters to completed sales only (excludes voided/returned) scoped to current drawer session.
  const drawerCashSales = drawerSession
    ? (() => {
        const openedAt = new Date(drawerSession.opened_at);
        const validIds = new Set(
          sales
            .filter(s => s.status === 'completed' && new Date(s.created_at) >= openedAt)
            .map(s => s.id)
        );
        return allPayments
          .filter(p => p.payment_method === 'cash' && validIds.has(p.sale_id))
          .reduce((sum, p) => sum + Number(p.amount), 0);
      })()
    : 0;

  async function loadBusiness() {
    const { data, error } = await supabase
      .from("businesses")
      .select("id, name, phone, email, address, tax_rate")
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
      setBusinessError("");
    }
    setBusinessLoaded(true);
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
    const { error } = await supabase
      .from("businesses")
      .update({
        name: editBizName.trim(),
        phone: editBizPhone.trim() || null,
        email: editBizEmail.trim() || null,
        address: editBizAddress.trim() || null,
        tax_rate: parsedTaxRate,
      })
      .eq("id", businessId);
    if (error) { console.error(error); setMessage({ text: "Failed to update business: " + error.message, type: "error" }); return; }
    setEditingBusiness(false);
    setMessage({ text: "Business profile updated", type: "success" });
    await loadBusiness();
  }

  async function loadSaleItems() {
    const { data, error } = await supabase
      .from("sale_items")
      .select("sale_id, product_id, quantity, unit_price, line_total");
    if (error) { console.error(error); return; }
    setSaleItems((data as SaleItemRecord[]) || []);
  }

  async function handleOpenReturn(sale: Sale) {
    if (returningSaleId === sale.id) { setReturningSaleId(null); setReturnLines([]); return; }
    const productMap = Object.fromEntries(products.map(p => [p.product_id, p.product_name]));
    const { data: items, error: itemsErr } = await supabase
      .from('sale_items')
      .select('product_id, quantity')
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
        already_returned: priorMap[i.product_id] ?? 0,
        available_qty: i.quantity - (priorMap[i.product_id] ?? 0),
        return_qty: 0,
      }))
      .filter(l => l.available_qty > 0);
    setReturnLines(lines);
    setReturnReason("");
    setReturningSaleId(sale.id);
  }

  async function handleConfirmReturn() {
    if (!returningSaleId) return;
    const toReturn = returnLines.filter(l => l.return_qty > 0);
    if (toReturn.length === 0) return;
    setReturnLoading(true);
    for (const line of toReturn) {
      const product = products.find(p => p.product_id === line.product_id);
      if (!product) continue;
      await supabase.from('return_items').insert({
        business_id: businessId,
        sale_id: returningSaleId,
        product_id: line.product_id,
        quantity_returned: line.return_qty,
        reason: returnReason || null,
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
    // Only mark fully returned when every line across the sale is exhausted
    const origSaleItems = saleItems.filter(si => si.sale_id === returningSaleId);
    const allFullyReturned = origSaleItems.every(si => {
      const line = returnLines.find(l => l.product_id === si.product_id);
      if (!line) return true; // was already fully returned in a prior batch
      return (line.already_returned + line.return_qty) >= si.quantity;
    });
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
    setReturnLoading(false);
    setMessage({ text: "Return processed", type: "success" });
    await loadProducts();
    await loadTransactions();
    await loadSales();
    await loadLoyaltyTransactions();
    await loadAllReturnItems();
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
      .order('created_at', { ascending: false });
    setLoyaltyTransactions((data as LoyaltyTransaction[]) ?? []);
  }

  async function loadAllReturnItems() {
    const { data } = await supabase
      .from('return_items')
      .select('sale_id, product_id, quantity_returned');
    setAllReturnItems((data as { sale_id: string; product_id: string; quantity_returned: number }[]) ?? []);
  }

  async function loadAllPoItems() {
    const { data } = await supabase
      .from('purchase_order_items')
      .select('id, purchase_order_id, product_id, quantity, quantity_received, unit_cost, line_total, created_at');
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
    const assigned = products.filter(p => p.category_id === cat.id).length;
    if (assigned > 0 && !window.confirm(`"${cat.name}" has ${assigned} product(s). Deleting will unset their category. Continue?`)) return;
    if (assigned > 0) {
      for (const p of products.filter(pr => pr.category_id === cat.id)) {
        await supabase.from('products').update({ category_id: null }).eq('id', p.product_id);
      }
    }
    const { error } = await supabase.from('categories').delete().eq('id', cat.id);
    if (error) { setMessage({ text: "Failed to delete category: " + error.message, type: "error" }); return; }
    setMessage({ text: `Category "${cat.name}" deleted`, type: "success" });
    await loadCategories();
    await loadProducts();
  }

  function handleLookupCustomer() {
    const phone = posCustomerPhone.trim();
    if (!phone) return;
    const match = customers.find(c => c.phone === phone && c.status === "active");
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
      setMessage({ text: `No customer found for ${phone} — sale will be anonymous`, type: "error" });
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
    if (error) { console.error(error); setMessage({ text: "Failed to add customer: " + error.message, type: "error" }); return; }
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
    const { data, error } = await supabase
      .from("sales")
      .select("id, cashier_id, customer_id, subtotal, tax, discount_amount, total, status, created_at")
      .order("created_at", { ascending: false });
    if (error) { console.error(error); return; }
    setSales((data as Sale[]) || []);
  }

  async function loadAllPayments() {
    const { data } = await supabase
      .from("payments")
      .select("sale_id, payment_method, amount");
    setAllPayments((data as EodPayment[]) ?? []);
  }

  async function loadEmployees() {
    const { data, error } = await supabase
      .from("employees")
      .select("id, business_id, name, role, status, created_at")
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
      .select("id, purchase_order_id, product_id, quantity, quantity_received, unit_cost, line_total, created_at")
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
      return;
    }

    const { data, error } = await supabase
      .from("purchase_order_items")
      .select("id, purchase_order_id, product_id, quantity, quantity_received, unit_cost, line_total, created_at")
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
    items.forEach((item) => {
      const remaining = item.quantity - (item.quantity_received ?? 0);
      qtys[item.id] = String(Math.max(0, remaining));
    });
    setReceiveQtys(qtys);
  }

  async function handleConfirmReceive() {
    const po = purchaseOrders.find((p) => p.id === receivingPoId);
    if (!po) return;
    if (isConfirmingReceive) return;
    setIsConfirmingReceive(true);

    try {
      const receiveNotes: string[] = [];

      for (const item of receivingItems) {
        const receiveQty = Number(receiveQtys[item.id] ?? 0);
        const remaining = item.quantity - (item.quantity_received ?? 0);
        const clampedQty = Math.min(Math.max(0, receiveQty), remaining);
        if (clampedQty <= 0) continue;

        const product = products.find((p) => p.product_id === item.product_id);
        if (!product) continue;

        const quantityBefore = product.quantity_on_hand;
        const quantityAfter = quantityBefore + clampedQty;
        const oldAvgCost = product.average_cost ?? 0;
        const newAvgCost = (quantityBefore + clampedQty) > 0
          ? ((quantityBefore * oldAvgCost) + (clampedQty * item.unit_cost)) / (quantityBefore + clampedQty)
          : item.unit_cost;

        const { error: invError } = await supabase
          .from("inventory")
          .update({ quantity_on_hand: quantityAfter })
          .eq("id", product.inventory_id);

        if (invError) { console.error(invError); continue; }

        const { error: avgCostError } = await supabase
          .from("products")
          .update({ average_cost: newAvgCost })
          .eq("id", item.product_id);

        if (avgCostError) { console.error(avgCostError); }

        const { error: txError } = await supabase
          .from("inventory_transactions")
          .insert({
            business_id: product.business_id,
            product_id: item.product_id,
            transaction_type: "receiving",
            quantity_change: clampedQty,
            quantity_before: quantityBefore,
            quantity_after: quantityAfter,
            reason: `PO ${po.po_number}`,
          });

        if (txError) { console.error(txError); }

        const newReceived = (item.quantity_received ?? 0) + clampedQty;
        await supabase
          .from("purchase_order_items")
          .update({ quantity_received: newReceived })
          .eq("id", item.id);

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
      const historyLine = `[Received ${timestamp}] ${receiveNotes.join("; ")}`;
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
      setMessage({ text: `${po.po_number} ${statusLabel} — inventory updated`, type: "success" });
      await loadProducts();
      await loadPurchaseOrders();
      await loadAllPoItems();
      await loadTransactions();
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

    const product = products.find((p) => p.barcode === code);
    if (!product) { setMessage({ text: `Barcode not recognised: ${code}`, type: "error" }); return; }
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
      }]);
    }
    setMessage(null);
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

    const { data: payments } = await supabase
      .from("payments")
      .select("payment_method")
      .eq("sale_id", sale.id)
      .limit(1)
      .single();

    const saleLoyalty = loyaltyTransactions.filter(lt => lt.sale_id === sale.id);
    const earnRow = saleLoyalty.find(lt => lt.type === 'earn');
    const redeemRow = saleLoyalty.find(lt => lt.type === 'redeem');

    setReceipt({
      sale,
      items: items as ReceiptItem[],
      paymentMethod: payments?.payment_method ?? "—",
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

    const { error: itemsErr } = await supabase
      .from("sale_items")
      .insert(cart.map((c) => ({
        business_id: businessId,
        sale_id: sale.id,
        product_id: c.product_id,
        quantity: c.quantity,
        unit_price: c.unit_price,
        line_total: c.line_total,
      })));

    if (itemsErr) { console.error(itemsErr); await supabase.from("sales").delete().eq("id", sale.id); setIsCompletingSale(false); setMessage({ text: "Sale items failed. Sale was not saved.", type: "error" }); return; }

    const { error: payErr } = await supabase
      .from("payments")
      .insert({ business_id: businessId, sale_id: sale.id, payment_method: paymentMethod, amount: finalTotal });

    if (payErr) { console.error(payErr); }

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
        .select("sale_id, payment_method, amount")
        .in("sale_id", todaySaleIds);

      setEodItems((items as EodItem[]) || []);
      setEodPayments((payments as EodPayment[]) || []);
    } else {
      setEodItems([]);
      setEodPayments([]);
    }

    setShowEod(true);
  }

  async function handleBatchReorderPO() {
    const selected = Array.from(reorderSelected);
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

    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    let poCount = 0;
    let itemCount = 0;

    for (const [supplierId, productIds] of Object.entries(bySupplier)) {
      const items = productIds.map(pid => {
        const product = products.find(p => p.product_id === pid)!;
        const qty = Number(reorderQtys[pid] ?? (product.reorder_level - product.quantity_on_hand));
        const unitCost = product.average_cost ?? 0;
        return { product_id: pid, product_name: product.product_name, quantity: qty, unit_cost: unitCost, line_total: qty * unitCost };
      });
      const subtotal = items.reduce((sum, i) => sum + i.line_total, 0);
      const ts = new Date(now.getTime() + poCount * 1000);
      const poNumber = `PO-${ts.getFullYear()}${pad(ts.getMonth() + 1)}${pad(ts.getDate())}-${pad(ts.getHours())}${pad(ts.getMinutes())}${pad(ts.getSeconds())}`;
      const notes = items.length === 1
        ? `Reorder: ${items[0].product_name}`
        : `Reorder: ${items.length} products`;

      const { data: po, error: poErr } = await supabase
        .from("purchase_orders")
        .insert({ business_id: businessId, supplier_id: supplierId, po_number: poNumber, status: "draft", subtotal, notes })
        .select("id")
        .single();

      if (poErr || !po) { console.error(poErr); setMessage({ text: "Failed to create PO", type: "error" }); return; }

      const CHUNK = 30;
      const rows = items.map(i => ({ business_id: businessId, purchase_order_id: po.id, product_id: i.product_id, quantity: i.quantity, unit_cost: i.unit_cost, line_total: i.line_total }));
      let chunkInserted = 0;
      for (let ci = 0; ci < rows.length; ci += CHUNK) {
        const { error: chunkErr } = await supabase.from("purchase_order_items").insert(rows.slice(ci, ci + CHUNK));
        if (chunkErr) { console.error(chunkErr); break; }
        chunkInserted += Math.min(CHUNK, rows.length - ci);
      }

      if (chunkInserted === 0) {
        await supabase.from("purchase_orders").delete().eq("id", po.id);
        continue;
      }

      poCount++;
      itemCount += chunkInserted;
    }

    setReorderSelected(new Set());
    const clearedSuppliers = { ...reorderSuppliers };
    const clearedQtys = { ...reorderQtys };
    for (const pid of selected) { delete clearedSuppliers[pid]; delete clearedQtys[pid]; }
    setReorderSuppliers(clearedSuppliers);
    setReorderQtys(clearedQtys);
    setMessage({ text: `Created ${poCount} purchase order${poCount !== 1 ? "s" : ""} containing ${itemCount} product${itemCount !== 1 ? "s" : ""}.`, type: "success" });
    await loadPurchaseOrders();
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

    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    const poNumber = `PO-${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;

    const items = supProducts.map(p => {
      const prefQty = getPrefQty(p.product_id);
      const defaultQty = Math.max(1, p.reorder_level - p.quantity_on_hand);
      const qty = prefQty ?? defaultQty;
      const unitCost = p.average_cost ?? 0;
      return { product_id: p.product_id, product_name: p.product_name, quantity: qty, unit_cost: unitCost, line_total: qty * unitCost };
    });

    const subtotal = items.reduce((sum, i) => sum + i.line_total, 0);
    const supplierName = suppliers.find(s => s.id === supplierId)?.name ?? "Unknown";
    const notes = items.length === 1 ? `Catalog: ${items[0].product_name}` : `Catalog: ${items.length} products`;

    const { data: po, error: poErr } = await supabase
      .from("purchase_orders")
      .insert({ business_id: businessId, supplier_id: supplierId, po_number: poNumber, status: "draft", subtotal, notes })
      .select("id")
      .single();

    if (poErr || !po) { console.error(poErr); setMessage({ text: "Failed to create PO", type: "error" }); return; }

    const CHUNK = 30;
    let insertedCount = 0;
    const rows = items.map(i => ({ business_id: businessId, purchase_order_id: po.id, product_id: i.product_id, quantity: i.quantity, unit_cost: i.unit_cost, line_total: i.line_total }));
    for (let i = 0; i < rows.length; i += CHUNK) {
      const { error: chunkErr } = await supabase.from("purchase_order_items").insert(rows.slice(i, i + CHUNK));
      if (chunkErr) { console.error(chunkErr); break; }
      insertedCount += Math.min(CHUNK, rows.length - i);
    }

    if (insertedCount === 0) {
      await supabase.from("purchase_orders").delete().eq("id", po.id);
      setMessage({ text: "Failed to add items — PO was not created", type: "error" });
      await loadPurchaseOrders();
      return;
    }

    if (insertedCount < items.length) {
      await supabase.from("purchase_orders").update({ subtotal: 0, notes: `${notes} (PARTIAL: ${insertedCount}/${items.length} items)` }).eq("id", po.id);
      setMessage({ text: `PO ${poNumber} created with only ${insertedCount} of ${items.length} items — some inserts failed`, type: "error" });
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

    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    const poNumber = `PO-${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;

    const { error } = await supabase.from("purchase_orders").insert({
      business_id: businessId,
      supplier_id: poSupplierId,
      po_number: poNumber,
      status: "draft",
      subtotal: 0,
      notes: poNotes || null,
    });

    if (error) {
      console.error(error);
      return;
    }

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
    if (receivingPoId === po.id) { setReceivingPoId(""); setReceivingItems([]); setReceiveQtys({}); }
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
    if (receivingPoId === po.id) { setReceivingPoId(""); setReceivingItems([]); setReceiveQtys({}); }
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
    if (!newEmpName.trim() || !businessId) return;
    const { error } = await supabase.from("employees").insert({
      business_id: businessId,
      name: newEmpName.trim(),
      role: newEmpRole,
      status: "active",
    });
    if (error) { console.error(error); setMessage({ text: "Failed to add employee: " + error.message, type: "error" }); return; }
    setNewEmpName("");
    setNewEmpRole("cashier");
    setMessage({ text: "Employee added", type: "success" });
    await loadEmployees();
  }

  async function handleToggleEmployeeStatus(emp: Employee) {
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
        reorder_level: item.products?.reorder_level ?? 10,
        status: item.products?.status,
        average_cost: item.products?.average_cost ?? 0,
        supplier_id: item.products?.supplier_id ?? null,
        category_id: item.products?.category_id ?? null,
      })) || [];

    setProducts(formatted);
  }

  async function loadTransactions() {
    const { data: txData, error: txError } = await supabase
      .from("inventory_transactions")
      .select("id, created_at, transaction_type, quantity_change, quantity_before, quantity_after, product_id")
      .order("created_at", { ascending: false });

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
    setMessage(null);

    if (!newName || !newSellingPrice || !newInitialStock) return;

    const initialStock = Number(newInitialStock);

    const { data: productData, error: productError } = await supabase
      .from("products")
      .insert({
        business_id: businessId,
        name: newName,
        sku: newSku || null,
        barcode: newBarcode || null,
        cost_price: newCostPrice ? Number(newCostPrice) : null,
        selling_price: Number(newSellingPrice),
        reorder_level: newReorderLevel ? Number(newReorderLevel) : 10,
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

    setNewName("");
    setNewSku("");
    setNewBarcode("");
    setNewCostPrice("");
    setNewSellingPrice("");
    setNewReorderLevel("");
    setNewInitialStock("");
    setNewProductCategory("");
    setBarcodeAutoFill("");
    setMessage({ text: "Product added successfully", type: "success" });
    await loadProducts();
    await loadTransactions();
  }

  async function handleEditProduct(e: React.FormEvent, productId: string) {
    e.preventDefault();
    if (!editProdName.trim() || !editProdPrice) return;
    const { error } = await supabase
      .from("products")
      .update({
        name: editProdName.trim(),
        sku: editProdSku.trim() || null,
        barcode: editProdBarcode.trim() || null,
        selling_price: Number(editProdPrice),
        reorder_level: editProdReorder ? Number(editProdReorder) : 10,
        category_id: editProdCategory || null,
      })
      .eq("id", productId);
    if (error) { console.error(error); setMessage({ text: "Failed to update product: " + error.message, type: "error" }); return; }
    setEditingProductId(null);
    setMessage({ text: "Product updated", type: "success" });
    await loadProducts();
  }

  async function handleToggleProductStatus(product: ProductStock) {
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
    setMessage(null);

    const qty = Number(adjustQuantity);

    if (!adjustProductId || !adjustQuantity || isNaN(qty)) {
      return;
    }

    const product = products.find((p) => p.product_id === adjustProductId);

    if (!product) {
      return;
    }

    const reductionTypes = ["damaged", "expired", "lost"];
    const delta = reductionTypes.includes(adjustType) ? -Math.abs(qty) : qty;

    const quantityBefore = product.quantity_on_hand;
    const quantityAfter = quantityBefore + delta;

    const { error: txError } = await supabase
      .from("inventory_transactions")
      .insert({
        business_id: product.business_id,
        product_id: product.product_id,
        transaction_type: adjustType,
        quantity_change: delta,
        quantity_before: quantityBefore,
        quantity_after: quantityAfter,
        reason: adjustReason || null,
      });

    if (txError) {
      console.error(txError);
      return;
    }

    const { error: updateError } = await supabase
      .from("inventory")
      .update({ quantity_on_hand: quantityAfter })
      .eq("id", product.inventory_id);

    if (updateError) {
      console.error(updateError);
      return;
    }

    setAdjustQuantity("");
    setAdjustReason("");
    setMessage({ text: "Inventory adjusted successfully", type: "success" });
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
          ] as [string, string][]).map(([key, label]) => (
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
          <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: "8px", marginTop: "4px", display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "12px", color: "#94a3b8", whiteSpace: "nowrap" }}>My Account</span>
            <button
              onClick={onSignOut}
              style={{ padding: "6px 14px", fontSize: "13px", cursor: "pointer", background: "#fee2e2", color: "#b91c1c", border: "1px solid #fca5a5", borderRadius: "5px", fontWeight: 500, whiteSpace: "nowrap" }}
            >
              Sign Out
            </button>
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

      {/* ── POS TAB ── */}
      <div style={{ display: activeTab === 'pos' && businessId ? '' : 'none' }}>

      <div className="page-header">
        <h2 className="page-title">Point of Sale</h2>
        <p className="page-subtitle">Scan items, process sales, manage returns and receipts</p>
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
          placeholder="Customer phone (optional)"
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
            {(() => {
              const bal = loyaltyTransactions.filter(lt => lt.customer_id === posCustomerId).reduce((s, lt) => s + lt.points, 0);
              return ` — ${bal} pts`;
            })()}
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
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {cart.map((item) => (
                  <tr key={item.product_id}>
                    <td>{item.product_name}</td>
                    <td>{item.quantity}</td>
                    <td>${item.unit_price.toFixed(2)}</td>
                    <td>${item.line_total.toFixed(2)}</td>
                    <td>
                      <button onClick={() => handleRemoveFromCart(item.product_id)} style={{ padding: "2px 8px" }}>
                        ✕
                      </button>
                    </td>
                  </tr>
                ))}
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
            const custBal = loyaltyTransactions.filter(lt => lt.customer_id === posCustomerId).reduce((s, lt) => s + lt.points, 0);
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
            <label style={{ cursor: "pointer" }}>
              <input
                type="radio"
                value="cash"
                checked={paymentMethod === "cash"}
                onChange={() => setPaymentMethod("cash")}
              />{" "}Cash
            </label>
            <label style={{ cursor: "pointer" }}>
              <input
                type="radio"
                value="card"
                checked={paymentMethod === "card"}
                onChange={() => setPaymentMethod("card")}
              />{" "}Card
            </label>
            {paymentMethod === "cash" && (() => {
              const subtotal = cart.reduce((s, c) => s + c.line_total, 0);
              const discountVal = Math.max(0, Number(posDiscountValue) || 0);
              const rawDiscountAmt = posDiscountType === "percent"
                ? subtotal * (discountVal / 100)
                : discountVal;
              const discountAmt = rawDiscountAmt > subtotal ? 0 : rawDiscountAmt;
              const cashDiscountedSubtotal = subtotal - discountAmt;
              const cashTaxAmt = Math.round(cashDiscountedSubtotal * (businessTaxRate / 100) * 100) / 100;
              const cashCustBal = posCustomerId
                ? loyaltyTransactions.filter(lt => lt.customer_id === posCustomerId).reduce((s, lt) => s + lt.points, 0)
                : 0;
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
      <div style={{ display: activeTab === 'inventory' && businessId ? '' : 'none' }}>

      <div className="page-header">
        <h2 className="page-title">Inventory</h2>
        <p className="page-subtitle">Manage products, stock levels, reorder points, and product status</p>
      </div>

      <div className="section-card">
        <h3 className="section-card-title">Receive Inventory</h3>
        <form
          onSubmit={handleReceive}
          style={{ display: "flex", flexWrap: "wrap", gap: "12px", alignItems: "center" }}
        >
          <select
            value={selectedProductId}
            onChange={(e) => setSelectedProductId(e.target.value)}
            style={{ flex: "1 1 200px", padding: "8px" }}
          >
            <option value="">Select product...</option>
            {products.map((product) => (
              <option key={product.product_id} value={product.product_id}>
                {product.product_name}
              </option>
            ))}
          </select>
          <input
            type="number"
            min="1"
            placeholder="Quantity"
            value={receiveQuantity}
            onChange={(e) => setReceiveQuantity(e.target.value)}
            style={{ flex: "1 1 120px", padding: "8px" }}
          />
          <button type="submit" className="pos-add-btn">
            Receive
          </button>
        </form>
      </div>

      <div className="section-card">
        <h3 className="section-card-title">Adjust Inventory</h3>
        <form
          onSubmit={handleAdjust}
          style={{ display: "flex", flexWrap: "wrap", gap: "12px", alignItems: "center" }}
        >
          <select
            value={adjustProductId}
            onChange={(e) => setAdjustProductId(e.target.value)}
            style={{ flex: "1 1 200px", padding: "8px" }}
          >
            <option value="">Select product...</option>
            {products.map((product) => (
              <option key={product.product_id} value={product.product_id}>
                {product.product_name}
              </option>
            ))}
          </select>
          <select
            value={adjustType}
            onChange={(e) => setAdjustType(e.target.value)}
            style={{ flex: "1 1 140px", padding: "8px" }}
          >
            <option value="damaged">damaged</option>
            <option value="expired">expired</option>
            <option value="lost">lost</option>
            <option value="correction">correction</option>
          </select>
          <input
            type="number"
            placeholder={adjustType === "correction" ? "Qty (±)" : "Quantity"}
            value={adjustQuantity}
            onChange={(e) => setAdjustQuantity(e.target.value)}
            style={{ flex: "1 1 120px", padding: "8px" }}
          />
          <input
            type="text"
            placeholder="Reason (optional)"
            value={adjustReason}
            onChange={(e) => setAdjustReason(e.target.value)}
            style={{ flex: "2 1 200px", padding: "8px" }}
          />
          <button type="submit" className="pos-add-btn">
            Adjust
          </button>
        </form>
      </div>

      <div className="section-card">
        <h3 className="section-card-title">Add Product</h3>
        <form
          onSubmit={handleAddProduct}
          style={{ display: "flex", flexWrap: "wrap", gap: "12px", alignItems: "center" }}
        >
          <input
            type="text"
            placeholder="Product Name *"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            style={{ flex: "2 1 200px", padding: "8px" }}
          />
          <input
            type="text"
            placeholder="SKU"
            value={newSku}
            onChange={(e) => setNewSku(e.target.value)}
            style={{ flex: "1 1 120px", padding: "8px" }}
          />
          <input
            type="text"
            placeholder="Barcode"
            value={newBarcode}
            onChange={(e) => { setNewBarcode(e.target.value); setBarcodeAutoFill(""); }}
            onBlur={handleBarcodeLookup}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleBarcodeLookup(); } }}
            style={{ flex: "1 1 120px", padding: "8px" }}
          />
          <input
            type="number"
            placeholder="Cost Price"
            value={newCostPrice}
            onChange={(e) => setNewCostPrice(e.target.value)}
            style={{ flex: "1 1 120px", padding: "8px" }}
          />
          <input
            type="number"
            placeholder="Selling Price *"
            value={newSellingPrice}
            onChange={(e) => setNewSellingPrice(e.target.value)}
            style={{ flex: "1 1 120px", padding: "8px" }}
          />
          <input
            type="number"
            placeholder="Reorder Level"
            value={newReorderLevel}
            onChange={(e) => setNewReorderLevel(e.target.value)}
            style={{ flex: "1 1 120px", padding: "8px" }}
          />
          <select
            value={newProductCategory}
            onChange={(e) => setNewProductCategory(e.target.value)}
            style={{ flex: "1 1 140px", padding: "8px" }}
          >
            <option value="">No Category</option>
            {categories.filter(c => c.status === "active").map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <input
            type="number"
            min="0"
            placeholder="Initial Stock *"
            value={newInitialStock}
            onChange={(e) => setNewInitialStock(e.target.value)}
            style={{ flex: "1 1 120px", padding: "8px" }}
          />
          <button type="submit" className="pos-add-btn">
            Add Product
          </button>
        </form>
        {barcodeAutoFill && (
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "12px", padding: "8px 14px", background: "#eff6ff", border: "1px solid #93c5fd", borderRadius: "6px", fontSize: "13px" }}>
            <span style={{ color: "#1d4ed8" }}>{barcodeAutoFill}</span>
            <button onClick={() => setBarcodeAutoFill("")} style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", fontSize: "15px", color: "#64748b" }}>✕</button>
          </div>
        )}
      </div>

      <div className="section-card">
        <h3 className="section-card-title">Bulk Import Products</h3>
        <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
          <button onClick={downloadCsvTemplate} style={{ padding: "8px 16px" }}>
            Download CSV Template
          </button>
          <input
            type="file"
            accept=".csv"
            onChange={handleCsvUpload}
            style={{ padding: "4px" }}
          />
        </div>

        {bulkPreview.length > 0 && (
          <>
            <div style={{ overflowX: "auto", marginTop: "16px", marginBottom: "12px" }}>
              <table border={1} cellPadding={8} style={{ width: "100%", fontSize: "13px" }}>
                <thead>
                  <tr>
                    <th>Status</th>
                    <th>Name</th>
                    <th>Selling Price</th>
                    <th>SKU</th>
                    <th>Barcode</th>
                    <th>Cost Price</th>
                    <th>Reorder Level</th>
                    <th>Initial Stock</th>
                  </tr>
                </thead>
                <tbody>
                  {bulkPreview.map((row, i) => {
                    const statusColor: Record<BulkRow['status'], string> = {
                      valid: '#15803d',
                      missing_name: '#b91c1c',
                      missing_price: '#b91c1c',
                      invalid_price: '#b91c1c',
                      duplicate_barcode: '#92400e',
                    };
                    const statusLabel: Record<BulkRow['status'], string> = {
                      valid: '✓ Valid',
                      missing_name: '✗ Missing name',
                      missing_price: '✗ Missing price',
                      invalid_price: '✗ Invalid price',
                      duplicate_barcode: '⚠ Duplicate barcode',
                    };
                    return (
                      <tr key={i} style={{ background: row.status === 'valid' ? undefined : '#fff7f7' }}>
                        <td style={{ color: statusColor[row.status], fontWeight: 'bold', whiteSpace: 'nowrap' }}>
                          {statusLabel[row.status]}
                        </td>
                        <td>{row.name || '—'}</td>
                        <td>{row.selling_price || '—'}</td>
                        <td>{row.sku || '—'}</td>
                        <td>{row.barcode || '—'}</td>
                        <td>{row.cost_price || '—'}</td>
                        <td>{row.reorder_level || '—'}</td>
                        <td>{row.initial_stock || '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
              <span style={{ fontSize: "13px", color: "#666" }}>
                {bulkPreview.filter(r => r.status === 'valid').length} valid &nbsp;·&nbsp;
                {bulkPreview.filter(r => r.status !== 'valid').length} will be skipped
              </span>
              <button
                onClick={handleBulkImport}
                disabled={bulkImporting || bulkPreview.filter(r => r.status === 'valid').length === 0}
                style={{
                  padding: "8px 24px",
                  background: bulkPreview.filter(r => r.status === 'valid').length === 0 ? '#ccc' : '#1d4ed8',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: bulkPreview.filter(r => r.status === 'valid').length === 0 ? 'not-allowed' : 'pointer',
                  fontWeight: 'bold',
                }}
              >
                {bulkImporting ? 'Importing…' : 'Import Products'}
              </button>
            </div>
          </>
        )}

        {bulkResults && (
          <div style={{ marginTop: "16px", padding: "16px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "8px", display: "flex", gap: "32px" }}>
            <div><span style={{ fontSize: "13px", color: "#666" }}>Imported</span><div style={{ fontSize: "24px", fontWeight: "bold", color: "#15803d" }}>{bulkResults.imported}</div></div>
            <div><span style={{ fontSize: "13px", color: "#666" }}>Skipped</span><div style={{ fontSize: "24px", fontWeight: "bold", color: "#92400e" }}>{bulkResults.skipped}</div></div>
            <div><span style={{ fontSize: "13px", color: "#666" }}>Failed</span><div style={{ fontSize: "24px", fontWeight: "bold", color: "#b91c1c" }}>{bulkResults.failed}</div></div>
          </div>
        )}
      </div>

      </div>{/* end inventory */}

      {/* ── DASHBOARD TAB ── */}
      <div style={{ display: activeTab === 'dashboard' && businessId ? '' : 'none' }}>

      <div className="page-header">
        <h2 className="page-title">Dashboard</h2>
        <p className="page-subtitle">Today's store performance and operating status</p>
      </div>

      {(() => {
        const today = new Date();
        const todaySales = sales.filter(s => {
          const d = new Date(s.created_at);
          return s.status === 'completed' &&
            d.getFullYear() === today.getFullYear() &&
            d.getMonth() === today.getMonth() &&
            d.getDate() === today.getDate();
        });
        const revenueToday = todaySales.reduce((sum, s) => sum + Number(s.total), 0);
        const txnCount = todaySales.length;
        const avgSale = txnCount > 0 ? revenueToday / txnCount : 0;
        const lowStockCount = products.filter(p => p.quantity_on_hand < p.reorder_level).length;
        const openPoCount = purchaseOrders.filter(po => po.status === 'draft' || po.status === 'ordered' || po.status === 'partially_received').length;
        const activeCustomerCount = customers.filter(c => c.status === 'active').length;
        const pointsOutstanding = Math.max(0, loyaltyTransactions.reduce((sum, lt) => sum + lt.points, 0));
        const recentSales = [...sales]
          .filter(s => s.status === 'completed')
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 5);

        const sLabel: React.CSSProperties = { fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#94a3b8", marginBottom: "12px" };

        return (
          <>
            {/* ── Today's Operations ── */}
            <div style={sLabel}>Today's Operations</div>
            <div className="dash-card-row">
              <div className="dash-card">
                <div className="dash-card-icon" style={{ background: "#eff6ff", color: "#1d4ed8" }}>$</div>
                <div className="dash-card-body">
                  <div className="dash-card-label">Revenue Today</div>
                  <div className="dash-card-value">${revenueToday.toFixed(2)}</div>
                </div>
              </div>
              <div className="dash-card">
                <div className="dash-card-icon" style={{ background: "#f0fdf4", color: "#16a34a" }}>&#x1D4E1;</div>
                <div className="dash-card-body">
                  <div className="dash-card-label">Transactions</div>
                  <div className="dash-card-value">{txnCount}</div>
                  <div className="dash-card-helper">{txnCount === 1 ? "sale" : "sales"} today</div>
                </div>
              </div>
              <div className="dash-card">
                <div className="dash-card-icon" style={{ background: "#eef2ff", color: "#4f46e5" }}>&#x2197;</div>
                <div className="dash-card-body">
                  <div className="dash-card-label">Average Sale</div>
                  <div className="dash-card-value">{txnCount > 0 ? `$${avgSale.toFixed(2)}` : "—"}</div>
                </div>
              </div>
              <div className="dash-card">
                <div className="dash-card-icon" style={{ background: lowStockCount > 0 ? "#fef2f2" : "#f0fdf4", color: lowStockCount > 0 ? "#dc2626" : "#16a34a" }}>&#x26A0;</div>
                <div className="dash-card-body">
                  <div className="dash-card-label">Low Stock Items</div>
                  <div className="dash-card-value" style={lowStockCount > 0 ? { color: "#dc2626" } : undefined}>{lowStockCount}</div>
                  <div className="dash-card-helper">{lowStockCount > 0 ? "need reorder" : "all stocked"}</div>
                </div>
              </div>
            </div>

            {/* ── Business Status ── */}
            <div style={sLabel}>Business Status</div>
            <div className="dash-card-row">
              <div className="dash-card">
                <div className="dash-card-icon" style={{ background: drawerSession ? "#f0fdf4" : "#f1f5f9", color: drawerSession ? "#16a34a" : "#64748b" }}>&#x1F4B0;</div>
                <div className="dash-card-body">
                  <div className="dash-card-label">Cash Drawer</div>
                  <div className="dash-card-value" style={{ color: drawerSession ? "#15803d" : "#475569" }}>{drawerSession ? "OPEN" : "CLOSED"}</div>
                  <div className="dash-card-helper">
                    {drawerSession ? `Since ${new Date(drawerSession.opened_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : "No active session"}
                  </div>
                </div>
              </div>
              <div className="dash-card">
                <div className="dash-card-icon" style={{ background: openPoCount > 0 ? "#fff7ed" : "#f1f5f9", color: openPoCount > 0 ? "#ea580c" : "#64748b" }}>&#x1F4C4;</div>
                <div className="dash-card-body">
                  <div className="dash-card-label">Open Purchase Orders</div>
                  <div className="dash-card-value">{openPoCount}</div>
                  <div className="dash-card-helper">{openPoCount > 0 ? "pending" : "none pending"}</div>
                </div>
              </div>
              <div className="dash-card">
                <div className="dash-card-icon" style={{ background: "#f0fdfa", color: "#0d9488" }}>&#x1F465;</div>
                <div className="dash-card-body">
                  <div className="dash-card-label">Active Customers</div>
                  <div className="dash-card-value">{activeCustomerCount}</div>
                </div>
              </div>
              <div className="dash-card">
                <div className="dash-card-icon" style={{ background: "#faf5ff", color: "#7c3aed" }}>&#x2605;</div>
                <div className="dash-card-body">
                  <div className="dash-card-label">Loyalty Points</div>
                  <div className="dash-card-value">{pointsOutstanding.toLocaleString()}</div>
                  <div className="dash-card-helper">outstanding</div>
                </div>
              </div>
            </div>

            {/* ── Recent Sales ── */}
            <div style={sLabel}>Recent Sales</div>
            {recentSales.length === 0 ? (
              <p style={{ color: "#94a3b8", fontSize: "14px", margin: "0" }}>No completed sales yet.</p>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
                  <thead>
                    <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0" }}>
                      <th style={{ padding: "10px 14px", textAlign: "left", color: "#475569", fontWeight: 600 }}>Sale #</th>
                      <th style={{ padding: "10px 14px", textAlign: "left", color: "#475569", fontWeight: 600 }}>Total</th>
                      <th style={{ padding: "10px 14px", textAlign: "left", color: "#475569", fontWeight: 600 }}>Cashier</th>
                      <th style={{ padding: "10px 14px", textAlign: "left", color: "#475569", fontWeight: 600 }}>Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentSales.map((s, i) => {
                      const cashierName = s.cashier_id
                        ? (employees.find(e => e.id === s.cashier_id)?.name ?? s.cashier_id.slice(0, 8))
                        : "—";
                      return (
                        <tr key={s.id} style={{ borderBottom: "1px solid #f1f5f9", background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                          <td style={{ padding: "10px 14px", fontFamily: "monospace", color: "#475569" }}>{s.id.slice(0, 8)}…</td>
                          <td style={{ padding: "10px 14px", fontWeight: 600, color: "#0f172a" }}>${Number(s.total).toFixed(2)}</td>
                          <td style={{ padding: "10px 14px", color: "#64748b" }}>{cashierName}</td>
                          <td style={{ padding: "10px 14px", color: "#94a3b8" }}>{new Date(s.created_at).toLocaleString()}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        );
      })()}

      </div>{/* end dashboard */}

      {/* ── INVENTORY TAB (2) ── */}
      <div style={{ display: activeTab === 'inventory' && businessId ? '' : 'none' }}>

      <h2 style={{ marginTop: "40px" }}>Products & Stock</h2>

      {/* ── Inventory Summary Cards ── */}
      {(() => {
        const totalProducts = products.length;
        const lowStockItems = products.filter(p => p.status === 'active' && p.quantity_on_hand < p.reorder_level).length;
        const inventoryValue = products.reduce((sum, p) => sum + p.quantity_on_hand * p.average_cost, 0);
        const activeSupplierCount = suppliers.filter(s => s.status === 'active').length;
        return (
          <div className="dash-card-row" style={{ marginBottom: "24px" }}>
            <div className="dash-card">
              <div className="dash-card-icon" style={{ background: "#eff6ff", color: "#1d4ed8" }}>&#x1F4E6;</div>
              <div className="dash-card-body">
                <div className="dash-card-label">Total Products</div>
                <div className="dash-card-value">{totalProducts}</div>
              </div>
            </div>
            <div className="dash-card">
              <div className="dash-card-icon" style={{ background: lowStockItems > 0 ? "#fef2f2" : "#f0fdf4", color: lowStockItems > 0 ? "#dc2626" : "#16a34a" }}>&#x26A0;</div>
              <div className="dash-card-body">
                <div className="dash-card-label">Low Stock Items</div>
                <div className="dash-card-value" style={lowStockItems > 0 ? { color: "#dc2626" } : undefined}>{lowStockItems}</div>
              </div>
            </div>
            <div className="dash-card">
              <div className="dash-card-icon" style={{ background: "#f0fdf4", color: "#16a34a" }}>$</div>
              <div className="dash-card-body">
                <div className="dash-card-label">Inventory Value</div>
                <div className="dash-card-value">${inventoryValue.toFixed(2)}</div>
              </div>
            </div>
            <div className="dash-card">
              <div className="dash-card-icon" style={{ background: "#faf5ff", color: "#7c3aed" }}>&#x1F465;</div>
              <div className="dash-card-body">
                <div className="dash-card-label">Active Suppliers</div>
                <div className="dash-card-value">{activeSupplierCount}</div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── Categories ── */}
      <div style={{ marginBottom: "24px" }}>
        <h3 style={{ marginBottom: "8px" }}>Categories</h3>
        <form onSubmit={handleAddCategory} style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap", marginBottom: "12px" }}>
          <input type="text" placeholder="Category name *" value={newCatName} onChange={(e) => setNewCatName(e.target.value)} required style={{ flex: "2 1 160px", padding: "7px" }} />
          <input type="text" placeholder="Description" value={newCatDesc} onChange={(e) => setNewCatDesc(e.target.value)} style={{ flex: "2 1 200px", padding: "7px" }} />
          <button type="submit" style={{ padding: "7px 16px" }}>Add Category</button>
        </form>
        {categories.length > 0 && (
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {categories.map(cat => {
              const count = products.filter(p => p.category_id === cat.id).length;
              const isEditing = editingCatId === cat.id;
              return isEditing ? (
                <form key={cat.id} onSubmit={handleEditCategory} style={{ display: "flex", gap: "6px", alignItems: "center", border: "1px solid #93c5fd", borderRadius: "6px", padding: "4px 8px", background: "#eff6ff" }}>
                  <input type="text" value={editCatName} onChange={(e) => setEditCatName(e.target.value)} required style={{ width: "120px", padding: "4px", fontSize: "13px" }} />
                  <input type="text" value={editCatDesc} onChange={(e) => setEditCatDesc(e.target.value)} placeholder="Desc" style={{ width: "120px", padding: "4px", fontSize: "13px" }} />
                  <button type="submit" style={{ padding: "2px 8px", fontSize: "12px" }}>Save</button>
                  <button type="button" onClick={() => setEditingCatId(null)} style={{ padding: "2px 8px", fontSize: "12px" }}>Cancel</button>
                </form>
              ) : (
                <div key={cat.id} style={{ display: "flex", alignItems: "center", gap: "6px", border: "1px solid #e2e8f0", borderRadius: "6px", padding: "4px 10px", background: "#fff", fontSize: "13px" }}>
                  <span style={{ fontWeight: 500 }}>{cat.name}</span>
                  <span style={{ color: "#94a3b8", fontSize: "11px" }}>({count})</span>
                  <button onClick={() => { setEditingCatId(cat.id); setEditCatName(cat.name); setEditCatDesc(cat.description ?? ""); }} style={{ padding: "1px 6px", fontSize: "11px", cursor: "pointer", background: "none", border: "1px solid #ccc", borderRadius: "3px" }}>Edit</button>
                  <button onClick={() => handleDeleteCategory(cat)} style={{ padding: "1px 6px", fontSize: "11px", cursor: "pointer", background: "none", border: "1px solid #fca5a5", borderRadius: "3px", color: "#dc2626" }}>Del</button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Category Filter ── */}
      {categories.length > 0 && (
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "16px" }}>
          {[{ key: "all", label: "All", count: products.length }, { key: "uncategorized", label: "Uncategorized", count: products.filter(p => !p.category_id).length }, ...categories.map(c => ({ key: c.id, label: c.name, count: products.filter(p => p.category_id === c.id).length }))].map(chip => {
            const active = categoryFilter === chip.key;
            return (
              <button
                key={chip.key}
                onClick={() => setCategoryFilter(chip.key)}
                style={{
                  padding: "6px 14px", borderRadius: "20px", cursor: "pointer", fontSize: "13px",
                  border: active ? "2px solid #1d4ed8" : "1px solid #d1d5db",
                  background: active ? "#dbeafe" : "#f9fafb",
                  color: active ? "#1d4ed8" : "#374151",
                  fontWeight: active ? 600 : 400,
                }}
              >{chip.label} ({chip.count})</button>
            );
          })}
        </div>
      )}

      {/* ── Desktop table / Mobile cards ── */}
      <div className="inv-table-wrap">
        <table className="inv-table">
          <thead>
            <tr>
              <th style={{ textAlign: "left" }}>Product</th>
              <th style={{ textAlign: "left" }}>Category</th>
              <th style={{ textAlign: "left" }}>SKU</th>
              <th style={{ textAlign: "right" }}>Price</th>
              <th style={{ textAlign: "right" }}>Stock</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {products.filter(p => categoryFilter === "all" ? true : categoryFilter === "uncategorized" ? !p.category_id : p.category_id === categoryFilter).map((product) => {
              const isLowStock = product.status === 'active' && product.quantity_on_hand < product.reorder_level;
              const isOutOfStock = product.status === 'active' && product.quantity_on_hand === 0;
              const inactive = product.status !== "active";
              const isEditing = editingProductId === product.product_id;
              return (
                <React.Fragment key={product.product_id}>
                  <tr className={inactive ? "inv-row-inactive" : ""}>
                    <td data-label="Product" style={{ fontWeight: 500 }}>{product.product_name}</td>
                    <td data-label="Category" style={{ fontSize: "13px", color: "#64748b" }}>{categories.find(c => c.id === product.category_id)?.name ?? "—"}</td>
                    <td data-label="SKU" style={{ color: "#64748b", fontFamily: "var(--mono)", fontSize: "13px" }}>{product.sku ?? "—"}</td>
                    <td data-label="Price" style={{ textAlign: "right", fontWeight: 500 }}>${product.selling_price.toFixed(2)}</td>
                    <td data-label="Stock" style={{ textAlign: "right" }}>
                      <span style={{ fontWeight: 500 }}>{product.quantity_on_hand}</span>
                      {!inactive && isOutOfStock && (
                        <span className="inv-badge inv-badge-danger" style={{ marginLeft: "8px" }}>Out of Stock</span>
                      )}
                      {!inactive && isLowStock && !isOutOfStock && (
                        <span className="inv-badge inv-badge-warning" style={{ marginLeft: "8px" }}>Low Stock</span>
                      )}
                    </td>
                    <td data-label="Status" style={{ textAlign: "center" }}>
                      <span className={`inv-badge ${inactive ? "inv-badge-muted" : "inv-badge-success"}`}>{product.status}</span>
                    </td>
                    <td data-label="Actions" style={{ whiteSpace: "nowrap" }}>
                      <button
                        onClick={() => {
                          if (isEditing) { setEditingProductId(null); return; }
                          setEditingProductId(product.product_id);
                          setEditProdName(product.product_name);
                          setEditProdSku(product.sku ?? "");
                          setEditProdBarcode(product.barcode ?? "");
                          setEditProdPrice(product.selling_price.toString());
                          setEditProdReorder(product.reorder_level.toString());
                          setEditProdCategory(product.category_id ?? "");
                        }}
                        className="sh-btn sh-btn-print"
                      >{isEditing ? "Cancel" : "Edit"}</button>
                      <button
                        onClick={() => handleToggleProductStatus(product)}
                        className={`sh-btn ${inactive ? "sh-btn-return" : "sh-btn-void"}`}
                        style={{ marginLeft: "6px" }}
                      >{inactive ? "Activate" : "Deactivate"}</button>
                    </td>
                  </tr>
                  {isEditing && (
                    <tr className="inv-edit-row">
                      <td colSpan={7} style={{ background: "#f9fafb", padding: "16px" }}>
                        <form onSubmit={(e) => handleEditProduct(e, product.product_id)} style={{ display: "flex", flexWrap: "wrap", gap: "10px", alignItems: "center" }}>
                          <strong style={{ width: "100%", marginBottom: "4px" }}>Edit Product — {product.product_name}</strong>
                          <input
                            type="text"
                            placeholder="Product name *"
                            value={editProdName}
                            onChange={(e) => setEditProdName(e.target.value)}
                            required
                            style={{ flex: "2 1 160px", padding: "7px" }}
                          />
                          <input
                            type="text"
                            placeholder="SKU"
                            value={editProdSku}
                            onChange={(e) => setEditProdSku(e.target.value)}
                            style={{ flex: "1 1 100px", padding: "7px" }}
                          />
                          <input
                            type="text"
                            placeholder="Barcode"
                            value={editProdBarcode}
                            onChange={(e) => setEditProdBarcode(e.target.value)}
                            style={{ flex: "1 1 110px", padding: "7px" }}
                          />
                          <input
                            type="number"
                            placeholder="Selling price *"
                            value={editProdPrice}
                            onChange={(e) => setEditProdPrice(e.target.value)}
                            required
                            min="0"
                            step="0.01"
                            style={{ flex: "1 1 110px", padding: "7px" }}
                          />
                          <input
                            type="number"
                            placeholder="Reorder level"
                            value={editProdReorder}
                            onChange={(e) => setEditProdReorder(e.target.value)}
                            min="0"
                            style={{ flex: "1 1 110px", padding: "7px" }}
                          />
                          <select
                            value={editProdCategory}
                            onChange={(e) => setEditProdCategory(e.target.value)}
                            style={{ flex: "1 1 140px", padding: "7px" }}
                          >
                            <option value="">No Category</option>
                            {categories.filter(c => c.status === "active").map(c => (
                              <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                          </select>
                          <div style={{ width: "100%", display: "flex", gap: "16px", flexWrap: "wrap", fontSize: "13px", color: "#64748b", padding: "4px 0" }}>
                            <span>Avg Cost: <strong style={{ color: "#0f172a" }}>${product.average_cost.toFixed(2)}</strong></span>
                            <span>Inventory Value: <strong style={{ color: "#0f172a" }}>${(product.quantity_on_hand * product.average_cost).toFixed(2)}</strong></span>
                            <span>Reorder Level: <strong style={{ color: "#0f172a" }}>{product.reorder_level}</strong></span>
                            <span>Barcode: <strong style={{ color: "#0f172a" }}>{product.barcode ?? "—"}</strong></span>
                          </div>
                          <button type="submit" style={{ padding: "7px 16px", cursor: "pointer", background: "#1d4ed8", color: "#fff", border: "none", borderRadius: "4px" }}>Save</button>
                          <button type="button" onClick={() => setEditingProductId(null)} style={{ padding: "7px 14px", cursor: "pointer" }}>Cancel</button>
                        </form>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      </div>{/* end inventory */}

      {/* ── PURCHASING TAB ── */}
      <div style={{ display: activeTab === 'purchasing' && businessId ? '' : 'none' }}>

      <div className="page-header">
        <h2 className="page-title">Purchasing</h2>
        <p className="page-subtitle">Manage suppliers, purchase orders, receiving, and reorder planning</p>
      </div>

      <h2 style={{ marginTop: "40px" }}>Suppliers</h2>

      <form
        onSubmit={handleAddSupplier}
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "12px",
          alignItems: "center",
          marginBottom: "16px",
        }}
      >
        <input
          type="text"
          placeholder="Supplier Name *"
          value={supName}
          onChange={(e) => setSupName(e.target.value)}
          style={{ flex: "2 1 200px", padding: "8px" }}
        />
        <input
          type="text"
          placeholder="Contact Person"
          value={supContact}
          onChange={(e) => setSupContact(e.target.value)}
          style={{ flex: "1 1 160px", padding: "8px" }}
        />
        <input
          type="text"
          placeholder="Phone"
          value={supPhone}
          onChange={(e) => setSupPhone(e.target.value)}
          style={{ flex: "1 1 130px", padding: "8px" }}
        />
        <input
          type="email"
          placeholder="Email"
          value={supEmail}
          onChange={(e) => setSupEmail(e.target.value)}
          style={{ flex: "1 1 180px", padding: "8px" }}
        />
        <input
          type="text"
          placeholder="Notes"
          value={supNotes}
          onChange={(e) => setSupNotes(e.target.value)}
          style={{ flex: "2 1 200px", padding: "8px" }}
        />
        <button type="submit" style={{ flex: "1 1 120px", padding: "8px" }}>
          Add Supplier
        </button>
      </form>

      <div style={{ marginBottom: "40px" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
          <thead>
            <tr style={{ borderBottom: "2px solid #e2e8f0" }}>
              <th style={{ width: "30px", padding: "10px 8px" }}></th>
              <th style={{ textAlign: "left", padding: "10px 8px" }}>Supplier</th>
              <th style={{ textAlign: "right", padding: "10px 8px" }}>POs</th>
              <th style={{ textAlign: "right", padding: "10px 8px" }}>Total Spend</th>
              <th style={{ textAlign: "left", padding: "10px 8px" }}>Last Order</th>
              <th style={{ padding: "10px 8px" }}>Performance</th>
              <th style={{ padding: "10px 8px" }}>Status</th>
              <th style={{ padding: "10px 8px" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {suppliers.length === 0 ? (
              <tr><td colSpan={8} style={{ padding: "16px", color: "#64748b" }}>No suppliers found</td></tr>
            ) : (
              suppliers.map((s) => {
                const inactive = s.status !== "active";
                const isEditing = editingSupplierId === s.id;
                const isExpanded = expandedCustomerId === `sup-${s.id}`;
                const pos = purchaseOrders.filter(po => po.supplier_id === s.id);
                const received = pos.filter(po => po.status === "received");
                const nonCancelled = pos.filter(po => po.status !== "cancelled");
                const totalSpend = nonCancelled.reduce((sum, po) => sum + Number(po.subtotal), 0);
                const receivedRate = pos.length > 0 ? Math.round((received.length / pos.length) * 100) : 0;
                const lastPO = pos.length > 0 ? new Date(Math.max(...pos.map(po => new Date(po.created_at).getTime()))) : null;
                const health = pos.length === 0 ? "none" : receivedRate >= 60 ? "good" : "attention";
                const healthBg = health === "good" ? "#dcfce7" : health === "attention" ? "#fef3c7" : "#f1f5f9";
                const healthColor = health === "good" ? "#15803d" : health === "attention" ? "#92400e" : "#94a3b8";
                const healthLabel = health === "good" ? "Good" : health === "attention" ? "Attention" : "No Activity";
                return (
                  <React.Fragment key={s.id}>
                    <tr style={{ borderBottom: "1px solid #f1f5f9", ...(inactive ? { backgroundColor: "#f9fafb", color: "#94a3b8" } : {}) }}>
                      <td style={{ padding: "10px 8px", cursor: "pointer", textAlign: "center" }} onClick={() => setExpandedCustomerId(isExpanded ? null : `sup-${s.id}`)}>
                        {isExpanded ? "▾" : "▸"}
                      </td>
                      <td style={{ padding: "10px 8px", fontWeight: 600 }}>{s.name}</td>
                      <td style={{ padding: "10px 8px", textAlign: "right" }}>{pos.length}</td>
                      <td style={{ padding: "10px 8px", textAlign: "right", fontWeight: 500 }}>${totalSpend.toFixed(2)}</td>
                      <td style={{ padding: "10px 8px", fontSize: "13px", color: "#64748b" }}>{lastPO ? lastPO.toLocaleDateString() : "—"}</td>
                      <td style={{ padding: "10px 8px" }}>
                        <span style={{ fontSize: "11px", fontWeight: 700, padding: "2px 8px", borderRadius: "10px", background: healthBg, color: healthColor }}>{healthLabel}</span>
                      </td>
                      <td style={{ padding: "10px 8px" }}>
                        <span style={{ fontSize: "11px", fontWeight: 700, padding: "2px 8px", borderRadius: "12px", background: inactive ? "#e5e7eb" : "#dcfce7", color: inactive ? "#6b7280" : "#15803d" }}>{s.status}</span>
                      </td>
                      <td style={{ padding: "10px 8px", whiteSpace: "nowrap" }}>
                        <button onClick={() => isEditing ? handleCancelEditSupplier() : handleStartEditSupplier(s)} style={{ padding: "3px 10px", marginRight: "4px", cursor: "pointer", background: isEditing ? "#f3f4f6" : undefined }}>{isEditing ? "Cancel" : "Edit"}</button>
                        <button onClick={() => handleToggleSupplierStatus(s)} style={{ padding: "3px 10px", marginRight: "4px", cursor: "pointer", color: inactive ? "#15803d" : "#b45309" }}>{inactive ? "Activate" : "Deactivate"}</button>
                        <button onClick={() => handleDeleteSupplier(s.id, s.name)} style={{ padding: "3px 10px", cursor: "pointer", color: "#b91c1c" }}>Delete</button>
                      </td>
                    </tr>
                    {isExpanded && !isEditing && (() => {
                      const supProducts = products.filter(p => p.supplier_id === s.id);
                      const catalogValue = supProducts.reduce((sum, p) => sum + p.quantity_on_hand * p.average_cost, 0);

                      const poIds = new Set(pos.map(p => p.id));
                      const supPoItems = allPoItems.filter(i => poIds.has(i.purchase_order_id));
                      const nonCancelledPos = pos.filter(po => po.status !== "cancelled");
                      const totalSpendAll = nonCancelledPos.reduce((sum, po) => sum + Number(po.subtotal), 0);
                      const avgOrderValue = nonCancelledPos.length > 0 ? totalSpendAll / nonCancelledPos.length : 0;
                      const draftCount = pos.filter(po => po.status === "draft").length;
                      const orderedCount = pos.filter(po => po.status === "ordered").length;
                      const partialCount = pos.filter(po => po.status === "partially_received").length;
                      const receivedCount = pos.filter(po => po.status === "received").length;
                      const cancelledCount = pos.filter(po => po.status === "cancelled").length;
                      const totalOrderedQty = supPoItems.reduce((sum, i) => sum + i.quantity, 0);
                      const totalReceivedQty = supPoItems.reduce((sum, i) => sum + (i.quantity_received ?? 0), 0);
                      const totalRemainingQty = totalOrderedQty - totalReceivedQty;

                      return (
                      <tr>
                        <td colSpan={8} style={{ background: "#f8fafc", padding: "16px", borderBottom: "1px solid #e2e8f0" }}>
                          {/* Contact info */}
                          <div style={{ display: "flex", gap: "24px", flexWrap: "wrap", marginBottom: "12px", fontSize: "13px" }}>
                            <div><span style={{ color: "#94a3b8" }}>Contact:</span> <strong>{s.contact_name || "—"}</strong></div>
                            <div><span style={{ color: "#94a3b8" }}>Phone:</span> <strong>{s.phone ? fmtPhone(s.phone) : "—"}</strong></div>
                            <div><span style={{ color: "#94a3b8" }}>Email:</span> <strong>{s.email || "—"}</strong></div>
                          </div>
                          {/* Performance Metrics */}
                          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "12px" }}>
                            {[
                              { label: "Total Spend", value: `$${totalSpendAll.toFixed(2)}`, color: "#1d4ed8" },
                              { label: "Avg Order Value", value: `$${avgOrderValue.toFixed(2)}` },
                              { label: "Total POs", value: pos.length },
                              { label: "Products Supplied", value: supProducts.length },
                              { label: "Last Order", value: lastPO ? lastPO.toLocaleDateString() : "—" },
                              { label: "Inventory Value", value: `$${catalogValue.toFixed(2)}` },
                            ].map(card => (
                              <div key={card.label} style={{ border: "1px solid #e2e8f0", borderRadius: "6px", padding: "8px 12px", minWidth: "110px", flex: 1, background: "#fff" }}>
                                <div style={{ fontSize: "10px", textTransform: "uppercase", fontWeight: 700, color: "#94a3b8", letterSpacing: "0.06em" }}>{card.label}</div>
                                <div style={{ fontSize: "17px", fontWeight: 700, color: (card as any).color ?? "#0f172a" }}>{card.value}</div>
                              </div>
                            ))}
                          </div>
                          {/* Quantity & Status Metrics */}
                          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "12px" }}>
                            {[
                              { label: "Ordered Qty", value: totalOrderedQty },
                              { label: "Received Qty", value: totalReceivedQty, color: "#15803d" },
                              { label: "Remaining Qty", value: totalRemainingQty, color: totalRemainingQty > 0 ? "#b45309" : "#15803d" },
                              { label: "Draft", value: draftCount },
                              { label: "Ordered", value: orderedCount },
                              { label: "Partial", value: partialCount, color: partialCount > 0 ? "#a16207" : undefined },
                              { label: "Received", value: receivedCount, color: "#15803d" },
                              { label: "Cancelled", value: cancelledCount, color: cancelledCount > 0 ? "#6b7280" : undefined },
                            ].map(card => (
                              <div key={card.label} style={{ border: "1px solid #e2e8f0", borderRadius: "6px", padding: "6px 10px", minWidth: "80px", background: "#fff" }}>
                                <div style={{ fontSize: "10px", textTransform: "uppercase", fontWeight: 700, color: "#94a3b8", letterSpacing: "0.06em" }}>{card.label}</div>
                                <div style={{ fontSize: "16px", fontWeight: 700, color: (card as any).color ?? "#0f172a" }}>{card.value}</div>
                              </div>
                            ))}
                          </div>
                          {s.notes && <div style={{ fontSize: "13px", color: "#64748b", marginBottom: "12px" }}><strong>Notes:</strong> {s.notes}</div>}

                          {/* PO Breakdown Table */}
                          {pos.length > 0 && (
                            <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: "12px", marginBottom: "16px" }}>
                              <strong style={{ fontSize: "14px", display: "block", marginBottom: "8px" }}>Purchase Order Breakdown</strong>
                              <div style={{ overflowX: "auto" }}>
                                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                                  <thead>
                                    <tr style={{ borderBottom: "1px solid #e2e8f0", background: "#f1f5f9" }}>
                                      <th style={{ textAlign: "left", padding: "6px 8px" }}>PO Number</th>
                                      <th style={{ padding: "6px 8px" }}>Status</th>
                                      <th style={{ textAlign: "right", padding: "6px 8px" }}>Ordered</th>
                                      <th style={{ textAlign: "right", padding: "6px 8px" }}>Received</th>
                                      <th style={{ textAlign: "right", padding: "6px 8px" }}>Remaining</th>
                                      <th style={{ textAlign: "right", padding: "6px 8px" }}>Subtotal</th>
                                      <th style={{ textAlign: "left", padding: "6px 8px" }}>Date</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {[...pos].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).map((po, i) => {
                                      const poItemsForPo = allPoItems.filter(item => item.purchase_order_id === po.id);
                                      const ordQty = poItemsForPo.reduce((sum, item) => sum + item.quantity, 0);
                                      const rcvQty = poItemsForPo.reduce((sum, item) => sum + (item.quantity_received ?? 0), 0);
                                      const remQty = ordQty - rcvQty;
                                      const stBg = po.status === "received" ? "#dcfce7" : po.status === "partially_received" ? "#fef9c3" : po.status === "ordered" ? "#dbeafe" : po.status === "cancelled" ? "#e5e7eb" : "#f1f5f9";
                                      const stColor = po.status === "received" ? "#15803d" : po.status === "partially_received" ? "#a16207" : po.status === "ordered" ? "#1e40af" : po.status === "cancelled" ? "#6b7280" : "#475569";
                                      const stLabel = po.status === "partially_received" ? "partial" : po.status === "ordered" ? "awaiting" : po.status;
                                      return (
                                        <tr key={po.id} style={{ borderBottom: "1px solid #f1f5f9", background: i % 2 === 0 ? "#fff" : "#fafafa", color: po.status === "cancelled" ? "#9ca3af" : undefined }}>
                                          <td style={{ padding: "6px 8px", fontWeight: 500 }}>{po.po_number}</td>
                                          <td style={{ padding: "6px 8px", textAlign: "center" }}>
                                            <span style={{ fontSize: "11px", fontWeight: 700, padding: "2px 8px", borderRadius: "10px", background: stBg, color: stColor }}>{stLabel}</span>
                                          </td>
                                          <td style={{ padding: "6px 8px", textAlign: "right" }}>{ordQty}</td>
                                          <td style={{ padding: "6px 8px", textAlign: "right" }}>{rcvQty}</td>
                                          <td style={{ padding: "6px 8px", textAlign: "right", fontWeight: remQty > 0 ? "bold" : "normal", color: remQty > 0 ? "#b45309" : "#15803d" }}>{remQty}</td>
                                          <td style={{ padding: "6px 8px", textAlign: "right" }}>${Number(po.subtotal).toFixed(2)}</td>
                                          <td style={{ padding: "6px 8px", fontSize: "12px", color: "#64748b" }}>{new Date(po.created_at).toLocaleDateString()}</td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                  <tfoot>
                                    <tr style={{ borderTop: "2px solid #e2e8f0", fontWeight: "bold", background: "#f9fafb" }}>
                                      <td style={{ padding: "6px 8px" }}>Total ({pos.length} POs)</td>
                                      <td></td>
                                      <td style={{ padding: "6px 8px", textAlign: "right" }}>{totalOrderedQty}</td>
                                      <td style={{ padding: "6px 8px", textAlign: "right" }}>{totalReceivedQty}</td>
                                      <td style={{ padding: "6px 8px", textAlign: "right", color: totalRemainingQty > 0 ? "#b45309" : "#15803d" }}>{totalRemainingQty}</td>
                                      <td style={{ padding: "6px 8px", textAlign: "right" }}>${nonCancelledPos.reduce((sum, po) => sum + Number(po.subtotal), 0).toFixed(2)}</td>
                                      <td></td>
                                    </tr>
                                  </tfoot>
                                </table>
                              </div>
                            </div>
                          )}

                          {/* Product Catalog */}
                          <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: "12px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                              <strong style={{ fontSize: "14px" }}>Product Catalog ({supProducts.length})</strong>
                              {supProducts.length > 0 && (
                                <button
                                  onClick={() => handleCreateCatalogPO(s.id)}
                                  style={{ padding: "6px 16px", cursor: "pointer", borderRadius: "5px", border: "none", background: "#15803d", color: "#fff", fontWeight: 600, fontSize: "13px" }}
                                >Create PO From Catalog</button>
                              )}
                            </div>
                            {supProducts.length === 0 ? (
                              <div style={{ fontSize: "13px", color: "#94a3b8", padding: "8px 0" }}>No products assigned to this supplier yet. Use the Reorder Center to assign products.</div>
                            ) : (
                              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                                <thead>
                                  <tr style={{ borderBottom: "1px solid #e2e8f0", background: "#f1f5f9" }}>
                                    <th style={{ textAlign: "left", padding: "6px 8px" }}>Product</th>
                                    <th style={{ textAlign: "right", padding: "6px 8px" }}>Stock</th>
                                    <th style={{ textAlign: "right", padding: "6px 8px" }}>Reorder Level</th>
                                    <th style={{ textAlign: "right", padding: "6px 8px" }}>Last Cost</th>
                                    <th style={{ textAlign: "right", padding: "6px 8px" }}>Pref. Order Qty</th>
                                    <th style={{ padding: "6px 8px" }}>Status</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {supProducts.map((p, i) => {
                                    const defaultQty = Math.max(1, p.reorder_level - p.quantity_on_hand);
                                    const prefQty = getPrefQty(p.product_id);
                                    const isLow = p.quantity_on_hand < p.reorder_level;
                                    return (
                                      <tr key={p.product_id} style={{ borderBottom: "1px solid #f1f5f9", background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                                        <td style={{ padding: "6px 8px" }}>{p.product_name}</td>
                                        <td style={{ padding: "6px 8px", textAlign: "right" }}>{p.quantity_on_hand}</td>
                                        <td style={{ padding: "6px 8px", textAlign: "right" }}>{p.reorder_level}</td>
                                        <td style={{ padding: "6px 8px", textAlign: "right" }}>${p.average_cost.toFixed(2)}</td>
                                        <td style={{ padding: "6px 8px", textAlign: "right" }}>
                                          <input
                                            type="number" min="1"
                                            value={prefQty ?? defaultQty}
                                            onChange={(e) => savePrefQty(p.product_id, Math.max(1, Number(e.target.value) || 1))}
                                            style={{ width: "60px", padding: "3px", textAlign: "right", fontSize: "12px" }}
                                          />
                                        </td>
                                        <td style={{ padding: "6px 8px" }}>
                                          {isLow ? (
                                            <span style={{ fontSize: "11px", fontWeight: 700, padding: "2px 6px", borderRadius: "10px", background: "#fef2f2", color: "#dc2626" }}>Low Stock</span>
                                          ) : (
                                            <span style={{ fontSize: "11px", fontWeight: 700, padding: "2px 6px", borderRadius: "10px", background: "#dcfce7", color: "#15803d" }}>OK</span>
                                          )}
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            )}
                          </div>
                        </td>
                      </tr>
                      );
                    })()}
                    {isEditing && (
                      <tr>
                        <td colSpan={8} style={{ background: "#f0f4ff", padding: "16px", border: "1px solid #c7d2fe" }}>
                          <strong style={{ color: "#3730a3", display: "block", marginBottom: "10px" }}>Edit Supplier — {s.name}</strong>
                          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
                            <input type="text" placeholder="Supplier Name *" value={editSupName} onChange={(e) => setEditSupName(e.target.value)} style={{ flex: "2 1 180px", padding: "7px 10px" }} />
                            <input type="text" placeholder="Contact Person" value={editSupContact} onChange={(e) => setEditSupContact(e.target.value)} style={{ flex: "1 1 150px", padding: "7px 10px" }} />
                            <input type="text" placeholder="Phone" value={editSupPhone} onChange={(e) => setEditSupPhone(e.target.value)} style={{ flex: "1 1 120px", padding: "7px 10px" }} />
                            <input type="email" placeholder="Email" value={editSupEmail} onChange={(e) => setEditSupEmail(e.target.value)} style={{ flex: "1 1 170px", padding: "7px 10px" }} />
                            <input type="text" placeholder="Notes" value={editSupNotes} onChange={(e) => setEditSupNotes(e.target.value)} style={{ flex: "2 1 180px", padding: "7px 10px" }} />
                            <button onClick={handleSaveSupplier} disabled={!editSupName.trim()} style={{ padding: "7px 18px", cursor: "pointer", fontWeight: "bold", background: "#1d4ed8", color: "#fff", border: "none", borderRadius: "5px" }}>Save</button>
                            <button onClick={handleCancelEditSupplier} style={{ padding: "7px 14px", cursor: "pointer" }}>Cancel</button>
                          </div>
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

      <h2 style={{ marginTop: "40px" }}>Reorder Center</h2>

      {(() => {
        const lowStock = products.filter((p) => p.quantity_on_hand < p.reorder_level && p.status === "active");
        if (lowStock.length === 0) {
          return <p style={{ color: "#16a34a" }}>All products are sufficiently stocked.</p>;
        }
        const missingSup = lowStock.filter(p => !p.supplier_id && !reorderSuppliers[p.product_id]);
        const readyToOrder = lowStock.filter(p => p.supplier_id || reorderSuppliers[p.product_id]);
        const filtered = reorderFilter === "missing" ? missingSup : reorderFilter === "ready" ? readyToOrder : lowStock;
        const selectedCount = lowStock.filter(p => reorderSelected.has(p.product_id)).length;
        const estValue = lowStock.filter(p => reorderSelected.has(p.product_id)).reduce((sum, p) => {
          const qty = Number(reorderQtys[p.product_id] ?? (p.reorder_level - p.quantity_on_hand));
          return sum + qty * (p.average_cost || 0);
        }, 0);
        const involvedSuppliers = new Set(lowStock.map(p => reorderSuppliers[p.product_id] || p.supplier_id).filter(Boolean));

        const grouped: Record<string, typeof lowStock> = {};
        for (const p of filtered) {
          const sid = reorderSuppliers[p.product_id] || p.supplier_id || "__unassigned__";
          if (!grouped[sid]) grouped[sid] = [];
          grouped[sid].push(p);
        }
        const supplierMap = Object.fromEntries(suppliers.map(s => [s.id, s.name]));

        return (
          <>
          {/* Summary cards */}
          <div className="dash-card-row" style={{ marginBottom: "16px" }}>
            <div className="dash-card">
              <div className="dash-card-icon" style={{ background: "#fef2f2", color: "#dc2626" }}>!</div>
              <div className="dash-card-body">
                <div className="dash-card-label">Need Reorder</div>
                <div className="dash-card-value">{lowStock.length}</div>
              </div>
            </div>
            <div className="dash-card">
              <div className="dash-card-icon" style={{ background: "#f0fdf4", color: "#16a34a" }}>S</div>
              <div className="dash-card-body">
                <div className="dash-card-label">Suppliers Involved</div>
                <div className="dash-card-value">{involvedSuppliers.size}</div>
              </div>
            </div>
            <div className="dash-card">
              <div className="dash-card-icon" style={{ background: "#eff6ff", color: "#1d4ed8" }}>&#x2713;</div>
              <div className="dash-card-body">
                <div className="dash-card-label">Selected</div>
                <div className="dash-card-value">{selectedCount}</div>
              </div>
            </div>
            <div className="dash-card">
              <div className="dash-card-icon" style={{ background: "#faf5ff", color: "#7c3aed" }}>$</div>
              <div className="dash-card-body">
                <div className="dash-card-label">Est. PO Value</div>
                <div className="dash-card-value">${estValue.toFixed(2)}</div>
              </div>
            </div>
          </div>

          {/* Missing supplier alert */}
          {missingSup.length > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: "16px", padding: "10px 16px", background: "#fffbeb", border: "1px solid #fde68a", borderRadius: "6px", marginBottom: "12px" }}>
              <div style={{ fontSize: "14px", color: "#92400e" }}>
                <strong>{missingSup.length}</strong> product{missingSup.length !== 1 ? "s" : ""} need supplier assignment
              </div>
              <button
                onClick={() => setReorderFilter("missing")}
                style={{ padding: "5px 14px", fontSize: "13px", cursor: "pointer", borderRadius: "5px", border: "1px solid #f59e0b", background: "#fef3c7", color: "#92400e", fontWeight: 600 }}
              >Review Missing Suppliers</button>
            </div>
          )}

          {/* Filter chips */}
          <div style={{ display: "flex", gap: "8px", marginBottom: "12px", flexWrap: "wrap", alignItems: "center" }}>
            {([
              { key: "all" as const, label: "All", count: lowStock.length },
              { key: "missing" as const, label: "Missing Supplier", count: missingSup.length },
              { key: "ready" as const, label: "Ready to Reorder", count: readyToOrder.length },
            ]).map(chip => {
              const active = reorderFilter === chip.key;
              return (
                <button
                  key={chip.key}
                  onClick={() => { setReorderFilter(chip.key); setReorderSelected(new Set()); }}
                  style={{
                    padding: "6px 16px", borderRadius: "20px", cursor: "pointer", fontSize: "13px",
                    border: active ? "2px solid #1d4ed8" : "1px solid #d1d5db",
                    background: active ? "#dbeafe" : "#f9fafb",
                    color: active ? "#1d4ed8" : "#374151",
                    fontWeight: active ? 600 : 400,
                  }}
                >{chip.label} ({chip.count})</button>
              );
            })}
            {selectedCount > 0 && (
              <span style={{ fontSize: "13px", color: "#64748b", marginLeft: "8px" }}>{selectedCount} selected</span>
            )}
          </div>

          {/* Bulk actions */}
          {selectedCount > 0 && (
            <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "12px", flexWrap: "wrap", padding: "10px 14px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "6px" }}>
              <button
                onClick={() => setReorderSelected(new Set())}
                style={{ padding: "6px 14px", cursor: "pointer", borderRadius: "5px", border: "1px solid #d1d5db", background: "#fff", color: "#374151", fontSize: "13px" }}
              >Clear Selection</button>
              <select
                value={bulkSupplierId}
                onChange={(e) => setBulkSupplierId(e.target.value)}
                style={{ padding: "6px 8px", fontSize: "13px", borderRadius: "5px", border: "1px solid #d1d5db" }}
              >
                <option value="">Assign supplier…</option>
                {suppliers.filter(s => s.status === "active").map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
              {bulkSupplierId && (
                <button
                  onClick={handleBulkAssignSupplier}
                  style={{ padding: "6px 14px", cursor: "pointer", borderRadius: "5px", border: "none", background: "#15803d", color: "#fff", fontWeight: 600, fontSize: "13px" }}
                >Assign to Selected ({selectedCount})</button>
              )}
              {reorderFilter !== "missing" && (
                <button
                  onClick={handleBatchReorderPO}
                  style={{ padding: "8px 22px", cursor: "pointer", borderRadius: "6px", border: "none", background: "#15803d", color: "#fff", fontWeight: 700, fontSize: "14px" }}
                >Create Draft PO ({selectedCount})</button>
              )}
            </div>
          )}

          {/* Grouped by supplier */}
          {Object.entries(grouped).map(([sid, items]) => {
            const supName = sid === "__unassigned__" ? "No Supplier Assigned" : (supplierMap[sid] ?? "Unknown");
            const isCollapsed = collapsedSuppliers.has(sid);
            const groupValue = items.reduce((sum, p) => {
              const qty = Number(reorderQtys[p.product_id] ?? (p.reorder_level - p.quantity_on_hand));
              return sum + qty * (p.average_cost || 0);
            }, 0);
            const groupSelected = items.filter(p => reorderSelected.has(p.product_id)).length;
            const allGroupSelected = items.every(p => reorderSelected.has(p.product_id));
            return (
              <div key={sid} style={{ marginBottom: "16px", border: "1px solid #e2e8f0", borderRadius: "6px", overflow: "hidden" }}>
                <div
                  onClick={() => setCollapsedSuppliers(prev => { const n = new Set(prev); if (n.has(sid)) n.delete(sid); else n.add(sid); return n; })}
                  style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 14px", background: "#f8fafc", cursor: "pointer", userSelect: "none" }}
                >
                  <span style={{ fontSize: "14px", color: "#64748b" }}>{isCollapsed ? "▸" : "▾"}</span>
                  <strong style={{ fontSize: "15px", color: sid === "__unassigned__" ? "#b45309" : "#0f172a" }}>{supName}</strong>
                  <span style={{ fontSize: "13px", color: "#64748b" }}>{items.length} product{items.length !== 1 ? "s" : ""}</span>
                  <span style={{ fontSize: "13px", color: "#64748b" }}>Est. ${groupValue.toFixed(2)}</span>
                  {groupSelected > 0 && <span style={{ fontSize: "12px", color: "#1d4ed8", fontWeight: 600 }}>{groupSelected} selected</span>}
                  <div style={{ marginLeft: "auto" }} onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={allGroupSelected}
                      onChange={() => {
                        setReorderSelected(prev => {
                          const next = new Set(prev);
                          if (allGroupSelected) { items.forEach(p => next.delete(p.product_id)); } else { items.forEach(p => next.add(p.product_id)); }
                          return next;
                        });
                      }}
                      style={{ cursor: "pointer" }}
                    />
                  </div>
                </div>
                {!isCollapsed && (
                  <table border={0} cellPadding={8} style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                    <thead>
                      <tr style={{ background: "#f1f5f9", borderBottom: "1px solid #e2e8f0" }}>
                        <th style={{ width: "36px", padding: "6px 8px" }}></th>
                        <th style={{ textAlign: "left", padding: "6px 8px" }}>Product</th>
                        <th style={{ textAlign: "right", padding: "6px 8px" }}>Stock</th>
                        <th style={{ textAlign: "right", padding: "6px 8px" }}>Reorder</th>
                        <th style={{ textAlign: "right", padding: "6px 8px" }}>Shortage</th>
                        <th style={{ padding: "6px 8px" }}>Supplier</th>
                        <th style={{ textAlign: "right", padding: "6px 8px" }}>Order Qty</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((p, i) => {
                        const checked = reorderSelected.has(p.product_id);
                        const savedSupplier = p.supplier_id || "";
                        return (
                          <tr key={p.product_id} style={{ borderBottom: "1px solid #f1f5f9", background: checked ? "#eff6ff" : i % 2 === 0 ? "#fff" : "#fafafa" }}>
                            <td style={{ padding: "6px 8px" }}>
                              <input type="checkbox" checked={checked} onChange={() => { setReorderSelected(prev => { const n = new Set(prev); if (n.has(p.product_id)) n.delete(p.product_id); else n.add(p.product_id); return n; }); }} style={{ cursor: "pointer" }} />
                            </td>
                            <td style={{ padding: "6px 8px" }}>{p.product_name}</td>
                            <td style={{ padding: "6px 8px", textAlign: "right" }}>{p.quantity_on_hand}</td>
                            <td style={{ padding: "6px 8px", textAlign: "right" }}>{p.reorder_level}</td>
                            <td style={{ padding: "6px 8px", textAlign: "right", color: "#dc2626", fontWeight: 600 }}>{p.reorder_level - p.quantity_on_hand}</td>
                            <td style={{ padding: "6px 8px" }}>
                              <select
                                value={reorderSuppliers[p.product_id] ?? savedSupplier}
                                onChange={(e) => setReorderSuppliers((prev) => ({ ...prev, [p.product_id]: e.target.value }))}
                                style={{ padding: "3px", width: "100%", fontSize: "12px" }}
                              >
                                <option value="">Select…</option>
                                {suppliers.filter(s => s.status === "active").map((s) => (
                                  <option key={s.id} value={s.id}>{s.name}</option>
                                ))}
                              </select>
                            </td>
                            <td style={{ padding: "6px 8px", textAlign: "right" }}>
                              <input
                                type="number" min="1"
                                value={reorderQtys[p.product_id] ?? String(p.reorder_level - p.quantity_on_hand)}
                                onChange={(e) => setReorderQtys((prev) => ({ ...prev, [p.product_id]: e.target.value }))}
                                style={{ width: "60px", padding: "3px", textAlign: "right" }}
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            );
          })}
          </>
        );
      })()}


      </div>{/* end purchasing */}

      {/* ── CUSTOMERS TAB ── */}
      <div style={{ display: activeTab === 'customers' && businessId ? '' : 'none' }}>

      <div className="page-header">
        <h2 className="page-title">Customers</h2>
        <p className="page-subtitle">Manage customer profiles, purchase history, and loyalty points</p>
      </div>

      <h3 style={{ marginBottom: "8px" }}>Add Customer</h3>
      <form
        onSubmit={handleAddCustomer}
        style={{ display: "flex", flexWrap: "wrap", gap: "12px", alignItems: "center", marginBottom: "24px" }}
      >
        <input
          type="text"
          placeholder="Name *"
          value={newCusName}
          onChange={(e) => setNewCusName(e.target.value)}
          style={{ flex: "1 1 150px", padding: "8px" }}
        />
        <input
          type="text"
          placeholder="Phone *"
          value={newCusPhone}
          onChange={(e) => setNewCusPhone(e.target.value)}
          style={{ flex: "1 1 140px", padding: "8px" }}
        />
        <input
          type="email"
          placeholder="Email (optional)"
          value={newCusEmail}
          onChange={(e) => setNewCusEmail(e.target.value)}
          style={{ flex: "1 1 180px", padding: "8px" }}
        />
        <button type="submit" style={{ padding: "8px 20px" }}>Add Customer</button>
      </form>

      {/* Customer Insights */}
      <h3 style={{ marginTop: "24px", marginBottom: "8px" }}>Customer Insights</h3>
      <p style={{ fontSize: "12px", color: "#888", marginBottom: "12px" }}>Based on most recent 20 sales</p>
      {(() => {
        const completedSales = sales.filter(s => s.status === "completed");
        const totalVisits = completedSales.length;
        const storeAvg = totalVisits > 0
          ? completedSales.reduce((sum, s) => sum + Number(s.total), 0) / totalVisits
          : 0;
        const repeatCount = customers.filter(c =>
          completedSales.filter(s => s.customer_id === c.id).length >= 2
        ).length;

        const productMap = Object.fromEntries(products.map(p => [p.product_id, p.product_name]));

        const top5 = customers
          .map(c => {
            const custSales = completedSales.filter(s => s.customer_id === c.id);
            const totalSpend = custSales.reduce((sum, s) => sum + Number(s.total), 0);
            const visits = custSales.length;
            const avgPerVisit = visits > 0 ? totalSpend / visits : 0;
            const custSaleIds = new Set(custSales.map(s => s.id));
            const itemQtys: Record<string, number> = {};
            saleItems
              .filter(si => custSaleIds.has(si.sale_id))
              .forEach(si => { itemQtys[si.product_id] = (itemQtys[si.product_id] ?? 0) + si.quantity; });
            const favProductId = Object.entries(itemQtys).sort((a, b) => b[1] - a[1])[0]?.[0];
            const favProduct = favProductId ? (productMap[favProductId] ?? "—") : "—";
            return { id: c.id, name: c.name, visits, totalSpend, avgPerVisit, favProduct };
          })
          .filter(r => r.totalSpend > 0)
          .sort((a, b) => b.totalSpend - a.totalSpend)
          .slice(0, 5);

        return (
          <>
            <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", marginBottom: "24px" }}>
              {[
                { label: "Total Customers", value: customers.length },
                { label: "Store Avg Spend / Visit", value: `$${storeAvg.toFixed(2)}` },
                { label: "Repeat Customers", value: repeatCount },
                { label: "Total Points Outstanding", value: loyaltyTransactions.reduce((s, lt) => s + lt.points, 0) },
              ].map(card => (
                <div key={card.label} style={{ border: "1px solid #ccc", borderRadius: "8px", padding: "16px", minWidth: "160px", flex: 1 }}>
                  <div style={{ fontSize: "12px", color: "#888" }}>{card.label}</div>
                  <div style={{ fontSize: "24px", fontWeight: "bold" }}>{card.value}</div>
                </div>
              ))}
            </div>

            <h4 style={{ marginBottom: "8px" }}>Top 5 Customers by Spend</h4>
            <div style={{ overflowX: "auto", marginBottom: "24px" }}>
              <table border={1} cellPadding={10} style={{ width: "100%" }}>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Name</th>
                    <th>Visits</th>
                    <th>Total Spend</th>
                    <th>Avg / Visit</th>
                    <th>Favorite Product</th>
                  </tr>
                </thead>
                <tbody>
                  {top5.length === 0 ? (
                    <tr><td colSpan={6}>No customer sales data yet</td></tr>
                  ) : (
                    top5.map((row, i) => (
                      <tr key={row.id}>
                        <td>{i + 1}</td>
                        <td>{row.name}</td>
                        <td>{row.visits}</td>
                        <td>${row.totalSpend.toFixed(2)}</td>
                        <td>${row.avgPerVisit.toFixed(2)}</td>
                        <td>{row.favProduct}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        );
      })()}

      <h3 style={{ marginBottom: "4px" }}>Customers</h3>
      <p style={{ fontSize: "12px", color: "#888", marginBottom: "8px" }}>Click a row to see purchase history</p>
      {(() => {
        const rows = customers.map((c) => {
          const custSales = sales.filter(s => s.customer_id === c.id && s.status === "completed");
          const totalSpend = custSales.reduce((sum, s) => sum + Number(s.total), 0);
          const lastVisit = custSales.length > 0
            ? new Date(Math.max(...custSales.map(s => new Date(s.created_at).getTime())))
            : null;
          const pointsBalance = loyaltyTransactions
            .filter(lt => lt.customer_id === c.id)
            .reduce((sum, lt) => sum + lt.points, 0);
          return { ...c, visitCount: custSales.length, totalSpend, lastVisit, pointsBalance };
        });
        return (
          <div style={{ overflowX: "auto", marginBottom: "40px" }}>
            <table border={1} cellPadding={10} style={{ width: "100%" }}>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Phone</th>
                  <th>Email</th>
                  <th>Status</th>
                  <th>Visits</th>
                  <th>Total Spend</th>
                  <th>Last Visit</th>
                  <th>Points</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr><td colSpan={9}>No customers yet</td></tr>
                ) : (
                  rows.map((row) => {
                    const isExpanded = expandedCustomerId === row.id;
                    const isEditing = editingCustomerId === row.id;
                    const inactive = row.status !== "active";
                    const custSales = sales.filter(s => s.customer_id === row.id && s.status !== 'open');
                    return (
                      <React.Fragment key={row.id}>
                        <tr
                          onClick={() => { if (!isEditing) setExpandedCustomerId(isExpanded ? null : row.id); }}
                          style={{
                            cursor: isEditing ? "default" : "pointer",
                            background: isExpanded ? "#f0f4ff" : inactive ? "#f5f5f5" : undefined,
                            color: inactive ? "#999" : undefined,
                          }}
                        >
                          <td>{isExpanded ? "▾" : "▸"} {row.name}</td>
                          <td>{row.phone}</td>
                          <td>{row.email ?? "—"}</td>
                          <td>
                            <span style={{
                              fontSize: "12px", fontWeight: "bold", padding: "2px 8px", borderRadius: "12px",
                              background: inactive ? "#e5e7eb" : "#dcfce7",
                              color: inactive ? "#6b7280" : "#15803d",
                            }}>{row.status}</span>
                          </td>
                          <td>{row.visitCount}</td>
                          <td>${row.totalSpend.toFixed(2)}</td>
                          <td>{row.lastVisit ? row.lastVisit.toLocaleDateString() : "—"}</td>
                          <td style={{ color: row.pointsBalance > 0 ? "#7c3aed" : "#888", fontWeight: row.pointsBalance > 0 ? "bold" : "normal" }}>{row.pointsBalance}</td>
                          <td style={{ whiteSpace: "nowrap" }} onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => {
                                if (isEditing) { setEditingCustomerId(null); return; }
                                setEditingCustomerId(row.id);
                                setEditCusName(row.name);
                                setEditCusPhone(row.phone);
                                setEditCusEmail(row.email ?? "");
                              }}
                              style={{ marginRight: "6px", padding: "3px 10px", cursor: "pointer" }}
                            >{isEditing ? "Cancel" : "Edit"}</button>
                            <button
                              onClick={() => handleToggleCustomerStatus(row)}
                              style={{ padding: "3px 10px", cursor: "pointer" }}
                            >{inactive ? "Activate" : "Deactivate"}</button>
                          </td>
                        </tr>
                        {isEditing && (
                          <tr>
                            <td colSpan={9} style={{ background: "#f9fafb", padding: "16px" }}>
                              <form onSubmit={(e) => handleEditCustomer(e, row.id)} style={{ display: "flex", flexWrap: "wrap", gap: "10px", alignItems: "center" }}>
                                <strong style={{ width: "100%", marginBottom: "4px" }}>Edit Customer — {row.name}</strong>
                                <input type="text" placeholder="Name *" value={editCusName} onChange={(e) => setEditCusName(e.target.value)} required style={{ flex: "2 1 160px", padding: "7px" }} />
                                <input type="text" placeholder="Phone *" value={editCusPhone} onChange={(e) => setEditCusPhone(e.target.value)} required style={{ flex: "1 1 130px", padding: "7px" }} />
                                <input type="email" placeholder="Email" value={editCusEmail} onChange={(e) => setEditCusEmail(e.target.value)} style={{ flex: "1 1 180px", padding: "7px" }} />
                                <button type="submit" style={{ padding: "7px 16px", cursor: "pointer", background: "#1d4ed8", color: "#fff", border: "none", borderRadius: "4px" }}>Save</button>
                                <button type="button" onClick={() => setEditingCustomerId(null)} style={{ padding: "7px 14px", cursor: "pointer" }}>Cancel</button>
                              </form>
                            </td>
                          </tr>
                        )}
                        {isExpanded && !isEditing && (
                          <tr>
                            <td colSpan={9} style={{ background: "#f8f9ff", padding: "16px" }}>
                              {(() => {
                                const custLoyalty = loyaltyTransactions.filter(lt => lt.customer_id === row.id);
                                const lifetimeEarned = custLoyalty.filter(lt => lt.type === 'earn' && lt.points > 0).reduce((s, lt) => s + lt.points, 0);
                                const lifetimeRedeemed = custLoyalty.filter(lt => lt.type === 'redeem').reduce((s, lt) => s + Math.abs(lt.points), 0);
                                const custReturns = allReturnItems.filter(ri => custSales.some(s => s.id === ri.sale_id));
                                const totalReturned = custReturns.reduce((s, ri) => s + ri.quantity_returned, 0);
                                const avgSpend = row.visitCount > 0 ? row.totalSpend / row.visitCount : 0;
                                const productNameMap = Object.fromEntries(products.map(p => [p.product_id, p.product_name]));

                                return (
                                  <>
                                    {/* Customer Summary */}
                                    <strong style={{ display: "block", marginBottom: "12px" }}>Customer Summary — {row.name}</strong>
                                    <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "20px" }}>
                                      {[
                                        { label: "Total Visits", value: String(row.visitCount) },
                                        { label: "Total Spent", value: `$${row.totalSpend.toFixed(2)}` },
                                        { label: "Avg per Visit", value: `$${avgSpend.toFixed(2)}` },
                                        { label: "Last Purchase", value: row.lastVisit ? row.lastVisit.toLocaleDateString() : "—" },
                                        { label: "Points Balance", value: String(row.pointsBalance), color: row.pointsBalance > 0 ? "#7c3aed" : "#888" },
                                        { label: "Items Returned", value: String(totalReturned), color: totalReturned > 0 ? "#dc2626" : "#888" },
                                        { label: "Lifetime Earned", value: `+${lifetimeEarned} pts`, color: "#15803d" },
                                        { label: "Lifetime Redeemed", value: `${lifetimeRedeemed} pts`, color: lifetimeRedeemed > 0 ? "#dc2626" : "#888" },
                                      ].map(card => (
                                        <div key={card.label} style={{ border: "1px solid #e5e7eb", borderRadius: "6px", padding: "10px 14px", minWidth: "110px", flex: 1, background: "#fff" }}>
                                          <div style={{ fontSize: "10px", color: "#888", textTransform: "uppercase", letterSpacing: "0.5px" }}>{card.label}</div>
                                          <div style={{ fontSize: "18px", fontWeight: "bold", color: card.color ?? "#0f172a", marginTop: "2px" }}>{card.value}</div>
                                        </div>
                                      ))}
                                    </div>

                                    {/* Purchase History */}
                                    <strong style={{ display: "block", marginBottom: "8px" }}>Purchase History</strong>
                                    {custSales.length === 0 ? (
                                      <p style={{ margin: "0 0 16px", color: "#888" }}>No sales recorded for this customer.</p>
                                    ) : (
                                      custSales.map(s => {
                                        const items = saleItems.filter(si => si.sale_id === s.id);
                                        const salePayments = allPayments.filter(p => p.sale_id === s.id);
                                        const saleReturns = allReturnItems.filter(ri => ri.sale_id === s.id);
                                        const saleLoyalty = custLoyalty.filter(lt => lt.sale_id === s.id);
                                        const earnedPts = saleLoyalty.filter(lt => lt.type === 'earn' && lt.points > 0).reduce((sum, lt) => sum + lt.points, 0);
                                        const redeemedPts = saleLoyalty.filter(lt => lt.type === 'redeem').reduce((sum, lt) => sum + Math.abs(lt.points), 0);
                                        const payMethods = salePayments.map(p => p.payment_method).join(", ") || "—";
                                        const statusBg = s.status === "completed" ? "#dcfce7" : s.status === "returned" ? "#fef2f2" : s.status === "voided" ? "#e5e7eb" : "#f1f5f9";
                                        const statusColor = s.status === "completed" ? "#15803d" : s.status === "returned" ? "#dc2626" : s.status === "voided" ? "#6b7280" : "#475569";

                                        return (
                                          <div key={s.id} style={{ border: "1px solid #e5e7eb", borderRadius: "6px", marginBottom: "12px", background: "#fff" }}>
                                            <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", alignItems: "center", padding: "10px 14px", borderBottom: "1px solid #f1f5f9" }}>
                                              <span style={{ fontWeight: "bold", fontSize: "13px" }}>{new Date(s.created_at).toLocaleString()}</span>
                                              <span style={{ fontSize: "11px", fontWeight: "bold", padding: "2px 8px", borderRadius: "12px", background: statusBg, color: statusColor }}>{s.status}</span>
                                              <span style={{ fontSize: "13px" }}>Payment: <strong>{payMethods}</strong></span>
                                              {Number(s.discount_amount) > 0 && (
                                                <span style={{ fontSize: "13px", color: "#b45309" }}>Discount: −${Number(s.discount_amount).toFixed(2)}</span>
                                              )}
                                              {earnedPts > 0 && <span style={{ fontSize: "12px", color: "#15803d", fontWeight: "bold" }}>+{earnedPts} pts earned</span>}
                                              {redeemedPts > 0 && <span style={{ fontSize: "12px", color: "#7c3aed", fontWeight: "bold" }}>−{redeemedPts} pts redeemed</span>}
                                              <span style={{ marginLeft: "auto", fontWeight: "bold", fontSize: "15px" }}>${Number(s.total).toFixed(2)}</span>
                                              <button onClick={() => handlePrintReceipt(s)} style={{ padding: "2px 10px", cursor: "pointer", fontSize: "12px" }}>Receipt</button>
                                            </div>
                                            <table cellPadding={6} style={{ width: "100%", fontSize: "13px" }}>
                                              <thead>
                                                <tr style={{ background: "#f9fafb" }}>
                                                  <th style={{ textAlign: "left", padding: "6px 14px" }}>Product</th>
                                                  <th style={{ textAlign: "right", padding: "6px 14px" }}>Qty</th>
                                                  <th style={{ textAlign: "right", padding: "6px 14px" }}>Unit Price</th>
                                                  <th style={{ textAlign: "right", padding: "6px 14px" }}>Line Total</th>
                                                  <th style={{ textAlign: "right", padding: "6px 14px" }}>Returned</th>
                                                </tr>
                                              </thead>
                                              <tbody>
                                                {items.map(si => {
                                                  const retQty = saleReturns.filter(ri => ri.product_id === si.product_id).reduce((s2, ri) => s2 + ri.quantity_returned, 0);
                                                  return (
                                                    <tr key={si.product_id}>
                                                      <td style={{ padding: "4px 14px" }}>{productNameMap[si.product_id] ?? si.product_id.slice(0, 8)}</td>
                                                      <td style={{ textAlign: "right", padding: "4px 14px" }}>{si.quantity}</td>
                                                      <td style={{ textAlign: "right", padding: "4px 14px" }}>${si.unit_price.toFixed(2)}</td>
                                                      <td style={{ textAlign: "right", padding: "4px 14px" }}>${si.line_total.toFixed(2)}</td>
                                                      <td style={{ textAlign: "right", padding: "4px 14px", color: retQty > 0 ? "#dc2626" : "#ccc", fontWeight: retQty > 0 ? "bold" : "normal" }}>
                                                        {retQty > 0 ? retQty : "—"}
                                                      </td>
                                                    </tr>
                                                  );
                                                })}
                                              </tbody>
                                            </table>
                                          </div>
                                        );
                                      })
                                    )}

                                    {/* Points History (kept) */}
                                    <strong style={{ display: "block", marginTop: "16px" }}>Points History</strong>
                                    {(() => {
                                      const recentLoyalty = custLoyalty.slice(0, 20);
                                      return recentLoyalty.length === 0 ? (
                                        <p style={{ margin: "8px 0 0", color: "#888" }}>No points history yet.</p>
                                      ) : (
                                        <table border={1} cellPadding={8} style={{ width: "100%", marginTop: "8px", fontSize: "13px" }}>
                                          <thead>
                                            <tr><th>Date</th><th>Type</th><th>Points</th><th>Sale</th></tr>
                                          </thead>
                                          <tbody>
                                            {recentLoyalty.map(lt => (
                                              <tr key={lt.id}>
                                                <td>{new Date(lt.created_at).toLocaleString()}</td>
                                                <td style={{ color: lt.type === 'earn' ? '#15803d' : '#dc2626', fontWeight: 'bold' }}>{lt.type}</td>
                                                <td style={{ color: lt.points > 0 ? '#15803d' : '#dc2626', fontWeight: 'bold' }}>
                                                  {lt.points > 0 ? `+${lt.points}` : lt.points}
                                                </td>
                                                <td style={{ fontFamily: 'monospace', fontSize: '12px' }}>{lt.sale_id ? lt.sale_id.slice(0, 8) + '…' : '—'}</td>
                                              </tr>
                                            ))}
                                          </tbody>
                                        </table>
                                      );
                                    })()}
                                  </>
                                );
                              })()}
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
        );
      })()}

      </div>{/* end customers */}

      {/* ── PURCHASING TAB (2) ── */}
      <div style={{ display: activeTab === 'purchasing' && businessId ? '' : 'none' }}>

      <h2 style={{ marginTop: "40px" }}>Create Purchase Order</h2>

      <form
        onSubmit={handleCreatePO}
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "12px",
          alignItems: "center",
          marginBottom: "16px",
        }}
      >
        <select
          value={poSupplierId}
          onChange={(e) => setPoSupplierId(e.target.value)}
          style={{ flex: "2 1 200px", padding: "8px" }}
        >
          <option value="">Select supplier...</option>
          {suppliers.filter(s => s.status === "active").map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>

        <input
          type="text"
          placeholder="Notes"
          value={poNotes}
          onChange={(e) => setPoNotes(e.target.value)}
          style={{ flex: "3 1 240px", padding: "8px" }}
        />

        <button type="submit" style={{ flex: "1 1 120px", padding: "8px" }}>
          Create PO
        </button>
      </form>

      {(() => {
        const counts = {
          all: purchaseOrders.length,
          draft: purchaseOrders.filter(po => po.status === "draft").length,
          ordered: purchaseOrders.filter(po => po.status === "ordered").length,
          partially_received: purchaseOrders.filter(po => po.status === "partially_received").length,
          received: purchaseOrders.filter(po => po.status === "received").length,
          cancelled: purchaseOrders.filter(po => po.status === "cancelled").length,
        };
        const chips: { key: typeof poStatusFilter; label: string }[] = [
          { key: "all", label: "All" },
          { key: "draft", label: "Draft" },
          { key: "ordered", label: "Awaiting Delivery" },
          { key: "partially_received", label: "Partial" },
          { key: "received", label: "Received" },
          { key: "cancelled", label: "Cancelled" },
        ];
        const filteredPOs = poStatusFilter === "all"
          ? purchaseOrders
          : purchaseOrders.filter(po => po.status === poStatusFilter);
        const supplierMap = Object.fromEntries(
          suppliers.map((supplier) => [supplier.id, supplier.name])
        );
        return (
          <>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "16px" }}>
            {chips.map(chip => {
              const active = poStatusFilter === chip.key;
              return (
                <button
                  key={chip.key}
                  onClick={() => setPoStatusFilter(chip.key)}
                  style={{
                    padding: "6px 16px",
                    borderRadius: "20px",
                    border: active ? "2px solid #1d4ed8" : "1px solid #d1d5db",
                    background: active ? "#dbeafe" : "#f9fafb",
                    color: active ? "#1d4ed8" : "#374151",
                    fontWeight: active ? 600 : 400,
                    cursor: "pointer",
                    fontSize: "13px",
                  }}
                >
                  {chip.label} ({counts[chip.key]})
                </button>
              );
            })}
          </div>
          <div style={{ marginBottom: "40px" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #e2e8f0" }}>
                  <th style={{ textAlign: "left", padding: "8px" }}>PO Number</th>
                  <th style={{ textAlign: "left", padding: "8px" }}>Supplier</th>
                  <th style={{ padding: "8px" }}>Status</th>
                  <th style={{ textAlign: "right", padding: "8px" }}>Subtotal</th>
                  <th style={{ textAlign: "left", padding: "8px" }}>Created</th>
                  <th style={{ padding: "8px", textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPOs.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: "16px", color: "#94a3b8" }}>{poStatusFilter === "all" ? "No purchase orders found" : `No ${poStatusFilter} purchase orders`}</td>
                  </tr>
                ) : (
                  filteredPOs.map((po) => {
                    const isDraft = po.status === "draft";
                    const isOrdered = po.status === "ordered";
                    const isPartiallyReceived = po.status === "partially_received";
                    const isCancelled = po.status === "cancelled";
                    const isReceived = po.status === "received";
                    const isSelected = selectedPoId === po.id;
                    const badgeBg = isDraft ? "#fef3c7" : isOrdered ? "#dbeafe" : isPartiallyReceived ? "#fef9c3" : isCancelled ? "#e5e7eb" : "#dcfce7";
                    const badgeColor = isDraft ? "#92400e" : isOrdered ? "#1e40af" : isPartiallyReceived ? "#a16207" : isCancelled ? "#6b7280" : "#15803d";
                    const badgeLabel = isDraft ? "Draft" : isOrdered ? "Awaiting" : isPartiallyReceived ? "Partial" : isCancelled ? "Cancelled" : "Received";
                    const isDraftPO = isDraft;
                    const productItemMap = Object.fromEntries(products.map((p) => [p.product_id, p.product_name]));
                    const moreOpen = poMoreOpen === po.id;
                    const hasSecondary = isDraft || isOrdered || isPartiallyReceived;
                    return (
                      <React.Fragment key={po.id}>
                      <tr style={{ borderBottom: "1px solid #f1f5f9", backgroundColor: isCancelled ? "#f9fafb" : isSelected ? "#f0f4ff" : "inherit", color: isCancelled ? "#9ca3af" : "inherit" }}>
                        <td style={{ padding: "8px", fontWeight: 500 }}>{po.po_number}</td>
                        <td style={{ padding: "8px" }}>{supplierMap[po.supplier_id] ?? "Unknown"}</td>
                        <td style={{ padding: "8px", textAlign: "center" }}>
                          <span style={{ fontSize: "12px", fontWeight: 700, padding: "3px 10px", borderRadius: "12px", background: badgeBg, color: badgeColor, display: "inline-block" }}>{badgeLabel}</span>
                        </td>
                        <td style={{ padding: "8px", textAlign: "right", fontWeight: 500 }}>${Number(po.subtotal ?? 0).toFixed(2)}</td>
                        <td style={{ padding: "8px", fontSize: "13px", color: "#64748b" }}>{new Date(po.created_at).toLocaleDateString()}</td>
                        <td style={{ padding: "8px", textAlign: "right", whiteSpace: "nowrap" }}>
                          {/* Primary: View */}
                          {isCancelled && (
                            <button onClick={() => handleSelectPO(po)} style={{ padding: "4px 10px", fontSize: "13px", cursor: "pointer" }}>
                              {isSelected ? "Close" : "View"}
                            </button>
                          )}
                          {!isCancelled && (
                            <button onClick={() => handleSelectPO(po)} style={{ padding: "4px 10px", marginRight: "4px", fontSize: "13px", cursor: "pointer" }}>
                              {isSelected ? "Close" : isDraft ? "View/Edit" : "View"}
                            </button>
                          )}
                          {/* Primary: Mark Ordered (draft only) */}
                          {isDraft && (
                            <button onClick={() => handleMarkOrdered(po)} style={{ padding: "4px 10px", marginRight: "4px", fontSize: "13px", cursor: "pointer", background: "#dbeafe", color: "#1e40af", border: "1px solid #93c5fd", borderRadius: "4px" }}>
                              Mark Ordered
                            </button>
                          )}
                          {/* Primary: Receive (ordered/partial) */}
                          {(isOrdered || isPartiallyReceived) && (
                            <button onClick={() => handleOpenReceive(po)} style={{ padding: "4px 10px", marginRight: "4px", fontSize: "13px", cursor: "pointer", background: receivingPoId === po.id ? "#d1fae5" : "#f0fdf4", color: "#15803d", border: "1px solid #bbf7d0", borderRadius: "4px" }}>
                              {receivingPoId === po.id ? "Cancel" : isPartiallyReceived ? "Receive More" : "Receive"}
                            </button>
                          )}
                          {/* Primary: Receive (draft — less prominent) */}
                          {isDraft && (
                            <button onClick={() => handleOpenReceive(po)} style={{ padding: "4px 10px", marginRight: "4px", fontSize: "13px", cursor: "pointer", background: receivingPoId === po.id ? "#d1fae5" : undefined }}>
                              {receivingPoId === po.id ? "Cancel" : "Receive"}
                            </button>
                          )}
                          {/* Primary: Delete (draft only) */}
                          {isDraft && (
                            <button onClick={() => handleDeletePO(po)} style={{ padding: "4px 10px", marginRight: "4px", fontSize: "13px", cursor: "pointer", background: "#fee2e2", color: "#dc2626", border: "1px solid #fca5a5", borderRadius: "4px" }}>
                              Delete
                            </button>
                          )}
                          {/* More menu */}
                          {(hasSecondary || isReceived) && (
                            <span style={{ position: "relative", display: "inline-block" }}>
                              <button onClick={() => setPoMoreOpen(moreOpen ? null : po.id)} style={{ padding: "4px 8px", fontSize: "13px", cursor: "pointer", background: moreOpen ? "#e5e7eb" : undefined }}>
                                ···
                              </button>
                              {moreOpen && (
                                <div style={{ position: "absolute", right: 0, top: "100%", zIndex: 10, background: "#fff", border: "1px solid #e2e8f0", borderRadius: "6px", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", minWidth: "140px", padding: "4px 0" }}>
                                  {(isDraft || isOrdered || isPartiallyReceived) && (
                                    <button onClick={() => { handlePrintPO(po); setPoMoreOpen(null); }} style={{ display: "block", width: "100%", textAlign: "left", padding: "6px 14px", border: "none", background: "none", cursor: "pointer", fontSize: "13px" }}>Print PO</button>
                                  )}
                                  {(isDraft || isOrdered || isPartiallyReceived) && (
                                    <button onClick={() => { handleEmailPO(po); setPoMoreOpen(null); }} style={{ display: "block", width: "100%", textAlign: "left", padding: "6px 14px", border: "none", background: "none", cursor: "pointer", fontSize: "13px", color: "#1d4ed8" }}>Email PO</button>
                                  )}
                                  {(isDraft || isOrdered || isPartiallyReceived) && (
                                    <button onClick={() => { setSignPoId(po.id); setSignRole("manager"); setPoMoreOpen(null); }} style={{ display: "block", width: "100%", textAlign: "left", padding: "6px 14px", border: "none", background: "none", cursor: "pointer", fontSize: "13px", color: "#15803d" }}>Sign PO</button>
                                  )}
                                  {isDraft && (
                                    <button onClick={() => { handleCancelPO(po); setPoMoreOpen(null); }} style={{ display: "block", width: "100%", textAlign: "left", padding: "6px 14px", border: "none", background: "none", cursor: "pointer", fontSize: "13px", color: "#dc2626" }}>Cancel PO</button>
                                  )}
                                  {isReceived && (
                                    <button onClick={() => { handlePrintPO(po); setPoMoreOpen(null); }} style={{ display: "block", width: "100%", textAlign: "left", padding: "6px 14px", border: "none", background: "none", cursor: "pointer", fontSize: "13px" }}>Print PO</button>
                                  )}
                                </div>
                              )}
                            </span>
                          )}
                        </td>
                      </tr>
                      {isSelected && (
                        <tr>
                          <td colSpan={6} style={{ background: "#f9fafb", padding: "16px", border: "1px solid #c7d2fe" }}>
                            <strong style={{ display: "block", marginBottom: "12px", color: "#1d4ed8" }}>
                              PO Detail — {po.po_number}
                              <span style={{
                                marginLeft: "12px", fontSize: "12px", fontWeight: "bold", padding: "2px 8px", borderRadius: "12px",
                                background: isDraftPO ? "#fef3c7" : po.status === "cancelled" ? "#e5e7eb" : isPartiallyReceived ? "#fef9c3" : "#dcfce7",
                                color: isDraftPO ? "#92400e" : po.status === "cancelled" ? "#6b7280" : isPartiallyReceived ? "#a16207" : "#15803d",
                              }}>{po.status === "partially_received" ? "partial" : po.status}</span>
                            </strong>

                            {isDraftPO && (
                              <form
                                onSubmit={handleAddPOItem}
                                style={{ display: "flex", flexWrap: "wrap", gap: "12px", alignItems: "center", marginBottom: "16px" }}
                              >
                                <select
                                  value={itemProductId}
                                  onChange={(e) => setItemProductId(e.target.value)}
                                  style={{ flex: "2 1 200px", padding: "8px" }}
                                >
                                  <option value="">Select product...</option>
                                  {products.map((p) => (
                                    <option key={p.product_id} value={p.product_id}>
                                      {p.product_name}
                                    </option>
                                  ))}
                                </select>
                                <input
                                  type="number"
                                  min="0"
                                  placeholder="Quantity"
                                  value={itemQuantity}
                                  onChange={(e) => setItemQuantity(e.target.value)}
                                  style={{ flex: "1 1 120px", padding: "8px" }}
                                />
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  placeholder="Unit Cost"
                                  value={itemUnitCost}
                                  onChange={(e) => setItemUnitCost(e.target.value)}
                                  style={{ flex: "1 1 120px", padding: "8px" }}
                                />
                                <button type="submit" style={{ flex: "1 1 120px", padding: "8px" }}>
                                  Add Item
                                </button>
                              </form>
                            )}

                            <table border={1} cellPadding={10} style={{ width: "100%" }}>
                              <thead>
                                <tr>
                                  <th>Product</th>
                                  <th>Ordered</th>
                                  {!isDraftPO && <th>Received</th>}
                                  {!isDraftPO && <th>Remaining</th>}
                                  <th>Unit Cost</th>
                                  <th>Line Total</th>
                                  {isDraftPO && <th></th>}
                                </tr>
                              </thead>
                              <tbody>
                                {poItems.length === 0 ? (
                                  <tr>
                                    <td colSpan={isDraftPO ? 5 : 6}>No items yet</td>
                                  </tr>
                                ) : (
                                  poItems.map((item) => {
                                    const rcvd = item.quantity_received ?? 0;
                                    const rem = item.quantity - rcvd;
                                    return (
                                      <tr key={item.id}>
                                        <td>{productItemMap[item.product_id] ?? "Unknown"}</td>
                                        <td>{item.quantity}</td>
                                        {!isDraftPO && <td>{rcvd}</td>}
                                        {!isDraftPO && (
                                          <td style={{ fontWeight: rem > 0 ? "bold" : "normal", color: rem > 0 ? "#b45309" : "#15803d" }}>
                                            {rem}
                                          </td>
                                        )}
                                        <td>${Number(item.unit_cost).toFixed(2)}</td>
                                        <td>${Number(item.line_total).toFixed(2)}</td>
                                        {isDraftPO && (
                                          <td>
                                            <button
                                              onClick={() => handleRemovePOItem(item.id)}
                                              style={{ padding: "2px 8px", background: "#fee2e2", color: "#dc2626", border: "1px solid #fca5a5", borderRadius: "4px", cursor: "pointer" }}
                                            >
                                              ×
                                            </button>
                                          </td>
                                        )}
                                      </tr>
                                    );
                                  })
                                )}
                              </tbody>
                            </table>

                            {poItems.length > 0 && (
                              <p style={{ textAlign: "right", fontWeight: "bold", marginTop: "8px" }}>
                                Subtotal: ${poItems.reduce((sum, i) => sum + Number(i.line_total), 0).toFixed(2)}
                              </p>
                            )}
                          </td>
                        </tr>
                      )}
                      {receivingPoId === po.id && (
                        <tr>
                          <td colSpan={6} style={{ background: "#f0fdf4", padding: "16px", border: "2px solid #16a34a" }}>
                            <strong style={{ display: "block", marginBottom: "12px", color: "#15803d" }}>
                              Receive Inventory — {po.po_number}
                            </strong>

                            <table border={1} cellPadding={10} style={{ width: "100%", marginBottom: "16px" }}>
                              <thead>
                                <tr>
                                  <th>Product</th>
                                  <th>Ordered</th>
                                  <th>Received</th>
                                  <th>Remaining</th>
                                  <th>Receive Qty</th>
                                  <th>Unit Cost</th>
                                </tr>
                              </thead>
                              <tbody>
                                {receivingItems.length === 0 ? (
                                  <tr>
                                    <td colSpan={6}>No line items on this PO</td>
                                  </tr>
                                ) : (
                                  receivingItems.map((item) => {
                                    const alreadyReceived = item.quantity_received ?? 0;
                                    const remaining = item.quantity - alreadyReceived;
                                    return (
                                      <tr key={item.id} style={{ background: remaining <= 0 ? "#f0fdf4" : undefined }}>
                                        <td>{productItemMap[item.product_id] ?? "Unknown"}</td>
                                        <td>{item.quantity}</td>
                                        <td>{alreadyReceived}</td>
                                        <td style={{ fontWeight: remaining > 0 ? "bold" : "normal", color: remaining > 0 ? "#b45309" : "#15803d" }}>
                                          {remaining}
                                        </td>
                                        <td>
                                          {remaining > 0 ? (
                                            <input
                                              type="number"
                                              min="0"
                                              max={remaining}
                                              value={receiveQtys[item.id] ?? ""}
                                              onChange={(e) =>
                                                setReceiveQtys((prev) => ({ ...prev, [item.id]: e.target.value }))
                                              }
                                              style={{ width: "80px", padding: "4px" }}
                                            />
                                          ) : (
                                            <span style={{ color: "#15803d", fontWeight: "bold" }}>Done</span>
                                          )}
                                        </td>
                                        <td>${Number(item.unit_cost).toFixed(2)}</td>
                                      </tr>
                                    );
                                  })
                                )}
                              </tbody>
                            </table>

                            <button
                              onClick={handleConfirmReceive}
                              disabled={receivingItems.length === 0 || isConfirmingReceive}
                              style={{ padding: "10px 24px", background: "#16a34a", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer" }}
                            >
                              {isConfirmingReceive ? "Processing…" : "Confirm Receive"}
                            </button>
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
          </>
        );
      })()}

      </div>{/* end purchasing */}

      {/* ── INVENTORY TAB (3) ── */}
      <div style={{ display: activeTab === 'inventory' && businessId ? '' : 'none' }}>

      <h2 style={{ marginTop: "40px" }}>Transaction History</h2>

      <div style={{ overflowX: "auto" }}>
        <table border={1} cellPadding={10} style={{ width: "100%" }}>
          <thead>
            <tr>
              <th>Date</th>
              <th>Product</th>
              <th>Type</th>
              <th>Change</th>
              <th>Before</th>
              <th>After</th>
            </tr>
          </thead>
          <tbody>
            {transactions.length === 0 ? (
              <tr>
                <td colSpan={6}>No transactions found</td>
              </tr>
            ) : (
              transactions.map((tx) => (
                <tr key={tx.id}>
                  <td>{new Date(tx.created_at).toLocaleString()}</td>
                  <td>{tx.products?.name}</td>
                  <td>{tx.transaction_type}</td>
                  <td>{tx.quantity_change}</td>
                  <td>{tx.quantity_before}</td>
                  <td>{tx.quantity_after}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      </div>{/* end inventory */}

      {/* ── POS TAB (2) ── */}
      <div style={{ display: activeTab === 'pos' && businessId ? '' : 'none' }}>

      <h2 style={{ marginTop: "40px" }}>Sales History</h2>

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
              <tr><td colSpan={7}>No sales yet</td></tr>
            ) : (
              sales.filter(s => {
                if (s.status === 'open') return false;
                if (salesCashierFilter === "all") return true;
                if (salesCashierFilter === "none") return !s.cashier_id;
                return s.cashier_id === salesCashierFilter;
              }).map((s) => {
                const cashierName = s.cashier_id ? (employees.find(e => e.id === s.cashier_id)?.name ?? s.cashier_id.slice(0, 8)) : "—";
                const rowClass = s.status === "voided" ? "sh-row-voided" : s.status === "returned" ? "sh-row-returned" : "";
                return (
                  <React.Fragment key={s.id}>
                    <tr className={rowClass}>
                      <td style={{ fontFamily: "monospace" }}>{s.id.slice(0, 8)}…</td>
                      <td>${Number(s.total).toFixed(2)}</td>
                      <td>${Number(s.tax).toFixed(2)}</td>
                      <td><span className={`status-pill sp-${s.status}`}>{s.status}</span></td>
                      <td>{cashierName}</td>
                      <td>{new Date(s.created_at).toLocaleString()}</td>
                      <td style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                        <button onClick={() => handlePrintReceipt(s)} className="sh-btn sh-btn-print">Print</button>
                        {s.status === "completed" && (
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
                        <td colSpan={7} style={{ background: "#faf5ff", padding: "16px", border: "1px solid #c4b5fd" }}>
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
                              <div style={{ display: "flex", gap: "12px", alignItems: "center", marginTop: "10px", flexWrap: "wrap" }}>
                                <input
                                  type="text"
                                  placeholder="Reason (optional)"
                                  value={returnReason}
                                  onChange={(e) => setReturnReason(e.target.value)}
                                  style={{ flex: "1 1 200px", padding: "7px" }}
                                />
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

      </div>{/* end pos */}

      {/* ── REPORTS TAB ── */}
      <div style={{ display: activeTab === 'reports' && businessId ? '' : 'none' }}>

      <div className="page-header">
        <h2 className="page-title">Reports</h2>
        <p className="page-subtitle">Review sales, tax, inventory, loyalty, and operational performance</p>
      </div>

      {/* Sales Analytics Dashboard */}
      <h2 style={{ marginTop: "40px" }}>Sales Analytics</h2>

      {(() => {
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

        const cashTotal = periodPayments.filter(p => p.payment_method === 'cash').reduce((sum, p) => sum + Number(p.amount), 0);
        const cardTotal = periodPayments.filter(p => p.payment_method === 'card').reduce((sum, p) => sum + Number(p.amount), 0);
        const otherTotal = periodPayments.filter(p => p.payment_method !== 'cash' && p.payment_method !== 'card').reduce((sum, p) => sum + Number(p.amount), 0);

        // Daily revenue breakdown
        const byDay: Record<string, { revenue: number; count: number }> = {};
        for (const s of periodSales) {
          const d = new Date(s.created_at);
          const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
          if (!byDay[key]) byDay[key] = { revenue: 0, count: 0 };
          byDay[key].revenue += Number(s.total);
          byDay[key].count += 1;
        }
        const dailyRows = Object.entries(byDay).sort((a, b) => b[0].localeCompare(a[0]));

        // Best-selling products
        const productMap = Object.fromEntries(products.map(p => [p.product_id, p.product_name]));
        const byProduct: Record<string, { name: string; units: number; revenue: number }> = {};
        for (const si of periodItems) {
          if (!byProduct[si.product_id]) {
            byProduct[si.product_id] = { name: productMap[si.product_id] ?? si.product_id, units: 0, revenue: 0 };
          }
          byProduct[si.product_id].units += si.quantity;
          byProduct[si.product_id].revenue += si.line_total;
        }
        const productRows = Object.values(byProduct).sort((a, b) => b.units - a.units);

        const rangeLabel = analyticsRange === 'today' ? 'Today' : analyticsRange === '7d' ? 'Last 7 Days' : analyticsRange === '30d' ? 'Last 30 Days' : 'All Time';

        return (
          <>
            {/* Period selector */}
            <div style={{ display: "flex", gap: "8px", marginBottom: "20px", flexWrap: "wrap" }}>
              {(['today', '7d', '30d', 'all'] as const).map(r => {
                const label = r === 'today' ? 'Today' : r === '7d' ? 'Last 7 Days' : r === '30d' ? 'Last 30 Days' : 'All Time';
                const active = analyticsRange === r;
                return (
                  <button
                    key={r}
                    onClick={() => setAnalyticsRange(r)}
                    style={{
                      padding: "7px 18px", cursor: "pointer", borderRadius: "6px", fontWeight: active ? "bold" : "normal",
                      background: active ? "#1d4ed8" : "#fff", color: active ? "#fff" : "#333",
                      border: active ? "1px solid #1d4ed8" : "1px solid #ccc",
                    }}
                  >{label}</button>
                );
              })}
              <span style={{ alignSelf: "center", fontSize: "13px", color: "#888", marginLeft: "8px" }}>
                {txCount} completed sale{txCount !== 1 ? 's' : ''}
              </span>
            </div>

            {/* KPI cards */}
            <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", marginBottom: "28px" }}>
              {[
                { label: "Revenue", value: `$${revenue.toFixed(2)}`, color: "#1d4ed8" },
                { label: "Transactions", value: String(txCount) },
                { label: "Avg Transaction", value: `$${avgTx.toFixed(2)}` },
                { label: "Items Sold", value: String(itemsSold) },
                { label: "Discounts Given", value: `$${discounts.toFixed(2)}`, color: discounts > 0 ? "#b45309" : undefined },
                { label: "Tax Collected", value: `$${taxCollected.toFixed(2)}`, color: taxCollected > 0 ? "#b45309" : undefined },
              ].map(card => (
                <div key={card.label} style={{ border: "1px solid #ccc", borderRadius: "8px", padding: "14px 20px", minWidth: "140px", flex: 1 }}>
                  <div style={{ fontSize: "12px", color: "#888" }}>{card.label}</div>
                  <div style={{ fontSize: "24px", fontWeight: "bold", color: card.color ?? "inherit" }}>{card.value}</div>
                </div>
              ))}
            </div>

            {/* Payment split */}
            <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", marginBottom: "32px" }}>
              {[
                { label: "Cash", value: cashTotal, color: "#15803d" },
                { label: "Card", value: cardTotal, color: "#1d4ed8" },
                ...(otherTotal > 0 ? [{ label: "Other", value: otherTotal, color: "#6b7280" }] : []),
              ].map(p => (
                <div key={p.label} style={{ border: "1px solid #e5e7eb", borderRadius: "8px", padding: "12px 18px", minWidth: "120px" }}>
                  <div style={{ fontSize: "12px", color: "#888" }}>{p.label}</div>
                  <div style={{ fontSize: "20px", fontWeight: "bold", color: p.color }}>${p.value.toFixed(2)}</div>
                  <div style={{ fontSize: "11px", color: "#aaa" }}>
                    {revenue > 0 ? `${((p.value / revenue) * 100).toFixed(0)}%` : '—'}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", gap: "32px", flexWrap: "wrap", alignItems: "flex-start" }}>
              {/* Daily revenue breakdown */}
              <div style={{ flex: 1, minWidth: "280px" }}>
                <h3 style={{ marginBottom: "8px" }}>Daily Revenue — {rangeLabel}</h3>
                {dailyRows.length === 0 ? (
                  <p style={{ color: "#888", fontSize: "14px" }}>No completed sales in this period.</p>
                ) : (
                  <div style={{ overflowX: "auto" }}>
                    <table border={1} cellPadding={10} style={{ width: "100%", fontSize: "14px" }}>
                      <thead>
                        <tr><th>Date</th><th>Revenue</th><th>Transactions</th></tr>
                      </thead>
                      <tbody>
                        {dailyRows.map(([date, row]) => (
                          <tr key={date}>
                            <td>{new Date(date + 'T12:00:00').toLocaleDateString()}</td>
                            <td>${row.revenue.toFixed(2)}</td>
                            <td>{row.count}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr style={{ fontWeight: "bold", background: "#f9fafb" }}>
                          <td>Total</td>
                          <td>${revenue.toFixed(2)}</td>
                          <td>{txCount}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </div>

              {/* Best-selling products */}
              <div style={{ flex: 1, minWidth: "280px" }}>
                <h3 style={{ marginBottom: "8px" }}>Best-Selling Products — {rangeLabel}</h3>
                {productRows.length === 0 ? (
                  <p style={{ color: "#888", fontSize: "14px" }}>No product data for this period.</p>
                ) : (
                  <div style={{ overflowX: "auto" }}>
                    <table border={1} cellPadding={10} style={{ width: "100%", fontSize: "14px" }}>
                      <thead>
                        <tr><th>#</th><th>Product</th><th>Units Sold</th><th>Revenue</th></tr>
                      </thead>
                      <tbody>
                        {productRows.map((row, i) => (
                          <tr key={row.name}>
                            <td>{i + 1}</td>
                            <td>{row.name}</td>
                            <td>{row.units}</td>
                            <td>${row.revenue.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr style={{ fontWeight: "bold", background: "#f9fafb" }}>
                          <td colSpan={2}>Total</td>
                          <td>{productRows.reduce((s, r) => s + r.units, 0)}</td>
                          <td>${productRows.reduce((s, r) => s + r.revenue, 0).toFixed(2)}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </>
        );
      })()}

      </div>{/* end reports */}

      {/* ── EMPLOYEES TAB (2) ── */}
      <div style={{ display: activeTab === 'employees' && businessId ? '' : 'none' }}>

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
        const cashTotal = eodPayments.filter((p) => p.payment_method === "cash").reduce((sum, p) => sum + Number(p.amount), 0);
        const cardTotal = eodPayments.filter((p) => p.payment_method === "card").reduce((sum, p) => sum + Number(p.amount), 0);
        const otherTotal = eodPayments.filter((p) => p.payment_method !== "cash" && p.payment_method !== "card").reduce((sum, p) => sum + Number(p.amount), 0);

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
                      const method = eodPayments.find((p) => p.sale_id === s.id)?.payment_method ?? "—";
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

      {/* ── REPORTS TAB (2) ── */}
      <div style={{ display: activeTab === 'reports' && businessId ? '' : 'none' }}>

      <h2 style={{ marginTop: "40px" }}>Inventory Reports</h2>

      {/* 1. Inventory Valuation Report */}
      <h3 style={{ marginTop: "24px", marginBottom: "8px" }}>Inventory Valuation</h3>
      <div style={{ overflowX: "auto" }}>
        <table border={1} cellPadding={10} style={{ width: "100%" }}>
          <thead>
            <tr>
              <th>Product</th>
              <th>Stock</th>
              <th>Avg Cost</th>
              <th>Inventory Value</th>
            </tr>
          </thead>
          <tbody>
            {products.length === 0 ? (
              <tr><td colSpan={4}>No products found</td></tr>
            ) : (
              products.map((p) => (
                <tr key={p.product_id}>
                  <td>{p.product_name}</td>
                  <td>{p.quantity_on_hand}</td>
                  <td>${p.average_cost.toFixed(2)}</td>
                  <td>${(p.quantity_on_hand * p.average_cost).toFixed(2)}</td>
                </tr>
              ))
            )}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={3} style={{ fontWeight: "bold", textAlign: "right" }}>Total Inventory Value</td>
              <td style={{ fontWeight: "bold" }}>
                ${products.reduce((sum, p) => sum + p.quantity_on_hand * p.average_cost, 0).toFixed(2)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* 2. Low Stock Report */}
      <h3 style={{ marginTop: "32px", marginBottom: "8px" }}>Low Stock Report</h3>
      {(() => {
        const lowStock = products.filter(p => p.quantity_on_hand < p.reorder_level);
        return (
          <div style={{ overflowX: "auto" }}>
            <table border={1} cellPadding={10} style={{ width: "100%" }}>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Current Stock</th>
                  <th>Reorder Level</th>
                  <th>Shortage</th>
                </tr>
              </thead>
              <tbody>
                {lowStock.length === 0 ? (
                  <tr><td colSpan={4}>No low stock items</td></tr>
                ) : (
                  lowStock.map((p) => (
                    <tr key={p.product_id} style={{ backgroundColor: "#ffe5e5" }}>
                      <td>{p.product_name}</td>
                      <td>{p.quantity_on_hand}</td>
                      <td>{p.reorder_level}</td>
                      <td style={{ color: "red", fontWeight: "bold" }}>
                        {p.reorder_level - p.quantity_on_hand}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        );
      })()}

      {/* 3. Product Movement Report */}
      <h3 style={{ marginTop: "32px", marginBottom: "8px" }}>Product Movement</h3>
      <div style={{ marginBottom: "12px", display: "flex", gap: "8px", flexWrap: "wrap" }}>
        {["all", "sale", "receiving", "damaged", "adjustment"].map((f) => (
          <button
            key={f}
            onClick={() => setMovementFilter(f)}
            style={{
              padding: "6px 14px",
              borderRadius: "4px",
              border: "1px solid #ccc",
              cursor: "pointer",
              backgroundColor: movementFilter === f ? "#333" : "#fff",
              color: movementFilter === f ? "#fff" : "#333",
              fontWeight: movementFilter === f ? "bold" : "normal",
            }}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>
      {(() => {
        const filtered = movementFilter === "all"
          ? transactions
          : transactions.filter(tx => tx.transaction_type === movementFilter);
        return (
          <div style={{ overflowX: "auto" }}>
            <table border={1} cellPadding={10} style={{ width: "100%" }}>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Product</th>
                  <th>Type</th>
                  <th>Change</th>
                  <th>Before</th>
                  <th>After</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={6}>No transactions</td></tr>
                ) : (
                  filtered.map((tx) => (
                    <tr key={tx.id}>
                      <td>{new Date(tx.created_at).toLocaleString()}</td>
                      <td>{tx.products?.name}</td>
                      <td>{tx.transaction_type}</td>
                      <td style={{ color: tx.quantity_change < 0 ? "red" : "green", fontWeight: "bold" }}>
                        {tx.quantity_change > 0 ? `+${tx.quantity_change}` : tx.quantity_change}
                      </td>
                      <td>{tx.quantity_before}</td>
                      <td>{tx.quantity_after}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        );
      })()}

      {/* 4. Purchase Order Report */}
      <h3 style={{ marginTop: "32px", marginBottom: "8px" }}>Purchase Order Report</h3>
      {(() => {
        const supplierMap = Object.fromEntries(suppliers.map(s => [s.id, s.name]));
        const totalPO = purchaseOrders.reduce((sum, po) => sum + po.subtotal, 0);
        return (
          <div style={{ overflowX: "auto" }}>
            <table border={1} cellPadding={10} style={{ width: "100%" }}>
              <thead>
                <tr>
                  <th>PO Number</th>
                  <th>Supplier</th>
                  <th>Status</th>
                  <th>Subtotal</th>
                  <th>Created At</th>
                </tr>
              </thead>
              <tbody>
                {purchaseOrders.length === 0 ? (
                  <tr><td colSpan={5}>No purchase orders found</td></tr>
                ) : (
                  purchaseOrders.map((po) => (
                    <tr key={po.id}>
                      <td>{po.po_number}</td>
                      <td>{supplierMap[po.supplier_id] ?? po.supplier_id}</td>
                      <td>{po.status}</td>
                      <td>${po.subtotal.toFixed(2)}</td>
                      <td>{new Date(po.created_at).toLocaleString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={3} style={{ fontWeight: "bold", textAlign: "right" }}>Total PO Value</td>
                  <td style={{ fontWeight: "bold" }}>${totalPO.toFixed(2)}</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        );
      })()}

      {/* 5. Profit Reporting v1 */}
      <h3 style={{ marginTop: "32px", marginBottom: "8px" }}>Profit Report</h3>
      {(() => {
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const profitRangeStart: Date | null =
          analyticsRange === 'today' ? startOfDay :
          analyticsRange === '7d'   ? new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) :
          analyticsRange === '30d'  ? new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) :
          null;

        const eligibleSales = sales.filter(s =>
          (s.status === 'completed' || s.status === 'returned') &&
          (profitRangeStart === null || new Date(s.created_at) >= profitRangeStart)
        );
        const eligibleSaleIds = new Set(eligibleSales.map(s => s.id));

        const periodItems = saleItems.filter(si => eligibleSaleIds.has(si.sale_id));

        const returnMap: Record<string, number> = {};
        for (const ri of allReturnItems) {
          if (!eligibleSaleIds.has(ri.sale_id)) continue;
          const key = `${ri.sale_id}::${ri.product_id}`;
          returnMap[key] = (returnMap[key] ?? 0) + ri.quantity_returned;
        }

        const productMap = Object.fromEntries(products.map(p => [p.product_id, p]));

        let grossSales = 0;
        let totalDiscounts = 0;
        let totalReturns = 0;
        let totalCogs = 0;

        const byProduct: Record<string, { name: string; soldUnits: number; returnedUnits: number; grossRev: number; returnedRev: number; cogs: number }> = {};

        for (const si of periodItems) {
          const product = productMap[si.product_id];
          const avgCost = product?.average_cost ?? 0;
          const unitPrice = si.unit_price;
          const returnKey = `${si.sale_id}::${si.product_id}`;
          const returnedQty = returnMap[returnKey] ?? 0;
          const netQty = si.quantity - returnedQty;
          const returnedRev = returnedQty * unitPrice;

          grossSales += si.line_total;
          totalReturns += returnedRev;
          totalCogs += netQty * avgCost;

          if (!byProduct[si.product_id]) {
            byProduct[si.product_id] = { name: product?.product_name ?? si.product_id, soldUnits: 0, returnedUnits: 0, grossRev: 0, returnedRev: 0, cogs: 0 };
          }
          byProduct[si.product_id].soldUnits += si.quantity;
          byProduct[si.product_id].returnedUnits += returnedQty;
          byProduct[si.product_id].grossRev += si.line_total;
          byProduct[si.product_id].returnedRev += returnedRev;
          byProduct[si.product_id].cogs += netQty * avgCost;
        }

        for (const s of eligibleSales) {
          totalDiscounts += Number(s.discount_amount);
        }

        const netSales = grossSales - totalDiscounts - totalReturns;
        const grossProfit = netSales - totalCogs;
        const grossMargin = netSales > 0 ? (grossProfit / netSales) * 100 : 0;

        const productRows = Object.entries(byProduct).map(([pid, row]) => {
          const netRev = row.grossRev - row.returnedRev;
          const gp = netRev - row.cogs;
          const margin = netRev > 0 ? (gp / netRev) * 100 : 0;
          return { pid, ...row, netRev, gp, margin };
        });
        const topProfit = [...productRows].sort((a, b) => b.gp - a.gp).slice(0, 10);
        const lowestMargin = [...productRows].filter(r => r.netRev > 0).sort((a, b) => a.margin - b.margin).slice(0, 10);

        const rangeLabel = analyticsRange === 'today' ? 'Today' : analyticsRange === '7d' ? 'Last 7 Days' : analyticsRange === '30d' ? 'Last 30 Days' : 'All Time';

        return (
          <>
            <div style={{ display: "flex", gap: "8px", marginBottom: "20px", flexWrap: "wrap" }}>
              {(['today', '7d', '30d', 'all'] as const).map(r => {
                const label = r === 'today' ? 'Today' : r === '7d' ? 'Last 7 Days' : r === '30d' ? 'Last 30 Days' : 'All Time';
                const active = analyticsRange === r;
                return (
                  <button
                    key={r}
                    onClick={() => setAnalyticsRange(r)}
                    style={{
                      padding: "7px 18px", cursor: "pointer", borderRadius: "6px", fontWeight: active ? "bold" : "normal",
                      background: active ? "#1d4ed8" : "#fff", color: active ? "#fff" : "#333",
                      border: active ? "1px solid #1d4ed8" : "1px solid #ccc",
                    }}
                  >{label}</button>
                );
              })}
            </div>

            {/* P&L Summary Cards */}
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "28px" }}>
              {[
                { label: "Gross Sales", value: `$${grossSales.toFixed(2)}`, color: "#1d4ed8" },
                { label: "Discounts", value: `−$${totalDiscounts.toFixed(2)}`, color: totalDiscounts > 0 ? "#b45309" : "#888" },
                { label: "Returns", value: `−$${totalReturns.toFixed(2)}`, color: totalReturns > 0 ? "#dc2626" : "#888" },
                { label: "Net Sales", value: `$${netSales.toFixed(2)}`, color: "#0f172a" },
                { label: "COGS", value: `$${totalCogs.toFixed(2)}`, color: "#6b7280" },
                { label: "Gross Profit", value: `$${grossProfit.toFixed(2)}`, color: grossProfit >= 0 ? "#15803d" : "#dc2626" },
                { label: "Gross Margin", value: `${grossMargin.toFixed(1)}%`, color: grossMargin >= 20 ? "#15803d" : grossMargin >= 0 ? "#b45309" : "#dc2626" },
              ].map(card => (
                <div key={card.label} style={{ border: "1px solid #e5e7eb", borderRadius: "8px", padding: "14px 18px", minWidth: "130px", flex: 1 }}>
                  <div style={{ fontSize: "11px", color: "#888", textTransform: "uppercase", letterSpacing: "0.5px" }}>{card.label}</div>
                  <div style={{ fontSize: "22px", fontWeight: "bold", color: card.color, marginTop: "4px" }}>{card.value}</div>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", gap: "32px", flexWrap: "wrap", alignItems: "flex-start" }}>
              {/* Top Profit Products */}
              <div style={{ flex: 1, minWidth: "320px" }}>
                <h4 style={{ marginBottom: "8px" }}>Top Profit Products — {rangeLabel}</h4>
                {topProfit.length === 0 ? (
                  <p style={{ color: "#888", fontSize: "14px" }}>No sales data for this period.</p>
                ) : (
                  <div style={{ overflowX: "auto" }}>
                    <table border={1} cellPadding={8} style={{ width: "100%", fontSize: "13px" }}>
                      <thead>
                        <tr><th>#</th><th>Product</th><th>Net Units</th><th>Net Revenue</th><th>COGS</th><th>Profit</th><th>Margin</th></tr>
                      </thead>
                      <tbody>
                        {topProfit.map((row, i) => (
                          <tr key={row.pid}>
                            <td>{i + 1}</td>
                            <td>{row.name}</td>
                            <td>{row.soldUnits - row.returnedUnits}</td>
                            <td>${row.netRev.toFixed(2)}</td>
                            <td>${row.cogs.toFixed(2)}</td>
                            <td style={{ color: row.gp >= 0 ? "#15803d" : "#dc2626", fontWeight: "bold" }}>${row.gp.toFixed(2)}</td>
                            <td>{row.margin.toFixed(1)}%</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr style={{ fontWeight: "bold", background: "#f9fafb" }}>
                          <td colSpan={3}>Top 10 Total</td>
                          <td>${topProfit.reduce((s, r) => s + r.netRev, 0).toFixed(2)}</td>
                          <td>${topProfit.reduce((s, r) => s + r.cogs, 0).toFixed(2)}</td>
                          <td style={{ color: "#15803d" }}>${topProfit.reduce((s, r) => s + r.gp, 0).toFixed(2)}</td>
                          <td></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </div>

              {/* Lowest Margin Products */}
              <div style={{ flex: 1, minWidth: "320px" }}>
                <h4 style={{ marginBottom: "8px" }}>Lowest Margin Products — {rangeLabel}</h4>
                {lowestMargin.length === 0 ? (
                  <p style={{ color: "#888", fontSize: "14px" }}>No sales data for this period.</p>
                ) : (
                  <div style={{ overflowX: "auto" }}>
                    <table border={1} cellPadding={8} style={{ width: "100%", fontSize: "13px" }}>
                      <thead>
                        <tr><th>#</th><th>Product</th><th>Net Units</th><th>Net Revenue</th><th>COGS</th><th>Profit</th><th>Margin</th></tr>
                      </thead>
                      <tbody>
                        {lowestMargin.map((row, i) => (
                          <tr key={row.pid} style={{ background: row.margin < 20 ? "#fef2f2" : undefined }}>
                            <td>{i + 1}</td>
                            <td>{row.name}</td>
                            <td>{row.soldUnits - row.returnedUnits}</td>
                            <td>${row.netRev.toFixed(2)}</td>
                            <td>${row.cogs.toFixed(2)}</td>
                            <td style={{ color: row.gp >= 0 ? "#15803d" : "#dc2626", fontWeight: "bold" }}>${row.gp.toFixed(2)}</td>
                            <td style={{ color: row.margin < 20 ? "#dc2626" : "#b45309", fontWeight: "bold" }}>{row.margin.toFixed(1)}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </>
        );
      })()}

      </div>{/* end reports */}

      {/* ── INVENTORY TAB (4) ── */}
      <div style={{ display: activeTab === 'inventory' && businessId ? '' : 'none' }}>

      {/* Stock Take / Inventory Count */}
      <h2 style={{ marginTop: "40px" }}>Stock Take / Inventory Count</h2>
      {!stockCountActive ? (
        <div style={{ marginBottom: "24px" }}>
          <p style={{ color: "#555", marginBottom: "12px", fontSize: "14px" }}>
            Count all products on the shelf and correct any discrepancies between
            the system quantity and the physical count.
          </p>
          <button
            onClick={handleStartCount}
            disabled={products.length === 0}
            style={{ padding: "9px 22px", fontWeight: "bold", cursor: "pointer", background: "#1d4ed8", color: "#fff", border: "none", borderRadius: "6px" }}
          >
            Start Stock Count ({products.length} products)
          </button>
        </div>
      ) : (
        <div style={{ marginBottom: "32px" }}>
          <div style={{ display: "flex", gap: "12px", alignItems: "center", marginBottom: "12px", flexWrap: "wrap" }}>
            <strong>Active Count — {stockCountLines.length} products</strong>
            <span style={{ fontSize: "13px", color: "#666" }}>
              Variances: {stockCountLines.filter(l => l.counted_qty !== l.system_qty).length}
            </span>
            <button
              onClick={() => { setStockCountActive(false); setStockCountLines([]); }}
              style={{ padding: "5px 14px", cursor: "pointer", marginLeft: "auto" }}
            >
              Cancel
            </button>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table border={1} cellPadding={8} style={{ width: "100%", fontSize: "13px" }}>
              <thead>
                <tr style={{ background: "#f3f4f6" }}>
                  <th style={{ textAlign: "left" }}>Product</th>
                  <th>SKU</th>
                  <th>Barcode</th>
                  <th>System Qty</th>
                  <th>Counted Qty</th>
                  <th>Variance</th>
                </tr>
              </thead>
              <tbody>
                {stockCountLines.map((line, idx) => {
                  const variance = line.counted_qty - line.system_qty;
                  return (
                    <tr key={line.product_id} style={{ background: variance !== 0 ? "#fefce8" : "inherit" }}>
                      <td>{line.product_name}</td>
                      <td style={{ color: "#888" }}>{line.sku ?? "—"}</td>
                      <td style={{ color: "#888" }}>{line.barcode ?? "—"}</td>
                      <td style={{ textAlign: "center" }}>{line.system_qty}</td>
                      <td style={{ textAlign: "center" }}>
                        <input
                          type="number"
                          min={0}
                          value={line.counted_qty}
                          onChange={(e) => {
                            const val = Math.max(0, Number(e.target.value));
                            setStockCountLines(prev => prev.map((l, i) => i === idx ? { ...l, counted_qty: val } : l));
                          }}
                          style={{ width: "70px", padding: "4px 6px", textAlign: "center" }}
                        />
                      </td>
                      <td style={{
                        textAlign: "center",
                        fontWeight: variance !== 0 ? "bold" : "normal",
                        color: variance > 0 ? "#16a34a" : variance < 0 ? "#dc2626" : "#888",
                      }}>
                        {variance > 0 ? `+${variance}` : variance}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div style={{ display: "flex", gap: "12px", alignItems: "center", marginTop: "14px", flexWrap: "wrap" }}>
            <button
              onClick={handleConfirmCount}
              disabled={stockCountLoading}
              style={{
                padding: "9px 24px", fontWeight: "bold", cursor: stockCountLoading ? "not-allowed" : "pointer",
                background: "#1d4ed8", color: "#fff", border: "none", borderRadius: "6px",
              }}
            >
              {stockCountLoading ? "Saving…" : `Confirm Count (${stockCountLines.filter(l => l.counted_qty !== l.system_qty).length} variance(s))`}
            </button>
            <button
              onClick={() => { setStockCountActive(false); setStockCountLines([]); }}
              style={{ padding: "9px 18px", cursor: "pointer", borderRadius: "6px" }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Past Stock Counts */}
      <h3 style={{ marginTop: "32px", marginBottom: "12px" }}>Past Stock Counts</h3>
      {stockCounts.length === 0 ? (
        <p style={{ color: "#888", fontSize: "14px", marginBottom: "24px" }}>No stock counts recorded yet.</p>
      ) : (
        <div style={{ overflowX: "auto", marginBottom: "32px" }}>
          <table border={1} cellPadding={8} style={{ width: "100%", fontSize: "13px" }}>
            <thead>
              <tr style={{ background: "#f3f4f6" }}>
                <th style={{ textAlign: "left" }}>Date</th>
                <th style={{ textAlign: "left" }}>Notes</th>
                <th style={{ textAlign: "center" }}>Status</th>
                <th style={{ textAlign: "center" }}>Items Counted</th>
                <th style={{ textAlign: "center" }}>Variances</th>
              </tr>
            </thead>
            <tbody>
              {stockCounts.map((sc) => {
                const isExpanded = expandedCountId === sc.id;
                const items = countItemsMap[sc.id] ?? [];
                return (
                  <React.Fragment key={sc.id}>
                    <tr
                      style={{ cursor: "pointer", background: isExpanded ? "#eff6ff" : "inherit" }}
                      onClick={() => {
                        if (isExpanded) {
                          setExpandedCountId(null);
                        } else {
                          setExpandedCountId(sc.id);
                          loadCountItems(sc.id);
                        }
                      }}
                    >
                      <td>{new Date(sc.completed_at).toLocaleString()}</td>
                      <td style={{ color: "#555" }}>{sc.notes ?? "—"}</td>
                      <td style={{ textAlign: "center" }}>
                        <span style={{
                          fontSize: "12px", fontWeight: "bold", padding: "2px 8px", borderRadius: "12px",
                          background: "#dcfce7", color: "#15803d",
                        }}>{sc.status}</span>
                      </td>
                      <td style={{ textAlign: "center", color: "#555" }}>
                        {countItemsMap[sc.id] ? countItemsMap[sc.id].length : "—"}
                      </td>
                      <td style={{ textAlign: "center", color: "#555" }}>
                        {countItemsMap[sc.id]
                          ? countItemsMap[sc.id].filter(i => i.variance !== 0).length
                          : "—"}
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr>
                        <td colSpan={5} style={{ background: "#f9fafb", padding: "16px" }}>
                          {items.length === 0 ? (
                            <span style={{ color: "#888", fontSize: "13px" }}>Loading…</span>
                          ) : (
                            <table border={1} cellPadding={6} style={{ width: "100%", fontSize: "12px" }}>
                              <thead>
                                <tr style={{ background: "#e5e7eb" }}>
                                  <th style={{ textAlign: "left" }}>Product</th>
                                  <th style={{ textAlign: "left" }}>SKU</th>
                                  <th style={{ textAlign: "center" }}>System Qty</th>
                                  <th style={{ textAlign: "center" }}>Counted Qty</th>
                                  <th style={{ textAlign: "center" }}>Variance</th>
                                </tr>
                              </thead>
                              <tbody>
                                {items.map((item) => (
                                  <tr key={item.id}>
                                    <td>{item.products?.name ?? "—"}</td>
                                    <td style={{ color: "#888" }}>{item.products?.sku ?? "—"}</td>
                                    <td style={{ textAlign: "center" }}>{item.system_qty}</td>
                                    <td style={{ textAlign: "center" }}>{item.counted_qty}</td>
                                    <td style={{
                                      textAlign: "center",
                                      fontWeight: item.variance !== 0 ? "bold" : "normal",
                                      color: item.variance > 0 ? "#16a34a" : item.variance < 0 ? "#dc2626" : "#9ca3af",
                                    }}>
                                      {item.variance > 0 ? `+${item.variance}` : item.variance}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          )}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      </div>{/* end inventory */}

      {/* ── EMPLOYEES TAB ── */}
      <div style={{ display: activeTab === 'employees' && businessId ? '' : 'none' }}>

      <div className="page-header">
        <h2 className="page-title">Staff</h2>
        <p className="page-subtitle">Manage cashiers and cash drawer operations &mdash; staff accounts and permissions coming in v2</p>
      </div>

      <form onSubmit={handleAddEmployee} style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap", marginBottom: "20px" }}>
        <input
          type="text"
          placeholder="Employee name *"
          value={newEmpName}
          onChange={(e) => setNewEmpName(e.target.value)}
          style={{ padding: "8px", flex: "1 1 180px" }}
          required
        />
        <select
          value={newEmpRole}
          onChange={(e) => setNewEmpRole(e.target.value as "cashier" | "manager")}
          style={{ padding: "8px" }}
        >
          <option value="cashier">Cashier</option>
          <option value="manager">Manager</option>
        </select>
        <button
          type="submit"
          disabled={!newEmpName.trim()}
          style={{ padding: "8px 20px", background: "#1d4ed8", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "bold" }}
        >
          Add Employee
        </button>
      </form>

      <div style={{ overflowX: "auto", marginBottom: "40px" }}>
        <table border={1} cellPadding={10} style={{ width: "100%" }}>
          <thead>
            <tr style={{ background: "#f3f4f6" }}>
              <th style={{ textAlign: "left" }}>Name</th>
              <th>Role</th>
              <th>Status</th>
              <th>Added</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {employees.length === 0 ? (
              <tr><td colSpan={5} style={{ color: "#888" }}>No employees yet</td></tr>
            ) : (
              employees.map(emp => {
                const rowStyle = emp.status === "inactive" ? { backgroundColor: "#f5f5f5", color: "#999" } : {};
                return (
                  <tr key={emp.id} style={rowStyle}>
                    <td style={{ fontWeight: "bold" }}>{emp.name}</td>
                    <td>
                      <span style={{
                        padding: "2px 8px", borderRadius: "12px", fontSize: "12px",
                        background: emp.role === "manager" ? "#fef3c7" : "#dbeafe",
                        color: emp.role === "manager" ? "#92400e" : "#1e40af",
                      }}>{emp.role}</span>
                    </td>
                    <td>
                      <span style={{
                        padding: "2px 8px", borderRadius: "12px", fontSize: "12px",
                        background: emp.status === "active" ? "#dcfce7" : "#f3f4f6",
                        color: emp.status === "active" ? "#15803d" : "#6b7280",
                      }}>{emp.status}</span>
                    </td>
                    <td style={{ color: "#888", fontSize: "13px" }}>{new Date(emp.created_at).toLocaleDateString()}</td>
                    <td>
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
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      </div>{/* end employees */}

      {/* ── SETTINGS TAB ── */}
      <div style={{ display: activeTab === 'settings' && businessId ? '' : 'none' }}>

      <div className="page-header">
        <h2 className="page-title">Settings</h2>
        <p className="page-subtitle">Configure business profile, tax, receipt, and store preferences</p>
      </div>

      {!editingBusiness ? (
        <div style={{ background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: "8px", padding: "20px", maxWidth: "480px", marginBottom: "16px" }}>
          <p style={{ margin: "0 0 8px" }}><strong>Name:</strong> {businessName || "—"}</p>
          <p style={{ margin: "0 0 8px" }}><strong>Phone:</strong> {businessPhone || "—"}</p>
          <p style={{ margin: "0 0 8px" }}><strong>Email:</strong> {businessEmail || "—"}</p>
          <p style={{ margin: "0 0 8px" }}><strong>Address:</strong> {businessAddress || "—"}</p>
          <p style={{ margin: "0 0 16px" }}><strong>Tax Rate:</strong> {businessTaxRate}%</p>
          <button
            onClick={() => {
              setEditBizName(businessName);
              setEditBizPhone(businessPhone);
              setEditBizEmail(businessEmail);
              setEditBizAddress(businessAddress);
              setEditBizTaxRate(String(businessTaxRate));
              setEditingBusiness(true);
            }}
            style={{ padding: "8px 20px", cursor: "pointer", background: "#1d4ed8", color: "#fff", border: "none", borderRadius: "6px", fontWeight: 600 }}
          >Edit Business Profile</button>
        </div>
      ) : (
        <form
          onSubmit={handleSaveBusiness}
          style={{ maxWidth: "480px", display: "flex", flexDirection: "column", gap: "10px", marginBottom: "16px" }}
        >
          <strong>Edit Business Profile</strong>
          <input
            type="text"
            placeholder="Business name *"
            value={editBizName}
            onChange={(e) => setEditBizName(e.target.value)}
            required
            style={{ padding: "8px" }}
          />
          <input
            type="text"
            placeholder="Phone"
            value={editBizPhone}
            onChange={(e) => setEditBizPhone(e.target.value)}
            style={{ padding: "8px" }}
          />
          <input
            type="email"
            placeholder="Email"
            value={editBizEmail}
            onChange={(e) => setEditBizEmail(e.target.value)}
            style={{ padding: "8px" }}
          />
          <input
            type="text"
            placeholder="Address"
            value={editBizAddress}
            onChange={(e) => setEditBizAddress(e.target.value)}
            style={{ padding: "8px" }}
          />
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <input
              type="number"
              min="0"
              max="100"
              step="0.01"
              placeholder="Tax rate %"
              value={editBizTaxRate}
              onChange={(e) => setEditBizTaxRate(e.target.value)}
              style={{ padding: "8px", width: "150px" }}
            />
            <span style={{ fontSize: "13px", color: "#64748b" }}>% Sales tax (0 = no tax)</span>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <button type="submit" style={{ padding: "8px 20px", cursor: "pointer", background: "#1d4ed8", color: "#fff", border: "none", borderRadius: "4px" }}>Save</button>
            <button type="button" onClick={() => setEditingBusiness(false)} style={{ padding: "8px 20px", cursor: "pointer" }}>Cancel</button>
          </div>
        </form>
      )}

      <h3 style={{ marginTop: "32px", marginBottom: "12px" }}>Receipt Settings</h3>
      <div style={{ background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: "8px", padding: "20px", maxWidth: "480px", marginBottom: "16px" }}>
        <p style={{ margin: "0 0 8px" }}><strong>Business Name:</strong> {businessName || "—"}</p>
        <p style={{ margin: "0 0 8px" }}><strong>Phone:</strong> {businessPhone || "—"}</p>
        <p style={{ margin: "0 0 8px" }}><strong>Address:</strong> {businessAddress || "—"}</p>
        <p style={{ margin: "0 0 16px" }}><strong>Tax Rate:</strong> {businessTaxRate}%</p>
        <p style={{ margin: 0, fontSize: "13px", color: "#64748b", fontStyle: "italic" }}>Receipt logo and printer setup coming in v2</p>
      </div>

      </div>{/* end settings */}

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

      {printPo && (() => {
        const productMap = Object.fromEntries(products.map((p) => [p.product_id, p.product_name]));
        const grandTotal = printPo.items.reduce((sum, i) => sum + Number(i.line_total), 0);
        return (
          <>
            <style>{`
              @media print {
                @page { margin: 0.5in; }
                .app-root > * { display: none !important; }
                #po-print-modal {
                  display: block !important;
                  position: static !important;
                  background: none !important;
                  align-items: stretch !important;
                  justify-content: flex-start !important;
                  height: auto !important;
                  inset: auto !important;
                }
                #po-print-content {
                  box-shadow: none !important;
                  margin: 0 !important;
                  padding: 0 !important;
                  width: 100% !important;
                  max-width: 100% !important;
                  max-height: none !important;
                  overflow: visible !important;
                  font-size: 12pt !important;
                }
                #po-print-content table { page-break-inside: avoid; break-inside: avoid; }
                #po-print-actions { display: none !important; }
              }
            `}</style>
            <div
              id="po-print-modal"
              style={{
                position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
                display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
              }}
              onClick={(e) => { if (e.target === e.currentTarget) setPrintPo(null); }}
            >
              <div
                id="po-print-content"
                style={{
                  background: "#fff", padding: "36px 40px", width: "760px", maxHeight: "90vh", overflowY: "auto",
                  fontFamily: "'Segoe UI', Arial, sans-serif", fontSize: "14px", lineHeight: "1.4",
                  boxShadow: "0 4px 24px rgba(0,0,0,0.2)", color: "#1e293b",
                }}
              >
                {/* Header */}
                {(() => {
                  const statusLabel = printPo.po.status === "ordered" ? "Awaiting Delivery" : printPo.po.status === "received" ? "Received" : printPo.po.status === "partially_received" ? "Partially Received" : "Draft";
                  const statusBg = printPo.po.status === "ordered" ? "#dbeafe" : printPo.po.status === "received" ? "#dcfce7" : printPo.po.status === "partially_received" ? "#fef9c3" : "#f1f5f9";
                  const statusColor = printPo.po.status === "ordered" ? "#1e40af" : printPo.po.status === "received" ? "#15803d" : printPo.po.status === "partially_received" ? "#a16207" : "#475569";
                  const sigs = getPoSignatures(printPo.po.id);
                  return (
                    <>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", paddingBottom: "12px", borderBottom: "3px solid #0f172a" }}>
                      <div style={{ display: "flex", alignItems: "flex-start", gap: "16px" }}>
                        <img src="/logo.png" alt="" style={{ height: "72px", width: "auto", maxWidth: "72px", objectFit: "contain", marginTop: "2px" }} onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
                        <div>
                          {businessName && <div style={{ fontWeight: 800, fontSize: "24px", color: "#0f172a", letterSpacing: "-0.01em" }}>{businessName}</div>}
                          {businessAddress && <div style={{ fontSize: "13px", color: "#475569", lineHeight: "1.5" }}>{businessAddress}</div>}
                          {businessPhone && <div style={{ fontSize: "13px", color: "#475569" }}>{fmtPhone(businessPhone)}</div>}
                          {businessEmail && <div style={{ fontSize: "13px", color: "#475569" }}>{businessEmail}</div>}
                        </div>
                      </div>
                      <div style={{ textAlign: "right", minWidth: "220px" }}>
                        <div style={{ fontSize: "22px", fontWeight: 800, color: "#0f172a", letterSpacing: "0.03em" }}>PURCHASE ORDER</div>
                        <div style={{ fontSize: "17px", fontWeight: 700, color: "#334155", marginTop: "2px", fontFamily: "monospace" }}>{printPo.po.po_number}</div>
                        <div style={{ fontSize: "13px", color: "#64748b", marginTop: "2px" }}>{new Date(printPo.po.created_at).toLocaleDateString()}</div>
                      </div>
                    </div>

                    {/* Supplier + Details row */}
                    <div style={{ display: "flex", gap: "12px", margin: "14px 0 10px" }}>
                      <div style={{ flex: 2, border: "1px solid #cbd5e1", borderRadius: "5px", padding: "10px 14px" }}>
                        <div style={{ fontSize: "10px", textTransform: "uppercase", fontWeight: 700, color: "#94a3b8", letterSpacing: "0.08em", marginBottom: "3px" }}>Supplier</div>
                        <div style={{ fontWeight: 700, fontSize: "16px", marginBottom: "2px" }}>{printPo.supplier?.name ?? "Unknown"}</div>
                        <div style={{ fontSize: "12px", color: printPo.supplier?.contact_name ? "#475569" : "#94a3b8" }}>
                          Contact: {printPo.supplier?.contact_name || "_______________"}&emsp;
                          Phone: {printPo.supplier?.phone ? fmtPhone(printPo.supplier.phone) : "_______________"}
                        </div>
                        <div style={{ fontSize: "12px", color: printPo.supplier?.email ? "#475569" : "#94a3b8", marginTop: "1px" }}>
                          Email: {printPo.supplier?.email || "_______________"}
                        </div>
                      </div>
                      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "8px" }}>
                        <div style={{ border: "1px solid #cbd5e1", borderRadius: "5px", padding: "8px 12px", flex: 1 }}>
                          <div style={{ fontSize: "10px", textTransform: "uppercase", fontWeight: 700, color: "#94a3b8", letterSpacing: "0.08em", marginBottom: "2px" }}>Status</div>
                          <span style={{ fontSize: "13px", fontWeight: 700, padding: "2px 10px", borderRadius: "10px", background: statusBg, color: statusColor }}>{statusLabel}</span>
                        </div>
                        <div style={{ border: "1px solid #cbd5e1", borderRadius: "5px", padding: "8px 12px", flex: 1 }}>
                          <div style={{ fontSize: "10px", textTransform: "uppercase", fontWeight: 700, color: "#94a3b8", letterSpacing: "0.08em", marginBottom: "2px" }}>Expected Delivery</div>
                          <div style={{ fontSize: "13px", color: "#94a3b8" }}>_______________</div>
                        </div>
                        <div style={{ border: "1px solid #cbd5e1", borderRadius: "5px", padding: "8px 12px", flex: 1 }}>
                          <div style={{ fontSize: "10px", textTransform: "uppercase", fontWeight: 700, color: "#94a3b8", letterSpacing: "0.08em", marginBottom: "2px" }}>Prepared By</div>
                          <div style={{ fontSize: "13px", color: "#94a3b8" }}>_______________</div>
                        </div>
                      </div>
                    </div>

                    {printPo.po.notes && (
                      <div style={{ fontSize: "13px", color: "#475569", marginBottom: "10px", padding: "8px 12px", background: "#f8fafc", borderRadius: "4px", borderLeft: "3px solid #94a3b8" }}>
                        <strong style={{ color: "#334155" }}>Notes:</strong> {printPo.po.notes}
                      </div>
                    )}

                    {/* Items table */}
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", border: "1px solid #94a3b8" }}>
                      <thead>
                        <tr style={{ background: "#1e293b" }}>
                          <th style={{ textAlign: "left", padding: "9px 12px", fontWeight: 700, fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.06em", color: "#fff" }}>Product</th>
                          <th style={{ textAlign: "center", padding: "9px 12px", fontWeight: 700, fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.06em", color: "#fff", width: "70px" }}>Qty</th>
                          <th style={{ textAlign: "right", padding: "9px 12px", fontWeight: 700, fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.06em", color: "#fff", width: "100px" }}>Unit Cost</th>
                          <th style={{ textAlign: "right", padding: "9px 12px", fontWeight: 700, fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.06em", color: "#fff", width: "100px" }}>Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {printPo.items.map((item, i) => (
                          <tr key={item.id} style={{ borderBottom: "1px solid #e2e8f0", background: i % 2 === 0 ? "#fff" : "#f8fafc" }}>
                            <td style={{ padding: "10px 12px" }}>{productMap[item.product_id] ?? "Unknown"}</td>
                            <td style={{ padding: "10px 12px", textAlign: "center" }}>{item.quantity}</td>
                            <td style={{ padding: "10px 12px", textAlign: "right" }}>${Number(item.unit_cost).toFixed(2)}</td>
                            <td style={{ padding: "10px 12px", textAlign: "right" }}>${Number(item.line_total).toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {/* Grand total box */}
                    <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "0" }}>
                      <div style={{ background: "#f1f5f9", border: "1px solid #94a3b8", borderTop: "none", borderRadius: "0 0 5px 5px", padding: "10px 24px", minWidth: "240px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: "14px", fontWeight: 600, color: "#475569" }}>Grand Total</span>
                        <span style={{ fontSize: "20px", fontWeight: 800, color: "#0f172a" }}>${grandTotal.toFixed(2)}</span>
                      </div>
                    </div>

                    {/* Signature blocks */}
                    <div style={{ display: "flex", gap: "32px", marginTop: "24px" }}>
                      <div style={{ flex: 1, border: "1px solid #e2e8f0", borderRadius: "5px", padding: "10px 14px" }}>
                        <div style={{ fontSize: "11px", textTransform: "uppercase", fontWeight: 700, color: "#94a3b8", letterSpacing: "0.06em", marginBottom: "6px" }}>Manager Approval</div>
                        {sigs.manager ? (
                          <>
                            <img src={sigs.manager.dataUrl} alt="Manager signature" style={{ height: "44px", width: "auto", maxWidth: "100%", objectFit: "contain", display: "block" }} />
                            <div style={{ fontSize: "11px", color: "#475569", marginTop: "4px" }}>{new Date(sigs.manager.signedAt).toLocaleString()}</div>
                          </>
                        ) : (
                          <div style={{ borderBottom: "1px solid #334155", height: "36px", marginBottom: "4px" }} />
                        )}
                        <div style={{ fontSize: "11px", color: "#94a3b8", borderTop: "1px solid #e2e8f0", paddingTop: "4px", marginTop: "4px" }}>Name: _______________&emsp;Date: ________</div>
                      </div>
                      <div style={{ flex: 1, border: "1px solid #e2e8f0", borderRadius: "5px", padding: "10px 14px" }}>
                        <div style={{ fontSize: "11px", textTransform: "uppercase", fontWeight: 700, color: "#94a3b8", letterSpacing: "0.06em", marginBottom: "6px" }}>Supplier Acceptance</div>
                        {sigs.supplier ? (
                          <>
                            <img src={sigs.supplier.dataUrl} alt="Supplier signature" style={{ height: "44px", width: "auto", maxWidth: "100%", objectFit: "contain", display: "block" }} />
                            <div style={{ fontSize: "11px", color: "#475569", marginTop: "4px" }}>{new Date(sigs.supplier.signedAt).toLocaleString()}</div>
                          </>
                        ) : (
                          <div style={{ borderBottom: "1px solid #334155", height: "36px", marginBottom: "4px" }} />
                        )}
                        <div style={{ fontSize: "11px", color: "#94a3b8", borderTop: "1px solid #e2e8f0", paddingTop: "4px", marginTop: "4px" }}>Name: _______________&emsp;Date: ________</div>
                      </div>
                    </div>

                    {/* Footer */}
                    <div style={{ textAlign: "center", marginTop: "18px", paddingTop: "8px", borderTop: "1px solid #e2e8f0", fontSize: "11px", color: "#94a3b8" }}>
                      Generated by Wegn-Store&emsp;|&emsp;Generated: {new Date().toLocaleString()}
                    </div>
                    </>
                  );
                })()}

                <div id="po-print-actions" style={{ display: "flex", gap: "8px", justifyContent: "center", marginTop: "16px" }}>
                  <button onClick={() => window.print()} style={{ padding: "8px 20px", cursor: "pointer", fontWeight: "bold", background: "#1d4ed8", color: "#fff", border: "none", borderRadius: "5px" }}>
                    Print
                  </button>
                  <button onClick={() => setPrintPo(null)} style={{ padding: "8px 20px", cursor: "pointer" }}>
                    Close
                  </button>
                </div>
              </div>
            </div>
          </>
        );
      })()}

      {receipt && (() => {
        const productMap = Object.fromEntries(products.map((p) => [p.product_id, p.product_name]));
        return (
          <>
            <style>{`
              @media print {
                .app-root > * { display: none !important; }
                #receipt-modal { display: block !important; position: static !important; background: none !important; }
                #receipt-print { box-shadow: none !important; margin: 0 !important; }
                #receipt-actions { display: none !important; }
              }
            `}</style>
            <div
              id="receipt-modal"
              style={{
                position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
                display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
              }}
              onClick={(e) => { if (e.target === e.currentTarget) setReceipt(null); }}
            >
              <div
                id="receipt-print"
                style={{
                  background: "#fff", padding: "32px 28px", width: "320px",
                  fontFamily: "monospace", fontSize: "13px", lineHeight: "1.6",
                  boxShadow: "0 4px 24px rgba(0,0,0,0.2)",
                }}
              >
                <div style={{ textAlign: "center", marginBottom: "6px" }}>
                  <img src="/logo.png" alt="Wegn-Store" style={{ height: "56px", width: "auto", maxWidth: "160px", objectFit: "contain" }} />
                </div>
                {businessName && (
                  <div style={{ textAlign: "center", fontWeight: "bold", fontSize: "16px", marginBottom: "4px" }}>{businessName}</div>
                )}
                {(businessPhone || businessAddress) && (
                  <div style={{ textAlign: "center", fontSize: "12px", color: "#555", marginBottom: "4px" }}>
                    {businessPhone && <div>{businessPhone}</div>}
                    {businessAddress && <div>{businessAddress}</div>}
                  </div>
                )}
                <div style={{ textAlign: "center", borderBottom: "1px dashed #333", paddingBottom: "8px", marginBottom: "8px" }}>
                  {receipt.sale.status === "voided" && (
                    <div style={{ color: "#b91c1c", fontWeight: "bold" }}>** VOIDED **</div>
                  )}
                  <div>Sale: {receipt.sale.id.slice(0, 8)}</div>
                  <div>{new Date(receipt.sale.created_at).toLocaleString()}</div>
                </div>

                {receipt.items.map((item, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", gap: "8px" }}>
                    <span style={{ flex: 1 }}>{productMap[item.product_id] ?? item.product_id.slice(0, 8)} x{item.quantity}</span>
                    <span>${Number(item.line_total).toFixed(2)}</span>
                  </div>
                ))}

                <div style={{ borderTop: "1px dashed #333", marginTop: "8px", paddingTop: "8px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>Subtotal</span><span>${Number(receipt.sale.subtotal).toFixed(2)}</span>
                  </div>
                  {Number(receipt.sale.discount_amount) > 0 && (
                    <div style={{ display: "flex", justifyContent: "space-between", color: "#16a34a" }}>
                      <span>Discount</span><span>−${Number(receipt.sale.discount_amount).toFixed(2)}</span>
                    </div>
                  )}
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>Tax</span><span>${Number(receipt.sale.tax).toFixed(2)}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "bold", fontSize: "15px", marginTop: "4px" }}>
                    <span>TOTAL</span><span>${Number(receipt.sale.total).toFixed(2)}</span>
                  </div>
                  <div style={{ marginTop: "4px" }}>Payment: {receipt.paymentMethod}</div>
                </div>

                {(receipt.pointsEarned !== undefined || receipt.pointsRedeemed !== undefined) && (
                  <div style={{ borderTop: "1px dashed #333", marginTop: "8px", paddingTop: "8px", fontSize: "12px" }}>
                    {receipt.pointsRedeemed !== undefined && receipt.pointsRedeemed > 0 && (
                      <div style={{ display: "flex", justifyContent: "space-between", color: "#7c3aed" }}>
                        <span>Points Redeemed</span><span>−{receipt.pointsRedeemed} pts</span>
                      </div>
                    )}
                    {receipt.pointsEarned !== undefined && receipt.pointsEarned > 0 && (
                      <div style={{ display: "flex", justifyContent: "space-between", color: "#15803d" }}>
                        <span>Points Earned</span><span>+{receipt.pointsEarned} pts</span>
                      </div>
                    )}
                  </div>
                )}
                <div style={{ textAlign: "center", borderTop: "1px dashed #333", marginTop: "12px", paddingTop: "8px" }}>
                  Thank you!
                </div>

                <div id="receipt-actions" style={{ display: "flex", gap: "8px", marginTop: "16px", justifyContent: "center" }}>
                  <button onClick={() => window.print()} style={{ padding: "8px 20px", cursor: "pointer", fontWeight: "bold" }}>
                    Print
                  </button>
                  <button onClick={() => setReceipt(null)} style={{ padding: "8px 20px", cursor: "pointer" }}>
                    Close
                  </button>
                </div>
              </div>
            </div>
          </>
        );
      })()}
    </div>
  );
}

export default App;
