"use client"

import * as React from "react"
import { createClient } from "@/lib/supabase/client"

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

export default function Home() {
  const [rows, setRows] = React.useState<Row[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState("")

  React.useEffect(() => {
    const supabase = createClientInstance()

    async function load() {
      setLoading(true)
      setError("")

      const { data, error } = await supabase
        .from("Transactions_List")
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

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b bg-white px-4 py-6">
        <div className="mx-auto max-w-7xl">
          <h1 className="text-2xl font-bold">FlexCare Accounting</h1>
          <p className="text-sm text-slate-600">Supabase rows dashboard</p>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8">
        {loading && <p>Loading...</p>}
        {error && <p className="text-red-600">{error}</p>}

        {!loading && !error && (
          <div className="overflow-x-auto rounded-lg border bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-slate-100">
                  <th className="p-2 text-left">Date</th>
                  <th className="p-2 text-left">Payee</th>
                  <th className="p-2 text-left">Memo</th>
                  <th className="p-2 text-left">Payment</th>
                  <th className="p-2 text-left">Deposit</th>
                  <th className="p-2 text-left">Account</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-b">
                    <td className="p-2">{r.Date_Value || ""}</td>
                    <td className="p-2">{r.Payee || ""}</td>
                    <td className="p-2">{r.Memo || ""}</td>
                    <td className="p-2">{r.Payment || ""}</td>
                    <td className="p-2">{r.Deposit || ""}</td>
                    <td className="p-2">{r.Bank_Accounts || ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  )
}
