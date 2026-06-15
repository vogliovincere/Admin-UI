"use client";

import { UserCog } from "lucide-react";

export default function UsersPage() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Users</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Manage users authorized on this organization.
        </p>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
        <UserCog className="w-10 h-10 text-gray-300 mx-auto mb-3" />
        <p className="text-sm text-gray-500">No additional users yet.</p>
        <p className="text-xs text-gray-400 mt-1">
          User management coming soon.
        </p>
      </div>
    </div>
  );
}
