"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowUpRight,
  ArrowDownLeft,
  Pause,
  Play,
  Unlink,
  CreditCard,
  Users,
  History,
  Landmark,
  XCircle,
} from "lucide-react";
import { mockAccounts } from "@/lib/mock-data";
import {
  TransactionStatusBadge,
  VerificationStatusBadge,
} from "@/components/ui/status-badge";
import { Badge } from "@/components/ui/badge";
import { TransactionRail, TransactionDirection } from "@/types";

type Tab = "transactions" | "details" | "bank_accounts" | "audit";

export default function AccountDetailClient() {
  const params = useParams();
  const account = mockAccounts.find((a) => a.id === params.id);
  const [activeTab, setActiveTab] = useState<Tab>("transactions");
  const [transactionsEnabled, setTransactionsEnabled] = useState(
    account?.transactionsEnabled ?? true
  );
  const [railFilter, setRailFilter] = useState<TransactionRail | "all">("all");
  const [dirFilter, setDirFilter] = useState<TransactionDirection | "all">(
    "all"
  );
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [closeReason, setCloseReason] = useState("");
  const [accountClosed, setAccountClosed] = useState(false);
  const [showUnlinkModal, setShowUnlinkModal] = useState<string | null>(null);

  if (!account) {
    return (
      <div className="p-6">
        <p className="text-gray-500">Account not found.</p>
        <Link
          href="/admin/accounts"
          className="text-blue-600 hover:text-blue-700 text-sm mt-2 inline-block"
        >
          Back to Accounts
        </Link>
      </div>
    );
  }

  const filteredTxns = account.transactions.filter((txn) => {
    const matchesRail = railFilter === "all" || txn.rail === railFilter;
    const matchesDir = dirFilter === "all" || txn.direction === dirFilter;
    return matchesRail && matchesDir;
  });

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    {
      key: "transactions",
      label: "Transactions",
      icon: <CreditCard className="w-4 h-4" />,
    },
    {
      key: "details",
      label: "Account Details",
      icon: <Users className="w-4 h-4" />,
    },
    {
      key: "bank_accounts",
      label: "Bank Accounts",
      icon: <Landmark className="w-4 h-4" />,
    },
    { key: "audit", label: "Audit Log", icon: <History className="w-4 h-4" /> },
  ];

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/admin/accounts"
          className="text-gray-400 hover:text-gray-600"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-gray-900">
            {account.organizationName}
          </h1>
          <p className="text-sm text-gray-500">
            {account.id} &middot; Balance: $
            {account.balance.toLocaleString()}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {accountClosed ? (
            <Badge variant="danger">Closed</Badge>
          ) : (
            <>
              <button
                onClick={() => setTransactionsEnabled(!transactionsEnabled)}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border ${
                  transactionsEnabled
                    ? "text-yellow-700 bg-yellow-50 border-yellow-200 hover:bg-yellow-100"
                    : "text-green-700 bg-green-50 border-green-200 hover:bg-green-100"
                }`}
              >
                {transactionsEnabled ? (
                  <>
                    <Pause className="w-4 h-4" /> Pause Transactions
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" /> Resume Transactions
                  </>
                )}
              </button>
              <button
                onClick={() => setShowCloseModal(true)}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100"
              >
                <XCircle className="w-4 h-4" /> Close Account
              </button>
            </>
          )}
        </div>
      </div>

      {!transactionsEnabled && !accountClosed && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6 flex items-center gap-3">
          <Pause className="w-5 h-5 text-yellow-500" />
          <p className="text-sm text-yellow-800">
            Transactions are currently <strong>paused</strong> on this account.
          </p>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex gap-6">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 pb-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? "border-[var(--interro-primary)] text-[var(--interro-primary)]"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Transactions */}
      {activeTab === "transactions" && (
        <div>
          <div className="flex items-center gap-4 mb-4">
            <select
              value={railFilter}
              onChange={(e) =>
                setRailFilter(e.target.value as TransactionRail | "all")
              }
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="all">All Rails</option>
              <option value="wire">Wire</option>
              <option value="ach">ACH</option>
              <option value="check">Check</option>
            </select>
            <select
              value={dirFilter}
              onChange={(e) =>
                setDirFilter(e.target.value as TransactionDirection | "all")
              }
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="all">All Directions</option>
              <option value="incoming">Incoming</option>
              <option value="outgoing">Outgoing</option>
            </select>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                    Direction
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                    Amount
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                    Rail
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                    Started
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                    Settled
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                    From
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                    To
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                    GUID
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredTxns.map((txn) => (
                  <tr key={txn.id} className="hover:bg-gray-50 text-sm">
                    <td className="px-4 py-3">
                      {txn.direction === "incoming" ? (
                        <span className="flex items-center gap-1 text-green-600">
                          <ArrowDownLeft className="w-3 h-3" /> In
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-red-600">
                          <ArrowUpRight className="w-3 h-3" /> Out
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900">
                      ${txn.amount.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-gray-600 uppercase">
                      {txn.rail}
                    </td>
                    <td className="px-4 py-3">
                      <TransactionStatusBadge status={txn.status} />
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {new Date(txn.dateStarted).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {txn.dateSettled
                        ? new Date(txn.dateSettled).toLocaleDateString()
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-600 max-w-32 truncate">
                      {txn.from}
                    </td>
                    <td className="px-4 py-3 text-gray-600 max-w-32 truncate">
                      {txn.to}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-400 max-w-40 truncate">
                      {txn.guid}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredTxns.length === 0 && (
              <div className="p-8 text-center text-sm text-gray-400">
                No transactions match the filters.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Account Details */}
      {activeTab === "details" && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Account Users
          </h2>
          <div className="space-y-3">
            {account.users.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-3 border border-gray-100 rounded-lg"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {user.name}
                  </p>
                  <p className="text-xs text-gray-500">{user.email}</p>
                </div>
                <Badge>{user.role}</Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bank Accounts */}
      {activeTab === "bank_accounts" && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Linked Bank Accounts
          </h2>
          <div className="space-y-4">
            {account.bankAccounts.map((ba) => (
              <div
                key={ba.id}
                className="border border-gray-200 rounded-lg p-4"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <Landmark className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {ba.bankName}
                      </p>
                      <p className="text-xs text-gray-500">
                        {ba.accountType}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <VerificationStatusBadge status={ba.verificationStatus} />
                    <button
                      onClick={() => setShowUnlinkModal(ba.id)}
                      className="text-red-500 hover:text-red-600 p-1"
                      title="Unlink bank account"
                    >
                      <Unlink className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                  <dt className="text-gray-500">Routing Number</dt>
                  <dd className="font-mono">{ba.routingNumber}</dd>
                  <dt className="text-gray-500">Account Number</dt>
                  <dd className="font-mono">{ba.accountNumber}</dd>
                  <dt className="text-gray-500">Verification Method</dt>
                  <dd className="capitalize">
                    {ba.verificationMethod?.replace("_", " ") || "—"}
                  </dd>
                  <dt className="text-gray-500">Verified At</dt>
                  <dd>
                    {ba.verifiedAt
                      ? new Date(ba.verifiedAt).toLocaleDateString()
                      : "—"}
                  </dd>
                  <dt className="text-gray-500">Linked At</dt>
                  <dd>{new Date(ba.linkedAt).toLocaleDateString()}</dd>
                </dl>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Audit Log */}
      {activeTab === "audit" && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Audit Log
          </h2>
          <div className="space-y-0">
            {account.auditLog.map((entry, i) => (
              <div
                key={entry.id}
                className="flex gap-4 pb-4 mb-4 border-b border-gray-100 last:border-0 last:mb-0 last:pb-0"
              >
                <div className="flex flex-col items-center">
                  <div className="w-2.5 h-2.5 rounded-full bg-blue-400 mt-1" />
                  {i < account.auditLog.length - 1 && (
                    <div className="w-px flex-1 bg-gray-200 mt-1" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900">
                      {entry.action}
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(entry.timestamp).toLocaleString()}
                    </p>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    by {entry.user}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">{entry.details}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Close Account Modal */}
      {showCloseModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Close Account
            </h3>
            {account.balance > 0 ? (
              <>
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                  <p className="text-sm text-red-700">
                    This account has a balance of{" "}
                    <strong>${account.balance.toLocaleString()}</strong>. The
                    balance must be $0 before the account can be closed.
                  </p>
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={() => setShowCloseModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Close
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="text-sm text-gray-600 mb-4">
                  Provide a reason for closing this account.
                </p>
                <textarea
                  value={closeReason}
                  onChange={(e) => setCloseReason(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm mb-4"
                  placeholder="Reason for closure..."
                />
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setShowCloseModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      setShowCloseModal(false);
                      setAccountClosed(true);
                    }}
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700"
                  >
                    Confirm Closure
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Unlink Bank Account Modal */}
      {showUnlinkModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Unlink Bank Account
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Are you sure you want to unlink this bank account? This action
              will be logged in the audit trail.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowUnlinkModal(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => setShowUnlinkModal(null)}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700"
              >
                Unlink
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
