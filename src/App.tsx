import React, { useEffect, useState } from "react";
import { supabase } from "./supabase";

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

function App() {
  const [products, setProducts] = useState<ProductStock[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [selectedPoId, setSelectedPoId] = useState("");
  const [poItems, setPoItems] = useState<POItem[]>([]);
  const [itemProductId, setItemProductId] = useState("");
  const [itemQuantity, setItemQuantity] = useState("");
  const [itemUnitCost, setItemUnitCost] = useState("");
  const [receivingPoId, setReceivingPoId] = useState("");
  const [receivingItems, setReceivingItems] = useState<POItem[]>([]);
  const [receiveQtys, setReceiveQtys] = useState<Record<string, string>>({});
  const [poSupplierId, setPoSupplierId] = useState("");
  const [poNotes, setPoNotes] = useState("");
  const [supName, setSupName] = useState("");
  const [supContact, setSupContact] = useState("");
  const [supPhone, setSupPhone] = useState("");
  const [supEmail, setSupEmail] = useState("");
  const [supNotes, setSupNotes] = useState("");
  const [businessId, setBusinessId] = useState("");
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
  const [message, setMessage] = useState("");
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
  const [reorderSuppliers, setReorderSuppliers] = useState<Record<string, string>>({});
  const [reorderQtys, setReorderQtys] = useState<Record<string, string>>({});
  const [saleItems, setSaleItems] = useState<SaleItemRecord[]>([]);
  const [showEod, setShowEod] = useState(false);
  const [eodItems, setEodItems] = useState<EodItem[]>([]);
  const [eodPayments, setEodPayments] = useState<EodPayment[]>([]);
  const [receipt, setReceipt] = useState<Receipt | null>(null);
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
  const [drawerCashSales, setDrawerCashSales] = useState(0);
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [openingFloat, setOpeningFloat] = useState("");
  const [paidOutAmount, setPaidOutAmount] = useState("");
  const [paidOutReason, setPaidOutReason] = useState("");
  const [closingCount, setClosingCount] = useState("");
  const [loyaltyTransactions, setLoyaltyTransactions] = useState<LoyaltyTransaction[]>([]);
  const [posRedeemPoints, setPosRedeemPoints] = useState("");
  const [analyticsRange, setAnalyticsRange] = useState<'today' | '7d' | '30d' | 'all'>('7d');
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
  const [businessName, setBusinessName] = useState("");
  const [businessPhone, setBusinessPhone] = useState("");
  const [businessEmail, setBusinessEmail] = useState("");
  const [businessAddress, setBusinessAddress] = useState("");
  const [editingBusiness, setEditingBusiness] = useState(false);
  const [editBizName, setEditBizName] = useState("");
  const [editBizPhone, setEditBizPhone] = useState("");
  const [editBizEmail, setEditBizEmail] = useState("");
  const [editBizAddress, setEditBizAddress] = useState("");

  const [activeTab, setActiveTab] = useState<string>('pos');

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
    loadDrawerSession();
    loadEmployees();
    loadStockCounts();
  }, []);

  async function loadBusiness() {
    const { data } = await supabase
      .from("businesses")
      .select("id, name, phone, email, address")
      .limit(1)
      .single();
    if (data) {
      setBusinessId(data.id);
      setBusinessName(data.name ?? "");
      setBusinessPhone(data.phone ?? "");
      setBusinessEmail(data.email ?? "");
      setBusinessAddress(data.address ?? "");
    }
  }

  async function handleSaveBusiness(e: React.FormEvent) {
    e.preventDefault();
    if (!editBizName.trim() || !businessId) return;
    const { error } = await supabase
      .from("businesses")
      .update({
        name: editBizName.trim(),
        phone: editBizPhone.trim() || null,
        email: editBizEmail.trim() || null,
        address: editBizAddress.trim() || null,
      })
      .eq("id", businessId);
    if (error) { console.error(error); setMessage("Failed to update business: " + error.message); return; }
    setEditingBusiness(false);
    setMessage("Business profile updated");
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
    setMessage("Return processed");
    await loadProducts();
    await loadTransactions();
    await loadSales();
    await loadLoyaltyTransactions();
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
      setMessage('Failed to save stock count: ' + scErr?.message);
      setStockCountLoading(false);
      return;
    }
    let varianceCount = 0;
    for (const line of stockCountLines) {
      const variance = line.counted_qty - line.system_qty;
      await supabase.from('stock_count_items').insert({
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
    setMessage(`Stock count completed — ${varianceCount} variance(s) corrected.`);
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
      const { data: payments } = await supabase
        .from('payments')
        .select('amount')
        .eq('payment_method', 'cash')
        .gte('created_at', data.opened_at);
      const total = (payments ?? []).reduce((sum: number, p: any) => sum + Number(p.amount), 0);
      setDrawerCashSales(total);
    } else {
      setDrawerPaidOuts([]);
      setDrawerCashSales(0);
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
    if (error) { setMessage('Failed to open drawer: ' + error.message); setDrawerLoading(false); return; }
    setDrawerSession(data as DrawerSession);
    setDrawerPaidOuts([]);
    setDrawerCashSales(0);
    setOpeningFloat('');
    setDrawerLoading(false);
    setMessage('Cash drawer opened');
  }

  async function handlePaidOut(e: React.FormEvent) {
    e.preventDefault();
    if (!drawerSession) return;
    const amount = Number(paidOutAmount);
    if (isNaN(amount) || amount <= 0) return;
    setDrawerLoading(true);
    const { error } = await supabase
      .from('drawer_paid_outs')
      .insert({ drawer_session_id: drawerSession.id, amount, reason: paidOutReason || null });
    if (error) { setMessage('Paid out failed: ' + error.message); setDrawerLoading(false); return; }
    setPaidOutAmount('');
    setPaidOutReason('');
    setDrawerLoading(false);
    setMessage('Paid out recorded');
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
    if (error) { setMessage('Failed to close drawer: ' + error.message); setDrawerLoading(false); return; }
    setDrawerSession(null);
    setDrawerPaidOuts([]);
    setDrawerCashSales(0);
    setClosingCount('');
    setDrawerLoading(false);
    const sign = overShort >= 0 ? 'Over' : 'Short';
    setMessage(`Drawer closed — Expected: $${expectedCash.toFixed(2)} | Counted: $${counted.toFixed(2)} | ${sign}: $${Math.abs(overShort).toFixed(2)}`);
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
      setMessage(`Customer: ${match.name} — ${balance} pts`);
    } else {
      setPosCustomerId(null);
      setPosCustomerName("");
      setMessage(`No customer found for ${phone} — sale will be anonymous`);
    }
  }

  async function handleAddCustomer(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");
    if (!newCusName || !newCusPhone) return;
    const { error } = await supabase.from("customers").insert({
      name: newCusName,
      phone: newCusPhone,
      email: newCusEmail || null,
    });
    if (error) { console.error(error); setMessage("Failed to add customer: " + error.message); return; }
    setNewCusName("");
    setNewCusPhone("");
    setNewCusEmail("");
    setMessage("Customer added");
    await loadCustomers();
  }

  async function handleEditCustomer(e: React.FormEvent, customerId: string) {
    e.preventDefault();
    if (!editCusName.trim() || !editCusPhone.trim()) return;
    const { error } = await supabase
      .from("customers")
      .update({ name: editCusName.trim(), phone: editCusPhone.trim(), email: editCusEmail.trim() || null })
      .eq("id", customerId);
    if (error) { console.error(error); setMessage("Failed to update customer: " + error.message); return; }
    setEditingCustomerId(null);
    setMessage("Customer updated");
    await loadCustomers();
  }

  async function handleToggleCustomerStatus(customer: Customer) {
    const newStatus = customer.status === "active" ? "inactive" : "active";
    const { error } = await supabase.from("customers").update({ status: newStatus }).eq("id", customer.id);
    if (error) { console.error(error); setMessage("Status update failed"); return; }
    if (posCustomerId === customer.id && newStatus === "inactive") {
      setPosCustomerId(null);
      setPosCustomerName("");
      setMessage("Customer deactivated — removed from current sale");
    } else {
      setMessage(newStatus === "active" ? "Customer activated" : "Customer deactivated");
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
      .select("id, purchase_order_id, product_id, quantity, unit_cost, line_total, created_at")
      .eq("purchase_order_id", poId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error(error);
      return;
    }

    setPoItems((data as POItem[]) || []);
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
    setMessage("");

    const qty = Number(itemQuantity);
    const cost = Number(itemUnitCost);

    if (!selectedPoId || !itemProductId || !qty || !cost) return;

    const lineTotal = qty * cost;

    const { error: insertError } = await supabase
      .from("purchase_order_items")
      .insert({
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
      .select("id, purchase_order_id, product_id, quantity, unit_cost, line_total, created_at")
      .eq("purchase_order_id", po.id)
      .order("created_at", { ascending: true });

    if (error) {
      console.error(error);
      return;
    }

    const items = (data as POItem[]) || [];
    setReceivingPoId(po.id);
    setReceivingItems(items);

    const qtys: Record<string, string> = {};
    items.forEach((item) => { qtys[item.id] = String(item.quantity); });
    setReceiveQtys(qtys);
  }

  async function handleConfirmReceive() {
    const po = purchaseOrders.find((p) => p.id === receivingPoId);
    if (!po) return;

    for (const item of receivingItems) {
      const receiveQty = Number(receiveQtys[item.id] ?? 0);
      if (receiveQty <= 0) continue;

      const product = products.find((p) => p.product_id === item.product_id);
      if (!product) continue;

      const quantityBefore = product.quantity_on_hand;
      const quantityAfter = quantityBefore + receiveQty;
      const oldAvgCost = product.average_cost ?? 0;
      const newAvgCost = (quantityBefore + receiveQty) > 0
        ? ((quantityBefore * oldAvgCost) + (receiveQty * item.unit_cost)) / (quantityBefore + receiveQty)
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
          quantity_change: receiveQty,
          quantity_before: quantityBefore,
          quantity_after: quantityAfter,
          reason: `PO ${po.po_number}`,
        });

      if (txError) { console.error(txError); }
    }

    const { error: statusError } = await supabase
      .from("purchase_orders")
      .update({ status: "received" })
      .eq("id", receivingPoId);

    if (statusError) { console.error(statusError); }

    setReceivingPoId("");
    setReceivingItems([]);
    setReceiveQtys({});
    await loadProducts();
    await loadPurchaseOrders();
    await loadTransactions();
  }

  function handleBarcodeSubmit(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key !== "Enter") return;
    e.preventDefault();
    const code = barcodeInput.trim();
    setBarcodeInput("");
    if (!code) return;

    const product = products.find((p) => p.barcode === code);
    if (!product) { setMessage(`Barcode not recognised: ${code}`); return; }
    if (product.status !== "active") { setMessage("Product is inactive and cannot be sold."); return; }
    if (product.quantity_on_hand <= 0) { setMessage(`${product.product_name} is out of stock`); return; }

    const existing = cart.find((c) => c.product_id === product.product_id);
    const alreadyInCart = existing?.quantity ?? 0;
    if (alreadyInCart + 1 > product.quantity_on_hand) {
      setMessage(`Not enough stock for ${product.product_name}`);
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
    setMessage("");
  }

  function handleAddToCart(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");
    if (!cartProductId) return;
    const qty = Number(cartQty);
    if (!qty || qty <= 0) return;

    const product = products.find((p) => p.product_id === cartProductId);
    if (!product) return;

    const existing = cart.find((c) => c.product_id === cartProductId);
    const alreadyInCart = existing?.quantity ?? 0;
    if (alreadyInCart + qty > product.quantity_on_hand) {
      setMessage(`Not enough stock. Available: ${product.quantity_on_hand}`);
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

  async function handleVoidSale(saleId: string) {
    const sale = sales.find((s) => s.id === saleId);
    if (!sale || sale.status !== "completed") return;
    if (!window.confirm(`Void sale $${Number(sale.total).toFixed(2)}? This will reverse inventory.`)) return;

    setMessage("");

    const { data: items, error: itemsErr } = await supabase
      .from("sale_items")
      .select("product_id, quantity, unit_price")
      .eq("sale_id", saleId);

    if (itemsErr || !items) { console.error(itemsErr); setMessage("Void failed"); return; }

    const { error: statusErr } = await supabase
      .from("sales")
      .update({ status: "voided" })
      .eq("id", saleId);

    if (statusErr) { console.error(statusErr); setMessage("Void failed"); return; }

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

    setVoidingId("");
    setMessage("Sale voided");
    await loadProducts();
    await loadTransactions();
    await loadSales();
    await loadSaleItems();
  }

  async function handleCompleteSale() {
    if (cart.length === 0) return;
    setMessage("");

    if (employees.filter(e => e.status === "active").length > 0 && !activeCashierId) {
      setMessage("Select a cashier before completing the sale");
      return;
    }

    for (const item of cart) {
      const product = products.find((p) => p.product_id === item.product_id);
      if (!product || item.quantity > product.quantity_on_hand) {
        setMessage(`Insufficient stock for ${item.product_name}`);
        return;
      }
    }

    const subtotal = cart.reduce((sum, c) => sum + c.line_total, 0);
    const discountVal = Math.max(0, Number(posDiscountValue) || 0);
    const discountAmount = posDiscountType === "percent"
      ? Math.min(subtotal, subtotal * (discountVal / 100))
      : Math.min(subtotal, discountVal);
    const customerLoyaltyBal = posCustomerId
      ? loyaltyTransactions.filter(lt => lt.customer_id === posCustomerId).reduce((s, lt) => s + lt.points, 0)
      : 0;
    const redeemPts = posCustomerId
      ? Math.min(Math.max(0, Math.floor(Number(posRedeemPoints) || 0)), customerLoyaltyBal)
      : 0;
    const finalTotal = Math.max(0, subtotal - discountAmount - redeemPts / 100);

    const { data: sale, error: saleErr } = await supabase
      .from("sales")
      .insert({ subtotal, tax: 0, discount_amount: discountAmount, total: finalTotal, status: "completed", customer_id: posCustomerId || null, cashier_id: activeCashierId || null })
      .select("id")
      .single();

    if (saleErr || !sale) { console.error(saleErr); setMessage("Sale failed"); return; }

    const { error: itemsErr } = await supabase
      .from("sale_items")
      .insert(cart.map((c) => ({
        sale_id: sale.id,
        product_id: c.product_id,
        quantity: c.quantity,
        unit_price: c.unit_price,
        line_total: c.line_total,
      })));

    if (itemsErr) { console.error(itemsErr); setMessage("Sale items failed"); return; }

    const { error: payErr } = await supabase
      .from("payments")
      .insert({ sale_id: sale.id, payment_method: paymentMethod, amount: finalTotal });

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
      const earnedPoints = Math.floor(finalTotal);
      if (earnedPoints > 0) {
        const { error: earnErr } = await supabase.from('loyalty_transactions').insert({
          customer_id: posCustomerId,
          sale_id: sale.id,
          points: earnedPoints,
          type: 'earn',
        });
        if (earnErr) console.error('loyalty earn insert error:', earnErr);
      }
      if (redeemPts > 0) {
        const { error: redeemErr } = await supabase.from('loyalty_transactions').insert({
          customer_id: posCustomerId,
          sale_id: sale.id,
          points: -redeemPts,
          type: 'redeem',
        });
        if (redeemErr) console.error('loyalty redeem insert error:', redeemErr);
      }
    }

    setCart([]);
    setAmountTendered("");
    setPosDiscountValue("");
    setPosDiscountType("percent");
    setPosCustomerPhone("");
    setPosCustomerId(null);
    setPosCustomerName("");
    setPosRedeemPoints("");
    setMessage("Sale completed");
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

  async function handleCreateReorderPO(product: ProductStock) {
    const supplierId = reorderSuppliers[product.product_id];
    const qty = Number(reorderQtys[product.product_id] ?? (product.reorder_level - product.quantity_on_hand));
    if (!supplierId || qty <= 0) { setMessage("Select a supplier and enter a quantity"); return; }

    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    const poNumber = `PO-${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
    const unitCost = product.average_cost ?? 0;
    const lineTotal = qty * unitCost;

    const { data: po, error: poErr } = await supabase
      .from("purchase_orders")
      .insert({
        business_id: businessId,
        supplier_id: supplierId,
        po_number: poNumber,
        status: "draft",
        subtotal: lineTotal,
        notes: `Reorder: ${product.product_name}`,
      })
      .select("id")
      .single();

    if (poErr || !po) { console.error(poErr); setMessage("Failed to create PO"); return; }

    await supabase.from("purchase_order_items").insert({
      purchase_order_id: po.id,
      product_id: product.product_id,
      quantity: qty,
      unit_cost: unitCost,
      line_total: lineTotal,
    });

    setReorderSuppliers((prev) => { const n = { ...prev }; delete n[product.product_id]; return n; });
    setReorderQtys((prev) => { const n = { ...prev }; delete n[product.product_id]; return n; });
    setMessage(`Draft PO created: ${poNumber}`);
    await loadPurchaseOrders();
  }

  async function handleCreatePO(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");

    if (!poSupplierId) return;

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
    setMessage("Purchase order created successfully");
    await loadPurchaseOrders();
  }

  async function handleDeletePO(po: PurchaseOrder) {
    const { error: itemsError } = await supabase
      .from("purchase_order_items")
      .delete()
      .eq("purchase_order_id", po.id);
    if (itemsError) { console.error(itemsError); setMessage("Failed to delete PO items"); return; }
    const { error: poError } = await supabase
      .from("purchase_orders")
      .delete()
      .eq("id", po.id);
    if (poError) { console.error(poError); setMessage("Failed to delete purchase order"); return; }
    if (selectedPoId === po.id) { setSelectedPoId(""); setPoItems([]); }
    if (receivingPoId === po.id) { setReceivingPoId(""); setReceivingItems([]); setReceiveQtys({}); }
    setMessage(`PO ${po.po_number} deleted`);
    await loadPurchaseOrders();
  }

  async function handleCancelPO(po: PurchaseOrder) {
    const { error } = await supabase
      .from("purchase_orders")
      .update({ status: "cancelled" })
      .eq("id", po.id);
    if (error) { console.error(error); setMessage("Failed to cancel purchase order"); return; }
    if (selectedPoId === po.id) { setSelectedPoId(""); setPoItems([]); }
    if (receivingPoId === po.id) { setReceivingPoId(""); setReceivingItems([]); setReceiveQtys({}); }
    setMessage(`PO ${po.po_number} cancelled`);
    await loadPurchaseOrders();
  }

  async function handleRemovePOItem(itemId: string) {
    const { error } = await supabase
      .from("purchase_order_items")
      .delete()
      .eq("id", itemId);
    if (error) { console.error(error); setMessage("Failed to remove item"); return; }
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
    setMessage("");

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
    setMessage("Supplier added successfully");
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
    if (error) { console.error(error); setMessage("Update failed"); return; }
    setEditingSupplierId(null);
    setMessage("Supplier updated");
    await loadSuppliers();
  }

  async function handleToggleSupplierStatus(s: Supplier) {
    const newStatus = s.status === "active" ? "inactive" : "active";
    const { error } = await supabase.from("suppliers").update({ status: newStatus }).eq("id", s.id);
    if (error) { console.error(error); setMessage("Status update failed"); return; }
    await loadSuppliers();
  }

  async function handleDeleteSupplier(id: string, name: string) {
    const hasPOs = purchaseOrders.some(po => po.supplier_id === id);
    if (hasPOs) { setMessage(`Cannot delete "${name}" — they have existing purchase orders.`); return; }
    const { error } = await supabase.from("suppliers").delete().eq("id", id);
    if (error) { console.error(error); setMessage("Delete failed"); return; }
    setMessage(`Supplier "${name}" deleted`);
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
    if (error) { console.error(error); setMessage("Failed to add employee: " + error.message); return; }
    setNewEmpName("");
    setNewEmpRole("cashier");
    setMessage("Employee added");
    await loadEmployees();
  }

  async function handleToggleEmployeeStatus(emp: Employee) {
    const newStatus = emp.status === "active" ? "inactive" : "active";
    const { error } = await supabase.from("employees").update({ status: newStatus }).eq("id", emp.id);
    if (error) { console.error(error); setMessage("Status update failed"); return; }
    if (activeCashierId === emp.id && newStatus === "inactive") {
      setActiveCashierId(null);
      setActiveCashierName("");
      setMessage("Employee deactivated — cashier deselected");
    } else {
      setMessage(newStatus === "active" ? "Employee activated" : "Employee deactivated");
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
          average_cost
        )
      `);

    console.log("DATA:", data);
    console.log("ERROR:", error);

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
      })) || [];

    setProducts(formatted);
  }

  async function loadTransactions() {
    const { data: txData, error: txError } = await supabase
      .from("inventory_transactions")
      .select("id, created_at, transaction_type, quantity_change, quantity_before, quantity_after, product_id")
      .order("created_at", { ascending: false });

    console.log("TX DATA", txData);
    console.log("TX ERROR", txError);

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
    setMessage("");

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
    setBarcodeAutoFill("");
    setMessage("Product added successfully");
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
      })
      .eq("id", productId);
    if (error) { console.error(error); setMessage("Failed to update product: " + error.message); return; }
    setEditingProductId(null);
    setMessage("Product updated");
    await loadProducts();
  }

  async function handleToggleProductStatus(product: ProductStock) {
    const newStatus = product.status === "active" ? "inactive" : "active";
    const { error } = await supabase
      .from("products")
      .update({ status: newStatus })
      .eq("id", product.product_id);
    if (error) { console.error(error); setMessage("Status update failed"); return; }
    setMessage(newStatus === "active" ? "Product activated" : "Product deactivated");
    await loadProducts();
  }

  async function handleReceive(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");

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
    setMessage("Inventory received successfully");
    await loadProducts();
    await loadTransactions();
  }

  async function handleAdjust(e: React.FormEvent) {
    e.preventDefault();
    console.log("HANDLE ADJUST FIRED");
    setMessage("");

    const qty = Number(adjustQuantity);

    console.log("GUARD CHECK", { adjustProductId, adjustQuantity, qty, isNaN: isNaN(qty) });

    if (!adjustProductId || !adjustQuantity || isNaN(qty)) {
      console.log("GUARD BLOCKED — returning early");
      return;
    }

    const product = products.find((p) => p.product_id === adjustProductId);

    console.log("ADJUST PRODUCT", product);
    console.log("ADJUST QTY", qty);

    if (!product) {
      return;
    }

    const reductionTypes = ["damaged", "expired", "lost"];
    const delta = reductionTypes.includes(adjustType) ? -Math.abs(qty) : qty;

    console.log("ADJUST DELTA", delta);

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

    console.log("ADJUST INSERT ERROR", txError);

    if (txError) {
      console.error(txError);
      return;
    }

    const { error: updateError } = await supabase
      .from("inventory")
      .update({ quantity_on_hand: quantityAfter })
      .eq("id", product.inventory_id);

    console.log("ADJUST UPDATE ERROR", updateError);

    if (updateError) {
      console.error(updateError);
      return;
    }

    setAdjustQuantity("");
    setAdjustReason("");
    setMessage("Inventory adjusted successfully");
    await loadProducts();
    await loadTransactions();
  }

  return (
    <div style={{ padding: "40px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", marginBottom: "24px", paddingBottom: "16px", borderBottom: "2px solid #e2e8f0", gap: "16px" }}>
        <h1 style={{ margin: "0", fontSize: "22px", fontWeight: "bold", color: "#0f172a" }}>Wegn-Store</h1>
        <nav style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
          {([
            ['dashboard', 'Dashboard'],
            ['pos', 'POS'],
            ['inventory', 'Inventory'],
            ['purchasing', 'Purchasing'],
            ['customers', 'Customers'],
            ['employees', 'Employees'],
            ['reports', 'Reports'],
            ['settings', 'Settings'],
          ] as [string, string][]).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              style={{
                padding: "8px 16px",
                background: activeTab === key ? "#1d4ed8" : "#f1f5f9",
                color: activeTab === key ? "#fff" : "#475569",
                border: "1px solid",
                borderColor: activeTab === key ? "#1d4ed8" : "#e2e8f0",
                borderRadius: "6px",
                cursor: "pointer",
                fontWeight: activeTab === key ? "bold" : "normal",
                fontSize: "14px",
              }}
            >
              {label}
            </button>
          ))}
        </nav>
      </div>

      {message && (
        <div style={{ padding: "10px 16px", background: "#f0fdf4", color: "#15803d", border: "1px solid #bbf7d0", borderRadius: "6px", fontSize: "14px", marginBottom: "16px" }}>
          {message}
        </div>
      )}

      {/* ── POS TAB ── */}
      <div style={{ display: activeTab === 'pos' ? '' : 'none' }}>

      <h2>Point of Sale</h2>

      <input
        type="text"
        autoFocus
        placeholder="Scan barcode or type and press Enter"
        value={barcodeInput}
        onChange={(e) => setBarcodeInput(e.target.value)}
        onKeyDown={handleBarcodeSubmit}
        style={{ width: "100%", padding: "10px", marginBottom: "12px", fontSize: "15px", boxSizing: "border-box" }}
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
        <button type="submit" style={{ flex: "0 1 120px", padding: "8px" }}>
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
                  const discountAmt = posDiscountType === "percent"
                    ? Math.min(subtotal, subtotal * (discountVal / 100))
                    : Math.min(subtotal, discountVal);
                  const tfCustBal = posCustomerId
                    ? loyaltyTransactions.filter(lt => lt.customer_id === posCustomerId).reduce((s, lt) => s + lt.points, 0)
                    : 0;
                  const tfRedeemPts = posCustomerId
                    ? Math.min(Math.max(0, Math.floor(Number(posRedeemPoints) || 0)), tfCustBal)
                    : 0;
                  const redeemDollar = tfRedeemPts / 100;
                  const finalTotal = Math.max(0, subtotal - discountAmt - redeemDollar);
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
              style={{ width: "110px", padding: "6px 8px", fontSize: "13px" }}
            />
            {posDiscountValue && (
              <button onClick={() => setPosDiscountValue("")} style={{ padding: "4px 10px", fontSize: "12px", cursor: "pointer" }}>
                Clear
              </button>
            )}
          </div>

          {/* Redeem loyalty points */}
          {posCustomerId && (() => {
            const custBal = loyaltyTransactions.filter(lt => lt.customer_id === posCustomerId).reduce((s, lt) => s + lt.points, 0);
            const redeemVal = Math.min(Math.max(0, Math.floor(Number(posRedeemPoints) || 0)), custBal);
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
                  style={{ width: "100px", padding: "6px 8px", fontSize: "13px" }}
                />
                {redeemVal > 0 && (
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
              const discountAmt = posDiscountType === "percent"
                ? Math.min(subtotal, subtotal * (discountVal / 100))
                : Math.min(subtotal, discountVal);
              const cashCustBal = posCustomerId
                ? loyaltyTransactions.filter(lt => lt.customer_id === posCustomerId).reduce((s, lt) => s + lt.points, 0)
                : 0;
              const cashRedeemPts = posCustomerId
                ? Math.min(Math.max(0, Math.floor(Number(posRedeemPoints) || 0)), cashCustBal)
                : 0;
              const finalTotal = Math.max(0, subtotal - discountAmt - cashRedeemPts / 100);
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
            <button
              onClick={handleCompleteSale}
              style={{
                padding: "10px 28px",
                background: "#1d4ed8",
                color: "#fff",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontWeight: "bold",
                fontSize: "15px",
              }}
            >
              Complete Sale
            </button>
          </div>
        </div>
      )}

      </div>{/* end pos */}

      {/* ── INVENTORY TAB ── */}
      <div style={{ display: activeTab === 'inventory' ? '' : 'none' }}>

      <h2>Receive Inventory</h2>

      <form
        onSubmit={handleReceive}
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "12px",
          alignItems: "center",
          marginBottom: "16px",
        }}
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

        <button type="submit" style={{ flex: "1 1 120px", padding: "8px" }}>
          Receive
        </button>
      </form>


      <h2>Adjust Inventory</h2>

      <form
        onSubmit={handleAdjust}
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "12px",
          alignItems: "center",
          marginBottom: "16px",
        }}
      >
        <select
          value={adjustProductId}
          onChange={(e) => {
            setAdjustProductId(e.target.value);
            console.log("SELECTED PRODUCT ID", e.target.value);
          }}
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

        <button type="submit" style={{ flex: "1 1 120px", padding: "8px" }}>
          Adjust
        </button>
      </form>

      <h2>Add Product</h2>

      <form
        onSubmit={handleAddProduct}
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
        <input
          type="number"
          min="0"
          placeholder="Initial Stock *"
          value={newInitialStock}
          onChange={(e) => setNewInitialStock(e.target.value)}
          style={{ flex: "1 1 120px", padding: "8px" }}
        />
        <button type="submit" style={{ flex: "1 1 120px", padding: "8px" }}>
          Add Product
        </button>
      </form>

      {barcodeAutoFill && (
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px", padding: "8px 14px", background: "#eff6ff", border: "1px solid #93c5fd", borderRadius: "6px", fontSize: "13px" }}>
          <span style={{ color: "#1d4ed8" }}>{barcodeAutoFill}</span>
          <button onClick={() => setBarcodeAutoFill("")} style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", fontSize: "15px", color: "#64748b" }}>✕</button>
        </div>
      )}

      <h2 style={{ marginTop: "40px" }}>Bulk Import Products</h2>

      <div style={{ display: "flex", gap: "12px", alignItems: "center", marginBottom: "16px", flexWrap: "wrap" }}>
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
          <div style={{ overflowX: "auto", marginBottom: "12px" }}>
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
          <div style={{ display: "flex", gap: "16px", alignItems: "center", marginBottom: "24px" }}>
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
        <div style={{ marginBottom: "24px", padding: "16px", border: "1px solid #ccc", borderRadius: "8px", display: "flex", gap: "32px" }}>
          <div><span style={{ fontSize: "13px", color: "#666" }}>Imported</span><div style={{ fontSize: "24px", fontWeight: "bold", color: "#15803d" }}>{bulkResults.imported}</div></div>
          <div><span style={{ fontSize: "13px", color: "#666" }}>Skipped</span><div style={{ fontSize: "24px", fontWeight: "bold", color: "#92400e" }}>{bulkResults.skipped}</div></div>
          <div><span style={{ fontSize: "13px", color: "#666" }}>Failed</span><div style={{ fontSize: "24px", fontWeight: "bold", color: "#b91c1c" }}>{bulkResults.failed}</div></div>
        </div>
      )}

      </div>{/* end inventory */}

      {/* ── DASHBOARD TAB ── */}
      <div style={{ display: activeTab === 'dashboard' ? '' : 'none' }}>

      <h2 style={{ marginBottom: "24px" }}>Dashboard</h2>

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
        const openPoCount = purchaseOrders.filter(po => po.status === 'draft' || po.status === 'ordered').length;
        const activeCustomerCount = customers.filter(c => c.status === 'active').length;
        const pointsOutstanding = Math.max(0, loyaltyTransactions.reduce((sum, lt) => sum + lt.points, 0));
        const recentSales = [...sales]
          .filter(s => s.status === 'completed')
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 5);

        const sLabel: React.CSSProperties = { fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#94a3b8", marginBottom: "12px" };
        const cardRow: React.CSSProperties = { display: "flex", gap: "16px", flexWrap: "wrap", marginBottom: "32px" };
        const cardBase = (accent: string): React.CSSProperties => ({
          padding: "16px 20px", background: "#fff", border: "1px solid #e2e8f0",
          borderLeft: `4px solid ${accent}`, borderRadius: "8px",
          minWidth: "160px", flex: "1 1 160px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
        });

        return (
          <>
            {/* ── Today's Operations ── */}
            <div style={sLabel}>Today's Operations</div>
            <div style={cardRow}>
              <div style={cardBase("#1d4ed8")}>
                <div style={{ fontSize: "12px", color: "#64748b", marginBottom: "4px" }}>Revenue Today</div>
                <div style={{ fontSize: "26px", fontWeight: "bold", color: "#0f172a" }}>${revenueToday.toFixed(2)}</div>
              </div>
              <div style={cardBase("#16a34a")}>
                <div style={{ fontSize: "12px", color: "#64748b", marginBottom: "4px" }}>Transactions</div>
                <div style={{ fontSize: "26px", fontWeight: "bold", color: "#0f172a" }}>{txnCount}</div>
                <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "4px" }}>{txnCount === 1 ? "sale" : "sales"} today</div>
              </div>
              <div style={cardBase("#4f46e5")}>
                <div style={{ fontSize: "12px", color: "#64748b", marginBottom: "4px" }}>Average Sale</div>
                <div style={{ fontSize: "26px", fontWeight: "bold", color: "#0f172a" }}>{txnCount > 0 ? `$${avgSale.toFixed(2)}` : "—"}</div>
              </div>
              <div style={cardBase(lowStockCount > 0 ? "#dc2626" : "#16a34a")}>
                <div style={{ fontSize: "12px", color: "#64748b", marginBottom: "4px" }}>Low Stock Items</div>
                <div style={{ fontSize: "26px", fontWeight: "bold", color: lowStockCount > 0 ? "#dc2626" : "#0f172a" }}>{lowStockCount}</div>
                <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "4px" }}>{lowStockCount > 0 ? "need reorder" : "all stocked"}</div>
              </div>
            </div>

            {/* ── Business Status ── */}
            <div style={sLabel}>Business Status</div>
            <div style={cardRow}>
              <div style={cardBase(drawerSession ? "#16a34a" : "#64748b")}>
                <div style={{ fontSize: "12px", color: "#64748b", marginBottom: "4px" }}>Cash Drawer</div>
                <div style={{ fontSize: "26px", fontWeight: "bold", color: drawerSession ? "#15803d" : "#475569" }}>{drawerSession ? "OPEN" : "CLOSED"}</div>
                <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "4px" }}>
                  {drawerSession ? `Since ${new Date(drawerSession.opened_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : "No active session"}
                </div>
              </div>
              <div style={cardBase(openPoCount > 0 ? "#ea580c" : "#64748b")}>
                <div style={{ fontSize: "12px", color: "#64748b", marginBottom: "4px" }}>Open Purchase Orders</div>
                <div style={{ fontSize: "26px", fontWeight: "bold", color: "#0f172a" }}>{openPoCount}</div>
                <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "4px" }}>{openPoCount > 0 ? "pending" : "none pending"}</div>
              </div>
              <div style={cardBase("#0d9488")}>
                <div style={{ fontSize: "12px", color: "#64748b", marginBottom: "4px" }}>Active Customers</div>
                <div style={{ fontSize: "26px", fontWeight: "bold", color: "#0f172a" }}>{activeCustomerCount}</div>
              </div>
              <div style={cardBase("#7c3aed")}>
                <div style={{ fontSize: "12px", color: "#64748b", marginBottom: "4px" }}>Loyalty Points</div>
                <div style={{ fontSize: "26px", fontWeight: "bold", color: "#0f172a" }}>{pointsOutstanding.toLocaleString()}</div>
                <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "4px" }}>outstanding</div>
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
      <div style={{ display: activeTab === 'inventory' ? '' : 'none' }}>

      <h2>Products & Stock</h2>

      <div style={{ overflowX: "auto" }}>
        <table border={1} cellPadding={10} style={{ width: "100%" }}>
          <thead>
            <tr>
              <th>Product</th>
              <th>SKU</th>
              <th>Barcode</th>
              <th>Price</th>
              <th>Stock</th>
              <th>Reorder Level</th>
              <th>Alert</th>
              <th>Status</th>
              <th>Avg Cost</th>
              <th>Inventory Value</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {products.map((product) => {
              const isLowStock = product.quantity_on_hand < product.reorder_level;
              const inactive = product.status !== "active";
              const isEditing = editingProductId === product.product_id;
              return (
                <React.Fragment key={product.product_id}>
                  <tr style={{
                    backgroundColor: inactive ? "#f5f5f5" : isLowStock ? "#ffe5e5" : "inherit",
                    color: inactive ? "#999" : "inherit",
                  }}>
                    <td>{product.product_name}</td>
                    <td>{product.sku ?? "—"}</td>
                    <td>{product.barcode ?? "—"}</td>
                    <td>${product.selling_price.toFixed(2)}</td>
                    <td>{product.quantity_on_hand}</td>
                    <td>{product.reorder_level}</td>
                    <td style={{ color: !inactive && isLowStock ? "red" : "inherit", fontWeight: !inactive && isLowStock ? "bold" : "normal" }}>
                      {inactive ? "—" : isLowStock ? "LOW STOCK" : "OK"}
                    </td>
                    <td>
                      <span style={{
                        fontSize: "12px", fontWeight: "bold", padding: "2px 8px", borderRadius: "12px",
                        background: inactive ? "#e5e7eb" : "#dcfce7",
                        color: inactive ? "#6b7280" : "#15803d",
                      }}>{product.status}</span>
                    </td>
                    <td>${product.average_cost.toFixed(2)}</td>
                    <td>${(product.quantity_on_hand * product.average_cost).toFixed(2)}</td>
                    <td style={{ whiteSpace: "nowrap" }}>
                      <button
                        onClick={() => {
                          if (isEditing) { setEditingProductId(null); return; }
                          setEditingProductId(product.product_id);
                          setEditProdName(product.product_name);
                          setEditProdSku(product.sku ?? "");
                          setEditProdBarcode(product.barcode ?? "");
                          setEditProdPrice(product.selling_price.toString());
                          setEditProdReorder(product.reorder_level.toString());
                        }}
                        style={{ marginRight: "6px", padding: "4px 10px", cursor: "pointer" }}
                      >{isEditing ? "Cancel" : "Edit"}</button>
                      <button
                        onClick={() => handleToggleProductStatus(product)}
                        style={{ padding: "4px 10px", cursor: "pointer" }}
                      >{inactive ? "Activate" : "Deactivate"}</button>
                    </td>
                  </tr>
                  {isEditing && (
                    <tr>
                      <td colSpan={11} style={{ background: "#f9fafb", padding: "16px" }}>
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
      <div style={{ display: activeTab === 'purchasing' ? '' : 'none' }}>

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

      <div style={{ overflowX: "auto", marginBottom: "40px" }}>
        <table border={1} cellPadding={10} style={{ width: "100%" }}>
          <thead>
            <tr>
              <th>Supplier Name</th>
              <th>Contact Person</th>
              <th>Phone</th>
              <th>Email</th>
              <th>Notes</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {suppliers.length === 0 ? (
              <tr><td colSpan={7}>No suppliers found</td></tr>
            ) : (
              suppliers.map((s) => {
                const inactive = s.status !== "active";
                const isEditing = editingSupplierId === s.id;
                return (
                  <React.Fragment key={s.id}>
                    <tr style={inactive ? { backgroundColor: "#f5f5f5", color: "#999" } : {}}>
                      <td>{s.name}</td>
                      <td>{s.contact_name ?? "—"}</td>
                      <td>{s.phone ?? "—"}</td>
                      <td>{s.email ?? "—"}</td>
                      <td>{s.notes ?? "—"}</td>
                      <td>
                        <span style={{
                          fontSize: "12px", fontWeight: "bold", padding: "2px 8px", borderRadius: "12px",
                          background: inactive ? "#e5e7eb" : "#dcfce7",
                          color: inactive ? "#6b7280" : "#15803d",
                        }}>{s.status}</span>
                      </td>
                      <td style={{ whiteSpace: "nowrap" }}>
                        <button
                          onClick={() => isEditing ? handleCancelEditSupplier() : handleStartEditSupplier(s)}
                          style={{ padding: "3px 10px", marginRight: "4px", cursor: "pointer",
                            background: isEditing ? "#f3f4f6" : undefined }}
                        >{isEditing ? "Cancel" : "Edit"}</button>
                        <button
                          onClick={() => handleToggleSupplierStatus(s)}
                          style={{ padding: "3px 10px", marginRight: "4px", cursor: "pointer",
                            color: inactive ? "#15803d" : "#b45309" }}
                        >{inactive ? "Activate" : "Deactivate"}</button>
                        <button
                          onClick={() => handleDeleteSupplier(s.id, s.name)}
                          style={{ padding: "3px 10px", cursor: "pointer", color: "#b91c1c" }}
                        >Delete</button>
                      </td>
                    </tr>
                    {isEditing && (
                      <tr>
                        <td colSpan={7} style={{ background: "#f0f4ff", padding: "16px", border: "1px solid #c7d2fe" }}>
                          <strong style={{ color: "#3730a3", display: "block", marginBottom: "10px" }}>
                            Edit Supplier — {s.name}
                          </strong>
                          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
                            <input
                              type="text" placeholder="Supplier Name *" value={editSupName}
                              onChange={(e) => setEditSupName(e.target.value)}
                              style={{ flex: "2 1 180px", padding: "7px 10px" }}
                            />
                            <input
                              type="text" placeholder="Contact Person" value={editSupContact}
                              onChange={(e) => setEditSupContact(e.target.value)}
                              style={{ flex: "1 1 150px", padding: "7px 10px" }}
                            />
                            <input
                              type="text" placeholder="Phone" value={editSupPhone}
                              onChange={(e) => setEditSupPhone(e.target.value)}
                              style={{ flex: "1 1 120px", padding: "7px 10px" }}
                            />
                            <input
                              type="email" placeholder="Email" value={editSupEmail}
                              onChange={(e) => setEditSupEmail(e.target.value)}
                              style={{ flex: "1 1 170px", padding: "7px 10px" }}
                            />
                            <input
                              type="text" placeholder="Notes" value={editSupNotes}
                              onChange={(e) => setEditSupNotes(e.target.value)}
                              style={{ flex: "2 1 180px", padding: "7px 10px" }}
                            />
                            <button
                              onClick={handleSaveSupplier}
                              disabled={!editSupName.trim()}
                              style={{ padding: "7px 18px", cursor: "pointer", fontWeight: "bold",
                                background: "#1d4ed8", color: "#fff", border: "none", borderRadius: "5px" }}
                            >Save</button>
                            <button
                              onClick={handleCancelEditSupplier}
                              style={{ padding: "7px 14px", cursor: "pointer" }}
                            >Cancel</button>
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
        return (
          <div style={{ overflowX: "auto", marginBottom: "32px" }}>
            <table border={1} cellPadding={10} style={{ width: "100%" }}>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Stock</th>
                  <th>Reorder Level</th>
                  <th>Shortage</th>
                  <th>Supplier</th>
                  <th>Order Qty</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {lowStock.map((p) => (
                  <tr key={p.product_id} style={{ backgroundColor: "#ffe5e5" }}>
                    <td>{p.product_name}</td>
                    <td>{p.quantity_on_hand}</td>
                    <td>{p.reorder_level}</td>
                    <td style={{ color: "red", fontWeight: "bold" }}>
                      {p.reorder_level - p.quantity_on_hand}
                    </td>
                    <td>
                      <select
                        value={reorderSuppliers[p.product_id] ?? ""}
                        onChange={(e) =>
                          setReorderSuppliers((prev) => ({ ...prev, [p.product_id]: e.target.value }))
                        }
                        style={{ padding: "4px", width: "100%" }}
                      >
                        <option value="">Select supplier…</option>
                        {suppliers.filter(s => s.status === "active").map((s) => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <input
                        type="number"
                        min="1"
                        value={reorderQtys[p.product_id] ?? String(p.reorder_level - p.quantity_on_hand)}
                        onChange={(e) =>
                          setReorderQtys((prev) => ({ ...prev, [p.product_id]: e.target.value }))
                        }
                        style={{ width: "70px", padding: "4px" }}
                      />
                    </td>
                    <td>
                      <button
                        onClick={() => handleCreateReorderPO(p)}
                        style={{ padding: "4px 12px", cursor: "pointer" }}
                      >
                        Create Draft PO
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      })()}

      <h2 style={{ marginTop: "40px" }}>Supplier Performance</h2>

      {(() => {
        const stats = suppliers.map((s) => {
          const pos = purchaseOrders.filter((po) => po.supplier_id === s.id);
          const received = pos.filter((po) => po.status === "received");
          const drafts = pos.filter((po) => po.status === "draft");
          const totalSpend = received.reduce((sum, po) => sum + Number(po.subtotal), 0);
          const lastPO = pos.length > 0
            ? new Date(Math.max(...pos.map((po) => new Date(po.created_at).getTime())))
            : null;
          return { name: s.name, totalPOs: pos.length, receivedPOs: received.length, draftPOs: drafts.length, totalSpend, lastPO };
        });

        return (
          <div style={{ overflowX: "auto", marginBottom: "40px" }}>
            <table border={1} cellPadding={10} style={{ width: "100%" }}>
              <thead>
                <tr>
                  <th>Supplier</th>
                  <th>Total POs</th>
                  <th>Received</th>
                  <th>Draft</th>
                  <th>Total Spend (received)</th>
                  <th>Last Order</th>
                </tr>
              </thead>
              <tbody>
                {stats.length === 0 ? (
                  <tr><td colSpan={6}>No suppliers found</td></tr>
                ) : (
                  stats.map((row) => (
                    <tr key={row.name}>
                      <td>{row.name}</td>
                      <td>{row.totalPOs}</td>
                      <td>{row.receivedPOs}</td>
                      <td>{row.draftPOs}</td>
                      <td>${row.totalSpend.toFixed(2)}</td>
                      <td>{row.lastPO ? row.lastPO.toLocaleDateString() : "—"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        );
      })()}

      </div>{/* end purchasing */}

      {/* ── CUSTOMERS TAB ── */}
      <div style={{ display: activeTab === 'customers' ? '' : 'none' }}>

      <h2 style={{ marginTop: "40px" }}>Customer Management</h2>

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
                    const custSales = sales.filter(s => s.customer_id === row.id);
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
                              <strong>Purchase History</strong>
                              {custSales.length === 0 ? (
                                <p style={{ margin: "8px 0 0", color: "#888" }}>No sales recorded for this customer.</p>
                              ) : (
                                <table border={1} cellPadding={8} style={{ width: "100%", marginTop: "8px" }}>
                                  <thead>
                                    <tr>
                                      <th>Date</th>
                                      <th>Total</th>
                                      <th>Status</th>
                                      <th></th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {custSales.map(s => (
                                      <tr key={s.id}>
                                        <td>{new Date(s.created_at).toLocaleString()}</td>
                                        <td>${Number(s.total).toFixed(2)}</td>
                                        <td>{s.status}</td>
                                        <td>
                                          <button
                                            onClick={() => handlePrintReceipt(s)}
                                            style={{ padding: "2px 10px", cursor: "pointer" }}
                                          >
                                            View Receipt
                                          </button>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              )}
                              <strong style={{ display: "block", marginTop: "16px" }}>Points History</strong>
                              {(() => {
                                const custLoyalty = loyaltyTransactions.filter(lt => lt.customer_id === row.id).slice(0, 20);
                                return custLoyalty.length === 0 ? (
                                  <p style={{ margin: "8px 0 0", color: "#888" }}>No points history yet.</p>
                                ) : (
                                  <table border={1} cellPadding={8} style={{ width: "100%", marginTop: "8px", fontSize: "13px" }}>
                                    <thead>
                                      <tr><th>Date</th><th>Type</th><th>Points</th><th>Sale</th></tr>
                                    </thead>
                                    <tbody>
                                      {custLoyalty.map(lt => (
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
      <div style={{ display: activeTab === 'purchasing' ? '' : 'none' }}>

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
        const supplierMap = Object.fromEntries(
          suppliers.map((supplier) => [supplier.id, supplier.name])
        );
        return (
          <div style={{ overflowX: "auto", marginBottom: "40px" }}>
            <table border={1} cellPadding={10} style={{ width: "100%" }}>
              <thead>
                <tr>
                  <th>PO Number</th>
                  <th>Supplier</th>
                  <th>Status</th>
                  <th>Subtotal</th>
                  <th>Notes</th>
                  <th>Created At</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {purchaseOrders.length === 0 ? (
                  <tr>
                    <td colSpan={7}>No purchase orders found</td>
                  </tr>
                ) : (
                  purchaseOrders.map((po) => {
                    const isDraft = po.status === "draft";
                    const isCancelled = po.status === "cancelled";
                    const badgeStyle: React.CSSProperties = {
                      fontSize: "11px", fontWeight: "bold", padding: "2px 8px", borderRadius: "12px",
                      background: isDraft ? "#fef3c7" : isCancelled ? "#e5e7eb" : "#dcfce7",
                      color: isDraft ? "#92400e" : isCancelled ? "#6b7280" : "#15803d",
                    };
                    return (
                      <tr key={po.id} style={{ backgroundColor: isCancelled ? "#f9fafb" : selectedPoId === po.id ? "#f0f4ff" : "inherit", color: isCancelled ? "#9ca3af" : "inherit" }}>
                        <td>{po.po_number}</td>
                        <td>{supplierMap[po.supplier_id] ?? "Unknown"}</td>
                        <td><span style={badgeStyle}>{po.status}</span></td>
                        <td>${Number(po.subtotal ?? 0).toFixed(2)}</td>
                        <td>{po.notes || "-"}</td>
                        <td>{new Date(po.created_at).toLocaleString()}</td>
                        <td style={{ whiteSpace: "nowrap" }}>
                          {!isCancelled && (
                            <button onClick={() => handleSelectPO(po)} style={{ padding: "4px 10px", marginRight: "4px" }}>
                              {selectedPoId === po.id ? "Close" : "View/Edit"}
                            </button>
                          )}
                          {isDraft && (
                            <button
                              onClick={() => handleOpenReceive(po)}
                              style={{ padding: "4px 10px", marginRight: "4px", background: receivingPoId === po.id ? "#d1fae5" : undefined }}
                            >
                              {receivingPoId === po.id ? "Cancel" : "Receive"}
                            </button>
                          )}
                          {isDraft && (
                            <button
                              onClick={() => handleCancelPO(po)}
                              style={{ padding: "4px 10px", marginRight: "4px" }}
                            >
                              Cancel PO
                            </button>
                          )}
                          {isDraft && (
                            <button
                              onClick={() => handleDeletePO(po)}
                              style={{ padding: "4px 10px", background: "#fee2e2", color: "#dc2626", border: "1px solid #fca5a5", borderRadius: "4px" }}
                            >
                              Delete
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        );
      })()}

      {selectedPoId && (() => {
        const po = purchaseOrders.find((p) => p.id === selectedPoId);
        const isDraftPO = po?.status === "draft";
        const productMap = Object.fromEntries(
          products.map((p) => [p.product_id, p.product_name])
        );
        return (
          <div style={{ marginTop: "32px", padding: "20px", border: "1px solid #ccc", borderRadius: "8px", marginBottom: "32px" }}>
            <h3 style={{ margin: "0 0 16px" }}>
              PO Detail — {po?.po_number}
              {po && (
                <span style={{
                  marginLeft: "12px", fontSize: "12px", fontWeight: "bold", padding: "2px 8px", borderRadius: "12px",
                  background: isDraftPO ? "#fef3c7" : po.status === "cancelled" ? "#e5e7eb" : "#dcfce7",
                  color: isDraftPO ? "#92400e" : po.status === "cancelled" ? "#6b7280" : "#15803d",
                }}>{po.status}</span>
              )}
            </h3>

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

            <div style={{ overflowX: "auto" }}>
              <table border={1} cellPadding={10} style={{ width: "100%" }}>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Quantity</th>
                    <th>Unit Cost</th>
                    <th>Line Total</th>
                    {isDraftPO && <th></th>}
                  </tr>
                </thead>
                <tbody>
                  {poItems.length === 0 ? (
                    <tr>
                      <td colSpan={isDraftPO ? 5 : 4}>No items yet</td>
                    </tr>
                  ) : (
                    poItems.map((item) => (
                      <tr key={item.id}>
                        <td>{productMap[item.product_id] ?? "Unknown"}</td>
                        <td>{item.quantity}</td>
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
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {poItems.length > 0 && (
              <p style={{ textAlign: "right", fontWeight: "bold", marginTop: "8px" }}>
                Subtotal: ${poItems.reduce((sum, i) => sum + Number(i.line_total), 0).toFixed(2)}
              </p>
            )}
          </div>
        );
      })()}

      {receivingPoId && (() => {
        const po = purchaseOrders.find((p) => p.id === receivingPoId);
        const productMap = Object.fromEntries(
          products.map((p) => [p.product_id, p.product_name])
        );
        return (
          <div style={{ marginTop: "32px", padding: "20px", border: "2px solid #16a34a", borderRadius: "8px", marginBottom: "32px" }}>
            <h3 style={{ margin: "0 0 16px", color: "#15803d" }}>
              Receive Inventory — {po?.po_number}
            </h3>

            <div style={{ overflowX: "auto", marginBottom: "16px" }}>
              <table border={1} cellPadding={10} style={{ width: "100%" }}>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Ordered Qty</th>
                    <th>Receive Qty</th>
                    <th>Unit Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {receivingItems.length === 0 ? (
                    <tr>
                      <td colSpan={4}>No line items on this PO</td>
                    </tr>
                  ) : (
                    receivingItems.map((item) => (
                      <tr key={item.id}>
                        <td>{productMap[item.product_id] ?? "Unknown"}</td>
                        <td>{item.quantity}</td>
                        <td>
                          <input
                            type="number"
                            min="0"
                            value={receiveQtys[item.id] ?? ""}
                            onChange={(e) =>
                              setReceiveQtys((prev) => ({ ...prev, [item.id]: e.target.value }))
                            }
                            style={{ width: "80px", padding: "4px" }}
                          />
                        </td>
                        <td>${Number(item.unit_cost).toFixed(2)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <button
              onClick={handleConfirmReceive}
              disabled={receivingItems.length === 0}
              style={{ padding: "10px 24px", background: "#16a34a", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer" }}
            >
              Confirm Receive
            </button>
          </div>
        );
      })()}

      </div>{/* end purchasing */}

      {/* ── INVENTORY TAB (3) ── */}
      <div style={{ display: activeTab === 'inventory' ? '' : 'none' }}>

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
      <div style={{ display: activeTab === 'pos' ? '' : 'none' }}>

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
        <table border={1} cellPadding={10} style={{ width: "100%" }}>
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
                if (salesCashierFilter === "all") return true;
                if (salesCashierFilter === "none") return !s.cashier_id;
                return s.cashier_id === salesCashierFilter;
              }).map((s) => {
                const rowStyle = s.status === "voided" || s.status === "returned"
                  ? { backgroundColor: "#f5f5f5", color: "#999" } : {};
                const statusColor = s.status === "returned" ? "#7c3aed" : s.status === "voided" ? "#999" : "inherit";
                const cashierName = s.cashier_id ? (employees.find(e => e.id === s.cashier_id)?.name ?? s.cashier_id.slice(0, 8)) : "—";
                return (
                  <React.Fragment key={s.id}>
                    <tr style={rowStyle}>
                      <td style={{ fontFamily: "monospace" }}>{s.id.slice(0, 8)}…</td>
                      <td>${Number(s.total).toFixed(2)}</td>
                      <td>${Number(s.tax).toFixed(2)}</td>
                      <td style={{ color: statusColor, fontWeight: s.status === "returned" ? "bold" : "inherit" }}>{s.status}</td>
                      <td style={{ color: "#555" }}>{cashierName}</td>
                      <td>{new Date(s.created_at).toLocaleString()}</td>
                      <td style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                        <button onClick={() => handlePrintReceipt(s)} style={{ padding: "3px 10px", cursor: "pointer" }}>Print</button>
                        {s.status === "completed" && (
                          <button
                            onClick={() => handleVoidSale(s.id)}
                            disabled={voidingId === s.id}
                            style={{ padding: "3px 10px", color: "#b91c1c", cursor: "pointer" }}
                          >Void</button>
                        )}
                        {(s.status === "completed" || s.status === "returned") && (
                          <button
                            onClick={() => handleOpenReturn(s)}
                            style={{ padding: "3px 10px", color: "#7c3aed", cursor: "pointer" }}
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
      <div style={{ display: activeTab === 'reports' ? '' : 'none' }}>

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

      {/* ── POS TAB (3) ── */}
      <div style={{ display: activeTab === 'pos' ? '' : 'none' }}>

      {/* Cash Drawer Management */}
      <h2>Cash Drawer</h2>

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
        const grossRevenue = todaySales.reduce((sum, s) => sum + Number(s.total), 0);
        const itemsSold = eodItems.reduce((sum, i) => sum + i.quantity, 0);
        const cashTotal = eodPayments.filter((p) => p.payment_method === "cash").reduce((sum, p) => sum + Number(p.amount), 0);
        const cardTotal = eodPayments.filter((p) => p.payment_method === "card").reduce((sum, p) => sum + Number(p.amount), 0);

        const productTotals: Record<string, { units: number; revenue: number }> = {};
        for (const item of eodItems) {
          if (!productTotals[item.product_id]) productTotals[item.product_id] = { units: 0, revenue: 0 };
          productTotals[item.product_id].units += item.quantity;
          productTotals[item.product_id].revenue += Number(item.line_total);
        }
        const productMap = Object.fromEntries(products.map((p) => [p.product_id, p.product_name]));
        const topProducts = Object.entries(productTotals)
          .map(([pid, v]) => ({ name: productMap[pid] ?? pid.slice(0, 8), ...v }))
          .sort((a, b) => b.units - a.units);

        return (
          <div style={{ border: "1px solid #333", borderRadius: "8px", padding: "24px", marginBottom: "32px" }}>
            <h3 style={{ margin: "0 0 20px" }}>
              End-of-Day Summary — {today.toLocaleDateString()}
            </h3>

            <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", marginBottom: "24px" }}>
              {[
                { label: "Transactions", value: String(todaySales.length) },
                { label: "Gross Revenue", value: `$${grossRevenue.toFixed(2)}` },
                { label: "Items Sold", value: String(itemsSold) },
                { label: "Cash", value: `$${cashTotal.toFixed(2)}` },
                { label: "Card", value: `$${cardTotal.toFixed(2)}` },
              ].map((card) => (
                <div key={card.label} style={{ padding: "12px 20px", border: "1px solid #ccc", borderRadius: "8px", minWidth: "120px" }}>
                  <div style={{ fontSize: "12px", color: "#666" }}>{card.label}</div>
                  <div style={{ fontSize: "24px", fontWeight: "bold" }}>{card.value}</div>
                </div>
              ))}
            </div>

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
                  <tr><th>Time</th><th>Sale ID</th><th>Total</th><th>Payment</th></tr>
                </thead>
                <tbody>
                  {todaySales.length === 0 ? (
                    <tr><td colSpan={4}>No sales today</td></tr>
                  ) : (
                    todaySales.map((s) => {
                      const method = eodPayments.find((p) => p.sale_id === s.id)?.payment_method ?? "—";
                      return (
                        <tr key={s.id}>
                          <td>{new Date(s.created_at).toLocaleTimeString()}</td>
                          <td style={{ fontFamily: "monospace" }}>{s.id.slice(0, 8)}…</td>
                          <td>${Number(s.total).toFixed(2)}</td>
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

            {voidedToday > 0 && (
              <p style={{ color: "#999", fontSize: "13px", margin: 0 }}>
                {voidedToday} voided sale(s) excluded from summary.
              </p>
            )}
          </div>
        );
      })()}

      </div>{/* end pos */}

      {/* ── REPORTS TAB (2) ── */}
      <div style={{ display: activeTab === 'reports' ? '' : 'none' }}>

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

      {/* 5. Profit / Gross Margin Report */}
      <h3 style={{ marginTop: "32px", marginBottom: "8px" }}>Profit / Gross Margin</h3>
      <p style={{ fontSize: "12px", color: "#888", marginBottom: "12px" }}>
        Approximate profit based on current average cost
      </p>
      {(() => {
        const completedSaleIds = new Set(sales.filter(s => s.status === "completed").map(s => s.id));
        const completedItems = saleItems.filter(si => completedSaleIds.has(si.sale_id));
        const productMap = Object.fromEntries(products.map(p => [p.product_id, p]));

        let totalRevenue = 0;
        let totalCogs = 0;

        const byProduct: Record<string, { name: string; units: number; revenue: number; cogs: number }> = {};
        for (const si of completedItems) {
          const product = productMap[si.product_id];
          const cost = product ? product.average_cost * si.quantity : 0;
          totalRevenue += si.line_total;
          totalCogs += cost;
          if (!byProduct[si.product_id]) {
            byProduct[si.product_id] = { name: product?.product_name ?? si.product_id, units: 0, revenue: 0, cogs: 0 };
          }
          byProduct[si.product_id].units += si.quantity;
          byProduct[si.product_id].revenue += si.line_total;
          byProduct[si.product_id].cogs += cost;
        }

        const grossProfit = totalRevenue - totalCogs;
        const marginPct = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

        return (
          <>
            <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", marginBottom: "24px" }}>
              {[
                { label: "Total Revenue", value: `$${totalRevenue.toFixed(2)}` },
                { label: "Total COGS", value: `$${totalCogs.toFixed(2)}` },
                { label: "Gross Profit", value: `$${grossProfit.toFixed(2)}` },
                { label: "Gross Margin %", value: `${marginPct.toFixed(1)}%` },
              ].map(card => (
                <div key={card.label} style={{ border: "1px solid #ccc", borderRadius: "8px", padding: "16px", minWidth: "160px", flex: 1 }}>
                  <div style={{ fontSize: "12px", color: "#888" }}>{card.label}</div>
                  <div style={{ fontSize: "24px", fontWeight: "bold" }}>{card.value}</div>
                </div>
              ))}
            </div>
            <div style={{ overflowX: "auto" }}>
              <table border={1} cellPadding={10} style={{ width: "100%" }}>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Units Sold</th>
                    <th>Revenue</th>
                    <th>COGS</th>
                    <th>Gross Profit</th>
                    <th>Margin %</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(byProduct).length === 0 ? (
                    <tr><td colSpan={6}>No completed sales data</td></tr>
                  ) : (
                    Object.entries(byProduct).map(([pid, row]) => {
                      const gp = row.revenue - row.cogs;
                      const mp = row.revenue > 0 ? (gp / row.revenue) * 100 : 0;
                      return (
                        <tr key={pid}>
                          <td>{row.name}</td>
                          <td>{row.units}</td>
                          <td>${row.revenue.toFixed(2)}</td>
                          <td>${row.cogs.toFixed(2)}</td>
                          <td>${gp.toFixed(2)}</td>
                          <td>{mp.toFixed(1)}%</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </>
        );
      })()}

      </div>{/* end reports */}

      {/* ── INVENTORY TAB (4) ── */}
      <div style={{ display: activeTab === 'inventory' ? '' : 'none' }}>

      {/* Stock Take / Inventory Count */}
      <h2>Stock Take / Inventory Count</h2>
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
      <div style={{ display: activeTab === 'employees' ? '' : 'none' }}>

      {/* Employee / Cashier Management */}
      <h2 style={{ marginTop: "40px" }}>Employee Management</h2>

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
      <div style={{ display: activeTab === 'settings' ? '' : 'none' }}>

      <h2 style={{ marginTop: "40px" }}>Business Profile / Store Settings</h2>

      {!editingBusiness ? (
        <div style={{ background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: "8px", padding: "20px", maxWidth: "480px", marginBottom: "16px" }}>
          <p style={{ margin: "0 0 8px" }}><strong>Name:</strong> {businessName || "—"}</p>
          <p style={{ margin: "0 0 8px" }}><strong>Phone:</strong> {businessPhone || "—"}</p>
          <p style={{ margin: "0 0 8px" }}><strong>Email:</strong> {businessEmail || "—"}</p>
          <p style={{ margin: "0 0 16px" }}><strong>Address:</strong> {businessAddress || "—"}</p>
          <button
            onClick={() => {
              setEditBizName(businessName);
              setEditBizPhone(businessPhone);
              setEditBizEmail(businessEmail);
              setEditBizAddress(businessAddress);
              setEditingBusiness(true);
            }}
            style={{ padding: "8px 20px", cursor: "pointer" }}
          >Edit</button>
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
          <div style={{ display: "flex", gap: "8px" }}>
            <button type="submit" style={{ padding: "8px 20px", cursor: "pointer", background: "#1d4ed8", color: "#fff", border: "none", borderRadius: "4px" }}>Save</button>
            <button type="button" onClick={() => setEditingBusiness(false)} style={{ padding: "8px 20px", cursor: "pointer" }}>Cancel</button>
          </div>
        </form>
      )}

      </div>{/* end settings */}

      {receipt && (() => {
        const productMap = Object.fromEntries(products.map((p) => [p.product_id, p.product_name]));
        return (
          <>
            <style>{`
              @media print {
                body > * { display: none !important; }
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
                <div style={{ textAlign: "center", fontWeight: "bold", fontSize: "16px", marginBottom: "4px" }}>{businessName || "WEGN-STORE"}</div>
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
