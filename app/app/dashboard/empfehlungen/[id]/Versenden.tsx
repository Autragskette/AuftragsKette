"use client";

import TeilenKnoepfe from "@/app/components/TeilenKnoepfe";
import { erinnerungVermerken, kanalMerken } from "../actions";

export function EmpfehlungVersenden({
  id,
  whatsapp,
  mailto,
  karte,
}: {
  id: string;
  whatsapp: string;
  mailto?: string;
  karte: string;
}) {
  return (
    <TeilenKnoepfe
      whatsapp={whatsapp}
      mailto={mailto}
      kopierText={karte}
      kopierLabel="Visitenkarte-Link kopieren"
      onGeteilt={(kanal) => {
        void kanalMerken(id, kanal);
      }}
    />
  );
}

export function ErinnerungVersenden({
  id,
  whatsapp,
  mailto,
}: {
  id: string;
  whatsapp: string;
  mailto?: string;
}) {
  return (
    <TeilenKnoepfe
      whatsapp={whatsapp}
      mailto={mailto}
      onGeteilt={() => {
        void erinnerungVermerken(id);
      }}
    />
  );
}
