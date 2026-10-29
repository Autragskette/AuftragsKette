export default function StufenAbzeichen({ name }: { name: string }) {
  const stil =
    name === "Top-Mitglied"
      ? "bg-amber-400 text-gray-900"
      : name === "Aktives Mitglied"
        ? "bg-blue-100 text-blue-800"
        : "bg-gray-100 text-gray-700";
  return (
    <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-3 py-1 text-xs font-bold ${stil}`}>
      {name === "Top-Mitglied" && <span aria-hidden>★</span>}
      {name}
    </span>
  );
}
