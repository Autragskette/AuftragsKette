import type { Metadata } from "next";
import NurFuerMitglieder from "@/app/components/NurFuerMitglieder";
import Link from "next/link";
import { notFound } from "next/navigation";
import { aktuellesMitglied } from "@/lib/mitglied";
import { emailVersandAktiv } from "@/lib/email";
import { einladungsBetreff, einladungsText, einladungsTextNetzwerk } from "@/lib/texte";
import { KENNENLERN_EMPFEHLUNGEN } from "@/lib/preise";
import { mailtoLink, whatsappLink } from "@/lib/teilen";
import { basisUrl } from "@/lib/url";
import StatusPlakette from "@/app/components/StatusPlakette";
import SchnellEmpfehlen from "@/app/components/SchnellEmpfehlen";
import TeilenKnoepfe from "@/app/components/TeilenKnoepfe";
import ProfilFehlt from "@/app/components/ProfilFehlt";
import KontaktFormular from "../KontaktFormular";
import { einladungErneutSenden } from "../actions";
import LoeschenKnopf from "./LoeschenKnopf";

export const metadata: Metadata = {
  title: "Kontakt bearbeiten",
};

const UUID_MUSTER =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function KontaktBearbeiten(
  props: PageProps<"/dashboard/netzwerk/[id]">,
) {
  const { id } = await props.params;
  const hinweis = await props.searchParams;
  if (!UUID_MUSTER.test(id)) notFound();

  const { supabase, user, profil, profilVollstaendig, istPartner } = await aktuellesMitglied();
  if (istPartner) {
    return (
      <div className="mx-auto max-w-2xl">
        <NurFuerMitglieder
          titel="Nur für Mitglieder"
          text="Kontakte verwalten können Mitglieder der AuftragsKette."
        />
      </div>
    );
  }

  const { data: kontakt } = await supabase
    .from("kontakte")
    .select(
      "name, firma, leistung, email, telefon, plz, ort, notiz, status, einladung_token, bestaetigt_am, interesse_mitgliedschaft, herkunft",
    )
    .eq("id", id)
    .eq("besitzer_id", user.id)
    .maybeSingle();

  if (!kontakt) notFound();

  const link = `${await basisUrl()}/bestaetigen/${kontakt.einladung_token}`;
  const absenderName = `${profil.vorname} ${profil.nachname}`.trim();
  const ausNetzwerk = kontakt.herkunft === "netzwerk";
  const text = (ausNetzwerk ? einladungsTextNetzwerk : einladungsText)({
    kontaktName: kontakt.name,
    leistung: kontakt.leistung,
    absenderName,
    absenderFirma: profil.firma || profil.branche,
    link,
  });
  const betreff = einladungsBetreff(absenderName);
  const mailVersand = emailVersandAktiv();

  type Kennenlernen = {
    empfehlungen: number;
    frei_bis: string | null;
    ist_mitglied: boolean;
    pausiert: boolean;
  };
  let phase: Kennenlernen | null = null;
  if (kontakt.status === "bestaetigt") {
    const { data } = await supabase.rpc("partner_kennenlernen", { p_kontakt_id: id });
    phase = (Array.isArray(data) ? data[0] : data) ?? null;
  }
  const freiBis = phase?.frei_bis
    ? new Date(phase.frei_bis).toLocaleDateString("de-DE", { timeZone: "Europe/Berlin" })
    : null;
  const restEmpfehlungen = Math.max(0, KENNENLERN_EMPFEHLUNGEN - (phase?.empfehlungen ?? 0));

  return (
    <div className="max-w-2xl">
      <Link
        href="/dashboard/netzwerk"
        className="text-sm font-medium text-gray-600 hover:text-gray-900"
      >
        ← Zurück zu Mein Netzwerk
      </Link>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold tracking-tight text-tinte sm:text-3xl">{kontakt.name}</h1>
        <StatusPlakette status={kontakt.status} />
      </div>
      {ausNetzwerk && (
        <p className="mt-2 text-sm text-slate-500">Über die AuftragsKette kennengelernt</p>
      )}

      {hinweis.gespeichert && (
        <p className="mt-4 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-800">
          Gespeichert.
        </p>
      )}

      {/* Bestätigung */}
      {kontakt.status === "bestaetigt" && phase?.pausiert ? (
        <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-900">
          <p className="font-semibold">Kennenlernphase beendet</p>
          <p className="mt-1">
            {kontakt.name} hat die kostenlose Kennenlernphase genutzt und ist
            pausiert, bis eine Mitgliedschaft abgeschlossen wird. Bis dahin ist
            der Kontakt in der Suche nicht sichtbar. Die Daten bleiben erhalten
            und zählen weiter zu deinem Netzwerk.
          </p>
        </div>
      ) : kontakt.status === "bestaetigt" ? (
        <div className="mt-6 rounded-xl border border-green-200 bg-green-50 p-5 text-sm leading-6 text-green-900">
          {kontakt.name} hat zugestimmt und ist im Netzwerk sichtbar und
          empfehlbar.
          {kontakt.interesse_mitgliedschaft && (
            <> Außerdem besteht Interesse, selbst Mitglied zu werden.</>
          )}
          {phase && !phase.ist_mitglied && (
            <p className="mt-2 text-green-800">
              Kostenlose Kennenlernphase: noch {restEmpfehlungen}{" "}
              {restEmpfehlungen === 1 ? "Empfehlung" : "Empfehlungen"}
              {freiBis && <>, längstens bis {freiBis}</>}.
            </p>
          )}
          <div className="mt-4">
            <SchnellEmpfehlen kontaktId={id} partnerName={kontakt.firma || kontakt.name} breit />
          </div>
        </div>
      ) : (
        <div className="mt-6 rounded-xl border border-amber-200 bg-white p-6">
          <h2 className="font-bold">
            {kontakt.status === "abgelehnt"
              ? "Der Kontakt hat abgelehnt"
              : "Bestätigung ausstehend"}
          </h2>
          <p className="mt-2 text-sm leading-6 text-gray-600">
            {kontakt.status === "abgelehnt"
              ? "Du kannst die Einladung erneut senden, falls es ein Versehen war."
              : ausNetzwerk
                ? `Erst wenn ${kontakt.name} zustimmt, gehört der Kontakt zu deinem Netzwerk.`
                : `Erst wenn ${kontakt.name} zustimmt, wird der Kontakt im Netzwerk sichtbar und zählt als dein Startkontakt.`}
          </p>

          {hinweis.versendet && (
            <p className="mt-4 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-800">
              Die Einladung wurde per E-Mail verschickt.
            </p>
          )}
          {hinweis.nichtversendet && (
            <p className="mt-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Die Einladung konnte nicht automatisch verschickt werden. Sende
              sie bitte über einen der Knöpfe.
            </p>
          )}

          {!profilVollstaendig ? (
            <div className="mt-5">
              <ProfilFehlt zurueck={`/dashboard/netzwerk/${id}`} was="der Einladung" />
            </div>
          ) : (
            <>
              <p className="mt-5 text-sm font-semibold text-gray-700">
                Einladung selbst senden
              </p>
              <div className="mt-3">
                <TeilenKnoepfe
                  teilenText={text}
                  teilenTitel={betreff}
                  whatsapp={whatsappLink(text, kontakt.telefon || undefined)}
                  mailto={kontakt.email ? mailtoLink(kontakt.email, betreff, text) : undefined}
                  kopierText={link}
                  kopierLabel="Bestätigungslink kopieren"
                />
              </div>
              <details className="mt-4 text-sm">
                <summary className="cursor-pointer font-medium text-gray-600">Einladung ansehen</summary>
                <pre className="mt-3 whitespace-pre-wrap rounded-lg bg-gray-50 p-4 font-sans text-gray-700">
                  {text}
                </pre>
              </details>
            </>
          )}

          {profilVollstaendig && mailVersand && kontakt.email && (
            <form action={einladungErneutSenden.bind(null, id)} className="mt-4">
              <button
                type="submit"
                className="text-sm font-semibold text-kette underline"
              >
                Automatische E-Mail erneut senden
              </button>
            </form>
          )}
        </div>
      )}

      {(kontakt.firma || kontakt.telefon || kontakt.email || kontakt.ort) && (
        <>
          <h2 className="mt-10 text-xl font-bold">Kontaktdaten</h2>
          <p className="mt-1 text-sm text-gray-500">
            {kontakt.status === "bestaetigt"
              ? `So hat ${kontakt.name.split(" ")[0]} die Angaben selbst hinterlegt. Ändern kann sie nur ${kontakt.name.split(" ")[0]}.`
              : "Diese Angaben prüft und ergänzt der Kontakt bei der Zustimmung selbst."}
          </p>
          <dl className="mt-4 grid gap-3 rounded-2xl border border-linie bg-white p-5 text-sm sm:grid-cols-2">
            {kontakt.firma && <Angabe titel="Firma" wert={kontakt.firma} />}
            {kontakt.telefon && <Angabe titel="Telefon" wert={kontakt.telefon} />}
            {kontakt.email && <Angabe titel="E-Mail" wert={kontakt.email} />}
            {(kontakt.plz || kontakt.ort) && <Angabe titel="Ort" wert={`${kontakt.plz} ${kontakt.ort}`.trim()} />}
          </dl>
        </>
      )}

      <h2 className="mt-10 text-xl font-bold">
        {kontakt.status === "bestaetigt" ? "Deine Notiz" : "Einladung bearbeiten"}
      </h2>
      <div className="mt-4">
        <KontaktFormular
          id={id}
          nurNotiz={kontakt.status === "bestaetigt"}
          anfangswerte={{ name: kontakt.name, leistung: kontakt.leistung, notiz: kontakt.notiz }}
        />
      </div>

      <div className="mt-10 rounded-xl border border-red-200 bg-white p-6">
        <h2 className="font-bold">Kontakt entfernen</h2>
        <p className="mt-2 text-sm text-gray-600">
          Der Kontakt wird aus deinem Netzwerk gelöscht. Bereits
          ausgesprochene Empfehlungen bleiben in deiner Übersicht erhalten.
        </p>
        <LoeschenKnopf id={id} name={kontakt.name} />
      </div>
    </div>
  );
}

function Angabe({ titel, wert }: { titel: string; wert: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">{titel}</dt>
      <dd className="mt-0.5 truncate text-slate-700">{wert}</dd>
    </div>
  );
}
