"use client"

import * as React from "react"
import Papa from "papaparse"
import { TrendingUp } from "lucide-react"
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts"
import { createClient } from "@/lib/supabase/client"

type SupabaseRow = {
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

type Txn = {
  id: string
  date: string
  refNo: string
  payee: string
  memo: string
  payment: number
  deposit: number
  status: string
  balance: number
  type: string
  account: string
  addedInBanking: string
}

function money(v: string | null | undefined) {
  const cleaned = (v || "").replace(/[$,]/g, "").trim()
  if (!cleaned) return 0
  const n = Number(cleaned)
  return Number.isFinite(n) ? n : 0
}

function txt(v: string | null | undefined) {
  return (v || "").trim()
}

export default function Page() {
  const [rows, setRows] = React.useState<Txn[]>([])
  const [error, setError] = React.useState("")
  const [loading, setLoading] = React.useState(true)
  const [activeTab, setActiveTab] = React.useState<"dashboard" | "settings">("dashboard")

  const [timeRange] = React.useState("90d")

  React.useEffect(() => {
    const supabase = createClient()

    async function loadRows() {
      setLoading(true)
      setError("")

      const { data, error } = await supabase
        .from("Transactions-List")
        .select("*")
        .order("Date_Value", { ascending: false })

      if (error) {
        setError(error.message)
        setLoading(false)
        return
      }

      const mapped: Txn[] = (data as SupabaseRow[] | null | undefined)?.map((r) => ({
        id: r.id,
        date: txt(r.Date_Value),
        refNo: txt(r.Ref_No),
        payee: txt(r.Payee),
        memo: txt(r.Memo),
        payment: money(r.Payment),
        deposit: money(r.Deposit),
        status: txt(r.Reconciliation_Status),
        balance: money(r.Balance),
        type: txt(r.Type),
        account: txt(r.Bank_Accounts) || "Uncategorized",
        addedInBanking: txt(r.Added_in_Banking),
      })) ?? []

      setRows(mapped)
      setLoading(false)
    }

    loadRows()
  }, [])

  const totals = React.useMemo(() => {
    const income = rows.reduce((sum, r) => sum + r.deposit, 0)
    const expenses = rows.reduce((sum, r) => sum + r.payment, 0)
    const net = income - expenses
    return { income, expenses, net }
  }, [rows])

  const byAccount = React.useMemo(() => {
    const map = new Map<string, { account: string; deposits: number; payments: number; net: number; count: number }>()

    for (const r of rows) {
      const key = r.account || "Uncategorized"
      const cur =
        map.get(key) || {
          account: key,
          deposits: 0,
          payments: 0,
          net: 0,
          count: 0,
        }
      cur.deposits += r.deposit
      cur.payments += r.payment
      cur.net += r.deposit - r.payment
      cur.count += 1
      map.set(key, cur)
    }

    return [...map.values()].sort((a, b) => Math.abs(b.net) - Math.abs(a.net))
  }, [rows])

  const chartData = React.useMemo(() => {
    return byAccount.map((acc) => ({
      name: acc.account,
      deposits: acc.deposits,
      payments: acc.payments,
    }))
  }, [byAccount])

  const monthlyData = React.useMemo(() => {
    const months = new Map<string, { month: string; income: number; expenses: number }>()

    rows.forEach((r) => {
      if (!r.date) return
      const date = new Date(r.date)
      if (Number.isNaN(date.getTime())) return
      const key = date.toLocaleDateString("en-US", { month: "short", year: "numeric" })
      const cur = months.get(key) || { month: key, income: 0, expenses: 0 }
      cur.income += r.deposit
      cur.expenses += r.payment
      months.set(key, cur)
    })

    return Array.from(months.values())
  }, [rows])

  async function onFile(file: File | null) {
    if (!file) return
    setError("")
    setLoading(true)

    try {
      const text = await file.text()
      const parsed = Papa.parse<any>(text, { header: true, skipEmptyLines: true })

      if (parsed.errors.length) throw new Error(parsed.errors[0].message)

      const cleaned: Txn[] = (parsed.data || [])
        .map((r: any) => ({
          id: r.id || crypto.randomUUID(),
          date: txt(r.Date_Value || r.Date),
          refNo: txt(r.Ref_No || r["Ref No."]),
          payee: txt(r.Payee),
          memo: txt(r.Memo),
          payment: money(r.Payment),
          deposit: money(r.Deposit),
          status: txt(r.Reconciliation_Status || r["Reconciliation Status"]),
          balance: money(r.Balance),
          type: txt(r.Type),
          account: txt(r.Bank_Accounts || r.Account) || "Uncategorized",
          addedInBanking: txt(r.Added_in_Banking || r["Added in Banking"]),
        }))
        .filter((r: Txn) => r.date)

      setRows(cleaned)
    } catch (e: any) {
      setError(e?.message || "Failed to parse CSV")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="border-b bg-white dark:bg-slate-950">
        <div className="mx-auto max-w-7xl px-6 py-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 p-2">
                <span className="text-2xl">🏢</span>
              </div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">FlexCare Accounting</h1>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Supabase-backed dashboard for your transaction rows
            </p>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-8 flex gap-4 border-b border-slate-200 dark:border-slate-800">
          {(["dashboard", "settings"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
                activeTab === tab
                  ? "border-blue-500 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
              }`}
            >
              {tab === "dashboard" && "📊 Dashboard"}
              {tab === "settings" && "⚙️ Settings"}
            </button>
          ))}
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-900 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
            ❌ {error}
          </div>
        )}

        {loading && <p className="text-center text-slate-600 dark:text-slate-400">⏳ Loading Supabase data...</p>}

        {activeTab === "dashboard" && !loading && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <Card title="💰 Deposits" value={totals.income} trend="up" />
              <Card title="💳 Payments" value={totals.expenses} trend="down" />
              <Card title="📈 Net Income" value={totals.net} trend={totals.net >= 0 ? "up" : "down"} />
            </div>

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
              {monthlyData.length > 0 && (
                <div className="rounded-lg border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-950">
                  <h3 className="mb-4 font-semibold text-slate-900 dark:text-white">Income vs Expenses</h3>
                  <div className="h-80 w-full">
                    <BarChart width={400} height={300} data={monthlyData}>
                      <CartesianGrid vertical={false} stroke="hsl(var(--border))" />
                      <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                      <Bar dataKey="income" fill="hsl(var(--chart-1))" />
                      <Bar dataKey="expenses" fill="hsl(var(--chart-2))" />
                    </BarChart>
                  </div>
                </div>
              )}

              {chartData.length > 0 && (
                <div className="rounded-lg border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-950">
                  <h3 className="mb-4 font-semibold text-slate-900 dark:text-white">Breakdown by Account</h3>
                  <div className="h-80 w-full">
                    <BarChart width={400} height={300} data={chartData}>
                      <CartesianGrid vertical={false} stroke="hsl(var(--border))" />
                      <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
                      <Bar dataKey="deposits" fill="hsl(var(--chart-1))" />
                      <Bar dataKey="payments" fill="hsl(var(--chart-2))" />
                    </BarChart>
                  </div>
                </div>
              )}
            </div>

            <div className="rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
              <div className="border-b border-slate-200 p-6 dark:border-slate-800">
                <h3 className="font-semibold text-slate-900 dark:text-white">🏦 Totals by Account</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900">
                      <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-white">Account</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-white">Txns</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-white">Deposits</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-white">Payments</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-white">Net</th>
                    </tr>
                  </thead>
                  <tbody>
                    {byAccount.map((r) => (
                      <tr key={r.account} className="border-b border-slate-200 dark:border-slate-800">
                        <td className="px-6 py-3 text-sm text-slate-900 dark:text-slate-100">{r.account}</td>
                        <td className="px-6 py-3 text-sm text-slate-900 dark:text-slate-100">{r.count}</td>
                        <td className="px-6 py-3 text-sm font-medium text-green-600 dark:text-green-400">${r.deposits.toLocaleString()}</td>
                        <td className="px-6 py-3 text-sm font-medium text-red-600 dark:text-red-400">${r.payments.toLocaleString()}</td>
                        <td className={`px-6 py-3 text-sm font-medium ${r.net >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                          ${r.net.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === "settings" && (
          <div className="rounded-lg border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-950">
            <h3 className="mb-4 font-semibold text-slate-900 dark:text-white">🔑 Supabase Table</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              This dashboard reads from <code>Transactions-List_rows</code> using your existing Supabase connection.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

function Card({ title, value, trend }: { title: string; value: number; trend: "up" | "down" }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-950">
      <div className="mb-2 text-sm font-medium text-slate-600 dark:text-slate-400">{title}</div>
      <div className="flex items-end justify-between">
        <div className="text-3xl font-bold text-slate-900 dark:text-white">
          ${(value / 1000).toFixed(1)}k
        </div>
        <TrendingUp className={`h-5 w-5 ${trend === "up" ? "text-green-600" : "rotate-180 text-red-600"}`} />
      </div>
    </div>
  )
}
