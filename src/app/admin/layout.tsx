"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  FileText,
  Bell,
  ArrowLeftRight,
  Landmark,
  Building2,
  Briefcase,
  Users,
  Fingerprint,
  CreditCard,
  UserCog,
  Settings,
  ShieldCheck,
} from "lucide-react";
import { TopHeader } from "@/components/top-header";

const enabledRoutes = new Set([
  "/admin/applications",
  "/admin/accounts",
  "/admin/verifications",
]);

type NavItem =
  | { href: string; label: string; icon: React.ComponentType<{ className?: string }> }
  | { type: "divider" };

const navItems: NavItem[] = [
  { href: "/admin", label: "System Transactions", icon: ArrowLeftRight },
  { href: "/admin/bank-transactions", label: "Bank Transactions", icon: Landmark },
  { href: "/admin/reconciliation", label: "Reconciliation", icon: FileText },
  { type: "divider" },
  { href: "/admin/applications", label: "Applications", icon: Briefcase },
  { href: "/admin/organizations", label: "Organizations", icon: Building2 },
  { href: "/admin/offerings", label: "Offerings", icon: CreditCard },
  { href: "/admin/investors", label: "Investors", icon: Users },
  { href: "/admin/entities", label: "Entities", icon: Users },
  { href: "/admin/fingerprints", label: "Fingerprints", icon: Fingerprint },
  { type: "divider" },
  { href: "/admin/verifications", label: "Verifications", icon: ShieldCheck },
  { href: "/admin/banks", label: "Banks", icon: Landmark },
  { href: "/admin/platform-users", label: "Platform Users", icon: UserCog },
  { type: "divider" },
  { href: "/admin/notifications", label: "Notifications", icon: Bell },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen bg-[#f5f6fa]">
      {/* Sidebar */}
      <aside className="w-[220px] bg-interro-primary text-white flex flex-col shrink-0">
        {/* Logo block - white pill */}
        <div className="px-4 py-4 border-b border-white/10">
          <Link href="/admin" className="block">
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
              Admin
            </p>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-2 overflow-y-auto">
          {navItems.map((item, i) => {
            if ("type" in item && item.type === "divider") {
              return (
                <div
                  key={`div-${i}`}
                  className="my-2 mx-3 border-t border-white/10"
                />
              );
            }
            if (!("href" in item)) return null;
            const Icon = item.icon;
            const enabled = enabledRoutes.has(item.href);
            const isActive =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(item.href);

            if (!enabled) {
              return (
                <span
                  key={item.href}
                  className="flex items-center gap-2.5 px-4 py-2 text-[13px] font-medium mx-2 rounded-md text-white/30 cursor-not-allowed"
                >
                  <Icon className="w-[16px] h-[16px] shrink-0" />
                  <span className="truncate">{item.label}</span>
                </span>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2.5 px-4 py-2 text-[13px] font-medium transition-colors mx-2 rounded-md ${
                  isActive
                    ? "bg-interro-accent text-white"
                    : "text-white/70 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Icon className="w-[16px] h-[16px] shrink-0" />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-white/10 text-[10px] text-white/30">
          Powered by Interro
        </div>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0">
        <TopHeader />
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
