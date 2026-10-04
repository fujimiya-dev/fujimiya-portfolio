export default function NoImage() {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 text-ink-faint">
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <path d="M21 15l-5-5L5 21" />
      </svg>
      <span className="text-[10px] tracking-wide">No Image</span>
    </div>
  );
}
