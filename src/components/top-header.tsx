"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { RefreshCcw, ArrowRightLeft } from "lucide-react";
import { useDemoState } from "@/lib/demo-state";

export function TopHeader() {
  const pathname = usePathname();
  const { reset } = useDemoState();
  const [showResetModal, setShowResetModal] = useState(false);

  const onClient = pathname?.startsWith("/client");
  const switchHref = onClient ? "/admin/applications" : "/client/onboarding";
  const switchLabel = onClient ? "Admin View" : "Client View";

  return (
    <>
      <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-3">
          <Image
            src="/interro-logo.png"
            alt="Interro"
            width={110}
            height={28}
            style={{ height: 28, width: "auto" }}
            priority
          />
        </div>
        <div className="flex items-center gap-3">
          <Link
            href={switchHref}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-interro-primary-soft border border-interro-accent/40 text-interro-primary rounded-md text-sm font-medium hover:bg-interro-accent-soft"
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
            {switchLabel}
          </Link>
          <button
            onClick={() => setShowResetModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm font-medium hover:bg-red-100"
          >
            <RefreshCcw className="w-3.5 h-3.5" />
            Reset Demo
          </button>
          <div className="w-8 h-8 rounded-full bg-interro-primary flex items-center justify-center text-xs font-bold text-white">
            AB
          </div>
        </div>
      </header>

      {showResetModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Reset Demo?
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              This will erase the demo client&apos;s onboarding, EDD responses,
              and bank accounts. Static example data is unaffected. Continue?
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowResetModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  reset();
                  setShowResetModal(false);
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700"
              >
                Reset Demo
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
