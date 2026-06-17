"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  RefreshCw,
  Download,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useVerifications } from "@/lib/verifications/verification-store";
import { entityNameFor } from "@/lib/verification-data";
import { SessionStatusBadge } from "@/components/ui/status-badge";
import { AggregateProgress } from "@/components/verifications/AggregateProgress";
import {
  OPS_HAS_PII_EXPORT_PERMISSION,
  buildSessionCsv,
  buildPerPersonCsv,
  downloadCsv,
  perPersonRowCount,
} from "@/lib/verifications/export-csv";
import { PathType, SessionStatus, VerificationSession } from "@/types";

const pathLabels: Record<PathType, string> = {
  solo: "Solo",
  joint: "Joint",
  entity: "Entity",
};

const statusOptions: { value: SessionStatus; label: string }[] = [
  { value: "in_progress", label: "In Progress" },
  { value: "abandoned", label: "Abandoned" },
  { value: "submitted", label: "Submitted" },
  { value: "screening_in_progress", label: "Screening In Progress" },
  { value: "pending_review", label: "Pending Review" },
  { value: "approved", label: "Approved" },
  { value: "denied", label: "Denied" },
  { value: "partially_verified", label: "Partially Verified" },
  { value: "expired", label: "Expired" },
];

type SortKey =
  | "entityBeingVerified"
  | "organizationName"
  | "pathType"
  | "primaryApplicant"
  | "status"
  | "personCount"
  | "createdAt"
  | "submittedAt";

const PAGE_SIZE = 6;

// Returns the person whose name should appear in the "Primary Applicant" column.
// For entity sessions: prefer control_person, then ubo, then fall back to persons[0].
// For all other path types: always persons[0].
function primaryApplicantPerson(s: VerificationSession) {
  if (s.pathType === "entity") {
    const cp = s.persons.find((p) => p.role === "control_person");
    if (cp) return cp;
    const ubo = s.persons.find((p) => p.role === "ubo");
    if (ubo) return ubo;
  }
  return s.persons[0];
}

function fmtDate(iso?: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
  });
}

function MultiSelect({
  label,
  options,
  selected,
  onToggle,
}: {
  label: string;
  options: { value: string; label: string }[];
  selected: Set<string>;
  onToggle: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 pl-3 pr-2 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
      >
        {label}
        {selected.size > 0 && (
          <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-interro-primary text-white text-[10px]">
            {selected.size}
          </span>
        )}
        <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute z-20 mt-1 w-60 max-h-72 overflow-auto bg-white border border-gray-200 rounded-lg shadow-lg py-1">
            {options.map((opt) => (
              <label
                key={opt.value}
                className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selected.has(opt.value)}
                  onChange={() => onToggle(opt.value)}
                  className="rounded border-gray-300 text-interro-primary focus:ring-interro-primary"
                />
                {opt.label}
              </label>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function SortHeader({
  label,
  sortKey,
  activeKey,
  dir,
  onSort,
}: {
  label: string;
  sortKey: SortKey;
  activeKey: SortKey;
  dir: "asc" | "desc";
  onSort: (key: SortKey) => void;
}) {
  const active = activeKey === sortKey;
  return (
    <th className="text-left px-4 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className="inline-flex items-center gap-1 hover:text-gray-700"
      >
        {label}
        {active ? (
          dir === "asc" ? (
            <ChevronUp className="w-3 h-3" />
          ) : (
            <ChevronDown className="w-3 h-3" />
          )
        ) : (
          <ChevronsUpDown className="w-3 h-3 text-gray-300" />
        )}
      </button>
    </th>
  );
}

export default function VerificationsPage() {
  const { sessions: verificationSessions, logExport, exportLog } =
    useVerifications();
  const router = useRouter();
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [primaryFilter, setPrimaryFilter] = useState("");
  const [orgFilter, setOrgFilter] = useState<Set<string>>(new Set());
  const [pathFilter, setPathFilter] = useState<PathType | "all">("all");
  const [statusFilter, setStatusFilter] = useState<Set<string>>(new Set());
  const [createdFilter, setCreatedFilter] = useState("");
  const [submittedFilter, setSubmittedFilter] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("createdAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(0);

  const orgOptions = useMemo(() => {
    const map = new Map<string, string>();
    verificationSessions.forEach((s) => map.set(s.organizationId, s.organizationName));
    return Array.from(map.entries()).map(([value, label]) => ({ value, label }));
  }, [verificationSessions]);

  function toggleSet(setter: React.Dispatch<React.SetStateAction<Set<string>>>, value: string) {
    setter((prev) => {
      const next = new Set(prev);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return next;
    });
    setPage(0);
  }

  function handleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "createdAt" || key === "submittedAt" ? "desc" : "asc");
    }
  }

  const filtered = useMemo(() => {
    const term = search.toLowerCase();
    const primaryTerm = primaryFilter.toLowerCase();
    return verificationSessions.filter((s) => {
      const primary = s.persons[0];
      const primaryName = `${primary.firstName} ${primary.lastName}`.toLowerCase();
      // Free-text search matches any person name (incl. UBO / Control Person),
      // Organization Environment, and the Legal Entity Being Verified value (A.2.3).
      const entityBeingVerified = entityNameFor(s).toLowerCase();
      const anyPersonMatch = s.persons.some((p) =>
        `${p.firstName} ${p.lastName}`.toLowerCase().includes(term)
      );
      const matchesSearch =
        !term ||
        anyPersonMatch ||
        s.organizationName.toLowerCase().includes(term) ||
        entityBeingVerified.includes(term);
      const matchesPrimary = !primaryTerm || primaryName.includes(primaryTerm);
      const matchesOrg = orgFilter.size === 0 || orgFilter.has(s.organizationId);
      const matchesPath = pathFilter === "all" || s.pathType === pathFilter;
      const matchesStatus = statusFilter.size === 0 || statusFilter.has(s.status);
      const matchesCreated =
        !createdFilter || (s.createdAt || "").slice(0, 10) === createdFilter;
      const matchesSubmitted =
        !submittedFilter || (s.submittedAt || "").slice(0, 10) === submittedFilter;
      return (
        matchesSearch &&
        matchesPrimary &&
        matchesOrg &&
        matchesPath &&
        matchesStatus &&
        matchesCreated &&
        matchesSubmitted
      );
    });
  }, [verificationSessions, search, primaryFilter, orgFilter, pathFilter, statusFilter, createdFilter, submittedFilter]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    arr.sort((a, b) => {
      let av: string | number;
      let bv: string | number;
      switch (sortKey) {
        case "entityBeingVerified":
          av = entityNameFor(a);
          bv = entityNameFor(b);
          break;
        case "organizationName":
          av = a.organizationName;
          bv = b.organizationName;
          break;
        case "pathType":
          av = a.pathType;
          bv = b.pathType;
          break;
        case "primaryApplicant": {
          const pa = primaryApplicantPerson(a);
          const pb = primaryApplicantPerson(b);
          av = `${pa.firstName} ${pa.lastName}`;
          bv = `${pb.firstName} ${pb.lastName}`;
          break;
        }
        case "status":
          av = a.status;
          bv = b.status;
          break;
        case "personCount":
          av = a.persons.length;
          bv = b.persons.length;
          break;
        case "submittedAt":
          av = a.submittedAt ?? "";
          bv = b.submittedAt ?? "";
          break;
        case "createdAt":
        default:
          av = a.createdAt;
          bv = b.createdAt;
          break;
      }
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return arr;
  }, [filtered, sortKey, sortDir]);

  const pageCount = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);
  const paged = sorted.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE);

  function resetFilters() {
    setSearch("");
    setPrimaryFilter("");
    setOrgFilter(new Set());
    setPathFilter("all");
    setStatusFilter(new Set());
    setCreatedFilter("");
    setSubmittedFilter("");
    setPage(0);
  }

  // ── E5 (PD-146) — CSV export of the currently-filtered list ──
  // Build a human-readable summary of the active filters for the audit log.
  function filterSummary(): string {
    const parts: string[] = [];
    if (search) parts.push(`search="${search}"`);
    if (primaryFilter) parts.push(`primary="${primaryFilter}"`);
    if (orgFilter.size) {
      const names = Array.from(orgFilter).map(
        (id) => orgOptions.find((o) => o.value === id)?.label ?? id
      );
      parts.push(`org=[${names.join(", ")}]`);
    }
    if (pathFilter !== "all") parts.push(`path=${pathFilter}`);
    if (statusFilter.size) parts.push(`status=[${Array.from(statusFilter).join(", ")}]`);
    if (createdFilter) parts.push(`created=${createdFilter}`);
    if (submittedFilter) parts.push(`submitted=${submittedFilter}`);
    parts.push(`sort=${sortKey} ${sortDir}`);
    return parts.length ? parts.join("; ") : "none";
  }

  // PII columns (SSN/Tax ID, DOB, full address) are included → flag the export.
  const exportContainsPii = OPS_HAS_PII_EXPORT_PERMISSION;

  function exportSessions() {
    const csv = buildSessionCsv(sorted, OPS_HAS_PII_EXPORT_PERMISSION);
    downloadCsv(`verification-sessions-${new Date().toISOString().slice(0, 10)}.csv`, csv);
    logExport({
      exportType: "session",
      filtersApplied: filterSummary(),
      rowCount: sorted.length,
      containsPii: exportContainsPii,
    });
    setExportMenuOpen(false);
  }

  function exportPerPerson() {
    const csv = buildPerPersonCsv(sorted, OPS_HAS_PII_EXPORT_PERMISSION);
    downloadCsv(`verification-persons-${new Date().toISOString().slice(0, 10)}.csv`, csv);
    logExport({
      exportType: "per-person",
      filtersApplied: filterSummary(),
      rowCount: perPersonRowCount(sorted),
      containsPii: exportContainsPii,
    });
    setExportMenuOpen(false);
  }

  return (
    <div className="p-6">
      {/* Page header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Verifications</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Browse and review KYC / KYB verification sessions
          </p>
        </div>
        <div className="relative">
          <button
            type="button"
            onClick={() => setExportMenuOpen((o) => !o)}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            <Download className="w-4 h-4" /> Export CSV
            <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
          </button>
          {exportMenuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setExportMenuOpen(false)} />
              <div className="absolute right-0 z-20 mt-1 w-72 bg-white border border-gray-200 rounded-lg shadow-lg py-1">
                <button
                  type="button"
                  onClick={exportSessions}
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  Session export
                  <span className="block text-xs text-gray-400">
                    One row per session ({sorted.length})
                  </span>
                </button>
                <button
                  type="button"
                  onClick={exportPerPerson}
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  Per-person export (Joint / Entity)
                  <span className="block text-xs text-gray-400">
                    One row per person ({perPersonRowCount(sorted)})
                  </span>
                </button>
                <div className="border-t border-gray-100 mt-1 px-3 py-2 text-[11px] text-gray-400">
                  {OPS_HAS_PII_EXPORT_PERMISSION
                    ? "SSN / Tax ID column included (PII export permitted)."
                    : "SSN / Tax ID column omitted (no PII export permission)."}
                  {exportLog.length > 0 && (
                    <span className="block mt-1">
                      {exportLog.length} export
                      {exportLog.length === 1 ? "" : "s"} this session · last:{" "}
                      {exportLog[0].rowCount} rows
                    </span>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-[220px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search legal entity, applicant, or organization..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[var(--interro-primary)] focus:border-[var(--interro-primary)] outline-none"
          />
        </div>

        <input
          type="text"
          placeholder="Primary applicant..."
          value={primaryFilter}
          onChange={(e) => {
            setPrimaryFilter(e.target.value);
            setPage(0);
          }}
          className="w-44 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[var(--interro-primary)] focus:border-[var(--interro-primary)] outline-none"
        />

        {/* Organization Environment = the org/tenant within Delio that SENT the
            KYC/KYB workflow to the entity being verified (A.2.2). */}
        <MultiSelect
          label="Organization Environment"
          options={orgOptions}
          selected={orgFilter}
          onToggle={(v) => toggleSet(setOrgFilter, v)}
        />

        <div className="relative">
          <select
            value={pathFilter}
            onChange={(e) => {
              setPathFilter(e.target.value as PathType | "all");
              setPage(0);
            }}
            className="appearance-none pl-3 pr-8 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 focus:ring-2 focus:ring-[var(--interro-primary)] focus:border-[var(--interro-primary)] outline-none cursor-pointer"
          >
            <option value="all">All Path Types</option>
            <option value="solo">Solo</option>
            <option value="joint">Joint</option>
            <option value="entity">Entity</option>
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
        </div>

        <MultiSelect
          label="Status"
          options={statusOptions}
          selected={statusFilter}
          onToggle={(v) => toggleSet(setStatusFilter, v)}
        />

        <label className="flex items-center gap-1.5 text-xs text-gray-500">
          Created
          <input
            type="date"
            value={createdFilter}
            onChange={(e) => {
              setCreatedFilter(e.target.value);
              setPage(0);
            }}
            className="px-2 py-1.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 focus:ring-2 focus:ring-[var(--interro-primary)] outline-none"
          />
        </label>

        <label className="flex items-center gap-1.5 text-xs text-gray-500">
          Submitted
          <input
            type="date"
            value={submittedFilter}
            onChange={(e) => {
              setSubmittedFilter(e.target.value);
              setPage(0);
            }}
            className="px-2 py-1.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 focus:ring-2 focus:ring-[var(--interro-primary)] outline-none"
          />
        </label>

        <button
          onClick={resetFilters}
          className="p-2 text-gray-400 hover:text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
          title="Reset filters"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <p className="text-xs text-gray-500 mb-2">
        {sorted.length} session{sorted.length === 1 ? "" : "s"}
      </p>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <SortHeader label="Legal Entity Being Verified" sortKey="entityBeingVerified" activeKey={sortKey} dir={sortDir} onSort={handleSort} />
              <SortHeader label="Path Type" sortKey="pathType" activeKey={sortKey} dir={sortDir} onSort={handleSort} />
              <SortHeader label="Organization Environment" sortKey="organizationName" activeKey={sortKey} dir={sortDir} onSort={handleSort} />
              <SortHeader label="Primary Applicant" sortKey="primaryApplicant" activeKey={sortKey} dir={sortDir} onSort={handleSort} />
              <SortHeader label="Status" sortKey="status" activeKey={sortKey} dir={sortDir} onSort={handleSort} />
              <SortHeader label="Persons" sortKey="personCount" activeKey={sortKey} dir={sortDir} onSort={handleSort} />
              <th className="text-left px-4 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                Verified
              </th>
              <SortHeader label="Created" sortKey="createdAt" activeKey={sortKey} dir={sortDir} onSort={handleSort} />
              <SortHeader label="Submitted" sortKey="submittedAt" activeKey={sortKey} dir={sortDir} onSort={handleSort} />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {paged.map((s) => {
              const primary = primaryApplicantPerson(s);
              return (
                <tr
                  key={s.id}
                  className="hover:bg-gray-50/50 transition-colors cursor-pointer"
                  onClick={() => {
                    router.push(`/admin/verifications/${s.id}`);
                  }}
                >
                  {/* Legal Entity Being Verified (A.2.1): solo → applicant name,
                      joint → trust/account name, entity → legal name. */}
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/verifications/${s.id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="text-sm font-medium text-[var(--interro-primary)] hover:text-[var(--interro-primary-hover)]"
                    >
                      {entityNameFor(s)}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {pathLabels[s.pathType]}
                  </td>
                  {/* Organization Environment = sending org/tenant within Delio. */}
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {s.organizationName}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {primary.firstName} {primary.lastName}
                  </td>
                  <td className="px-4 py-3">
                    <SessionStatusBadge status={s.status} />
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {s.persons.length}
                  </td>
                  <td className="px-4 py-3">
                    <AggregateProgress session={s} />
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {fmtDate(s.createdAt)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {fmtDate(s.submittedAt)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {sorted.length === 0 && (
          <div className="p-12 text-center text-sm text-gray-400">
            No verification sessions found.
          </div>
        )}
      </div>

      {/* Pagination */}
      {pageCount > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-xs text-gray-500">
            Page {safePage + 1} of {pageCount}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={safePage === 0}
              className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" /> Prev
            </button>
            <button
              onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
              disabled={safePage >= pageCount - 1}
              className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
