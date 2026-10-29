import type { Metadata } from "next";
import AccountForm from "@/components/AccountForm";

export const metadata: Metadata = { title: "Moj račun" };

export default function AccountPage() {
  return (
    <div className="mx-auto min-h-[70vh] max-w-[520px] px-4 pb-24 pt-[calc(var(--header-h)+56px)]">
      <h1 className="display text-[48px] sm:text-[60px]" style={{ ["--wdth" as string]: 115 }}>
        Moj račun
      </h1>
      <p className="mt-3 text-[16px] text-beton-300">Prijavi se da vidiš narudžbe i pratiš paket. Za kupovinu račun nije potreban.</p>
      <AccountForm />
    </div>
  );
}
