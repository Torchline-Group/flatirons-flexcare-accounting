"use client"

import { ArrowDownRight, ArrowUpRight, DollarSign, TrendingUp } from "lucide-react"
import { Card } from "@/components/ui/card"

export function DashboardStats() {
  const stats = [
    {
      label: "Total Deposits",
      value: "$847,500",
      change: "+12.5%",
      isPositive: true,
      icon: ArrowDownRight,
    },
    {
      label: "Total Payments",
      value: "$523,250",
      change: "-8.2%",
      isPositive: false,
      icon: ArrowUpRight,
    },
    {
      label: "Current Balance",
      value: "$324,250",
      change: "+4.3%",
      isPositive: true,
      icon: DollarSign,
    },
    {
      label: "Transactions",
      value: "368",
      change: "This Period",
      isPositive: true,
      icon: TrendingUp,
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, index) => {
        const Icon = stat.icon
        return (
          <Card key={index} className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">{stat.label}</p>
                <p className="mt-2 text-2xl font-bold text-slate-900">
                  {stat.value}
                </p>
                <p
                  className={`mt-1 text-xs font-semibold ${
                    stat.isPositive ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {stat.change}
                </p>
              </div>
              <div
                className={`rounded-lg p-3 ${
                  stat.isPositive ? "bg-green-100" : "bg-red-100"
                }`}
              >
                <Icon
                  className={`h-6 w-6 ${
                    stat.isPositive ? "text-green-600" : "text-red-600"
                  }`}
                />
              </div>
            </div>
          </Card>
        )
      })}
    </div>
  )
}
