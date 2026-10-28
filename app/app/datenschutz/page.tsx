import type { Metadata } from "next";
import LegalPage from "../components/LegalPage";

export const metadata: Metadata = {
  title: "Datenschutz",
};

// TODO vor dem Livegang: durch eine vollständige, auf AuftragsKette
// zugeschnittene Datenschutzerklärung ersetzen (z. B. per Generator
// oder anwaltlich geprüft). Sie muss Hosting, Anmeldung, Datenbank
// und Zahlungsanbieter abdecken.
export default function Datenschutz() {
  return (
    <LegalPage title="Datenschutzerklärung">
      <div>
        <h2 className="font-semibold text-gray-900">Verantwortlicher</h2>
        <p>
          [Name bzw. Firmenname]
          <br />
          [Anschrift]
          <br />
          E-Mail: [E-Mail-Adresse]
        </p>
      </div>

      <div>
        <h2 className="font-semibold text-gray-900">
          Diese Erklärung ist noch in Vorbereitung
        </h2>
        <p>
          Die vollständige Datenschutzerklärung wird vor dem Start von
          AuftragsKette veröffentlicht. Bei Fragen zum Datenschutz
          erreichst du uns unter der oben genannten E-Mail-Adresse.
        </p>
      </div>
    </LegalPage>
  );
}
