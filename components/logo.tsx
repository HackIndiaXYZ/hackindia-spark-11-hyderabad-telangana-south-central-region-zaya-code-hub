export function Logo({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden>
      <rect x="1" y="1" width="30" height="30" rx="7" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M10 22V10h4.2c2.4 0 3.9 1.2 3.9 3.1 0 1.3-.7 2.2-1.8 2.7l2.6 6.2h-2.9l-2.3-5.6H13v5.6H10zm3-8.2h1c1.1 0 1.7-.5 1.7-1.4s-.6-1.3-1.7-1.3H13v2.7z"
        fill="currentColor"
      />
    </svg>
  );
}

export function LogoWordmark() {
  return (
    <span className="wordmark">
      <Logo />
      <span>Launchpad</span>
    </span>
  );
}
