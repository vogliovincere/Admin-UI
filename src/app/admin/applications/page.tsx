"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, ChevronDown, RefreshCw, Eye, Download } from "lucide-react";
import { mockApplications } from "@/lib/mock-data";
import { OnboardingStatus } from "@/types";
import { useDemoState, toApplication } from "@/lib/demo-state";

const statusStyles: Record<string, string> = {
  draft: "bg-gray-100 text-gray-600",
  submitted: "bg-interro-primary-soft text-interro-primary",
  under_review: "bg-yellow-100 text-yellow-700",
  edd_required: "bg-red-100 text-red-700",
  approved: "bg-interro-accent-soft text-interro-accent",
  denied: "bg-red-100 text-red-700",
  closed: "bg-gray-100 text-gray-600",
};

const statusLabels: Record<string, string> = {
  draft: "Draft",
  submitted: "Submitted",
  under_review: "Under Review",
  edd_required: "EDD Required",
  approved: "Approved",
  denied: "Denied",
  closed: "Closed",
};

const riskStyles: Record<string, string> = {
  low: "bg-green-100 text-green-700",
  medium: "bg-yellow-100 text-yellow-700",
  high: "bg-red-100 text-red-700",
};

export default function ApplicationsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<OnboardingStatus | "all">("all");
  const { clientApp, appOverrides } = useDemoState();
  const router = useRouter();

  const allApps = [
    ...mockApplications,
    ...(clientApp ? [toApplication(clientApp)] : []),
  ].map((app) => {
    const override = appOverrides[app.id];
    if (override?.status) {
      return { ...app, status: override.status };
    }
    return app;
  });

  const filtered = allApps.filter((app) => {
    const matchesSearch =
      app.businessInfo.legalName.toLowerCase().includes(search.toLowerCase()) ||
      app.id.toLowerCase().includes(search.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || app.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-6">
      {/* Page header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Applications</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Review and manage onboarding applications
          </p>
        </div>
        <button className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">
          <Download className="w-4 h-4" /> Export
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[var(--interro-primary)] focus:border-[var(--interro-primary)] outline-none"
          />
        </div>
        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as OnboardingStatus | "all")
            }
            className="appearance-none pl-3 pr-8 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 focus:ring-2 focus:ring-[var(--interro-primary)] focus:border-[var(--interro-primary)] outline-none cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="submitted">Submitted</option>
            <option value="under_review">Under Review</option>
            <option value="edd_required">EDD Required</option>
            <option value="approved">Approved</option>
            <option value="denied">Denied</option>
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
              <th className="text-left px-4 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                Application
              </th>
              <th className="text-left px-4 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                Jurisdiction
              </th>
              <th className="text-left px-4 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="text-left px-4 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                Risk
              </th>
              <th className="text-left px-4 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                Submitted
              </th>
              <th className="text-left px-4 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map((app) => (
              <tr
                key={app.id}
                className="hover:bg-gray-50/50 transition-colors cursor-pointer"
                onClick={() => {
                  router.push(`/admin/applications/${app.id}`);
                }}
              >
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/applications/${app.id}`}
                    className="text-sm font-medium text-[var(--interro-primary)] hover:text-[var(--interro-primary-hover)]"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {app.businessInfo.legalName}
                  </Link>
                </td>
                <td className="px-4 py-3 text-sm text-gray-700">
                  {app.businessInfo.stateOfIncorporation}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      statusStyles[app.status] || "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {statusLabels[app.status] || app.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {app.riskLevel ? (
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        riskStyles[app.riskLevel]
                      }`}
                    >
                      {app.riskLevel.charAt(0).toUpperCase() + app.riskLevel.slice(1)}
                    </span>
                  ) : (
                    <span className="text-xs text-gray-400">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-sm text-gray-500">
                  {app.submittedAt
                    ? new Date(app.submittedAt).toLocaleDateString("en-US", {
                        month: "2-digit",
                        day: "2-digit",
                        year: "numeric",
                      })
                    : "—"}
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/applications/${app.id}`}
                    className="p-1.5 text-gray-400 hover:text-[var(--interro-primary)] hover:bg-interro-primary-soft rounded transition-colors inline-flex"
                    title="View details"
                    onClick={(e) => e.stopPropagation()}
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
            No applications found.
          </div>
        )}
      </div>
    </div>
  );
}
