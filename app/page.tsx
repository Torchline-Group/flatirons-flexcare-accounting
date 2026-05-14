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

function txKind(row: Row) {
  const t = (row.Type ?? "").toLowerCase()
  const memo = `${row.Memo ?? ""} ${row.Payee ?? ""} ${row.Added_in_Banking ?? ""}`.toLowerCase()

  if (t.includes("deposit") || parseAmount(row.Deposit) > 0) return "ar"
  if (t.includes("payment") || parseAmount(row.Payment) > 0) return "ap"
  if (memo.includes("transfer") || t.includes("transfer")) return "transfers"
  return "misc"
}

export default function Home() {
  const [rows, setRows] = React.useState<Row[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState("")

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

  const monthly = React.useMemo(() => {
    const map = new Map<string, MonthlyRow>()

    for (const r of rows) {
      const month = monthKey(r.Date_Value)
      const cur =
        map.get(month) ?? {
          month,
          ar: 0,
          ap: 0,
          transfers: 0,
          misc: 0,
          net: 0,
          total: 0,
        }

      const kind = txKind(r)
      const ar = parseAmount(r.Deposit)
      const ap = parseAmount(r.Payment)
      const amt = ar + ap

      cur.ar += kind === "ar" ? ar : 0
      cur.ap += kind === "ap" ? ap : 0
      cur.transfers += kind === "transfers" ? amt : 0
      cur.misc += kind === "misc" ? amt : 0
      cur.net += ar - ap
      cur.total += amt

      map.set(month, cur)
    }

    return [...map.values()].sort((a, b) => a.month.localeCompare(b.month))
  }, [rows])

  const totals = React.useMemo(() => {
    const totalAR = rows.reduce((s, r) => s + (txKind(r) === "ar" ? parseAmount(r.Deposit) : 0), 0)
    const totalAP = rows.reduce((s, r) => s + (txKind(r) === "ap" ? parseAmount(r.Payment) : 0), 0)
    const totalTransfers = rows.reduce((s, r) => {
      const kind = txKind(r)
      return s + (kind === "transfers" ? parseAmount(r.Deposit) + parseAmount(r.Payment) : 0)
    }, 0)
    const totalMisc = rows.reduce((s, r) => {
      const kind = txKind(r)
      return s + (kind === "misc" ? parseAmount(r.Deposit) + parseAmount(r.Payment) : 0)
    }, 0)

    const totalIn = totalAR + totalTransfers + totalMisc
    const totalOut = totalAP + totalTransfers + totalMisc
    const net = totalAR - totalAP
    const monthlyAverage = monthly.length ? monthly.reduce((s, m) => s + m.total, 0) / monthly.length : 0

    return {
      totalAR,
      totalAP,
      totalTransfers,
      totalMisc,
      totalIn,
      totalOut,
      net,
      monthlyAverage,
    }
  }, [rows, monthly])

  const pieData = [
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
          <p className="text-sm text-slate-600">Monthly profit/loss and transaction breakdown</p>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 space-y-8">
        {loading && <p>Loading...</p>}
        {error && <p className="text-red-600">{error}</p>}

        {!loading && !error && (
          <>
            <div className="grid gap-4 md:grid-cols-4">
              <Card title="Total AR" value={totals.totalAR} className="bg-green-50" />
              <Card title="Total AP" value={totals.totalAP} className="bg-red-50" />
              <Card title="Total Transfers" value={totals.totalTransfers} className="bg-yellow-50" />
              <Card title="Monthly Avg" value={totals.monthlyAverage} className="bg-slate-100" />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <Card title="Net Profit / Loss" value={totals.net} className={totals.net >= 0 ? "bg-green-50" : "bg-red-50"} />
              <Card title="Total In" value={totals.totalIn} className="bg-slate-100" />
              <Card title="Total Out" value={totals.totalOut} className="bg-slate-100" />
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
                <h2 className="mb-4 text-lg font-semibold">Breakdown by Category</h2>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={pieData} dataKey="value" nameKey="name" outerRadius={110} label>
                        {pieData.map((entry, index) => (
                          <Cell
                            key={entry.name}
                            fill={
                              index === 0 ? COLORS.ar :
                              index === 1 ? COLORS.ap :
                              index === 2 ? COLORS.transfers :
                              COLORS.misc
                            }
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
              <h2 className="mb-4 text-lg font-semibold">Monthly Summary</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-slate-100">
                      <th className="p-2 text-left">Month</th>
                      <th className="p-2 text-left">AR</th>
                      <th className="p-2 text-left">AP</th>
                      <th className="p-2 text-left">Transfers</th>
                      <th className="p-2 text-left">Misc</th>
                      <th className="p-2 text-left">Total</th>
                      <th className="p-2 text-left">Net</th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthly.map((m) => (
                      <tr key={m.month} className="border-b">
                        <td className="p-2">{m.month}</td>
                        <td className="p-2">${m.ar.toLocaleString()}</td>
                        <td className="p-2">${m.ap.toLocaleString()}</td>
                        <td className="p-2">${m.transfers.toLocaleString()}</td>
                        <td className="p-2">${m.misc.toLocaleString()}</td>
                        <td className="p-2">${m.total.toLocaleString()}</td>
                        <td className="p-2">${m.net.toLocaleString()}</td>
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
