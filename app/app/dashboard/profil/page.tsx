import type { Metadata } from "next";
import { aktuellesMitglied } from "@/lib/mitglied";
import ProfilFormular from "./ProfilFormular";

export const metadata: Metadata = {
  title: "Mein Profil",
};

export default async function MeinProfil() {
  const { profil, user } = await aktuellesMitglied();

  return (
    <div className="max-w-2xl">
      <p className="font-semibold text-blue-600">Mein Profil</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight">Deine Angaben</h1>
      <p className="mt-3 text-gray-600">
        Dein Name und deine Firma stehen in Einladungen und Empfehlungen, die
        du verschickst. Angemeldet als {user.email}.
      </p>

      <div className="mt-8">
        <ProfilFormular
          werte={{
            vorname: profil.vorname,
            nachname: profil.nachname,
            firma: profil.firma,
            branche: profil.branche,
            plz: profil.plz,
            ort: profil.ort,
            telefon: profil.telefon,
          }}
        />
      </div>
    </div>
  );
}
