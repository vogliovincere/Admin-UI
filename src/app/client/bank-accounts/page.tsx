"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Landmark, CheckCircle, Clock, Sparkles } from "lucide-react";
import { useDemoState } from "@/lib/demo-state";

export default function BankAccountsPage() {
  const { isHydrated, getActiveClientView, addBankAccountToActiveClient } =
    useDemoState();
  const view = getActiveClientView();
  const [showModal, setShowModal] = useState(false);
  const [bankName, setBankName] = useState("");
  const [holderName, setHolderName] = useState("");
  const [nickname, setNickname] = useState("");
  const [routingNumber, setRoutingNumber] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountType, setAccountType] = useState("Checking");

  if (!isHydrated) {
    return (
      <div className="p-12 text-center text-sm text-gray-400">Loading...</div>
    );
  }

  if (!view || view.status !== "approved") {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
          <Landmark className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <h2 className="text-lg font-semibold text-gray-900 mb-1">
            Complete onboarding first
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            Bank account linking unlocks once your application is approved.
          </p>
          <Link
            href="/client/onboarding"
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-interro-primary rounded-lg hover:bg-interro-primary-hover"
          >
            Go to Onboarding
          </Link>
        </div>
      </div>
    );
  }

  function prefillBank() {
    setBankName("JPMorgan Chase");
    setHolderName(view?.legalName || "Northwind Markets LLC");
    setNickname("Operating Account");
    setRoutingNumber("021000021");
    setAccountNumber("1234567890");
    setAccountType("Checking");
  }

  function handleAdd() {
    addBankAccountToActiveClient({
      bankName,
      holderName,
      nickname,
      routingNumber,
      accountNumber,
      accountType,
    });
    setBankName("");
    setHolderName("");
    setNickname("");
    setRoutingNumber("");
    setAccountNumber("");
    setAccountType("Checking");
    setShowModal(false);
  }

  return (
    <div className="p-6">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Bank Accounts</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Linked external bank accounts.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-interro-primary rounded-lg hover:bg-interro-primary-hover"
        >
          <Plus className="w-4 h-4" /> Add Bank Account
        </button>
      </div>

      {view.bankAccounts.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
          <Landmark className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-500">No bank accounts linked yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {view.bankAccounts.map((ba) => (
            <div
              key={ba.id}
              className="bg-white rounded-xl border border-gray-200 p-5"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-md bg-interro-primary-soft flex items-center justify-center">
                    <Landmark className="w-5 h-5 text-interro-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {ba.nickname || ba.bankName}
                    </p>
                    <p className="text-xs text-gray-500">{ba.bankName}</p>
                  </div>
                </div>
                {ba.status === "approved" ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-interro-accent-soft text-interro-accent border border-interro-accent/30">
                    <CheckCircle className="w-3 h-3" /> Approved
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-yellow-50 text-yellow-700 border border-yellow-200">
                    <Clock className="w-3 h-3" /> Pending
                  </span>
                )}
              </div>
              <dl className="grid grid-cols-2 gap-y-1 text-xs">
                <dt className="text-gray-500">Account Holder</dt>
                <dd className="text-gray-900">{ba.holderName || "—"}</dd>
                <dt className="text-gray-500">Type</dt>
                <dd className="text-gray-900">{ba.accountType}</dd>
                <dt className="text-gray-500">Routing</dt>
                <dd className="font-mono text-gray-900">{ba.routingNumber}</dd>
                <dt className="text-gray-500">Account</dt>
                <dd className="font-mono text-gray-900">{ba.accountNumber}</dd>
              </dl>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-lg w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Add Bank Account
              </h3>
              <button
                onClick={prefillBank}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white rounded-lg"
                style={{
                  backgroundColor: "#FF00B8",
                  boxShadow: "0 0 12px rgba(255,0,184,0.5)",
                }}
              >
                <Sparkles className="w-3 h-3" /> Prefill
              </button>
            </div>
            <div className="space-y-3 mb-5">
              <Field
                label="Bank Name"
                value={bankName}
                onChange={setBankName}
              />
              <Field
                label="Account Holder Name"
                value={holderName}
                onChange={setHolderName}
              />
              <Field
                label="Nickname"
                value={nickname}
                onChange={setNickname}
              />
              <Field
                label="Routing Number"
                value={routingNumber}
                onChange={setRoutingNumber}
              />
              <Field
                label="Account Number"
                value={accountNumber}
                onChange={setAccountNumber}
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Account Type
                </label>
                <select
                  value={accountType}
                  onChange={(e) => setAccountType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-interro-primary focus:border-interro-primary"
                >
                  <option value="Checking">Checking</option>
                  <option value="Savings">Savings</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAdd}
                disabled={
                  !bankName ||
                  !holderName ||
                  !routingNumber ||
                  !accountNumber
                }
                className="px-4 py-2 text-sm font-medium text-white bg-interro-primary rounded-lg hover:bg-interro-primary-hover disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add Account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-interro-primary focus:border-interro-primary"
      />
    </div>
  );
}
