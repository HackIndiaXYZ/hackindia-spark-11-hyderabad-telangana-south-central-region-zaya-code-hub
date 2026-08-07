type IconProps = { className?: string; size?: number };

export function IconResearch({ className, size = 18 }: IconProps) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3.5-3.5" />
    </svg>
  );
}

export function IconStrategy({ className, size = 18 }: IconProps) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19h16M6 15l3-8 4 5 3-4 2 7" />
    </svg>
  );
}

export function IconFinance({ className, size = 18 }: IconProps) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
      <path d="M12 3v18M7 8h7a3 3 0 010 6H9a3 3 0 000 6h8" />
    </svg>
  );
}

export function IconBrand({ className, size = 18 }: IconProps) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l2.2 6.8H21l-5.6 4.1 2.1 6.8L12 16.6 6.5 20.7l2.1-6.8L3 9.8h6.8L12 3z" />
    </svg>
  );
}

export function IconWebsite({ className, size = 18 }: IconProps) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 9h18M8 5V3M16 5V3" />
    </svg>
  );
}

export function IconPitch({ className, size = 18 }: IconProps) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="3" width="16" height="18" rx="2" />
      <path d="M8 8h8M8 12h6M8 16h4" />
    </svg>
  );
}

export const AGENT_ICONS = {
  marketResearch: IconResearch,
  businessStrategy: IconStrategy,
  financialPlanning: IconFinance,
  branding: IconBrand,
  websiteGenerator: IconWebsite,
  pitchDeck: IconPitch,
} as const;
