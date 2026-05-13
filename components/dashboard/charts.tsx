"use client"

import { Card } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts"

const monthlyData = [
  { month: "Oct", deposits: 45000, payments: 32000 },
  { month: "Nov", deposits: 52000, payments: 38000 },
  { month: "Dec", deposits: 48000, payments: 35000 },
  { month: "Jan", deposits: 61000, payments: 42000 },
  { month: "Feb", deposits: 55000, payments: 40000 },
  { month: "Mar", deposits: 67000, payments: 45000 },
  { month: "Apr", deposits: 58000, payments: 43000 },
  { month: "May", deposits: 42000, payments: 28000 },
]

const accountBreakdown = [
  { name: "Contract Labor", value: 125000 },
  { name: "Payroll", value: 94000 },
  { name: "Owner's Capital", value: 61000 },
  { name: "Office Expenses", value: 28000 },
  { name: "Other", value: 15000 },
]

const COLORS = ["#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6"]

export function DashboardCharts() {
  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="mb-4 font-semibold text-slate-900">Monthly Trend</h3>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={monthlyData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="deposits" stroke="#10b981" />
            <Line type="monotone" dataKey="payments" stroke="#ef4444" />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      <Card className="p-6">
        <h3 className="mb-4 font-semibold text-slate-900">Account Breakdown</h3>
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={accountBreakdown}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, value }) =>
                `${name} $${(value / 1000).toFixed(0)}k`
              }
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {accountBreakdown.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </Card>
    </div>
  )
}
