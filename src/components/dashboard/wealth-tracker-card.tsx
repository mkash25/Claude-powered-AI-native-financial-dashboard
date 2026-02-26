"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, X, ChevronDown, ChevronRight } from "lucide-react";
import { Card, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import type { ManualAsset, ManualDebt } from "@/lib/queries/manual-accounts";

// ── Config ─────────────────────────────────────────────────────────────────────

const ASSET_CATEGORIES: { value: string; label: string; color: string }[] = [
  { value: "retirement", label: "Retirement",      color: "text-purple-400" },
  { value: "investment", label: "Investment",      color: "text-blue-400"   },
  { value: "cash",       label: "Cash / Liquid",   color: "text-green-400"  },
  { value: "real_estate",label: "Real Estate",     color: "text-yellow-400" },
  { value: "other",      label: "Other Asset",     color: "text-gray-400"   },
];

const ACCOUNT_TYPES: Record<string, string[]> = {
  retirement:  ["Traditional IRA", "Roth IRA", "401k", "403b", "HSA", "SEP IRA", "Other"],
  investment:  ["Taxable Brokerage", "Crypto", "Stock Options", "Other"],
  cash:        ["Checking", "Savings", "Money Market", "CD", "Other"],
  real_estate: ["Primary Residence", "Rental Property", "Other"],
  other:       ["Other"],
};

const DEBT_TYPES: { value: string; label: string }[] = [
  { value: "credit_card",   label: "Credit Card"   },
  { value: "auto_loan",     label: "Auto Loan"      },
  { value: "student_loan",  label: "Student Loan"   },
  { value: "mortgage",      label: "Mortgage"       },
  { value: "personal_loan", label: "Personal Loan"  },
  { value: "other",         label: "Other"          },
];

const DEBT_COLORS: Record<string, string> = {
  credit_card:  "text-red-400",
  auto_loan:    "text-orange-400",
  student_loan: "text-yellow-400",
  mortgage:     "text-blue-400",
  personal_loan:"text-pink-400",
  other:        "text-gray-400",
};

// ── Types ──────────────────────────────────────────────────────────────────────

type Mode = "assets" | "debts";

interface AssetForm {
  name: string; institution: string; category: string; account_type: string; balance: string; notes: string;
}
interface DebtForm {
  name: string; institution: string; debt_type: string; balance: string; notes: string;
}

const emptyAsset: AssetForm = { name: "", institution: "", category: "retirement", account_type: "", balance: "", notes: "" };
const emptyDebt: DebtForm   = { name: "", institution: "", debt_type: "credit_card", balance: "", notes: "" };

// ── Main component ─────────────────────────────────────────────────────────────

interface WealthTrackerCardProps {
  initialAssets: ManualAsset[];
  initialDebts:  ManualDebt[];
}

export function WealthTrackerCard({ initialAssets, initialDebts }: WealthTrackerCardProps) {
  const router = useRouter();

  // Modal state
  const [modalMode, setModalMode] = useState<Mode | null>(null);
  const [editingAssetId, setEditingAssetId] = useState<string | null>(null);
  const [editingDebtId, setEditingDebtId] = useState<string | null>(null);
  const [assetForm, setAssetForm] = useState<AssetForm>(emptyAsset);
  const [debtForm, setDebtForm]   = useState<DebtForm>(emptyDebt);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Collapsible sections
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(["retirement"]));

  // ── Asset helpers ───────────────────────────────────────────────────────────
  const groupedAssets = ASSET_CATEGORIES
    .map((cat) => ({
      ...cat,
      items: initialAssets.filter((a) => a.category === cat.value),
      total: initialAssets.filter((a) => a.category === cat.value).reduce((s, a) => s + a.balance, 0),
    }))
    .filter((g) => g.items.length > 0 || true); // show all categories

  const totalAssets = initialAssets.reduce((s, a) => s + a.balance, 0);
  const totalDebts  = initialDebts.reduce((s, d) => s + d.balance, 0);

  const toggleCategory = (cat: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat); else next.add(cat);
      return next;
    });
  };

  // ── Open modals ─────────────────────────────────────────────────────────────
  const openAddAsset = () => {
    setAssetForm(emptyAsset);
    setEditingAssetId(null);
    setError(null);
    setModalMode("assets");
  };
  const openEditAsset = (a: ManualAsset) => {
    setAssetForm({ name: a.name, institution: a.institution ?? "", category: a.category, account_type: a.account_type ?? "", balance: String(a.balance), notes: a.notes ?? "" });
    setEditingAssetId(a.id);
    setError(null);
    setModalMode("assets");
  };
  const openAddDebt = () => {
    setDebtForm(emptyDebt);
    setEditingDebtId(null);
    setError(null);
    setModalMode("debts");
  };
  const openEditDebt = (d: ManualDebt) => {
    setDebtForm({ name: d.name, institution: d.institution ?? "", debt_type: d.debt_type, balance: String(d.balance), notes: d.notes ?? "" });
    setEditingDebtId(d.id);
    setError(null);
    setModalMode("debts");
  };
  const closeModal = () => { setModalMode(null); setEditingAssetId(null); setEditingDebtId(null); };

  // ── Save asset ──────────────────────────────────────────────────────────────
  const saveAsset = async () => {
    if (!assetForm.name.trim() || !assetForm.balance) return;
    setSaving(true); setError(null);
    try {
      const url  = editingAssetId ? `/api/assets/${editingAssetId}` : "/api/assets";
      const method = editingAssetId ? "PUT" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(assetForm) });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error ?? "Save failed"); }
      closeModal();
      router.refresh();
    } catch (e: any) { setError(e.message); }
    finally { setSaving(false); }
  };

  // ── Delete asset ─────────────────────────────────────────────────────────────
  const deleteAsset = async (id: string) => {
    if (!confirm("Delete this asset?")) return;
    await fetch(`/api/assets/${id}`, { method: "DELETE" });
    router.refresh();
  };

  // ── Save debt ────────────────────────────────────────────────────────────────
  const saveDebt = async () => {
    if (!debtForm.name.trim() || !debtForm.balance) return;
    setSaving(true); setError(null);
    try {
      const url    = editingDebtId ? `/api/debts/${editingDebtId}` : "/api/debts";
      const method = editingDebtId ? "PUT" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(debtForm) });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error ?? "Save failed"); }
      closeModal();
      router.refresh();
    } catch (e: any) { setError(e.message); }
    finally { setSaving(false); }
  };

  // ── Delete debt ──────────────────────────────────────────────────────────────
  const deleteDebt = async (id: string) => {
    if (!confirm("Delete this debt?")) return;
    await fetch(`/api/debts/${id}`, { method: "DELETE" });
    router.refresh();
  };

  return (
    <>
      <Card>
        <div className="flex items-center justify-between mb-4">
          <CardTitle>Wealth Tracker</CardTitle>
          <div className="flex gap-1 text-xs text-gray-500">
            <span className="text-green-400 font-mono">+{formatCurrency(totalAssets, 0)}</span>
            <span>assets</span>
            <span className="mx-1">·</span>
            <span className="text-red-400 font-mono">−{formatCurrency(totalDebts, 0)}</span>
            <span>debts</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* ── Assets column ───────────────────────────────────────────────── */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Assets</h3>
              <button onClick={openAddAsset} className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
                <Plus size={12} /> Add
              </button>
            </div>

            {initialAssets.length === 0 ? (
              <p className="text-xs text-gray-600 py-4 text-center">No assets tracked yet. Add retirement accounts, savings, and more.</p>
            ) : (
              <div className="space-y-2">
                {groupedAssets
                  .filter((g) => g.items.length > 0)
                  .map((group) => {
                    const expanded = expandedCategories.has(group.value);
                    return (
                      <div key={group.value} className="rounded-lg border border-white/6 overflow-hidden">
                        {/* Category header */}
                        <button
                          onClick={() => toggleCategory(group.value)}
                          className="w-full flex items-center justify-between px-3 py-2 bg-white/3 hover:bg-white/5 transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            {expanded ? <ChevronDown size={12} className="text-gray-500" /> : <ChevronRight size={12} className="text-gray-500" />}
                            <span className={`text-xs font-semibold ${group.color}`}>{group.label}</span>
                          </div>
                          <span className="text-xs font-mono text-white">{formatCurrency(group.total, 0)}</span>
                        </button>

                        {/* Items */}
                        {expanded && (
                          <div className="divide-y divide-white/4">
                            {group.items.map((a) => (
                              <div key={a.id} className="flex items-center justify-between px-3 py-2 group">
                                <div className="min-w-0 flex-1">
                                  <div className="text-xs font-medium text-gray-200 truncate">{a.name}</div>
                                  {(a.institution || a.account_type) && (
                                    <div className="text-xs text-gray-500 truncate">
                                      {[a.institution, a.account_type].filter(Boolean).join(" · ")}
                                    </div>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 ml-2 shrink-0">
                                  <span className="text-xs font-mono text-white">{formatCurrency(a.balance, 0)}</span>
                                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => openEditAsset(a)} className="text-gray-500 hover:text-indigo-400 transition-colors">
                                      <Pencil size={11} />
                                    </button>
                                    <button onClick={() => deleteAsset(a.id)} className="text-gray-500 hover:text-red-400 transition-colors">
                                      <Trash2 size={11} />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            )}
          </div>

          {/* ── Debts column ─────────────────────────────────────────────────── */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Debts</h3>
              <button onClick={openAddDebt} className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
                <Plus size={12} /> Add
              </button>
            </div>

            {initialDebts.length === 0 ? (
              <p className="text-xs text-gray-600 py-4 text-center">No debts tracked yet. Add credit cards, loans, and more.</p>
            ) : (
              <div className="space-y-1.5">
                {initialDebts.map((d) => {
                  const dtLabel = DEBT_TYPES.find((t) => t.value === d.debt_type)?.label ?? d.debt_type;
                  const dtColor = DEBT_COLORS[d.debt_type] ?? "text-gray-400";
                  return (
                    <div key={d.id} className="flex items-center justify-between px-3 py-2.5 rounded-lg border border-white/6 group">
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-medium text-gray-200 truncate">{d.name}</div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className={`text-xs ${dtColor}`}>{dtLabel}</span>
                          {d.institution && <span className="text-xs text-gray-600">· {d.institution}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-2 shrink-0">
                        <span className="text-xs font-mono text-red-400">−{formatCurrency(d.balance, 0)}</span>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => openEditDebt(d)} className="text-gray-500 hover:text-indigo-400 transition-colors">
                            <Pencil size={11} />
                          </button>
                          <button onClick={() => deleteDebt(d.id)} className="text-gray-500 hover:text-red-400 transition-colors">
                            <Trash2 size={11} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* ── Modal ─────────────────────────────────────────────────────────────── */}
      {modalMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#16213e] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/8">
              <h2 className="text-sm font-semibold text-white">
                {modalMode === "assets"
                  ? (editingAssetId ? "Edit Asset" : "Add Asset")
                  : (editingDebtId  ? "Edit Debt"  : "Add Debt")}
              </h2>
              <button onClick={closeModal} className="text-gray-500 hover:text-white transition-colors">
                <X size={16} />
              </button>
            </div>

            <div className="px-5 py-4 space-y-3">
              {modalMode === "assets" ? (
                <>
                  <Field label="Account Name *">
                    <input className={inputCls} value={assetForm.name} onChange={(e) => setAssetForm({ ...assetForm, name: e.target.value })} placeholder="e.g. Fidelity IRA" />
                  </Field>
                  <Field label="Institution">
                    <input className={inputCls} value={assetForm.institution} onChange={(e) => setAssetForm({ ...assetForm, institution: e.target.value })} placeholder="e.g. Fidelity" />
                  </Field>
                  <Field label="Category *">
                    <select className={inputCls} value={assetForm.category}
                      onChange={(e) => setAssetForm({ ...assetForm, category: e.target.value, account_type: "" })}>
                      {ASSET_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                  </Field>
                  <Field label="Account Type">
                    <select className={inputCls} value={assetForm.account_type}
                      onChange={(e) => setAssetForm({ ...assetForm, account_type: e.target.value })}>
                      <option value="">— select —</option>
                      {(ACCOUNT_TYPES[assetForm.category] ?? []).map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </Field>
                  <Field label="Current Balance ($) *">
                    <input className={inputCls} type="number" min="0" step="0.01" value={assetForm.balance}
                      onChange={(e) => setAssetForm({ ...assetForm, balance: e.target.value })} placeholder="0.00" />
                  </Field>
                  <Field label="Notes">
                    <input className={inputCls} value={assetForm.notes} onChange={(e) => setAssetForm({ ...assetForm, notes: e.target.value })} placeholder="Optional" />
                  </Field>
                </>
              ) : (
                <>
                  <Field label="Debt Name *">
                    <input className={inputCls} value={debtForm.name} onChange={(e) => setDebtForm({ ...debtForm, name: e.target.value })} placeholder="e.g. Chase Sapphire Card" />
                  </Field>
                  <Field label="Institution">
                    <input className={inputCls} value={debtForm.institution} onChange={(e) => setDebtForm({ ...debtForm, institution: e.target.value })} placeholder="e.g. Chase" />
                  </Field>
                  <Field label="Type *">
                    <select className={inputCls} value={debtForm.debt_type} onChange={(e) => setDebtForm({ ...debtForm, debt_type: e.target.value })}>
                      {DEBT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                  </Field>
                  <Field label="Amount Owed ($) *">
                    <input className={inputCls} type="number" min="0" step="0.01" value={debtForm.balance}
                      onChange={(e) => setDebtForm({ ...debtForm, balance: e.target.value })} placeholder="0.00" />
                  </Field>
                  <Field label="Notes">
                    <input className={inputCls} value={debtForm.notes} onChange={(e) => setDebtForm({ ...debtForm, notes: e.target.value })} placeholder="Optional" />
                  </Field>
                </>
              )}

              {error && <p className="text-xs text-red-400">{error}</p>}
            </div>

            <div className="flex gap-2 px-5 py-4 border-t border-white/8">
              <button onClick={closeModal} className="flex-1 py-2 rounded-lg text-sm text-gray-400 hover:text-white border border-white/10 hover:border-white/20 transition-colors">
                Cancel
              </button>
              <button
                onClick={modalMode === "assets" ? saveAsset : saveDebt}
                disabled={saving}
                className="flex-1 py-2 rounded-lg text-sm font-medium bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-700 text-white transition-colors"
              >
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ── Helpers ────────────────────────────────────────────────────────────────────

const inputCls = "w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500/60 transition-colors";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs text-gray-400 mb-1">{label}</label>
      {children}
    </div>
  );
}
