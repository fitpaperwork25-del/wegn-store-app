import { useEffect, useState } from "react";
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
  customer_id: string | null;
  subtotal: number;
  tax: number;
  total: number;
  status: string;
  created_at: string;
};

type Customer = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
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
  const [bulkPreview, setBulkPreview] = useState<BulkRow[]>([]);
  const [bulkResults, setBulkResults] = useState<{ imported: number; skipped: number; failed: number } | null>(null);
  const [bulkImporting, setBulkImporting] = useState(false);

  useEffect(() => {
    loadBusinessId();
    loadProducts();
    loadTransactions();
    loadSuppliers();
    loadPurchaseOrders();
    loadSales();
    loadSaleItems();
    loadCustomers();
  }, []);

  async function loadBusinessId() {
    const { data } = await supabase
      .from("businesses")
      .select("id")
      .limit(1)
      .single();
    if (data) setBusinessId(data.id);
  }

  async function loadSaleItems() {
    const { data, error } = await supabase
      .from("sale_items")
      .select("sale_id, product_id, quantity, unit_price, line_total");
    if (error) { console.error(error); return; }
    setSaleItems((data as SaleItemRecord[]) || []);
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
      .select("id, name, phone, email, created_at")
      .order("created_at", { ascending: false });
    if (error) { console.error(error); return; }
    setCustomers((data as Customer[]) || []);
  }

  function handleLookupCustomer() {
    const phone = posCustomerPhone.trim();
    if (!phone) return;
    const match = customers.find(c => c.phone === phone);
    if (match) {
      setPosCustomerId(match.id);
      setPosCustomerName(match.name);
      setMessage(`Customer: ${match.name}`);
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

  async function loadSales() {
    const { data, error } = await supabase
      .from("sales")
      .select("id, customer_id, subtotal, tax, total, status, created_at")
      .order("created_at", { ascending: false })
      .limit(20);
    if (error) { console.error(error); return; }
    setSales((data as Sale[]) || []);
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

    setReceipt({
      sale,
      items: items as ReceiptItem[],
      paymentMethod: payments?.payment_method ?? "—",
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

    for (const item of cart) {
      const product = products.find((p) => p.product_id === item.product_id);
      if (!product || item.quantity > product.quantity_on_hand) {
        setMessage(`Insufficient stock for ${item.product_name}`);
        return;
      }
    }

    const subtotal = cart.reduce((sum, c) => sum + c.line_total, 0);

    const { data: sale, error: saleErr } = await supabase
      .from("sales")
      .insert({ subtotal, tax: 0, total: subtotal, status: "completed", customer_id: posCustomerId || null })
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
      .insert({ sale_id: sale.id, payment_method: paymentMethod, amount: subtotal });

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

    setCart([]);
    setAmountTendered("");
    setPosCustomerPhone("");
    setPosCustomerId(null);
    setPosCustomerName("");
    setMessage("Sale completed");
    await loadProducts();
    await loadTransactions();
    await loadSales();
    await loadSaleItems();
    await loadCustomers();
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
    setMessage("Product added successfully");
    await loadProducts();
    await loadTransactions();
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
      <h1>Wegn-Store</h1>

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
          {products.filter((p) => p.quantity_on_hand > 0).map((p) => (
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
          <span style={{ color: "#15803d", fontWeight: "bold" }}>{posCustomerName}</span>
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
                <tr>
                  <td colSpan={3} style={{ fontWeight: "bold", textAlign: "right" }}>Total</td>
                  <td style={{ fontWeight: "bold" }}>
                    ${cart.reduce((s, c) => s + c.line_total, 0).toFixed(2)}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>

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
            {paymentMethod === "cash" && (
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
                {Number(amountTendered) >= cart.reduce((s, c) => s + c.line_total, 0) && amountTendered !== "" && (
                  <span style={{ fontWeight: "bold", color: "#15803d" }}>
                    Change: ${(Number(amountTendered) - cart.reduce((s, c) => s + c.line_total, 0)).toFixed(2)}
                  </span>
                )}
              </>
            )}
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

      {message && <p>{message}</p>}

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
          onChange={(e) => setNewBarcode(e.target.value)}
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

      <h2>Dashboard</h2>

      <div style={{ display: "flex", gap: "24px", flexWrap: "wrap", marginBottom: "24px" }}>
        <div style={{ padding: "16px 24px", border: "1px solid #ccc", borderRadius: "8px", minWidth: "140px" }}>
          <div style={{ fontSize: "13px", color: "#666" }}>Total Products</div>
          <div style={{ fontSize: "28px", fontWeight: "bold" }}>{products.length}</div>
        </div>
        <div style={{ padding: "16px 24px", border: "1px solid #ccc", borderRadius: "8px", minWidth: "140px" }}>
          <div style={{ fontSize: "13px", color: "#666" }}>Low Stock Items</div>
          <div style={{ fontSize: "28px", fontWeight: "bold", color: products.filter(p => p.quantity_on_hand < p.reorder_level).length > 0 ? "red" : "inherit" }}>
            {products.filter(p => p.quantity_on_hand < p.reorder_level).length}
          </div>
        </div>
        <div style={{ padding: "16px 24px", border: "1px solid #ccc", borderRadius: "8px", minWidth: "140px" }}>
          <div style={{ fontSize: "13px", color: "#666" }}>Total Suppliers</div>
          <div style={{ fontSize: "28px", fontWeight: "bold" }}>{suppliers.length}</div>
        </div>
        <div style={{ padding: "16px 24px", border: "1px solid #ccc", borderRadius: "8px", minWidth: "140px" }}>
          <div style={{ fontSize: "13px", color: "#666" }}>Total Inventory Value</div>
          <div style={{ fontSize: "28px", fontWeight: "bold" }}>
            ${products.reduce((sum, p) => sum + p.quantity_on_hand * p.average_cost, 0).toFixed(2)}
          </div>
        </div>
        <div style={{ padding: "16px 24px", border: "1px solid #ccc", borderRadius: "8px", minWidth: "140px" }}>
          <div style={{ fontSize: "13px", color: "#666" }}>Today's Revenue</div>
          <div style={{ fontSize: "28px", fontWeight: "bold", color: "#1d4ed8" }}>
            ${sales
              .filter((s) => {
                const d = new Date(s.created_at);
                const now = new Date();
                return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
              })
              .reduce((sum, s) => sum + Number(s.total), 0)
              .toFixed(2)}
          </div>
        </div>
      </div>

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
            </tr>
          </thead>

          <tbody>
            {products.map((product, index) => {
              const isLowStock = product.quantity_on_hand < product.reorder_level;
              return (
                <tr key={index} style={{ backgroundColor: isLowStock ? "#ffe5e5" : "inherit" }}>
                  <td>{product.product_name}</td>
                  <td>{product.sku}</td>
                  <td>{product.barcode}</td>
                  <td>${product.selling_price}</td>
                  <td>{product.quantity_on_hand}</td>
                  <td>{product.reorder_level}</td>
                  <td style={{ color: isLowStock ? "red" : "inherit", fontWeight: isLowStock ? "bold" : "normal" }}>
                    {isLowStock ? "LOW STOCK" : "OK"}
                  </td>
                  <td>{product.status}</td>
                  <td>${product.average_cost.toFixed(2)}</td>
                  <td>${(product.quantity_on_hand * product.average_cost).toFixed(2)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
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
            </tr>
          </thead>
          <tbody>
            {suppliers.length === 0 ? (
              <tr>
                <td colSpan={6}>No suppliers found</td>
              </tr>
            ) : (
              suppliers.map((s) => (
                <tr key={s.id}>
                  <td>{s.name}</td>
                  <td>{s.contact_name}</td>
                  <td>{s.phone}</td>
                  <td>{s.email}</td>
                  <td>{s.notes}</td>
                  <td>{s.status}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <h2 style={{ marginTop: "40px" }}>Reorder Center</h2>

      {(() => {
        const lowStock = products.filter((p) => p.quantity_on_hand < p.reorder_level);
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
                        {suppliers.map((s) => (
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
          return { ...c, visitCount: custSales.length, totalSpend, lastVisit };
        });
        return (
          <div style={{ overflowX: "auto", marginBottom: "40px" }}>
            <table border={1} cellPadding={10} style={{ width: "100%" }}>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Phone</th>
                  <th>Email</th>
                  <th>Visits</th>
                  <th>Total Spend</th>
                  <th>Last Visit</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr><td colSpan={6}>No customers yet</td></tr>
                ) : (
                  rows.map((row) => {
                    const isExpanded = expandedCustomerId === row.id;
                    const custSales = sales.filter(s => s.customer_id === row.id);
                    return (
                      <>
                        <tr
                          key={row.id}
                          onClick={() => setExpandedCustomerId(isExpanded ? null : row.id)}
                          style={{ cursor: "pointer", background: isExpanded ? "#f0f4ff" : undefined }}
                        >
                          <td>{isExpanded ? "▾" : "▸"} {row.name}</td>
                          <td>{row.phone}</td>
                          <td>{row.email ?? "—"}</td>
                          <td>{row.visitCount}</td>
                          <td>${row.totalSpend.toFixed(2)}</td>
                          <td>{row.lastVisit ? row.lastVisit.toLocaleDateString() : "—"}</td>
                        </tr>
                        {isExpanded && (
                          <tr key={`${row.id}-history`}>
                            <td colSpan={6} style={{ background: "#f8f9ff", padding: "16px" }}>
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
                            </td>
                          </tr>
                        )}
                      </>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        );
      })()}

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
          {suppliers.map((s) => (
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
                  purchaseOrders.map((po) => (
                    <tr key={po.id} style={{ backgroundColor: selectedPoId === po.id ? "#f0f4ff" : "inherit" }}>
                      <td>{po.po_number}</td>
                      <td>{supplierMap[po.supplier_id] ?? "Unknown"}</td>
                      <td>{po.status}</td>
                      <td>${Number(po.subtotal ?? 0).toFixed(2)}</td>
                      <td>{po.notes || "-"}</td>
                      <td>{new Date(po.created_at).toLocaleString()}</td>
                      <td style={{ display: "flex", gap: "6px" }}>
                        <button onClick={() => handleSelectPO(po)} style={{ padding: "4px 10px" }}>
                          {selectedPoId === po.id ? "Close" : "View/Edit"}
                        </button>
                        {po.status !== "received" && (
                          <button
                            onClick={() => handleOpenReceive(po)}
                            style={{ padding: "4px 10px", background: receivingPoId === po.id ? "#d1fae5" : undefined }}
                          >
                            {receivingPoId === po.id ? "Cancel" : "Receive"}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        );
      })()}

      {selectedPoId && (() => {
        const po = purchaseOrders.find((p) => p.id === selectedPoId);
        const productMap = Object.fromEntries(
          products.map((p) => [p.product_id, p.product_name])
        );
        return (
          <div style={{ marginTop: "32px", padding: "20px", border: "1px solid #ccc", borderRadius: "8px", marginBottom: "32px" }}>
            <h3 style={{ margin: "0 0 16px" }}>
              PO Detail — {po?.po_number}
            </h3>

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

            <div style={{ overflowX: "auto" }}>
              <table border={1} cellPadding={10} style={{ width: "100%" }}>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Quantity</th>
                    <th>Unit Cost</th>
                    <th>Line Total</th>
                  </tr>
                </thead>
                <tbody>
                  {poItems.length === 0 ? (
                    <tr>
                      <td colSpan={4}>No items yet</td>
                    </tr>
                  ) : (
                    poItems.map((item) => (
                      <tr key={item.id}>
                        <td>{productMap[item.product_id] ?? "Unknown"}</td>
                        <td>{item.quantity}</td>
                        <td>${Number(item.unit_cost).toFixed(2)}</td>
                        <td>${Number(item.line_total).toFixed(2)}</td>
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

      <h2 style={{ marginTop: "40px" }}>Sales History</h2>

      <div style={{ overflowX: "auto", marginBottom: "40px" }}>
        <table border={1} cellPadding={10} style={{ width: "100%" }}>
          <thead>
            <tr>
              <th>Sale ID</th>
              <th>Total</th>
              <th>Tax</th>
              <th>Status</th>
              <th>Created At</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {sales.length === 0 ? (
              <tr><td colSpan={6}>No sales yet</td></tr>
            ) : (
              sales.map((s) => (
                <tr key={s.id} style={{ backgroundColor: s.status === "voided" ? "#f5f5f5" : "inherit", color: s.status === "voided" ? "#999" : "inherit" }}>
                  <td style={{ fontFamily: "monospace" }}>{s.id.slice(0, 8)}…</td>
                  <td>${Number(s.total).toFixed(2)}</td>
                  <td>${Number(s.tax).toFixed(2)}</td>
                  <td>{s.status}</td>
                  <td>{new Date(s.created_at).toLocaleString()}</td>
                  <td style={{ display: "flex", gap: "6px" }}>
                    <button
                      onClick={() => handlePrintReceipt(s)}
                      style={{ padding: "3px 10px", cursor: "pointer" }}
                    >
                      Print
                    </button>
                    {s.status === "completed" && (
                      <button
                        onClick={() => handleVoidSale(s.id)}
                        disabled={voidingId === s.id}
                        style={{ padding: "3px 10px", color: "#b91c1c", cursor: "pointer" }}
                      >
                        Void
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

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

            {voidedToday > 0 && (
              <p style={{ color: "#999", fontSize: "13px", margin: 0 }}>
                {voidedToday} voided sale(s) excluded from summary.
              </p>
            )}
          </div>
        );
      })()}

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
                <div style={{ textAlign: "center", fontWeight: "bold", fontSize: "16px", marginBottom: "4px" }}>WEGN-STORE</div>
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
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>Tax</span><span>${Number(receipt.sale.tax).toFixed(2)}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "bold", fontSize: "15px", marginTop: "4px" }}>
                    <span>TOTAL</span><span>${Number(receipt.sale.total).toFixed(2)}</span>
                  </div>
                  <div style={{ marginTop: "4px" }}>Payment: {receipt.paymentMethod}</div>
                </div>

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
