export default function StufenAbzeichen({ name }: { name: string }) {
  const stil =
    name === "Top-Mitglied"
      ? "bg-messing text-white"
      : name === "Aktives Mitglied"
        ? "bg-kette/10 text-kette"
        : "bg-slate-100 text-slate-600";
  return (
    <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${stil}`}>
      {name === "Top-Mitglied" && <span aria-hidden>★</span>}
      {name}
    </span>
  );
}
