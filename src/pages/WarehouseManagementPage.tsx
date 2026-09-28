import { type FormEvent, type ReactNode, useEffect, useState } from "react";
import {
  createWarehouseAdjustment,
  createWarehouseReceipt,
  createWarehouseStockCount,
  createWarehouseTransfer,
  decideWarehouseTransfer,
  dispatchWarehouseTransfer,
  getAdminInventory,
  getAdminStores,
  getWarehouseLedger,
  getWarehouseOverview,
  getWarehouseReturns,
  getWarehouseStock,
  getWarehouseTransfers,
  inventoryUnitOptions,
  receiveWarehouseReturn,
  type AdminInventoryItem,
  type AdminStore,
  type WarehouseOverview,
  type WarehouseReturn,
  type WarehouseStockRow,
  type WarehouseTransaction,
  type WarehouseTransfer,
} from "../api/admin";
import { EmptyState, ErrorState, LoadingState } from "../components/PageStates";

type Props = { pathname: string; onNavigate: (path: string) => void };
type TransferLine = { inventoryItemId: string; quantity: string; unit: string };

export function WarehouseManagementPage({ pathname, onNavigate }: Props) {
  const section = pathname.split("/")[2] || "overview";
  const [overview, setOverview] = useState<WarehouseOverview | null>(null);
  const [stock, setStock] = useState<WarehouseStockRow[]>([]);
  const [inventory, setInventory] = useState<AdminInventoryItem[]>([]);
  const [stores, setStores] = useState<AdminStore[]>([]);
  const [transfers, setTransfers] = useState<WarehouseTransfer[]>([]);
  const [returns, setReturns] = useState<WarehouseReturn[]>([]);
  const [ledger, setLedger] = useState<WarehouseTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function load() {
    setIsLoading(true);
    setError(null);
    try {
      const [overviewData, stockData, inventoryData, storesData, transfersData, returnsData, ledgerData] = await Promise.all([
        getWarehouseOverview(),
        getWarehouseStock(),
        getAdminInventory(),
        getAdminStores(),
        getWarehouseTransfers(),
        getWarehouseReturns(),
        getWarehouseLedger(),
      ]);
      setOverview(overviewData);
      setStock(stockData.stock);
      setInventory(inventoryData.inventory);
      setStores(storesData.stores);
      setTransfers(transfersData.transfers);
      setReturns(returnsData.returns);
      setLedger(ledgerData.transactions);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to load warehouse data");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  const title = section === "receive" ? "Receive inventory" : section === "transfers" ? "Warehouse transfers" : section === "adjustments" ? "Adjustments & stock counts" : section === "returns" ? "Store returns" : section === "ledger" ? "Inventory ledger" : "Central Warehouse";
  const description = section === "overview" ? "One clear view of warehouse stock, value, risk, and movement." : "Every quantity change is recorded with a reason and audit reference.";

  return (
    <div className="page-stack">
      <div className="resource-toolbar">
        <div><p className="eyebrow">Admin Warehouse</p><h2>{title}</h2><p className="page-description">{description}</p></div>
        <button type="button" className="secondary-button" onClick={() => void load()}>Refresh</button>
      </div>
      <div className="module-tabs" aria-label="Warehouse sections">
        {[["/warehouse", "Overview"], ["/warehouse/receive", "Receive"], ["/warehouse/transfers", "Transfers"], ["/warehouse/adjustments", "Adjustments"], ["/warehouse/returns", "Returns"], ["/warehouse/ledger", "Ledger"]].map(([path, label]) => <button key={path} type="button" className={pathname.replace(/\/$/, "") === path ? "module-tab module-tab-active" : "module-tab"} onClick={() => onNavigate(path)}>{label}</button>)}
      </div>
      {isLoading ? <LoadingState title="Loading warehouse" message="Preparing stock balances and movement history..." /> : null}
      {error ? <ErrorState title="Warehouse unavailable" message={error} /> : null}
      {success ? <section className="state-panel" role="status"><div><h2>Saved</h2><p>{success}</p></div></section> : null}
      {!isLoading && !error && section === "overview" && overview ? <WarehouseOverviewPanel overview={overview} stock={stock} onNavigate={onNavigate} /> : null}
      {!isLoading && !error && section === "receive" ? <ReceiveInventoryPanel inventory={inventory} onSaved={(message) => { setSuccess(message); void load(); }} /> : null}
      {!isLoading && !error && section === "transfers" ? <TransferPanel inventory={inventory} stores={stores} transfers={transfers} onChanged={(message) => { setSuccess(message); void load(); }} /> : null}
      {!isLoading && !error && section === "adjustments" ? <AdjustmentPanel inventory={inventory} stores={stores} onSaved={(message) => { setSuccess(message); void load(); }} /> : null}
      {!isLoading && !error && section === "returns" ? <ReturnsPanel returns={returns} onChanged={(message) => { setSuccess(message); void load(); }} /> : null}
      {!isLoading && !error && section === "ledger" ? <LedgerPanel transactions={ledger} /> : null}
    </div>
  );
}

function WarehouseOverviewPanel({ overview, stock, onNavigate }: { overview: WarehouseOverview; stock: WarehouseStockRow[]; onNavigate: (path: string) => void }) {
  const cards = [["Products", overview.counts.products], ["Stock units", formatNumber(overview.counts.totalStockUnits)], ["Low stock", overview.counts.lowStockProducts], ["Out of stock", overview.counts.outOfStockProducts], ["Pending transfers", overview.counts.pendingTransfers], ["Inventory value", formatMoney(overview.inventoryValueCents)]];
  return <>
    <div className="summary-grid">{cards.map(([label, value]) => <article className="summary-card" key={String(label)}><span>{label}</span><strong>{value}</strong></article>)}</div>
    <div className="content-grid content-grid-two">
      <section className="table-panel"><div className="panel-heading"><div><p className="eyebrow">Central stock</p><h3>Current warehouse stock</h3></div><button type="button" onClick={() => onNavigate("/warehouse/receive")}>Receive stock</button></div>{stock.length === 0 ? <EmptyState title="No warehouse stock yet" message="Receive your first inventory item to start the ledger." /> : <StockTable rows={stock} />}</section>
      <section className="related-panel"><p className="eyebrow">Category view</p><h3>Stock by category</h3><div className="related-list">{overview.categories.map((category) => <div className="related-row" key={category.category}><strong>{category.category}</strong><span>{formatNumber(category.quantity)} units</span></div>)}</div></section>
    </div>
  </>;
}

function StockTable({ rows }: { rows: WarehouseStockRow[] }) {
  return <table className="data-table"><thead><tr><th>Product</th><th>Category</th><th>Supplier</th><th>On hand</th><th>Minimum</th><th>Status</th></tr></thead><tbody>{rows.map((row) => <tr key={row._id}><td><strong>{row.item?.name ?? "Unavailable"}</strong><span>{row.item?.sku}</span></td><td>{row.item?.category}</td><td>{row.item?.supplier ?? "—"}</td><td>{formatNumber(row.quantityOnHand)} {row.item?.baseUnit}</td><td>{formatNumber(row.item?.minimumStockLevel ?? row.reorderPoint)}</td><td><span className={`status-badge status-badge-${row.status}`}>{formatTitle(row.status)}</span></td></tr>)}</tbody></table>;
}

function ReceiveInventoryPanel({ inventory, onSaved }: { inventory: AdminInventoryItem[]; onSaved: (message: string) => void }) {
  const [form, setForm] = useState({ inventoryItemId: "", quantity: "", unit: "", supplier: "", invoiceNumber: "", batchNumber: "", expiryDate: "", notes: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const selected = inventory.find((item) => item._id === form.inventoryItemId);
  function change(name: string, value: string) { setForm((current) => ({ ...current, [name]: value, ...(name === "inventoryItemId" ? { unit: inventory.find((item) => item._id === value)?.purchaseUnit ?? "" } : {}) })); }
  async function submit(event: FormEvent) { event.preventDefault(); setError(null); if (!form.inventoryItemId || !form.quantity || Number(form.quantity) <= 0 || !form.supplier.trim()) { setError("Select a product, enter a positive quantity, and provide the supplier."); return; } setSaving(true); try { const result = await createWarehouseReceipt({ ...form, quantity: Number(form.quantity), expiryDate: form.expiryDate || undefined }); onSaved(`Receipt ${result.receipt.transactionNumber} posted. Warehouse balance is now ${result.receipt.warehouseQuantity}.`); setForm({ inventoryItemId: "", quantity: "", unit: "", supplier: "", invoiceNumber: "", batchNumber: "", expiryDate: "", notes: "" }); } catch (caught) { setError(caught instanceof Error ? caught.message : "Unable to post receipt"); } finally { setSaving(false); } }
  return <form className="store-form" onSubmit={submit}><section><h3>Receive from supplier</h3><p className="form-hint">Receiving increases Central Warehouse stock and creates a permanent ledger entry.</p><div className="form-grid"><Field label="Product *"><select value={form.inventoryItemId} onChange={(event) => change("inventoryItemId", event.target.value)}><option value="">Select product</option>{inventory.map((item) => <option value={item._id} key={item._id}>{item.name} ({item.sku})</option>)}</select></Field><Field label={`Quantity${selected ? ` in ${selected.purchaseUnit}` : " *"}`}><input type="number" min="0.000001" step="0.000001" value={form.quantity} onChange={(event) => change("quantity", event.target.value)} /></Field><Field label="Unit *"><select value={form.unit} onChange={(event) => change("unit", event.target.value)}><option value="">Select unit</option>{inventoryUnitOptions.map((unit) => <option value={unit.value} key={unit.value}>{unit.label}</option>)}</select></Field><Field label="Supplier *"><input value={form.supplier} onChange={(event) => change("supplier", event.target.value)} placeholder="ABC Coffee Supplier" /></Field><Field label="Invoice number"><input value={form.invoiceNumber} onChange={(event) => change("invoiceNumber", event.target.value)} /></Field><Field label="Batch number"><input value={form.batchNumber} onChange={(event) => change("batchNumber", event.target.value)} /></Field><Field label="Expiry date"><input type="date" value={form.expiryDate} onChange={(event) => change("expiryDate", event.target.value)} /></Field><Field label="Notes"><input value={form.notes} onChange={(event) => change("notes", event.target.value)} /></Field></div></section>{error ? <ErrorState title="Receipt not saved" message={error} /> : null}<div className="form-actions"><button type="submit" disabled={saving}>{saving ? "Posting..." : "Post receipt"}</button></div></form>;
}

function TransferPanel({ inventory, stores, transfers, onChanged }: { inventory: AdminInventoryItem[]; stores: AdminStore[]; transfers: WarehouseTransfer[]; onChanged: (message: string) => void }) {
  const [destinationStoreId, setDestinationStoreId] = useState("");
  const [lines, setLines] = useState<TransferLine[]>([{ inventoryItemId: "", quantity: "", unit: "" }]);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  function updateLine(index: number, key: keyof TransferLine, value: string) { setLines((current) => current.map((line, lineIndex) => lineIndex === index ? { ...line, [key]: value, ...(key === "inventoryItemId" ? { unit: inventory.find((item) => item._id === value)?.baseUnit ?? "" } : {}) } : line)); }
  async function submit(event: FormEvent) { event.preventDefault(); setError(null); if (!destinationStoreId || lines.some((line) => !line.inventoryItemId || Number(line.quantity) <= 0 || !line.unit)) { setError("Choose a destination and complete every transfer line."); return; } setSaving(true); try { const result = await createWarehouseTransfer({ destinationStoreId, notes: notes.trim() || undefined, lines: lines.map((line) => ({ ...line, quantity: Number(line.quantity) })) }); onChanged(`${result.transfer.transferNumber} is pending approval.`); setDestinationStoreId(""); setLines([{ inventoryItemId: "", quantity: "", unit: "" }]); setNotes(""); } catch (caught) { setError(caught instanceof Error ? caught.message : "Unable to create transfer"); } finally { setSaving(false); } }
  async function action(transfer: WarehouseTransfer, type: "approve" | "reject" | "dispatch") { try { if (type === "dispatch") await dispatchWarehouseTransfer(transfer._id); else await decideWarehouseTransfer(transfer._id, type); onChanged(`${transfer.transferNumber} was ${type === "dispatch" ? "dispatched" : `${type}d`}.`); } catch (caught) { setError(caught instanceof Error ? caught.message : "Transfer action failed"); } }
  return <div className="content-grid content-grid-two"><form className="store-form" onSubmit={submit}><section><h3>Create warehouse transfer</h3><p className="form-hint">Transfers move stock out of the Central Warehouse only after approval and dispatch.</p><Field label="Destination store *"><select value={destinationStoreId} onChange={(event) => setDestinationStoreId(event.target.value)}><option value="">Select store</option>{stores.map((store) => <option value={store._id} key={store._id}>{store.name} ({store.storeNumber})</option>)}</select></Field>{lines.map((line, index) => <div className="form-grid packaging-level-row" key={index}><Field label={`Product ${index + 1} *`}><select value={line.inventoryItemId} onChange={(event) => updateLine(index, "inventoryItemId", event.target.value)}><option value="">Select product</option>{inventory.map((item) => <option value={item._id} key={item._id}>{item.name}</option>)}</select></Field><Field label="Quantity *"><input type="number" min="0.000001" step="0.000001" value={line.quantity} onChange={(event) => updateLine(index, "quantity", event.target.value)} /></Field><Field label="Unit *"><select value={line.unit} onChange={(event) => updateLine(index, "unit", event.target.value)}><option value="">Select unit</option>{inventoryUnitOptions.map((unit) => <option value={unit.value} key={unit.value}>{unit.label}</option>)}</select></Field>{lines.length > 1 ? <button type="button" className="secondary-button" onClick={() => setLines((current) => current.filter((_line, lineIndex) => lineIndex !== index))}>Remove</button> : null}</div>)}<button type="button" className="secondary-button" onClick={() => setLines((current) => [...current, { inventoryItemId: "", quantity: "", unit: "" }])}>Add product</button><Field label="Notes"><textarea value={notes} onChange={(event) => setNotes(event.target.value)} /></Field></section>{error ? <ErrorState title="Transfer action failed" message={error} /> : null}<div className="form-actions"><button type="submit" disabled={saving}>{saving ? "Saving..." : "Create transfer"}</button></div></form><section className="table-panel"><div className="panel-heading"><div><p className="eyebrow">Controlled movement</p><h3>Transfers</h3></div></div>{transfers.length === 0 ? <EmptyState title="No transfers" message="Created transfers will appear here." /> : <table className="data-table"><thead><tr><th>Transfer</th><th>Store</th><th>Items</th><th>Status</th><th>Actions</th></tr></thead><tbody>{transfers.map((transfer) => <tr key={transfer._id}><td><strong>{transfer.transferNumber}</strong><span>{formatDate(transfer.createdAt)}</span></td><td>{transfer.store?.name ?? "Unavailable"}</td><td>{transfer.lines.length}</td><td><span className={`status-badge status-badge-${transfer.status}`}>{formatTitle(transfer.status)}</span></td><td><div className="table-actions">{transfer.status === "pending_approval" ? <><button type="button" onClick={() => void action(transfer, "approve")}>Approve</button><button type="button" className="secondary-button" onClick={() => void action(transfer, "reject")}>Reject</button></> : null}{transfer.status === "approved" ? <button type="button" onClick={() => void action(transfer, "dispatch")}>Dispatch</button> : null}</div></td></tr>)}</tbody></table>}</section></div>;
}

function AdjustmentPanel({ inventory, stores, onSaved }: { inventory: AdminInventoryItem[]; stores: AdminStore[]; onSaved: (message: string) => void }) {
  const [form, setForm] = useState({ inventoryItemId: "", quantityDelta: "", locationType: "warehouse" as "warehouse" | "store", storeId: "", reason: "", notes: "" });
  const [count, setCount] = useState({ inventoryItemId: "", physicalQuantity: "", locationType: "warehouse" as "warehouse" | "store", storeId: "", reason: "" });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  async function submitAdjustment(event: FormEvent) { event.preventDefault(); setError(null); if (!form.inventoryItemId || !form.reason.trim() || !form.quantityDelta || (form.locationType === "store" && !form.storeId)) { setError("Complete the product, change, location, and reason."); return; } setSaving(true); try { const result = await createWarehouseAdjustment({ ...form, quantityDelta: Number(form.quantityDelta), storeId: form.storeId || undefined }); onSaved(`Adjustment ${result.adjustment.transactionNumber} posted. New balance: ${result.adjustment.quantityAfter}.`); setForm({ ...form, quantityDelta: "", reason: "", notes: "" }); } catch (caught) { setError(caught instanceof Error ? caught.message : "Unable to post adjustment"); } finally { setSaving(false); } }
  async function submitCount(event: FormEvent) { event.preventDefault(); setError(null); if (!count.inventoryItemId || !count.physicalQuantity || !count.reason.trim() || (count.locationType === "store" && !count.storeId)) { setError("Complete the stock count fields and reason."); return; } setSaving(true); try { const result = await createWarehouseStockCount({ ...count, physicalQuantity: Number(count.physicalQuantity), storeId: count.storeId || undefined }); onSaved(`Stock count ${result.stockCount.transactionNumber} posted. Difference: ${result.stockCount.difference}.`); setCount({ ...count, physicalQuantity: "", reason: "" }); } catch (caught) { setError(caught instanceof Error ? caught.message : "Unable to post stock count"); } finally { setSaving(false); } }
  return <div className="content-grid content-grid-two"><form className="store-form" onSubmit={submitAdjustment}><section><p className="eyebrow">Controlled change</p><h3>Inventory adjustment</h3><p className="form-hint">Use a positive number for stock added and a negative number for damage, loss, or correction.</p><WarehouseLocationFields form={form} setForm={setForm} inventory={inventory} stores={stores} /><Field label="Quantity change *"><input type="number" step="0.000001" value={form.quantityDelta} onChange={(event) => setForm({ ...form, quantityDelta: event.target.value })} /></Field><Field label="Reason *"><input value={form.reason} onChange={(event) => setForm({ ...form, reason: event.target.value })} placeholder="Damaged, lost, or corrected" /></Field><Field label="Notes"><textarea value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} /></Field></section><div className="form-actions"><button type="submit" disabled={saving}>{saving ? "Saving..." : "Post adjustment"}</button></div></form><form className="store-form" onSubmit={submitCount}><section><p className="eyebrow">Physical verification</p><h3>Stock count</h3><p className="form-hint">The system calculates the difference and records the resulting adjustment.</p><WarehouseLocationFields form={count} setForm={setCount} inventory={inventory} stores={stores} /><Field label="Physical quantity *"><input type="number" min="0" step="0.000001" value={count.physicalQuantity} onChange={(event) => setCount({ ...count, physicalQuantity: event.target.value })} /></Field><Field label="Reason *"><input value={count.reason} onChange={(event) => setCount({ ...count, reason: event.target.value })} placeholder="Physical count difference" /></Field></section><div className="form-actions"><button type="submit" disabled={saving}>{saving ? "Saving..." : "Post stock count"}</button></div></form>{error ? <ErrorState title="Inventory change failed" message={error} /> : null}</div>;
}

function WarehouseLocationFields({ form, setForm, inventory, stores }: { form: { inventoryItemId: string; locationType: "warehouse" | "store"; storeId: string }; setForm: (value: any) => void; inventory: AdminInventoryItem[]; stores: AdminStore[] }) { return <div className="form-grid"><Field label="Product *"><select value={form.inventoryItemId} onChange={(event) => setForm({ ...form, inventoryItemId: event.target.value })}><option value="">Select product</option>{inventory.map((item) => <option value={item._id} key={item._id}>{item.name} ({item.sku})</option>)}</select></Field><Field label="Location *"><select value={form.locationType} onChange={(event) => setForm({ ...form, locationType: event.target.value as "warehouse" | "store", storeId: "" })}><option value="warehouse">Central Warehouse</option><option value="store">Store</option></select></Field>{form.locationType === "store" ? <Field label="Store *"><select value={form.storeId} onChange={(event) => setForm({ ...form, storeId: event.target.value })}><option value="">Select store</option>{stores.map((store) => <option value={store._id} key={store._id}>{store.name}</option>)}</select></Field> : null}</div>; }

function ReturnsPanel({ returns, onChanged }: { returns: WarehouseReturn[]; onChanged: (message: string) => void }) { const [error, setError] = useState<string | null>(null); async function receive(record: WarehouseReturn) { try { await receiveWarehouseReturn(record._id); onChanged(`${record.returnNumber} was received into Central Warehouse.`); } catch (caught) { setError(caught instanceof Error ? caught.message : "Unable to receive return"); } } return <section className="table-panel"><p className="eyebrow">Store to warehouse</p><h3>Return requests</h3>{error ? <ErrorState title="Return action failed" message={error} /> : null}{returns.length === 0 ? <EmptyState title="No return requests" message="Store Manager return requests will appear here." /> : <table className="data-table"><thead><tr><th>Return</th><th>Store</th><th>Product</th><th>Quantity</th><th>Reason</th><th>Status</th><th>Action</th></tr></thead><tbody>{returns.map((record) => <tr key={record._id}><td><strong>{record.returnNumber}</strong><span>{formatDate(record.createdAt)}</span></td><td>{record.store?.name}</td><td>{record.item?.name}</td><td>{record.quantity} {record.unit}</td><td>{record.reason}</td><td><span className={`status-badge status-badge-${record.status}`}>{formatTitle(record.status)}</span></td><td>{record.status === "pending" ? <button type="button" onClick={() => void receive(record)}>Receive</button> : "—"}</td></tr>)}</tbody></table>}</section>; }

function LedgerPanel({ transactions }: { transactions: WarehouseTransaction[] }) { return <section className="table-panel"><p className="eyebrow">Audit trail</p><h3>Inventory movement ledger</h3>{transactions.length === 0 ? <EmptyState title="No movement yet" message="Receipts, transfers, returns, and adjustments will appear here." /> : <table className="data-table"><thead><tr><th>Date</th><th>Reference</th><th>Product</th><th>Type</th><th>Location</th><th>Change</th><th>Reason</th></tr></thead><tbody>{transactions.map((transaction) => <tr key={transaction._id}><td>{formatDate(transaction.createdAt)}</td><td><strong>{transaction.referenceNumber ?? transaction.transactionNumber}</strong></td><td>{transaction.item?.name ?? "Unavailable"}</td><td>{formatTitle(transaction.transactionType)}</td><td>{transaction.location?.name ?? "—"}</td><td>{transaction.quantityDelta > 0 ? "+" : ""}{formatNumber(transaction.quantityDelta)} {transaction.unit}</td><td>{transaction.reason ?? transaction.notes ?? "—"}</td></tr>)}</tbody></table>}</section>; }

function Field({ label, children }: { label: string; children: ReactNode }) { return <label className="form-field"><span>{label}</span>{children}</label>; }
function formatMoney(cents: number) { return `$${(cents / 100).toFixed(2)}`; }
function formatNumber(value: number) { return new Intl.NumberFormat().format(value); }
function formatDate(value?: string) { return value ? new Date(value).toLocaleDateString() : "—"; }
function formatTitle(value: string) { return value.split("_").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" "); }
