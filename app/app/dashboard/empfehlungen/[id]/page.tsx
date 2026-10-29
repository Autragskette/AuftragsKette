import type { Metadata } from "next";
import NurFuerMitglieder from "@/app/components/NurFuerMitglieder";
import Link from "next/link";
import { notFound } from "next/navigation";
import { aktuellesMitglied } from "@/lib/mitglied";
import { datum, nachfrageFaellig, tageBisNachfrage } from "@/lib/empfehlung";
import { empfehlungsText, erinnerungsText, partnerBescheidText } from "@/lib/texte";
import { mailtoLink, whatsappLink } from "@/lib/teilen";
import { basisUrl } from "@/lib/url";
import StatusPlakette from "@/app/components/StatusPlakette";
import ProfilFehlt from "@/app/components/ProfilFehlt";
import { empfehlungLoeschen, ergebnisEintragen } from "../actions";
import { EmpfehlungVersenden, ErinnerungVersenden } from "./Versenden";

export const metadata: Metadata = {
  title: "Empfehlung",
};

const UUID_MUSTER =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Partner = {
  name: string;
  firma: string;
  leistung: string;
  telefon: string;
  email: string;
};

export default async function EmpfehlungDetail(
  props: PageProps<"/dashboard/empfehlungen/[id]">,
) {
  const { id } = await props.params;
  const { neu } = await props.searchParams;
  if (!UUID_MUSTER.test(id)) notFound();

  const { supabase, signatur, profilVollstaendig, istPartner } = await aktuellesMitglied();
  if (istPartner) {
    return (
      <div className="mx-auto max-w-2xl">
        <NurFuerMitglieder
          titel="Nur für Mitglieder"
          text="Empfehlungen geben können Mitglieder der AuftragsKette."
        />
      </div>
    );
  }

  const { data: e } = await supabase
    .from("kundenempfehlungen")
    .select(
      "id, kontakt_id, kontakt_name, kunde_name, kunde_email, kunde_telefon, nachricht, kanal, nachfrage_erlaubt, ergebnis, ergebnis_am, erinnert_am, karten_token, erstellt_am",
    )
    .eq("id", id)
    .maybeSingle();
  if (!e) notFound();

  let partner: Partner | null = null;
  if (e.kontakt_id) {
    const { data } = await supabase.rpc("empfehlung_partner", { p_empfehlung_id: e.id });
    partner = ((Array.isArray(data) ? data[0] : data) as Partner | undefined) ?? null;
  }

  const karte = `${await basisUrl()}/k/${e.karten_token}`;
  const faellig = nachfrageFaellig(e);
  const betreff = `Empfehlung: ${e.kontakt_name}`;

  const text = partner
    ? empfehlungsText({
        kundeName: e.kunde_name,
        kontakt: partner,
        signatur,
        karte,
        nachricht: e.nachricht,
      })
    : "";
  const bescheid = partner
    ? partnerBescheidText({
        partnerName: partner.name,
        kundeName: e.kunde_name,
        leistung: partner.leistung,
        signatur,
      })
    : "";
  const erinnerung = erinnerungsText({
    kundeName: e.kunde_name,
    kontaktName: e.kontakt_name,
    signatur,
    karte,
  });

  return (
    <div className="max-w-2xl">
      <Link href="/dashboard/empfehlungen" className="text-sm font-medium text-gray-600 hover:text-gray-900">
        ← Meine Empfehlungen
      </Link>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold tracking-tight text-tinte sm:text-3xl">
          {e.kontakt_name}{e.kunde_name ? ` für ${e.kunde_name}` : ""}
        </h1>
        <StatusPlakette status={e.ergebnis} />
      </div>
      <p className="mt-2 text-sm text-gray-500">Empfohlen am {datum(e.erstellt_am)}</p>

      {/* Versenden */}
      {partner && !profilVollstaendig ? (
        <div className="mt-6">
          <ProfilFehlt zurueck={`/dashboard/empfehlungen/${e.id}`} was="der Empfehlung" />
        </div>
      ) : partner ? (
        <div className="mt-6 rounded-xl border border-blue-200 bg-white p-6">
          <h2 className="font-bold">{neu ? "Jetzt an den Kunden senden" : "Erneut senden"}</h2>
          <p className="mt-2 text-sm leading-6 text-gray-600">
            Die Nachricht enthält die Kontaktdaten und einen Link zur digitalen
            Visitenkarte, die sich der Kunde direkt ins Telefonbuch speichern kann.
          </p>
          <div className="mt-4">
            <EmpfehlungVersenden
              id={e.id}
              whatsapp={whatsappLink(text, e.kunde_telefon || undefined)}
              mailto={mailtoLink(e.kunde_email, betreff, text)}
              karte={karte}
              text={text}
            />
          </div>
          <details className="mt-5 text-sm">
            <summary className="cursor-pointer font-medium text-gray-600">Nachricht ansehen</summary>
            <pre className="mt-3 whitespace-pre-wrap rounded-lg bg-gray-50 p-4 font-sans text-gray-700">
              {text}
            </pre>
          </details>
          <Link href={`/k/${e.karten_token}`} target="_blank" className="mt-4 inline-block text-sm font-semibold text-kette underline">
            Visitenkarte ansehen
          </Link>
        </div>
      ) : (
        <p className="mt-6 rounded-lg bg-gray-100 px-4 py-3 text-sm text-gray-600">
          Dieser Partner ist nicht mehr im Netzwerk gelistet. Die Empfehlung
          bleibt hier zur Übersicht gespeichert.
        </p>
      )}

      {/* Partner Bescheid geben, aus dem eigenen WhatsApp */}
      {partner && profilVollstaendig && (
        <div className="mt-6 rounded-2xl border border-linie bg-white p-6">
          <h2 className="font-bold">{partner.name.split(" ")[0]} Bescheid geben</h2>
          <p className="mt-2 text-sm leading-6 text-gray-600">
            Sag {partner.name.split(" ")[0]} kurz, dass sich ein Kunde meldet.
            Die Nachricht geht aus deinem eigenen WhatsApp, persönlich von dir.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            {partner.telefon ? (
              <a
                href={whatsappLink(bescheid, partner.telefon)}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-xl bg-[#1fa855] px-5 py-3 text-sm font-semibold text-white"
              >
                Per WhatsApp Bescheid geben
              </a>
            ) : (
              <p className="text-sm text-gray-500">Für {partner.name} ist keine Telefonnummer hinterlegt.</p>
            )}
            {partner.email && (
              <a
                href={mailtoLink(partner.email, `Empfehlung an ${e.kunde_name || "einen Kunden"}`, bescheid)}
                className="rounded-xl border border-linie px-5 py-3 text-sm font-semibold"
              >
                Per E-Mail
              </a>
            )}
          </div>
          <details className="mt-4 text-sm">
            <summary className="cursor-pointer font-medium text-gray-600">Nachricht ansehen</summary>
            <pre className="mt-3 whitespace-pre-wrap rounded-lg bg-gray-50 p-4 font-sans text-gray-700">
              {bescheid}
            </pre>
          </details>
        </div>
      )}

      {/* Nachverfolgung */}
      <div className="mt-6 rounded-2xl border border-linie bg-white p-6">
        <h2 className="font-bold">Kam es zu einem Auftrag?</h2>

        {e.ergebnis === "offen" ? (
          <>
            <p className="mt-2 text-sm leading-6 text-gray-600">
              {faellig
                ? "Eine Woche ist vorbei. Wie ist es ausgegangen?"
                : `In ${tageBisNachfrage(e.erstellt_am)} Tagen fragen wir automatisch nach. Du kannst es aber auch jetzt schon eintragen.`}
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <form action={ergebnisEintragen.bind(null, e.id, "auftrag")}>
                <button className="rounded-lg bg-green-600 px-5 py-3 text-sm font-semibold text-white">
                  Ja, Auftrag erhalten
                </button>
              </form>
              <form action={ergebnisEintragen.bind(null, e.id, "kein_auftrag")}>
                <button className="rounded-xl border border-linie px-5 py-3 text-sm font-semibold">
                  Nein, bisher nicht
                </button>
              </form>
            </div>
          </>
        ) : (
          <p className="mt-2 text-sm text-gray-600">
            {e.ergebnis === "auftrag" ? "Ja, es kam zum Auftrag. 🎉" : "Bisher kam es nicht zum Auftrag."}
            {e.ergebnis_am && ` Eingetragen am ${datum(e.ergebnis_am)}.`}
          </p>
        )}

        {e.ergebnis === "kein_auftrag" && (
          <div className="mt-5 border-t border-linie pt-5">
            {e.nachfrage_erlaubt ? (
              <>
                <p className="text-sm font-semibold text-gray-700">
                  {e.erinnert_am
                    ? `Erinnerung gesendet am ${datum(e.erinnert_am)}`
                    : "Beim Kunden einmal nachhaken"}
                </p>
                {!e.erinnert_am && profilVollstaendig && (
                  <div className="mt-3">
                    <ErinnerungVersenden
                      id={e.id}
                      text={erinnerung}
                      whatsapp={whatsappLink(erinnerung, e.kunde_telefon || undefined)}
                      mailto={e.kunde_email ? mailtoLink(e.kunde_email, `Erinnerung: ${e.kontakt_name}`, erinnerung) : undefined}
                    />
                  </div>
                )}
              </>
            ) : (
              <p className="text-sm text-gray-500">
                Der Kunde hat einer Nachfrage nicht zugestimmt, deshalb wird
                keine Erinnerung verschickt.
              </p>
            )}
            <form action={ergebnisEintragen.bind(null, e.id, "auftrag")} className="mt-4">
              <button className="text-sm font-semibold text-green-700 underline">
                Doch noch Auftrag erhalten
              </button>
            </form>
          </div>
        )}
      </div>

      <form action={empfehlungLoeschen.bind(null, e.id)} className="mt-8">
        <button className="text-sm font-medium text-gray-400 hover:text-red-600">
          Empfehlung löschen
        </button>
      </form>
    </div>
  );
}
