import type { Metadata } from "next";
import { aktuellesMitglied } from "@/lib/mitglied";
import ProfilFormular from "./ProfilFormular";

export const metadata: Metadata = {
  title: "Mein Profil",
};

export default async function MeinProfil(props: PageProps<"/dashboard/profil">) {
  const { zurueck } = await props.searchParams;
  const { profil, user } = await aktuellesMitglied();
  const ziel = typeof zurueck === "string" ? zurueck : undefined;

  return (
    <div className="max-w-2xl">
      <h1 className="mt-2 text-2xl font-semibold tracking-tight text-tinte sm:text-3xl">Deine Angaben</h1>
      <p className="mt-3 text-gray-600">
        Dein Name und deine Firma stehen in jeder Einladung und Empfehlung,
        die du verschickst, z. B. „Max Muster von Lichtblick Fotografie hat
        dich empfohlen“. Hast du keine Firma, trag deine Tätigkeit ein, etwa
        „Freelancer Webdesign“. Angemeldet als {user.email}.
      </p>

      <div className="mt-8">
        <ProfilFormular
          zurueck={ziel}
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
