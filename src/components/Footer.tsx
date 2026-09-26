export default function Footer() {
  return (
    <footer className="relative z-[2] py-6 text-center text-xs text-ink-faint [text-shadow:0_0_10px_rgba(127,183,255,0.25)]">
      © {new Date().getFullYear()} Fujimiya.
    </footer>
  );
}
