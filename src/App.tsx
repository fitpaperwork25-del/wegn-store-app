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
};

function App() {
  const [products, setProducts] = useState<ProductStock[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
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

  useEffect(() => {
    loadBusinessId();
    loadProducts();
    loadTransactions();
    loadSuppliers();
    loadPurchaseOrders();
  }, []);

  async function loadBusinessId() {
    const { data } = await supabase
      .from("businesses")
      .select("id")
      .limit(1)
      .single();
    if (data) setBusinessId(data.id);
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
          status
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

      <h2>Dashboard</h2>

      <div style={{ display: "flex", gap: "24px", flexWrap: "wrap", marginBottom: "24px" }}>
        <div style={{ padding: "16px 24px", border: "1px solid #ccc", borderRadius: "8px", minWidth: "140px" }}>
          <div style={{ fontSize: "13px", color: "#666" }}>Total Products</div>
          <div style={{ fontSize: "28px", fontWeight: "bold" }}>{products.length}</div>
        </div>
        <div style={{ padding: "16px 24px", border: "1px solid #ccc", borderRadius: "8px", minWidth: "140px" }}>
          <div style={{ fontSize: "13px", color: "#666" }}>Low Stock Items</div>
          <div style={{ fontSize: "28px", fontWeight: "bold", color: products.filter(p => p.quantity_on_hand <= p.reorder_level).length > 0 ? "red" : "inherit" }}>
            {products.filter(p => p.quantity_on_hand <= p.reorder_level).length}
          </div>
        </div>
        <div style={{ padding: "16px 24px", border: "1px solid #ccc", borderRadius: "8px", minWidth: "140px" }}>
          <div style={{ fontSize: "13px", color: "#666" }}>Total Suppliers</div>
          <div style={{ fontSize: "28px", fontWeight: "bold" }}>{suppliers.length}</div>
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
            </tr>
          </thead>

          <tbody>
            {products.map((product, index) => {
              const isLowStock = product.quantity_on_hand <= product.reorder_level;
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
                </tr>
              </thead>
              <tbody>
                {purchaseOrders.length === 0 ? (
                  <tr>
                    <td colSpan={6}>No purchase orders found</td>
                  </tr>
                ) : (
                  purchaseOrders.map((po) => (
                    <tr key={po.id}>
                      <td>{po.po_number}</td>
                      <td>{supplierMap[po.supplier_id] ?? "Unknown"}</td>
                      <td>{po.status}</td>
                      <td>${Number(po.subtotal ?? 0).toFixed(2)}</td>
                      <td>{po.notes || "-"}</td>
                      <td>{new Date(po.created_at).toLocaleString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
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
    </div>
  );
}

export default App;
