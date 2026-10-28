"use client";

import { useTransition } from "react";
import { kontaktLoeschen } from "../actions";

export default function LoeschenKnopf({
  id,
  name,
}: {
  id: string;
  name: string;
}) {
  const [laeuft, starte] = useTransition();

  function loeschen() {
    if (!window.confirm(`„${name}“ wirklich aus deinem Netzwerk löschen?`)) {
      return;
    }
    starte(async () => {
      await kontaktLoeschen(id);
    });
  }

  return (
    <button
      type="button"
      onClick={loeschen}
      disabled={laeuft}
      className="mt-4 rounded-lg border border-red-300 px-5 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60"
    >
      {laeuft ? "Wird gelöscht …" : "Kontakt löschen"}
    </button>
  );
}
