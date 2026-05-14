"use client";

import { useMemo, useState } from "react";
import Papa from "papaparse";
import type { TdHTMLAttributes } from "react";

type Row = {
  id?: string;
  Date?: string;
  "Ref No."?: string;
  Payee?: string;
  Memo?: string;
  Payment?: string;
  Deposit?: string;
  "Reconciliation Status"?: string;
  Balance?: string;
  Type?: string;
  Account?: string;
  "Added in Banking"?: string;
};

type Txn = {
  date: string;
  refNo: string;
  payee: string;
  memo: string;
  payment: number;
  deposit: number;
  status: string;
  balance: number;
  type: string;
  account: string;
  addedInBanking: string;
};

type BankAccount = {
  id: string;
  name: string;
  last4: string;
  bankName: string;
  isDefault: boolean;
};

type Transfer = {
  id: string;
  date: string;
  type: "send" | "receive";
  amount: number;
  recipient: string;
  status: "pending" | "completed" | "failed";
  processor: "stripe" | "melio";
};

function money(v: string | undefined) {
  const cleaned = (v || "").replace(/[$,]/g, "").trim();
  if (!cleaned) return 0;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : 0;
}

function txt(v: string | undefined) {
  return (v || "").trim();
}

const colors = {
  primary: "#1e40af",
  success: "#15803d",
  danger: "#b91c1c",
  warning: "#d97706",
  neutral: "#64748b",
  background: "#f8fafc",
  border: "#e2e8f0",
};

export default function Page() {
  const [rows, setRows] = useState<Txn[]>([]);
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"dashboard" | "transfers" | "settings">("dashboard");
  
  // Bank account state
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([
    {
      id: "1",
      name: "Business Checking",
      last4: "4242",
      bankName: "Chase",
      isDefault: true,
    },
  ]);
  
  // Transfer state
  const [transfers, setTransfers] = useState<Transfer[]>([
    {
      id: "t1",
      date: "2026-05-13",
      type: "receive",
      amount: 5000,
      recipient: "Client A Payment",
      status: "completed",
      processor: "stripe",
    },
    {
      id: "t2",
      date: "2026-05-12",
      type: "send",
      amount: 1200,
      recipient: "Vendor Invoice #5421",
      status: "completed",
      processor: "melio",
    },
  ]);

  // Transfer form state
  const [transferForm, setTransferForm] = useState({
    type: "send" as "send" | "receive",
    amount: "",
    recipient: "",
    processor: "stripe" as "stripe" | "melio",
  });

  const [stripeConnected, setStripeConnected] = useState(false);
  const [melioConnected, setMelioConnected] = useState(false);

  const totals = useMemo(() => {
    const income = rows.reduce((sum, r) => sum + r.deposit, 0);
    const expenses = rows.reduce((sum, r) => sum + r.payment, 0);
    const net = income - expenses;
    return { income, expenses, net };
  }, [rows]);

  const byAccount = useMemo(() => {
    const map = new Map<
      string,
      { account: string; deposits: number; payments: number; net: number; count: number }
    >();

    for (const r of rows) {
      const key = r.account || "Uncategorized";
      const cur = map.get(key) || {
        account: key,
        deposits: 0,
        payments: 0,
        net: 0,
        count: 0,
      };
      cur.deposits += r.deposit;
      cur.payments += r.payment;
      cur.net += r.deposit - r.payment;
      cur.count += 1;
      map.set(key, cur);
    }

    return [...map.values()].sort((a, b) => Math.abs(b.net) - Math.abs(a.net));
  }, [rows]);

  async function onFile(file: File | null) {
    if (!file) return;
    setError("");
    setLoading(true);

    try {
      const text = await file.text();
      const parsed = Papa.parse<Row>(text, {
        header: true,
        skipEmptyLines: true,
      });

      if (parsed.errors.length) {
        throw new Error(parsed.errors[0].message);
      }

      const cleaned: Txn[] = (parsed.data || [])
        .filter((r) => r.Date || r.Payee || r.Account)
        .map((r) => ({
          date: txt(r.Date),
          refNo: txt(r["Ref No."]),
          payee: txt(r.Payee),
          memo: txt(r.Memo),
          payment: money(r.Payment),
          deposit: money(r.Deposit),
          status: txt(r["Reconciliation Status"]),
          balance: money(r.Balance),
          type: txt(r.Type),
          account: txt(r.Account) || "Uncategorized",
          addedInBanking: txt(r["Added in Banking"]),
        }))
        .filter((r) => r.date);

      setRows(cleaned);
    } catch (e: any) {
      setError(e?.message || "Failed to parse CSV");
    } finally {
      setLoading(false);
    }
  }

  const handleStripeConnect = async () => {
    // In production, this would redirect to Stripe OAuth
    alert(
      "Redirecting to Stripe OAuth...\n\nIn production, this would connect your Stripe account with API key: sk_live_xxx"
    );
    setStripeConnected(true);
  };

  const handleMelioConnect = async () => {
    // In production, this would redirect to Melio OAuth
    alert(
      "Redirecting to Melio OAuth...\n\nIn production, this would connect your Melio account with API key: melio_xxx"
    );
    setMelioConnected(true);
  };

  const handleTransfer = async () => {
    if (!transferForm.amount || !transferForm.recipient) {
      setError("Please fill in all transfer fields");
      return;
    }

    const newTransfer: Transfer = {
      id: `t${Date.now()}`,
      date: new Date().toISOString().split("T")[0],
      type: transferForm.type,
      amount: parseFloat(transferForm.amount),
      recipient: transferForm.recipient,
      status: "pending",
      processor: transferForm.processor,
    };

    setTransfers([newTransfer, ...transfers]);
    setTransferForm({ type: "send", amount: "", recipient: "", processor: "stripe" });
    
    // In production, this would call your backend API
    alert(
      `Transfer initiated:\n${transferForm.type === "send" ? "Sending" : "Requesting"} $${transferForm.amount} via ${transferForm.processor.toUpperCase()}`
    );
  };

  return (
    <main style={{ fontFamily: "system-ui, -apple-system, sans-serif", background: colors.background, minHeight: "100vh" }}>
      {/* Header */}
      <div style={{ background: "white", borderBottom: `1px solid ${colors.border}`, padding: "24px" }}>
        <div style={{ maxWidth: 1400, margin: "0 auto" }}>
          <h1 style={{ fontSize: 32, fontWeight: 700, margin: 0, color: colors.primary }}>
            🏢 Flatirons FlexCare Accounting
          </h1>
          <p style={{ color: colors.neutral, marginTop: 8, margin: 0 }}>
            Professional accounting dashboard with ACH transfers & payment processing
          </p>
        </div>
      </div>

      <div style={{ maxWidth: 1400, margin: "0 auto", padding: 24 }}>
        {/* Tab Navigation */}
        <div style={{ display: "flex", gap: 12, marginBottom: 24, borderBottom: `2px solid ${colors.border}` }}>
          {(["dashboard", "transfers", "settings"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: "12px 20px",
                border: "none",
                background: "none",
                cursor: "pointer",
                fontSize: 16,
                fontWeight: activeTab === tab ? 600 : 500,
                color: activeTab === tab ? colors.primary : colors.neutral,
                borderBottom: activeTab === tab ? `3px solid ${colors.primary}` : "none",
                marginBottom: -2,
                textTransform: "capitalize",
              }}
            >
              {tab === "dashboard" && "📊 Dashboard"}
              {tab === "transfers" && "💸 Transfers"}
              {tab === "settings" && "⚙️ Settings"}
            </button>
          ))}
        </div>

        {error && (
          <div
            style={{
              background: "#fee2e2",
              color: colors.danger,
              padding: 16,
              borderRadius: 8,
              marginBottom: 24,
              border: `1px solid ${colors.danger}`,
            }}
          >
            ❌ {error}
          </div>
        )}

        {/* Dashboard Tab */}
        {activeTab === "dashboard" && (
          <div>
            <div style={{ marginBottom: 32 }}>
              <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 16, color: colors.primary }}>
                📁 Upload CSV & View Transactions
              </h2>
              <div
                style={{
                  border: `2px dashed ${colors.border}`,
                  borderRadius: 8,
                  padding: 32,
                  textAlign: "center",
                  background: "#f0f9ff",
                  cursor: "pointer",
                }}
              >
                <input
                  type="file"
                  accept=".csv"
                  onChange={(e) => onFile(e.target.files?.[0] || null)}
                  style={{ display: "none" }}
                  id="csvInput"
                />
                <label htmlFor="csvInput" style={{ cursor: "pointer" }}>
                  <p style={{ fontSize: 16, fontWeight: 600, color: colors.primary, margin: 0 }}>
                    📤 Click to upload CSV or drag & drop
                  </p>
                  <p style={{ color: colors.neutral, fontSize: 14, marginTop: 8 }}>
                    Bank statements, reconciliation files, etc.
                  </p>
                </label>
              </div>
            </div>

            {loading && (
              <div style={{ textAlign: "center", padding: 24 }}>
                <p style={{ fontSize: 16, color: colors.neutral }}>⏳ Parsing CSV...</p>
              </div>
            )}

            {rows.length > 0 && (
              <div>
                {/* Summary Cards */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
                    gap: 16,
                    marginBottom: 32,
                  }}
                >
                  <Card title="💰 Total Deposits" value={totals.income} color={colors.success} />
                  <Card title="💳 Total Payments" value={totals.expenses} color={colors.danger} />
                  <Card
                    title="📈 Net Income"
                    value={totals.net}
                    color={totals.net >= 0 ? colors.success : colors.danger}
                  />
                </div>

                {/* Accounts Table */}
                <div>
                  <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 16, color: colors.primary }}>
                    🏦 Totals by Account
                  </h2>
                  <div
                    style={{
                      overflowX: "auto",
                      border: `1px solid ${colors.border}`,
                      borderRadius: 8,
                      background: "white",
                    }}
                  >
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                      <thead>
                        <tr style={{ background: colors.background, borderBottom: `1px solid ${colors.border}` }}>
                          <Th>Account</Th>
                          <Th>Txns</Th>
                          <Th>Deposits</Th>
                          <Th>Payments</Th>
                          <Th>Net</Th>
                        </tr>
                      </thead>
                      <tbody>
                        {byAccount.map((r) => (
                          <tr key={r.account} style={{ borderBottom: `1px solid ${colors.border}` }}>
                            <Td>{r.account}</Td>
                            <Td>{r.count}</Td>
                            <Td style={{ color: colors.success, fontWeight: 600 }}>
                              ${r.deposits.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </Td>
                            <Td style={{ color: colors.danger, fontWeight: 600 }}>
                              ${r.payments.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </Td>
                            <Td style={{ color: r.net >= 0 ? colors.success : colors.danger, fontWeight: 600 }}>
                              ${r.net.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </Td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Transfers Tab */}
        {activeTab === "transfers" && (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 32 }}>
              {/* Send/Receive Form */}
              <div
                style={{
                  background: "white",
                  padding: 24,
                  borderRadius: 12,
                  border: `1px solid ${colors.border}`,
                }}
              >
                <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16, color: colors.primary }}>
                  💸 Create Transfer
                </h3>

                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: "block", fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
                    Transfer Type
                  </label>
                  <div style={{ display: "flex", gap: 12 }}>
                    {(["send", "receive"] as const).map((type) => (
                      <button
                        key={type}
                        onClick={() => setTransferForm({ ...transferForm, type })}
                        style={{
                          flex: 1,
                          padding: 10,
                          border: `2px solid ${transferForm.type === type ? colors.primary : colors.border}`,
                          background: transferForm.type === type ? colors.primary : "white",
                          color: transferForm.type === type ? "white" : colors.neutral,
                          borderRadius: 6,
                          cursor: "pointer",
                          fontWeight: 600,
                          textTransform: "capitalize",
                        }}
                      >
                        {type === "send" ? "📤 Send" : "📥 Receive"}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: "block", fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
                    Processor
                  </label>
                  <select
                    value={transferForm.processor}
                    onChange={(e) =>
                      setTransferForm({ ...transferForm, processor: e.target.value as "stripe" | "melio" })
                    }
                    style={{
                      width: "100%",
                      padding: 10,
                      border: `1px solid ${colors.border}`,
                      borderRadius: 6,
                      fontSize: 14,
                    }}
                  >
                    <option value="stripe">Stripe (Payments & ACH)</option>
                    <option value="melio">Melio (Bill Pay)</option>
                  </select>
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: "block", fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
                    Amount
                  </label>
                  <input
                    type="number"
                    placeholder="1000.00"
                    value={transferForm.amount}
                    onChange={(e) => setTransferForm({ ...transferForm, amount: e.target.value })}
                    style={{
                      width: "100%",
                      padding: 10,
                      border: `1px solid ${colors.border}`,
                      borderRadius: 6,
                      fontSize: 14,
                      boxSizing: "border-box",
                    }}
                  />
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: "block", fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
                    {transferForm.type === "send" ? "Recipient" : "Payor"}
                  </label>
                  <input
                    type="text"
                    placeholder="Vendor name, customer name, etc."
                    value={transferForm.recipient}
                    onChange={(e) => setTransferForm({ ...transferForm, recipient: e.target.value })}
                    style={{
                      width: "100%",
                      padding: 10,
                      border: `1px solid ${colors.border}`,
                      borderRadius: 6,
                      fontSize: 14,
                      boxSizing: "border-box",
                    }}
                  />
                </div>

                <button
                  onClick={handleTransfer}
                  style={{
                    width: "100%",
                    padding: 12,
                    background: colors.primary,
                    color: "white",
                    border: "none",
                    borderRadius: 6,
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  {transferForm.type === "send" ? "📤 Send" : "📥 Receive"} ${transferForm.amount || "0.00"}
                </button>
              </div>

              {/* Bank Accounts */}
              <div
                style={{
                  background: "white",
                  padding: 24,
                  borderRadius: 12,
                  border: `1px solid ${colors.border}`,
                }}
              >
                <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16, color: colors.primary }}>
                  🏦 Connected Accounts
                </h3>
                {bankAccounts.map((acc) => (
                  <div
                    key={acc.id}
                    style={{
                      padding: 12,
                      border: `1px solid ${colors.border}`,
                      borderRadius: 6,
                      marginBottom: 12,
                      background: acc.isDefault ? "#f0f9ff" : "white",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <p style={{ margin: 0, fontWeight: 600, color: colors.primary }}>{acc.name}</p>
                        <p style={{ margin: 0, fontSize: 12, color: colors.neutral }}>
                          {acc.bankName} •••• {acc.last4}
                        </p>
                      </div>
                      {acc.isDefault && <span style={{ fontSize: 12, color: colors.success, fontWeight: 600 }}>✓ Default</span>}
                    </div>
                  </div>
                ))}
                <button
                  style={{
                    width: "100%",
                    padding: 10,
                    background: colors.background,
                    color: colors.primary,
                    border: `1px solid ${colors.border}`,
                    borderRadius: 6,
                    cursor: "pointer",
                    fontWeight: 600,
                  }}
                >
                  + Add Bank Account
                </button>
              </div>
            </div>

            {/* Recent Transfers */}
            <div
              style={{
                background: "white",
                padding: 24,
                borderRadius: 12,
                border: `1px solid ${colors.border}`,
              }}
            >
              <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16, color: colors.primary }}>
                📋 Recent Transfers
              </h3>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: colors.background, borderBottom: `1px solid ${colors.border}` }}>
                      <Th>Date</Th>
                      <Th>Type</Th>
                      <Th>Amount</Th>
                      <Th>Recipient</Th>
                      <Th>Processor</Th>
                      <Th>Status</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {transfers.map((t) => (
                      <tr key={t.id} style={{ borderBottom: `1px solid ${colors.border}` }}>
                        <Td>{t.date}</Td>
                        <Td>{t.type === "send" ? "📤 Send" : "📥 Receive"}</Td>
                        <Td style={{ fontWeight: 600 }}>${t.amount.toLocaleString()}</Td>
                        <Td>{t.recipient}</Td>
                        <Td style={{ textTransform: "uppercase", fontSize: 12, fontWeight: 600 }}>
                          {t.processor}
                        </Td>
                        <Td>
                          <span
                            style={{
                              padding: "4px 8px",
                              borderRadius: 4,
                              fontSize: 12,
                              fontWeight: 600,
                              background:
                                t.status === "completed"
                                  ? "#d1fae5"
                                  : t.status === "pending"
                                    ? "#fef3c7"
                                    : "#fee2e2",
                              color:
                                t.status === "completed"
                                  ? colors.success
                                  : t.status === "pending"
                                    ? colors.warning
                                    : colors.danger,
                            }}
                          >
                            {t.status === "completed" && "✓"}
                            {t.status === "pending" && "⏳"}
                            {t.status === "failed" && "✕"}
                            {t.status.charAt(0).toUpperCase() + t.status.slice(1)}
                          </span>
                        </Td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === "settings" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
            {/* Stripe Section */}
            <div
              style={{
                background: "white",
                padding: 24,
                borderRadius: 12,
                border: `1px solid ${colors.border}`,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", marginBottom: 16 }}>
                <h3 style={{ fontSize: 18, fontWeight: 600, color: colors.primary, margin: 0 }}>
                  🔵 Stripe Integration
                </h3>
                {stripeConnected && (
                  <span style={{ marginLeft: "auto", color: colors.success, fontWeight: 600 }}>✓ Connected</span>
                )}
              </div>
              <p style={{ color: colors.neutral, fontSize: 14, marginBottom: 16 }}>
                Collect payments & send/receive ACH transfers. Perfect for invoicing clients and getting paid fast.
              </p>
              <div
                style={{
                  background: colors.background,
                  padding: 12,
                  borderRadius: 6,
                  marginBottom: 16,
                  fontSize: 12,
                  fontFamily: "monospace",
                  color: colors.neutral,
                }}
              >
                Features: Payment links • ACH transfers • Plaid account linking • Subscription billing
              </div>
              <button
                onClick={handleStripeConnect}
                style={{
                  width: "100%",
                  padding: 12,
                  background: stripeConnected ? colors.background : colors.primary,
                  color: stripeConnected ? colors.primary : "white",
                  border: `1px solid ${colors.border}`,
                  borderRadius: 6,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                {stripeConnected ? "✓ Connected" : "🔗 Connect Stripe"}
              </button>
            </div>

            {/* Melio Section */}
            <div
              style={{
                background: "white",
                padding: 24,
                borderRadius: 12,
                border: `1px solid ${colors.border}`,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", marginBottom: 16 }}>
                <h3 style={{ fontSize: 18, fontWeight: 600, color: "#ff6b35", margin: 0 }}>
                  🟠 Melio Integration
                </h3>
                {melioConnected && (
                  <span style={{ marginLeft: "auto", color: colors.success, fontWeight: 600 }}>✓ Connected</span>
                )}
              </div>
              <p style={{ color: colors.neutral, fontSize: 14, marginBottom: 16 }}>
                Pay vendors & contractors. Built for small business bill pay and ACH transfers.
              </p>
              <div
                style={{
                  background: colors.background,
                  padding: 12,
                  borderRadius: 6,
                  marginBottom: 16,
                  fontSize: 12,
                  fontFamily: "monospace",
                  color: colors.neutral,
                }}
              >
                Features: Bill pay • Vendor payments • ACH transfers • Invoice automation
              </div>
              <button
                onClick={handleMelioConnect}
                style={{
                  width: "100%",
                  padding: 12,
                  background: melioConnected ? colors.background : "#ff6b35",
                  color: melioConnected ? "#ff6b35" : "white",
                  border: `1px solid ${colors.border}`,
                  borderRadius: 6,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                {melioConnected ? "✓ Connected" : "🔗 Connect Melio"}
              </button>
            </div>

            {/* API Keys Section */}
            <div
              style={{
                background: "white",
                padding: 24,
                borderRadius: 12,
                border: `1px solid ${colors.border}`,
                gridColumn: "1 / -1",
              }}
            >
              <h3 style={{ fontSize: 18, fontWeight: 600, color: colors.primary, marginBottom: 16 }}>
                🔑 API Configuration
              </h3>
              <p style={{ color: colors.neutral, fontSize: 14, marginBottom: 16 }}>
                Set your API keys in environment variables. Never commit secrets to version control!
              </p>
              <div
                style={{
                  background: colors.background,
                  padding: 16,
                  borderRadius: 6,
                  fontFamily: "monospace",
                  fontSize: 12,
                  color: colors.neutral,
                  whiteSpace: "pre-wrap",
                  overflowX: "auto",
                }}
              >
{`# .env.local
NEXT_PUBLIC_STRIPE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_MELIO_KEY=melio_pk_...
MELIO_SECRET_KEY=melio_sk_...`}
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

function Card({ title, value, color }: { title: string; value: number; color: string }) {
  return (
    <div
      style={{
        background: "white",
        border: `1px solid ${colors.border}`,
        borderRadius: 12,
        padding: 24,
        boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
      }}
    >
      <div style={{ color: colors.neutral, fontSize: 14, marginBottom: 12 }}>{title}</div>
      <div style={{ fontSize: 32, fontWeight: 700, color }}>
        ${value.toLocaleString(undefined, { minimumFractionDigits: 2 })}
      </div>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th
      style={{
        padding: "12px 16px",
        borderBottom: `1px solid ${colors.border}`,
        textAlign: "left",
        fontWeight: 600,
        fontSize: 14,
        color: colors.primary,
      }}
    >
      {children}
    </th>
  );
}

function Td({
  children,
  style,
  ...props
}: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td
      {...props}
      style={{
        padding: "12px 16px",
        borderBottom: `1px solid ${colors.border}`,
        fontSize: 14,
        ...style,
      }}
    >
      {children}
    </td>
  );
}
