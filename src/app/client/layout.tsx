"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  FileText,
  Wallet,
  Bell,
  ArrowLeftRight,
  Landmark,
  Briefcase,
  UserCog,
  Settings,
} from "lucide-react";
import { TopHeader } from "@/components/top-header";
import { useDemoState } from "@/lib/demo-state";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const view = useDemoState().getActiveClientView();

  const unansweredEdd = view
    ? view.eddItems.filter((i) => !i.submittedAt).length
    : 0;
  const bankAccountsEnabled = view?.status === "approved";

  const sections: React.ReactNode[] = [];

  // First section (all grayed)
  sections.push(
    <div key="sec1" className="py-1">
      {[
        { label: "System Transactions", icon: ArrowLeftRight },
        { label: "Bank Transactions", icon: Landmark },
        { label: "Reconciliation", icon: FileText },
        { label: "Reconciled Transact...", icon: FileText },
      ].map((it) => {
        const Icon = it.icon;
        return (
          <span
            key={it.label}
            className="flex items-center gap-2.5 px-4 py-2 text-[13px] font-medium mx-2 rounded-md text-white/30 cursor-not-allowed"
          >
            <Icon className="w-[16px] h-[16px] shrink-0" />
            <span className="truncate">{it.label}</span>
          </span>
        );
      })}
    </div>
  );

  // Onboarding + Bank Accounts
  sections.push(
    <div key="sec2" className="py-1 border-t border-white/10">
      <Link
        href="/client/onboarding"
        className={`flex items-center gap-2.5 px-4 py-2 text-[13px] font-medium transition-colors mx-2 rounded-md ${
          pathname?.startsWith("/client/onboarding")
            ? "bg-interro-accent text-white"
            : "text-white/70 hover:bg-white/10 hover:text-white"
        }`}
      >
        <Briefcase className="w-[16px] h-[16px] shrink-0" />
        <span className="truncate flex-1">Onboarding</span>
        {unansweredEdd > 0 && (
          <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold bg-red-500 text-white rounded-full">
            {unansweredEdd}
          </span>
        )}
      </Link>
      {bankAccountsEnabled ? (
        <Link
          href="/client/bank-accounts"
          className={`flex items-center gap-2.5 px-4 py-2 text-[13px] font-medium transition-colors mx-2 rounded-md ${
            pathname?.startsWith("/client/bank-accounts")
              ? "bg-interro-accent text-white"
              : "text-white/70 hover:bg-white/10 hover:text-white"
          }`}
        >
          <Wallet className="w-[16px] h-[16px] shrink-0" />
          <span className="truncate">Bank Accounts</span>
        </Link>
      ) : (
        <span className="flex items-center gap-2.5 px-4 py-2 text-[13px] font-medium mx-2 rounded-md text-white/30 cursor-not-allowed">
          <Wallet className="w-[16px] h-[16px] shrink-0" />
          <span className="truncate">Bank Accounts</span>
        </span>
      )}
    </div>
  );

  // Banks (grayed), Users (enabled)
  sections.push(
    <div key="sec3" className="py-1 border-t border-white/10">
      <span className="flex items-center gap-2.5 px-4 py-2 text-[13px] font-medium mx-2 rounded-md text-white/30 cursor-not-allowed">
        <Landmark className="w-[16px] h-[16px] shrink-0" />
        <span className="truncate">Banks</span>
      </span>
      <Link
        href="/client/users"
        className={`flex items-center gap-2.5 px-4 py-2 text-[13px] font-medium transition-colors mx-2 rounded-md ${
          pathname?.startsWith("/client/users")
            ? "bg-interro-accent text-white"
            : "text-white/70 hover:bg-white/10 hover:text-white"
        }`}
      >
        <UserCog className="w-[16px] h-[16px] shrink-0" />
        <span className="truncate">Users</span>
      </Link>
    </div>
  );

  // Notifications, Settings
  sections.push(
    <div key="sec4" className="py-1 border-t border-white/10">
      <Link
        href="/client/notifications"
        className={`flex items-center gap-2.5 px-4 py-2 text-[13px] font-medium transition-colors mx-2 rounded-md ${
          pathname?.startsWith("/client/notifications")
            ? "bg-interro-accent text-white"
            : "text-white/70 hover:bg-white/10 hover:text-white"
        }`}
      >
        <Bell className="w-[16px] h-[16px] shrink-0" />
        <span className="truncate">Notifications</span>
      </Link>
      <span className="flex items-center gap-2.5 px-4 py-2 text-[13px] font-medium mx-2 rounded-md text-white/30 cursor-not-allowed">
        <Settings className="w-[16px] h-[16px] shrink-0" />
        <span className="truncate">Settings</span>
      </span>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-[#f5f6fa]">
      <aside className="w-[220px] bg-interro-primary text-white flex flex-col shrink-0">
        <div className="px-4 py-4 border-b border-white/10">
          <Link href="/client/onboarding" className="block">
            <div className="bg-white rounded-md px-3 py-2 flex items-center justify-center">
              <Image
                src="/interro-logo.png"
                alt="Interro"
                width={120}
                height={24}
                style={{ height: 24, width: "auto" }}
              />
            </div>
            <p className="text-[10px] text-white/60 mt-1 ml-1 uppercase tracking-wider">
              Client
            </p>
          </Link>
        </div>
        <nav className="flex-1 overflow-y-auto">{sections}</nav>
        <div className="px-4 py-3 border-t border-white/10 text-[10px] text-white/30">
          Powered by Interro
        </div>
      </aside>
      <div className="flex-1 flex flex-col min-w-0">
        <TopHeader />
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
