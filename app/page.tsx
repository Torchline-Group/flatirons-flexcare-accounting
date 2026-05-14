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
}

type TxKind = "ar" | "ap" | "transfers" | "misc"

type TxRow = Row & {
  kind: TxKind
  amount: number
  month: string
}

type MonthlyRow = {
  month: string
  ar: number
  ap: number
  transfers: number
  misc: number
  net: number
  total: number
}

const COLORS = {
  ar: "#dcfce7",
  ap: "#fee2e2",
  transfers: "#fef9c3",
  misc: "#e5e7eb",
}

function parseAmount(v: string | null | undefined) {
  const n = Number(String(v ?? "").replace(/[$,]/g, "").trim())
  return Number.isFinite(n) ? n : 0
}

function monthKey(dateStr: string | null | undefined) {
  if (!dateStr) return "Unknown"
  const d = new Date(dateStr)
  if (Number.isNaN(d.getTime())) return "Unknown"
  return d.toLocaleDateString("en-US", { month: "short", year: "numeric" })
}

function txKind(row: Row): TxKind {
  const t = (row.Type ?? "").toLowerCase()
  const memo = `${row.Memo ?? ""} ${row.Payee ?? ""} ${row.Added_in_Banking ?? ""}`.toLowerCase()

  if (t.includes("transfer") || memo.includes("transfer")) return "transfers"
  if (parseAmount(row.Deposit) > 0) return "ar"
  if (parseAmount(row.Payment) > 0) return "ap"
  return "misc"
}

function money(v: number) {
  return `$${v.toLocaleString(undefined, { maximumFractionDigits: 2 })}`
}

export default function Home() {
  const [rows, setRows] = React.useState<Row[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState("")
  const [filter, setFilter] = React.useState<"all" | TxKind>("all")

  React.useEffect(() => {
    const supabase = createClient()

    async function load() {
      setLoading(true)
      setError("")

      const { data, error } = await supabase
        .from("Transactions List")
        .select("*")
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
    return rows.map((r) => {
      const kind = txKind(r)
      const ar = parseAmount(r.Deposit)
      const ap = parseAmount(r.Payment)
      const amount = ar > 0 ? ar : ap > 0 ? ap : 0

      return {
        ...r,
        kind,
        amount,
        month: monthKey(r.Date_Value),
      }
    })
  }, [rows])

  const filteredRows = React.useMemo(() => {
    if (filter === "all") return txRows
    return txRows.filter((r) => r.kind === filter)
  }, [txRows, filter])

  const monthly = React.useMemo(() => {
    const map = new Map<string, MonthlyRow>()

    for (const r of txRows) {
      const cur =
        map.get(r.month) ?? {
          month: r.month,
          ar: 0,
          ap: 0,
          transfers: 0,
          misc: 0,
          net: 0,
          total: 0,
        }

      if (r.kind === "ar") cur.ar += r.amount
      if (r.kind === "ap") cur.ap += r.amount
      if (r.kind === "transfers") cur.transfers += r.amount
      if (r.kind === "misc") cur.misc += r.amount

      cur.net += r.kind === "ar" ? r.amount : r.kind === "ap" ? -r.amount : 0
      cur.total += r.amount

      map.set(r.month, cur)
    }

    return [...map.values()].sort((a, b) => a.month.localeCompare(b.month))
  }, [txRows])

  const totals = React.useMemo(() => {
    const totalAR = txRows.filter((r) => r.kind === "ar").reduce((s, r) => s + r.amount, 0)
    const totalAP = txRows.filter((r) => r.kind === "ap").reduce((s, r) => s + r.amount, 0)
    const totalTransfers = txRows.filter((r) => r.kind === "transfers").reduce((s, r) => s + r.amount, 0)
    const totalMisc = txRows.filter((r) => r.kind === "misc").reduce((s, r) => s + r.amount, 0)
    const net = totalAR - totalAP
    const monthlyAverage = monthly.length ? monthly.reduce((s, m) => s + m.total, 0) / monthly.length : 0

    return { totalAR, totalAP, totalTransfers, totalMisc, net, monthlyAverage }
  }, [txRows, monthly])

  const categoryTotals = [
    { name: "AR", value: totals.totalAR },
    { name: "AP", value: totals.totalAP },
    { name: "Transfers", value: totals.totalTransfers },
    { name: "Misc", value: totals.totalMisc },
  ]

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b bg-white px-4 py-6">
        <div className="mx-auto max-w-7xl">
          <h1 className="text-2xl font-bold">FlexCare Accounting</h1>
          <p className="text-sm text-slate-600">Monthly P/L, category breakdown, and transaction explorer</p>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-8 px-4 py-8">
        {loading && <p>Loading...</p>}
        {error && <p className="text-red-600">{error}</p>}

        {!loading && !error && (
          <>
            <div className="grid gap-4 md:grid-cols-4">
              <Card title="Total AR" value={totals.totalAR} className="bg-green-50" />
              <Card title="Total AP" value={totals.totalAP} className="bg-red-50" />
              <Card title="Transfers" value={totals.totalTransfers} className="bg-yellow-50" />
              <Card title="Monthly Avg" value={totals.monthlyAverage} className="bg-slate-100" />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <Card title="Net Profit / Loss" value={totals.net} className={totals.net >= 0 ? "bg-green-50" : "bg-red-50"} />
              <Card title="Total In" value={totals.totalAR + totals.totalTransfers + totals.totalMisc} className="bg-slate-100" />
              <Card title="Total Out" value={totals.totalAP + totals.totalTransfers + totals.totalMisc} className="bg-slate-100" />
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
                    <Bar dataKey="ar" name="AR" fill={COLORS.ar} />
                    <Bar dataKey="ap" name="AP" fill={COLORS.ap} />
                    <Bar dataKey="transfers" name="Transfers" fill={COLORS.transfers} />
                    <Bar dataKey="misc" name="Misc" fill={COLORS.misc} />
                    <Line dataKey="net" name="Net" stroke="#111827" strokeWidth={2} dot={false} />
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
                      <Pie data={categoryTotals} dataKey="value" nameKey="name" outerRadius={110} label>
                        {categoryTotals.map((entry, index) => (
                          <Cell
                            key={entry.name}
                            fill={index === 0 ? COLORS.ar : index === 1 ? COLORS.ap : index === 2 ? COLORS.transfers : COLORS.misc}
                          />
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
                      <Line type="monotone" dataKey="net" name="Net Profit/Loss" stroke="#111827" strokeWidth={2} dot={false} />
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
                    ["ar", "AR"],
                    ["ap", "AP"],
                    ["transfers", "Transfers"],
                    ["misc", "Misc"],
                  ].map(([key, label]) => (
                    <button
                      key={key}
                      onClick={() => setFilter(key as "all" | TxKind)}
                      className={`rounded-full px-4 py-2 text-sm font-medium ${
                        filter === key
                          ? "bg-slate-900 text-white"
                          : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

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
                        <td className="p-2">{r.Date_Value || ""}</td>
                        <td className="p-2">{r.Payee || ""}</td>
                        <td className="p-2">{r.Memo || ""}</td>
                        <td className="p-2">
                          <span
                            className={`rounded-full px-2 py-1 text-xs font-medium ${
                              r.kind === "ar"
                                ? "bg-green-100 text-green-700"
                                : r.kind === "ap"
                                  ? "bg-red-100 text-red-700"
                                  : r.kind === "transfers"
                                    ? "bg-yellow-100 text-yellow-700"
                                    : "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {r.kind.toUpperCase()}
                          </span>
                        </td>
                        <td className="p-2">${r.amount.toLocaleString()}</td>
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