"use client"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"

export function TransactionTable() {
  // Mock data - replace with real data from Supabase
  const transactions = [
    {
      id: 1,
      date: "2026-05-11",
      payee: "Owner",
      memo: "FUNDS TRANSFER DEBIT",
      payment: 50000.0,
      deposit: 0,
      balance: 45505.75,
      type: "Expense",
      account: "Owner's Capital",
      status: "Cleared",
    },
    {
      id: 2,
      date: "2026-05-10",
      payee: "QuickBooks Payments",
      memo: "System-recorded fee",
      payment: 20.0,
      deposit: 0,
      balance: 95525.75,
      type: "Expense",
      account: "QB Payments Fees",
      status: "Cleared",
    },
    {
      id: 3,
      date: "2026-05-08",
      payee: "Fardous Ismail",
      memo: "CHECK 106139",
      payment: 1008.0,
      deposit: 0,
      balance: 93390.75,
      type: "Check",
      account: "Contract labor",
      status: "Cleared",
    },
  ]

  return (
    <Card>
      <div className="border-b p-6">
        <h2 className="text-lg font-semibold text-slate-900">Recent Transactions</h2>
        <div className="relative mt-4">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search transactions..."
            className="pl-10"
          />
        </div>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Payee</TableHead>
            <TableHead>Memo</TableHead>
            <TableHead>Account</TableHead>
            <TableHead className="text-right">Payment</TableHead>
            <TableHead className="text-right">Deposit</TableHead>
            <TableHead className="text-right">Balance</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((tx) => (
            <TableRow key={tx.id} className="hover:bg-slate-50">
              <TableCell className="font-medium">{tx.date}</TableCell>
              <TableCell>{tx.payee}</TableCell>
              <TableCell className="text-sm text-slate-600">{tx.memo}</TableCell>
              <TableCell className="text-sm">{tx.account}</TableCell>
              <TableCell className="text-right font-medium text-red-600">
                {tx.payment > 0 ? `-$${tx.payment.toFixed(2)}` : "-"}
              </TableCell>
              <TableCell className="text-right font-medium text-green-600">
                {tx.deposit > 0 ? `+$${tx.deposit.toFixed(2)}` : "-"}
              </TableCell>
              <TableCell className="text-right font-semibold">
                ${tx.balance.toFixed(2)}
              </TableCell>
              <TableCell>
                <Badge variant="outline">{tx.status}</Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  )
}
