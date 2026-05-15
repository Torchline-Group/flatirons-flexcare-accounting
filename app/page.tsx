"use client"

import * as React from "react"
import { createClient } from "@/lib/supabase/client"
import {
  BarChart,
  Bar,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts"

type Category =
  | "accounts_receivable"
  | "accounts_payable"
  | "vendor_payment"
  | "owner_withdrawal"

type Row = {
  id: string
  Date_Value: string | null
  Ref_No: string | null
  Payee: string | null
  Memo: string | null
  Payment: string | null
  Deposit: string | null
  Reconciliation_Status: string | null
  Balance: string | null
  Type: string | null
  Bank_Accounts: string | null
  Added_in_Banking: string | null
  category: Category | null
}

type TxRow = Row & {
  amount: number
  dateObj: Date | null
  month: string
}

type MonthlyRow = {
  month: string
  ar: number
  ap: number
  vendor: number
  owner: number
  net: number
  total: number
}

const START_DATE = new Date("2025-10-20T00:00:00")

const COLORS = {
  ar: "#dcfce7",
  ap: "#fee2e2",
  vendor: "#fef9c3",
  owner: "#dbeafe",
  net: "#111827",
}

function parseAmount(v: string | null | undefined) {
  const n = Number(String(v ?? "").replace(/[$,]/g, "").trim())
  return Number.isFinite(n) ? n : 0
}

function parseDate(v: string | null | undefined) {
  if (!v) return null
  const raw = String(v).trim()
  if (!raw) return null

  const mmddyyyy = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (mmddyyyy) {
    const [, mm, dd, yyyy] = mmddyyyy
    const d = new Date(Number(yyyy), Number(mm) - 1, Number(dd))
    return Number.isNaN(d.getTime()) ? null : d
  }

  const d = new Date(raw)
  return Number.isNaN(d.getTime()) ? null : d
}

function monthKey(dateObj: Date | null) {
  if (!dateObj) return "Unknown"
  return dateObj.toLocaleDateString("en-US", { month: "short", year: "numeric" })
}

function money(v: number) {
  return `$${v.toLocaleString(undefined, { maximumFractionDigits: 2 })}`
}

function categoryLabel(cat: Category | null) {
  switch (cat) {
    case "accounts_receivable":
      return "Accounts Receivable"
    case "accounts_payable":
      return "Accounts Payable"
    case "vendor_payment":
      return "Vendor Payment"
    case "owner_withdrawal":
      return "Owner Withdrawal"
    default:
      return "Uncategorized"
  }
}

function categoryColor(cat: Category | null) {
  switch (cat) {
    case "accounts_receivable":
      return "bg-green-100 text-green-700"
    case "accounts_payable":
      return "bg-red-100 text-red-700"
    case "vendor_payment":
      return "bg-yellow-100 text-yellow-700"
    case "owner_withdrawal":
      return "bg-blue-100 text-blue-700"
    default:
      return "bg-slate-100 text-slate-700"
  }
}

export default function Home() {
  const [rows, setRows] = React.useState<Row[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState("")
  const [filter, setFilter] = React.useState<"all" | Category>("all")
  const [showOwnerOnly, setShowOwnerOnly] = React.useState(false)

  React.useEffect(() => {
    const supabase = createClient()

    async function load() {
      setLoading(true)
      setError("")

      const { data, error } = await supabase
        .from("Transactions List")
        .select("*")
        .gte("Date_Value", "2025-10-20")
        .order("Date_Value", { ascending: false })

      if (error) {
        setError(error.message)
        setLoading(false)
        return
      }

      setRows((data ?? []) as Row[])
      setLoading(false)
    }

    load()
  }, [])

  const txRows = React.useMemo<TxRow[]>(() => {
    return rows
      .map((r) => {
        const dateObj = parseDate(r.Date_Value)
        const amount = parseAmount(r.Deposit) > 0 ? parseAmount(r.Deposit) : parseAmount(r.Payment)

        return {
          ...r,
          amount,
          dateObj,
          month: monthKey(dateObj),
        }
      })
      .sort((a, b) => (b.dateObj?.getTime() ?? 0) - (a.dateObj?.getTime() ?? 0))
  }, [rows])

  const filteredRows = React.useMemo(() => {
    let out = txRows
    if (filter !== "all") out = out.filter((r) => r.category === filter)
    if (showOwnerOnly) out = out.filter((r) => r.category === "owner_withdrawal")
    return out
  }, [txRows, filter, showOwnerOnly])

  const monthly = React.useMemo(() => {
    const map = new Map<string, MonthlyRow>()

    for (const r of txRows) {
      const cur =
        map.get(r.month) ?? {
          month: r.month,
          ar: 0,
          ap: 0,
          vendor: 0,
          owner: 0,
          net: 0,
          total: 0,
        }

      if (r.category === "accounts_receivable") cur.ar += r.amount
      if (r.category === "accounts_payable") cur.ap += r.amount
      if (r.category === "vendor_payment") cur.vendor += r.amount
      if (r.category === "owner_withdrawal") cur.owner += r.amount

      cur.net += r.category === "accounts_receivable" ? r.amount : r.category === "accounts_payable" ? -r.amount : 0
      cur.total += r.amount

      map.set(r.month, cur)
    }

    return [...map.values()].sort((a, b) => a.month.localeCompare(b.month))
  }, [txRows])

  const totals = React.useMemo(() => {
    const ar = txRows.filter((r) => r.category === "accounts_receivable").reduce((s, r) => s + r.amount, 0)
    const ap = txRows.filter((r) => r.category === "accounts_payable").reduce((s, r) => s + r.amount, 0)
    const vendor = txRows.filter((r) => r.category === "vendor_payment").reduce((s, r) => s + r.amount, 0)
    const owner = txRows.filter((r) => r.category === "owner_withdrawal").reduce((s, r) => s + r.amount, 0)

    const operatingNet = ar - ap - vendor
    const squareOneNet = ar - ap - vendor - owner
    const monthlyAverage = monthly.length ? monthly.reduce((s, m) => s + m.total, 0) / monthly.length : 0

    return { ar, ap, vendor, owner, operatingNet, squareOneNet, monthlyAverage }
  }, [txRows, monthly])

  const pieData = [
    { name: "Accounts Receivable", value: totals.ar, fill: COLORS.ar },
    { name: "Accounts Payable", value: totals.ap, fill: COLORS.ap },
    { name: "Vendor Payment", value: totals.vendor, fill: COLORS.vendor },
    { name: "Owner Withdrawal", value: totals.owner, fill: COLORS.owner },
  ]

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b bg-white px-4 py-6">
        <div className="mx-auto max-w-7xl">
          <h1 className="text-2xl font-bold">FlexCare Accounting</h1>
          <p className="text-sm text-slate-600">Post-cutoff reporting from October 20 onward</p>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-8 px-4 py-8">
        {loading && <p>Loading...</p>}
        {error && <p className="text-red-600">{error}</p>}

        {!loading && !error && (
          <>
            <div className="grid gap-4 md:grid-cols-4">
              <Card title="AR" value={totals.ar} className="bg-green-50" />
              <Card title="AP" value={totals.ap} className="bg-red-50" />
              <Card title="Vendor Payment" value={totals.vendor} className="bg-yellow-50" />
              <Card title="Owner Withdrawal" value={totals.owner} className="bg-blue-50" />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <Card title="Operating Net" value={totals.operatingNet} className={totals.operatingNet >= 0 ? "bg-green-50" : "bg-red-50"} />
              <Card title="Square-1 Net" value={totals.squareOneNet} className={totals.squareOneNet >= 0 ? "bg-green-50" : "bg-red-50"} />
              <Card title="Avg Monthly Total" value={totals.monthlyAverage} className="bg-slate-100" />
            </div>

            <section className="rounded-lg border bg-white p-4">
              <h2 className="mb-4 text-lg font-semibold">Monthly Profit / Loss</h2>
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthly}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="ar" name="Accounts Receivable" fill={COLORS.ar} />
                    <Bar dataKey="ap" name="Accounts Payable" fill={COLORS.ap} />
                    <Bar dataKey="vendor" name="Vendor Payment" fill={COLORS.vendor} />
                    <Bar dataKey="owner" name="Owner Withdrawal" fill={COLORS.owner} />
                    <Line dataKey="net" name="Net" stroke={COLORS.net} strokeWidth={2} dot={false} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>

            <section className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-lg border bg-white p-4">
                <h2 className="mb-4 text-lg font-semibold">Category Breakdown</h2>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={pieData} dataKey="value" nameKey="name" outerRadius={110} label>
                        {pieData.map((entry) => (
                          <Cell key={entry.name} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="rounded-lg border bg-white p-4">
                <h2 className="mb-4 text-lg font-semibold">Monthly Totals</h2>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={monthly}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="total" name="Total Amount" stroke="#2563eb" strokeWidth={2} dot />
                      <Line type="monotone" dataKey="net" name="Net Operating" stroke={COLORS.net} strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </section>

            <section className="rounded-lg border bg-white p-4">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-lg font-semibold">Transactions</h2>
                <div className="flex flex-wrap gap-2">
                  {[
                    ["all", "All"],
                    ["accounts_receivable", "AR"],
                    ["accounts_payable", "AP"],
                    ["vendor_payment", "Vendor"],
                    ["owner_withdrawal", "Owner"],
                  ].map(([key, label]) => (
                    <button
                      key={key}
                      onClick={() => setFilter(key as "all" | Category)}
                      className={`rounded-full px-4 py-2 text-sm font-medium ${
                        filter === key ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <label className="mb-4 flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={showOwnerOnly}
                  onChange={(e) => setShowOwnerOnly(e.target.checked)}
                />
                Show owner withdrawals only
              </label>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-slate-100">
                      <th className="p-2 text-left">Date</th>
                      <th className="p-2 text-left">Payee</th>
                      <th className="p-2 text-left">Memo</th>
                      <th className="p-2 text-left">Category</th>
                      <th className="p-2 text-left">Amount</th>
                      <th className="p-2 text-left">Account</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRows.map((r) => (
                      <tr key={r.id} className="border-b">
                        <td className="p-2">{r.dateObj ? r.dateObj.toLocaleDateString("en-US") : r.Date_Value || ""}</td>
                        <td className="p-2">{r.Payee || ""}</td>
                        <td className="p-2">{r.Memo || ""}</td>
                        <td className="p-2">
                          <span className={`rounded-full px-2 py-1 text-xs font-medium ${categoryColor(r.category)}`}>
                            {categoryLabel(r.category)}
                          </span>
                        </td>
                        <td className="p-2">{money(r.amount)}</td>
                        <td className="p-2">{r.Bank_Accounts || ""}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  )
}

function Card({
  title,
  value,
  className,
}: {
  title: string
  value: number
  className?: string
}) {
  return (
    <div className={`rounded-lg border p-4 ${className ?? "bg-white"}`}>
      <div className="text-sm text-slate-600">{title}</div>
      <div className="mt-2 text-2xl font-bold">${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
    </div>
  )
}
