import { type FormEvent, type ReactNode, useEffect, useState } from "react";
import { inventoryUnitOptions } from "../api/admin";
import {
  createManagerWarehouseReturn,
  getManagerStoreInventory,
  getManagerWarehouseReturns,
  getManagerWarehouseTransfers,
  receiveManagerWarehouseTransfer,
  type ManagerInventoryRecord,
  type ManagerWarehouseReturn,
  type ManagerWarehouseTransfer,
} from "../api/manager";
import type { SessionUser } from "../api/auth";
import { EmptyState, ErrorState, LoadingState } from "../components/PageStates";

export function ManagerWarehousePage({ user, onNavigate }: { user: SessionUser; onNavigate: (path: string) => void }) {
  const storeId = user.storeId;
  const [inventory, setInventory] = useState<ManagerInventoryRecord[]>([]);
  const [transfers, setTransfers] = useState<ManagerWarehouseTransfer[]>([]);
  const [returns, setReturns] = useState<ManagerWarehouseReturn[]>([]);
  const [receiveValues, setReceiveValues] = useState<Record<string, string>>({});
  const [reasons, setReasons] = useState<Record<string, string>>({});
  const [form, setForm] = useState({ inventoryItemId: "", quantity: "", unit: "", reason: "", notes: "" });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function load() {
    if (!storeId) { setError("Your manager account is not assigned to a store."); setIsLoading(false); return; }
    setIsLoading(true); setError(null);
    try {
      const [inventoryData, transferData, returnData] = await Promise.all([getManagerStoreInventory(storeId), getManagerWarehouseTransfers(storeId), getManagerWarehouseReturns(storeId)]);
      setInventory(inventoryData.inventory); setTransfers(transferData.transfers); setReturns(returnData.returns);
      const nextValues: Record<string, string> = {};
      for (const transfer of transferData.transfers) for (const line of transfer.lines) nextValues[`${transfer._id}:${line._id}`] = String(Math.max(0, line.quantity - line.receivedQuantity));
      setReceiveValues(nextValues);
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Unable to load store inventory"); } finally { setIsLoading(false); }
  }
  useEffect(() => { void load(); }, [storeId]);

  async function receive(transfer: ManagerWarehouseTransfer) {
    if (!storeId) return;
    setSaving(true); setError(null);
    try {
      const result = await receiveManagerWarehouseTransfer(storeId, transfer._id, transfer.lines.filter((line) => line.quantity > line.receivedQuantity).map((line) => ({ lineId: line._id, receivedQuantity: Number(receiveValues[`${transfer._id}:${line._id}`] ?? 0), discrepancyReason: reasons[`${transfer._id}:${line._id}`] || undefined })));
      setSuccess(`${result.transfer.transferNumber} was received and store stock was updated.`); await load();
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Unable to confirm delivery"); } finally { setSaving(false); }
  }

  async function submitReturn(event: FormEvent) {
    event.preventDefault(); if (!storeId) return; setError(null);
    if (!form.inventoryItemId || !form.quantity || Number(form.quantity) <= 0 || !form.unit || !form.reason.trim()) { setError("Select a product, quantity, unit, and return reason."); return; }
    setSaving(true);
    try { const result = await createManagerWarehouseReturn(storeId, { ...form, quantity: Number(form.quantity) }); setSuccess(`${result.return.returnNumber} was submitted to Admin for warehouse receiving.`); setForm({ inventoryItemId: "", quantity: "", unit: "", reason: "", notes: "" }); await load(); } catch (caught) { setError(caught instanceof Error ? caught.message : "Unable to submit return"); } finally { setSaving(false); }
  }

  return <div className="page-stack"><div className="resource-toolbar"><div><p className="eyebrow">Store Inventory</p><h2>Receiving & Returns</h2><p className="page-description">Confirm deliveries from Central Warehouse and send stock back with a reason.</p></div><button type="button" className="secondary-button" onClick={() => onNavigate("/store-manager")}>Back to workspace</button></div>{isLoading ? <LoadingState title="Loading store inventory" message="Preparing deliveries and return history..." /> : null}{error ? <ErrorState title="Store inventory unavailable" message={error} /> : null}{success ? <section className="state-panel" role="status"><div><h2>Saved</h2><p>{success}</p></div></section> : null}{!isLoading && !error ? <><section className="table-panel"><p className="eyebrow">Store stock</p><h3>Current inventory</h3>{inventory.length === 0 ? <EmptyState title="No store stock" message="Inventory assigned to this store will appear here." /> : <table className="data-table"><thead><tr><th>Product</th><th>On hand</th><th>Reorder point</th><th>Status</th></tr></thead><tbody>{inventory.map((record) => <tr key={record._id}><td><strong>{record.item.name}</strong><span>{record.item.sku}</span></td><td>{record.quantityOnHand} {record.item.baseUnit}</td><td>{record.reorderPoint}</td><td><span className={`status-badge status-badge-${record.status}`}>{formatTitle(record.status)}</span></td></tr>)}</tbody></table>}</section><section className="related-panel"><p className="eyebrow">Warehouse deliveries</p><h3>Confirm received quantities</h3>{transfers.filter((transfer) => transfer.status === "dispatched" || transfer.status === "partially_received").length === 0 ? <EmptyState title="No deliveries waiting" message="Dispatched warehouse transfers will appear here." /> : <div className="related-list">{transfers.filter((transfer) => transfer.status === "dispatched" || transfer.status === "partially_received").map((transfer) => <article className="related-row" key={transfer._id}><div><strong>{transfer.transferNumber}</strong><span>{transfer.store?.name} · {formatDate(transfer.dispatchedAt)}</span></div><div className="form-grid">{transfer.lines.filter((line) => line.quantity > line.receivedQuantity).map((line) => <div className="packaging-level-row" key={line._id}><label className="form-field"><span>{line.item?.name ?? "Product"} · sent {line.quantity} {line.unit}</span><input type="number" min="0" max={line.quantity - line.receivedQuantity} step="0.000001" value={receiveValues[`${transfer._id}:${line._id}`] ?? ""} onChange={(event) => setReceiveValues((current) => ({ ...current, [`${transfer._id}:${line._id}`]: event.target.value }))} /></label><label className="form-field"><span>Difference reason, if short</span><input value={reasons[`${transfer._id}:${line._id}`] ?? ""} onChange={(event) => setReasons((current) => ({ ...current, [`${transfer._id}:${line._id}`]: event.target.value }))} placeholder="Damaged, missing, incorrect shipment" /></label></div>)}</div><button type="button" disabled={saving} onClick={() => void receive(transfer)}>{saving ? "Saving..." : "Confirm delivery"}</button></article>)}</div>}</section><div className="content-grid content-grid-two"><form className="store-form" onSubmit={submitReturn}><section><p className="eyebrow">Store to warehouse</p><h3>Request a return</h3><p className="form-hint">Returns remain pending until Admin receives them into Central Warehouse.</p><Field label="Product *"><select value={form.inventoryItemId} onChange={(event) => setForm({ ...form, inventoryItemId: event.target.value, unit: inventory.find((record) => record.inventoryItemId === event.target.value)?.item.baseUnit ?? "" })}><option value="">Select product</option>{inventory.map((record) => <option value={record.inventoryItemId} key={record.inventoryItemId}>{record.item.name} ({record.item.sku})</option>)}</select></Field><div className="form-grid"><Field label="Quantity *"><input type="number" min="0.000001" step="0.000001" value={form.quantity} onChange={(event) => setForm({ ...form, quantity: event.target.value })} /></Field><Field label="Unit *"><select value={form.unit} onChange={(event) => setForm({ ...form, unit: event.target.value })}><option value="">Select unit</option>{inventoryUnitOptions.map((unit) => <option value={unit.value} key={unit.value}>{unit.label}</option>)}</select></Field></div><Field label="Reason *"><input value={form.reason} onChange={(event) => setForm({ ...form, reason: event.target.value })} placeholder="Damaged, excess, or expired" /></Field><Field label="Notes"><textarea value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} /></Field></section><div className="form-actions"><button type="submit" disabled={saving}>{saving ? "Submitting..." : "Submit return"}</button></div></form><section className="table-panel"><p className="eyebrow">History</p><h3>Return requests</h3>{returns.length === 0 ? <EmptyState title="No returns" message="Your submitted return requests will appear here." /> : <table className="data-table"><thead><tr><th>Return</th><th>Product</th><th>Quantity</th><th>Status</th></tr></thead><tbody>{returns.map((record) => <tr key={record._id}><td><strong>{record.returnNumber}</strong><span>{formatDate(record.createdAt)}</span></td><td>{record.item?.name}</td><td>{record.quantity} {record.unit}</td><td><span className={`status-badge status-badge-${record.status}`}>{formatTitle(record.status)}</span></td></tr>)}</tbody></table>}</section></div></> : null}</div>;
}

function Field({ label, children }: { label: string; children: ReactNode }) { return <label className="form-field"><span>{label}</span>{children}</label>; }
function formatDate(value?: string) { return value ? new Date(value).toLocaleDateString() : "—"; }
function formatTitle(value: string) { return value.split("_").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" "); }
