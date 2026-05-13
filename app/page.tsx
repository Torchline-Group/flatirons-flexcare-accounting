import { DashboardHeader } from "@/components/dashboard/header"
import { TransactionTable } from "@/components/dashboard/transaction-table"
import { DashboardStats } from "@/components/dashboard/stats"
import { DashboardCharts } from "@/components/dashboard/charts"

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50">
      <DashboardHeader />
      <main className="container mx-auto px-4 py-8">
        <DashboardStats />
        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <TransactionTable />
          </div>
          <div>
            <DashboardCharts />
          </div>
        </div>
      </main>
    </div>
  )
}
