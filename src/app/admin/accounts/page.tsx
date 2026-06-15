"use client";

import Link from "next/link";
import { Search, ChevronDown, RefreshCw, Eye, Download } from "lucide-react";
import { useState } from "react";
import { mockAccounts } from "@/lib/mock-data";

export default function AccountsPage() {
  const [search, setSearch] = useState("");

  const filtered = mockAccounts.filter(
    (a) =>
      a.organizationName.toLowerCase().includes(search.toLowerCase()) ||
      a.id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Bank Accounts</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Manage linked bank accounts and balances
          </p>
        </div>
        <button className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">
          <Download className="w-4 h-4" /> Export
        </button>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search accounts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[var(--interro-primary)] focus:border-[var(--interro-primary)] outline-none"
          />
        </div>
        <div className="relative">
          <select className="appearance-none pl-3 pr-8 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 focus:ring-2 focus:ring-[var(--interro-primary)] focus:border-[var(--interro-primary)] outline-none cursor-pointer">
            <option>All Statuses</option>
            <option>Active</option>
            <option>Paused</option>
            <option>Closed</option>
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
        </div>
        <button className="p-2 text-gray-400 hover:text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left px-4 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                Account
              </th>
              <th className="text-left px-4 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                Balance
              </th>
              <th className="text-left px-4 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                Transactions
              </th>
              <th className="text-left px-4 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                Bank Accounts
              </th>
              <th className="text-left px-4 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="text-left px-4 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map((account) => (
              <tr
                key={account.id}
                className="hover:bg-gray-50/50 transition-colors"
              >
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/accounts/${account.id}`}
                    className="text-sm font-medium text-[var(--interro-primary)] hover:text-[var(--interro-primary-hover)]"
                  >
                    {account.organizationName}
                  </Link>
                  <p className="text-xs text-gray-400 mt-0.5">{account.id}</p>
                </td>
                <td className="px-4 py-3 text-sm font-medium text-gray-900">
                  ${account.balance.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </td>
                <td className="px-4 py-3 text-sm text-gray-700">
                  {account.transactions.length}
                </td>
                <td className="px-4 py-3 text-sm text-gray-700">
                  {account.bankAccounts.length}
                </td>
                <td className="px-4 py-3">
                  {account.transactionsEnabled ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                      Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                      Paused
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/accounts/${account.id}`}
                    className="p-1.5 text-gray-400 hover:text-[var(--interro-primary)] hover:bg-interro-primary-soft rounded transition-colors inline-flex"
                    title="View details"
                  >
                    <Eye className="w-4 h-4" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="p-12 text-center text-sm text-gray-400">
            No accounts found.
          </div>
        )}
      </div>
    </div>
  );
}
