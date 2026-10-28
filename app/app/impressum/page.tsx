import type { Metadata } from "next";
import LegalPage from "../components/LegalPage";

export const metadata: Metadata = {
  title: "Impressum",
};

// TODO vor dem Livegang: alle Angaben in [eckigen Klammern] durch echte Daten ersetzen.
export default function Impressum() {
  return (
    <LegalPage title="Impressum">
      <div>
        <h2 className="font-semibold text-gray-900">
          Angaben gemäß § 5 DDG
        </h2>
        <p>
          [Name bzw. Firmenname]
          <br />
          [Straße und Hausnummer]
          <br />
          [PLZ und Ort]
        </p>
      </div>

      <div>
        <h2 className="font-semibold text-gray-900">Kontakt</h2>
        <p>
          E-Mail: [E-Mail-Adresse]
          <br />
          Telefon: [Telefonnummer]
        </p>
      </div>

      <div>
        <h2 className="font-semibold text-gray-900">Umsatzsteuer-ID</h2>
        <p>[Umsatzsteuer-Identifikationsnummer, falls vorhanden]</p>
      </div>

      <div>
        <h2 className="font-semibold text-gray-900">
          Verantwortlich für den Inhalt
        </h2>
        <p>[Name, Anschrift wie oben]</p>
      </div>
    </LegalPage>
  );
}
