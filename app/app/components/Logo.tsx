/** Bildmarke: zwei verschränkte Kettenglieder (wie im App-Symbol) */
export default function Logo({ className = "h-7 w-7" }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 32 32" className={className}>
      <rect width="32" height="32" rx="8" fill="#2457d6" />
      <g transform="rotate(-30 16 16)" fill="none" strokeWidth="2.6">
        <rect x="11.2" y="12" width="13.4" height="8" rx="4" stroke="#bfdbfe" />
        <rect x="7.4" y="12" width="13.4" height="8" rx="4" stroke="#fff" />
      </g>
    </svg>
  );
}
