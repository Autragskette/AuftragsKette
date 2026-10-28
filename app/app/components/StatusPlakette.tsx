const STIL: Record<string, { text: string; klassen: string }> = {
  eingeladen: { text: "Wartet auf Bestätigung", klassen: "bg-amber-50 text-amber-800" },
  bestaetigt: { text: "Bestätigt", klassen: "bg-green-50 text-green-800" },
  abgelehnt: { text: "Abgelehnt", klassen: "bg-red-50 text-red-700" },
  offen: { text: "Offen", klassen: "bg-gray-100 text-gray-700" },
  auftrag: { text: "Auftrag erhalten", klassen: "bg-green-50 text-green-800" },
  kein_auftrag: { text: "Kein Auftrag", klassen: "bg-gray-100 text-gray-600" },
  faellig: { text: "Nachfrage fällig", klassen: "bg-amber-50 text-amber-800" },
};

export default function StatusPlakette({ status }: { status: string }) {
  const stil = STIL[status] ?? { text: status, klassen: "bg-gray-100 text-gray-700" };
  return (
    <span
      className={`inline-block shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${stil.klassen}`}
    >
      {stil.text}
    </span>
  );
}
