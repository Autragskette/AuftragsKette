"use client";

import TeilenKnoepfe from "@/app/components/TeilenKnoepfe";
import { erinnerungVermerken, kanalMerken } from "../actions";

export function EmpfehlungVersenden({
  id,
  whatsapp,
  mailto,
  karte,
  text,
}: {
  id: string;
  whatsapp: string;
  mailto?: string;
  karte: string;
  text: string;
}) {
  return (
    <TeilenKnoepfe
      teilenText={text}
      teilenTitel="Empfehlung"
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
  text,
}: {
  id: string;
  whatsapp: string;
  mailto?: string;
  text: string;
}) {
  return (
    <TeilenKnoepfe
      teilenText={text}
      teilenTitel="Erinnerung"
      whatsapp={whatsapp}
      mailto={mailto}
      onGeteilt={() => {
        void erinnerungVermerken(id);
      }}
    />
  );
}
