"use client";

import { useState } from "react";

/** Sign-in by email link; the backend is not connected yet, so this only confirms the step. */
export default function AccountForm() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "error" | "sent">("idle");
  if (state === "sent") {
    return (
      <p className="mt-8 rounded-xl bg-white/[0.05] p-5 text-[16px]" role="status">
        Poslali smo link za prijavu na <strong>{email}</strong>. Otvori ga na ovom uređaju.
      </p>
    );
  }
  return (
    <form
      noValidate
      className="mt-8"
      onSubmit={(e) => {
        e.preventDefault();
        setState(/^\S+@\S+\.\S+$/.test(email) ? "sent" : "error");
      }}
    >
      <label htmlFor="acc-email" className="mb-2 block text-[14px] text-beton-300">
        Email adresa
      </label>
      <input
        id="acc-email"
        type="email"
        autoComplete="email"
        value={email}
        onChange={(e) => {
          setEmail(e.target.value);
          setState("idle");
        }}
        aria-invalid={state === "error"}
        aria-describedby={state === "error" ? "acc-err" : undefined}
        className="h-12 w-full rounded-full border border-white/15 bg-white/[0.04] px-5 text-[16px] outline-none focus:border-limeta"
      />
      {state === "error" && (
        <p id="acc-err" className="mt-2 text-[14px] text-greska">
          Upiši email u obliku ime@domena.ba.
        </p>
      )}
      <button className="btn btn-primary mt-5 w-full">Pošalji link za prijavu</button>
    </form>
  );
}
