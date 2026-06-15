"use client";

import { useState } from "react";
import {
  Search,
  ChevronDown,
  RefreshCw,
  Import,
  Download,
  Eye,
  Copy,
  ChevronUp,
} from "lucide-react";
import { mockAccounts } from "@/lib/mock-data";

const allTransactions = mockAccounts.flatMap((acct) =>
  acct.transactions.map((txn) => ({ ...txn, org: acct.organizationName, type: "Credit", refId: txn.guid.split("-")[0] + "-" + txn.id }))
);

// Add more mock system transactions
const systemTransactions = [
  ...allTransactions,
  {
    id: "TXN-100",
    guid: "NOMATCH-SYS-009",
    amount: 33000,
    rail: "wire" as const,
    direction: "incoming" as const,
    status: "settled" as const,
    dateStarted: "2026-05-12T09:00:00Z",
    dateSettled: "2026-05-13T15:00:00Z",
    to: "Pinnacle Wealth - Interro Account",
    from: "External Sender",
    org: "Pinnacle Wealth Advisors Inc",
    type: "Credit",
    refId: "NOMATCH-SYS-009",
  },
  {
    id: "TXN-101",
    guid: "NOMATCH-SYS-008",
    amount: 9500,
    rail: "wire" as const,
    direction: "incoming" as const,
    status: "settled" as const,
    dateStarted: "2026-05-11T09:00:00Z",
    dateSettled: "2026-05-13T15:00:00Z",
    to: "Evergreen Capital - Interro Account",
    from: "LP - Summit Fund",
    org: "Evergreen Capital Partners LLC",
    type: "Credit",
    refId: "NOMATCH-SYS-008",
  },
  {
    id: "TXN-102",
    guid: "NOMATCH-SYS-007",
    amount: 4200,
    rail: "wire" as const,
    direction: "incoming" as const,
    status: "settled" as const,
    dateStarted: "2026-05-10T09:00:00Z",
    dateSettled: "2026-05-12T12:00:00Z",
    to: "Pinnacle Wealth - Interro Account",
    from: "External Sender",
    org: "Pinnacle Wealth Advisors Inc",
    type: "Credit",
    refId: "NOMATCH-SYS-007",
  },
  {
    id: "TXN-103",
    guid: "NOMATCH-SYS-001",
    amount: 8000,
    rail: "wire" as const,
    direction: "incoming" as const,
    status: "settled" as const,
    dateStarted: "2026-05-09T09:00:00Z",
    dateSettled: "2026-05-10T15:00:00Z",
    to: "Evergreen Capital - Interro Account",
    from: "LP - Horizon",
    org: "Evergreen Capital Partners LLC",
    type: "Credit",
    refId: "NOMATCH-SYS-001",
  },
  {
    id: "TXN-104",
    guid: "NOMATCH-SYS-00L",
    amount: 18000,
    rail: "wire" as const,
    direction: "incoming" as const,
    status: "settled" as const,
    dateStarted: "2026-05-08T10:00:00Z",
    dateSettled: "2026-05-09T15:00:00Z",
    to: "Pinnacle Wealth - Interro Account",
    from: "External Sender",
    org: "Pinnacle Wealth Advisors Inc",
    type: "Credit",
    refId: "NOMATCH-SYS-00L",
  },
  {
    id: "TXN-105",
    guid: "SPLIT-002",
    amount: 39000,
    rail: "wire" as const,
    direction: "incoming" as const,
    status: "settled" as const,
    dateStarted: "2026-05-07T09:00:00Z",
    dateSettled: "2026-05-08T14:00:00Z",
    to: "Atlas Infrastructure - Interro Account",
    from: "LP - Blackrock",
    org: "Atlas Infrastructure Fund GP LLC",
    type: "Credit",
    refId: "SPLIT-002",
  },
  {
    id: "TXN-106",
    guid: "SPLIT-003",
    amount: 12000,
    rail: "wire" as const,
    direction: "incoming" as const,
    status: "settled" as const,
    dateStarted: "2026-05-06T09:00:00Z",
    dateSettled: "2026-05-07T10:00:00Z",
    to: "Pinnacle Wealth - Interro Account",
    from: "LP - Vanguard",
    org: "Pinnacle Wealth Advisors Inc",
    type: "Credit",
    refId: "SPLIT-003",
  },
  {
    id: "TXN-107",
    guid: "SPLIT-001",
    amount: 45000,
    rail: "wire" as const,
    direction: "incoming" as const,
    status: "settled" as const,
    dateStarted: "2026-05-05T09:00:00Z",
    dateSettled: "2026-05-06T14:00:00Z",
    to: "Evergreen Capital - Interro Account",
    from: "LP - Fidelity",
    org: "Evergreen Capital Partners LLC",
    type: "Credit",
    refId: "SPLIT-001",
  },
  {
    id: "TXN-108",
    guid: "PARTIAL-006",
    amount: 2500,
    rail: "ach" as const,
    direction: "outgoing" as const,
    status: "settled" as const,
    dateStarted: "2026-05-04T09:00:00Z",
    dateSettled: "2026-05-06T12:00:00Z",
    to: "Investor - Jane Doe",
    from: "Pinnacle Wealth - Interro Account",
    org: "Pinnacle Wealth Advisors Inc",
    type: "Credit",
    refId: "PARTIAL-006",
  },
  {
    id: "TXN-109",
    guid: "PARTIAL-003",
    amount: 6000,
    rail: "wire" as const,
    direction: "outgoing" as const,
    status: "settled" as const,
    dateStarted: "2026-05-03T09:00:00Z",
    dateSettled: "2026-05-04T12:00:00Z",
    to: "Investor - Bob Williams",
    from: "Atlas Infrastructure - Interro Account",
    org: "Atlas Infrastructure Fund GP LLC",
    type: "Credit",
    refId: "PARTIAL-003",
  },
  {
    id: "TXN-110",
    guid: "PARTIAL-004",
    amount: 30000,
    rail: "wire" as const,
    direction: "incoming" as const,
    status: "settled" as const,
    dateStarted: "2026-05-02T09:00:00Z",
    dateSettled: "2026-05-03T14:00:00Z",
    to: "Evergreen Capital - Interro Account",
    from: "LP - Capital Group",
    org: "Evergreen Capital Partners LLC",
    type: "Credit",
    refId: "PARTIAL-004",
  },
  {
    id: "TXN-111",
    guid: "PARTIAL-007",
    amount: 5000,
    rail: "wire" as const,
    direction: "incoming" as const,
    status: "settled" as const,
    dateStarted: "2026-05-01T09:00:00Z",
    dateSettled: "2026-05-02T14:00:00Z",
    to: "Pinnacle Wealth - Interro Account",
    from: "LP - Angel Fund",
    org: "Pinnacle Wealth Advisors Inc",
    type: "Credit",
    refId: "PARTIAL-007",
  },
];

type SortField = "refId" | "amount" | "status" | "dateStarted" | "dateSettled";

export default function SystemTransactionsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortField, setSortField] = useState<SortField>("dateStarted");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const filtered = systemTransactions.filter((txn) => {
    const matchesSearch =
      (txn.refId || txn.guid).toLowerCase().includes(search.toLowerCase()) ||
      txn.to.toLowerCase().includes(search.toLowerCase()) ||
      txn.from.toLowerCase().includes(search.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || txn.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const sorted = [...filtered].sort((a, b) => {
    let cmp = 0;
    switch (sortField) {
      case "refId":
        cmp = (a.refId || a.guid).localeCompare(b.refId || b.guid);
        break;
      case "amount":
        cmp = a.amount - b.amount;
        break;
      case "status":
        cmp = a.status.localeCompare(b.status);
        break;
      case "dateStarted":
        cmp = new Date(a.dateStarted).getTime() - new Date(b.dateStarted).getTime();
        break;
      case "dateSettled":
        cmp = (a.dateSettled || "").localeCompare(b.dateSettled || "");
        break;
    }
    return sortDir === "asc" ? cmp : -cmp;
  });

  function toggleSort(field: SortField) {
    if (sortField === field) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  }

  function SortIcon({ field }: { field: SortField }) {
    if (sortField !== field)
      return <ChevronDown className="w-3 h-3 text-gray-300" />;
    return sortDir === "asc" ? (
      <ChevronUp className="w-3 h-3 text-[var(--interro-primary)]" />
    ) : (
      <ChevronDown className="w-3 h-3 text-[var(--interro-primary)]" />
    );
  }

  return (
    <div className="p-6">
      {/* Page header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            System Transactions
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Manage fund transactions and payment records
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">
            <Import className="w-4 h-4" /> Import
          </button>
          <button className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">
            <Download className="w-4 h-4" /> Export
          </button>
        </div>
      </div>

      {/* Filters bar */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search transactions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[var(--interro-primary)] focus:border-[var(--interro-primary)] outline-none"
          />
        </div>
        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="appearance-none pl-3 pr-8 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 focus:ring-2 focus:ring-[var(--interro-primary)] focus:border-[var(--interro-primary)] outline-none cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="settled">Completed</option>
            <option value="failed">Failed</option>
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
        </div>
        <button className="p-2 text-gray-400 hover:text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th
                className="text-left px-4 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700"
                onClick={() => toggleSort("refId")}
              >
                <span className="flex items-center gap-1">
                  REF ID <SortIcon field="refId" />
                </span>
              </th>
              <th className="text-left px-4 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                <span className="flex items-center gap-1">
                  TYPE <ChevronDown className="w-3 h-3 text-gray-300" />
                </span>
              </th>
              <th className="text-left px-4 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                <span className="flex items-center gap-1">
                  RAIL <ChevronDown className="w-3 h-3 text-gray-300" />
                </span>
              </th>
              <th
                className="text-left px-4 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700"
                onClick={() => toggleSort("amount")}
              >
                <span className="flex items-center gap-1">
                  AMOUNT <SortIcon field="amount" />
                </span>
              </th>
              <th
                className="text-left px-4 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700"
                onClick={() => toggleSort("status")}
              >
                <span className="flex items-center gap-1">
                  STATUS <SortIcon field="status" />
                </span>
              </th>
              <th
                className="text-left px-4 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700"
                onClick={() => toggleSort("dateStarted")}
              >
                <span className="flex items-center gap-1">
                  CREATED <SortIcon field="dateStarted" />
                </span>
              </th>
              <th
                className="text-left px-4 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700"
                onClick={() => toggleSort("dateSettled")}
              >
                <span className="flex items-center gap-1">
                  PROCESSED <SortIcon field="dateSettled" />
                </span>
              </th>
              <th className="text-left px-4 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                ACTIONS
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {sorted.map((txn) => (
              <tr
                key={txn.id}
                className="hover:bg-gray-50/50 transition-colors"
              >
                <td className="px-4 py-3">
                  <span className="text-sm font-medium text-gray-900">
                    {txn.refId || txn.guid.split("-")[0]}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                    <span className="text-sm text-gray-700">Credit</span>
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                      txn.rail === "wire"
                        ? "bg-purple-100 text-purple-700"
                        : txn.rail === "ach"
                        ? "bg-interro-primary-soft text-interro-primary"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {txn.rail === "wire"
                      ? "Wire"
                      : txn.rail === "ach"
                      ? "ACH"
                      : "Check"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm font-medium text-gray-900">
                    ${txn.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      txn.status === "settled"
                        ? "bg-green-100 text-green-700"
                        : txn.status === "processing"
                        ? "bg-yellow-100 text-yellow-700"
                        : txn.status === "pending"
                        ? "bg-gray-100 text-gray-600"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {txn.status === "settled" ? "completed" : txn.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-500">
                  {new Date(txn.dateStarted).toLocaleDateString("en-US", {
                    month: "2-digit",
                    day: "2-digit",
                    year: "numeric",
                  })}
                </td>
                <td className="px-4 py-3 text-sm text-gray-500">
                  {txn.dateSettled
                    ? new Date(txn.dateSettled).toLocaleDateString("en-US", {
                        month: "2-digit",
                        day: "2-digit",
                        year: "numeric",
                      })
                    : "—"}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <button
                      className="p-1.5 text-gray-400 hover:text-[var(--interro-primary)] hover:bg-interro-primary-soft rounded transition-colors"
                      title="View details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      className="p-1.5 text-gray-400 hover:text-[var(--interro-primary)] hover:bg-interro-primary-soft rounded transition-colors"
                      title="Copy ID"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {sorted.length === 0 && (
          <div className="p-12 text-center text-sm text-gray-400">
            No transactions found.
          </div>
        )}
      </div>
    </div>
  );
}
