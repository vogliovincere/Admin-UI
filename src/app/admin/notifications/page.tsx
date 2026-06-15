"use client";

import { useState } from "react";
import {
  Bell,
  Clock,
  AlertTriangle,
  CheckCircle,
  Calendar,
  RefreshCw,
  CreditCard,
} from "lucide-react";
import {
  mockRefreshSchedules,
  mockIDExpirations,
  getRiskCadence,
} from "@/lib/mock-data";
import { Badge } from "@/components/ui/badge";
import { RiskBadge } from "@/components/ui/status-badge";

type Tab = "refresh" | "id_expiration";

export default function NotificationsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("refresh");

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900">
          Notifications & Refresh Tracking
        </h1>
      </div>

      {/* Risk cadence reference */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <RefreshCw className="w-4 h-4 text-gray-400" /> Risk-Based Refresh
          Cadence (from Alloy)
        </h3>
        <div className="grid grid-cols-3 gap-4">
          {(["low", "medium", "high"] as const).map((level) => {
            const { cadenceMonths, responseWindowDays } =
              getRiskCadence(level);
            return (
              <div
                key={level}
                className="p-3 border border-gray-100 rounded-lg"
              >
                <div className="flex items-center gap-2 mb-2">
                  <RiskBadge level={level} />
                </div>
                <dl className="text-xs space-y-1">
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Refresh Cadence</dt>
                    <dd className="font-medium">{cadenceMonths} months</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Response Window</dt>
                    <dd className="font-medium">{responseWindowDays} days</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Reminders</dt>
                    <dd className="font-medium">Day 30, 50, 59</dd>
                  </div>
                </dl>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex gap-6">
          <button
            onClick={() => setActiveTab("refresh")}
            className={`flex items-center gap-2 pb-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "refresh"
                ? "border-[var(--interro-primary)] text-[var(--interro-primary)]"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            <Calendar className="w-4 h-4" /> KYC Refresh Schedule
          </button>
          <button
            onClick={() => setActiveTab("id_expiration")}
            className={`flex items-center gap-2 pb-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "id_expiration"
                ? "border-[var(--interro-primary)] text-[var(--interro-primary)]"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            <CreditCard className="w-4 h-4" /> ID Expirations
          </button>
        </nav>
      </div>

      {/* Refresh Schedule */}
      {activeTab === "refresh" && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">
                  Organization
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">
                  Risk Level
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">
                  Cadence
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">
                  Response Window
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">
                  Last Refresh
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">
                  Next Refresh
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">
                  Status
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {mockRefreshSchedules.map((schedule) => (
                <tr key={schedule.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium text-gray-900">
                      {schedule.organizationName}
                    </p>
                    <p className="text-xs text-gray-500">
                      {schedule.applicationId}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <RiskBadge level={schedule.riskLevel} />
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {schedule.cadenceMonths} months
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {schedule.responseWindowDays} days
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {schedule.lastRefreshDate}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {schedule.nextRefreshDate}
                  </td>
                  <td className="px-6 py-4">
                    <RefreshStatusBadge status={schedule.status} />
                  </td>
                  <td className="px-6 py-4">
                    <button className="text-sm text-interro-primary hover:text-interro-primary-hover font-medium">
                      Send Reminder
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ID Expirations */}
      {activeTab === "id_expiration" && (
        <div>
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4 flex items-start gap-3">
            <Bell className="w-5 h-5 text-blue-500 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-blue-800">
                ID Expiration Policy
              </p>
              <p className="text-xs text-blue-700 mt-1">
                When an ID expires, the individual has a hard 90-day response
                window to upload a new ID, regardless of risk level. The system
                sends reminders at day 30, 50, and 59.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">
                    Person
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">
                    Type
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">
                    Organization
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">
                    ID Expires
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">
                    Response Deadline
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {mockIDExpirations.map((exp) => (
                  <tr key={exp.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {exp.personName}
                    </td>
                    <td className="px-6 py-4">
                      <Badge>
                        {exp.personType === "control_person"
                          ? "Control Person"
                          : "UBO"}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {exp.organizationName}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {exp.idExpiration}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {exp.responseDeadline || "—"}
                    </td>
                    <td className="px-6 py-4">
                      <IDStatusBadge status={exp.status} />
                    </td>
                    <td className="px-6 py-4">
                      {exp.status === "expiring_soon" && (
                        <button className="text-sm text-interro-primary hover:text-interro-primary-hover font-medium">
                          Send Reminder
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function RefreshStatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; variant: "success" | "warning" | "danger" | "info" | "default" }> = {
    current: { label: "Current", variant: "success" },
    notification_sent: { label: "Notified", variant: "info" },
    overdue: { label: "Overdue", variant: "danger" },
    completed: { label: "Completed", variant: "success" },
  };
  const { label, variant } = map[status] || { label: status, variant: "default" as const };
  return <Badge variant={variant}>{label}</Badge>;
}

function IDStatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; icon: React.ReactNode; variant: "success" | "warning" | "danger" | "default" }> = {
    valid: {
      label: "Valid",
      icon: <CheckCircle className="w-3 h-3" />,
      variant: "success",
    },
    expiring_soon: {
      label: "Expiring Soon",
      icon: <Clock className="w-3 h-3" />,
      variant: "warning",
    },
    expired: {
      label: "Expired",
      icon: <AlertTriangle className="w-3 h-3" />,
      variant: "danger",
    },
    renewed: {
      label: "Renewed",
      icon: <CheckCircle className="w-3 h-3" />,
      variant: "success",
    },
  };
  const { label, variant } = map[status] || {
    label: status,
    variant: "default" as const,
  };
  return <Badge variant={variant}>{label}</Badge>;
}
