// Small inline SVG icon set used for room amenities and trust badges.
// Kept local/inline rather than pulling in an icon library for ~8 glyphs.

function Icon({ children, className = 'h-4 w-4' }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {children}
    </svg>
  );
}

export const WifiIcon = (props) => (
  <Icon {...props}>
    <path d="M2 8.5a16 16 0 0 1 20 0" />
    <path d="M5 12.5a11 11 0 0 1 14 0" />
    <path d="M8.5 16.5a6 6 0 0 1 7 0" />
    <circle cx="12" cy="20" r="1" fill="currentColor" stroke="none" />
  </Icon>
);

export const SnowflakeIcon = (props) => (
  <Icon {...props}>
    <path d="M12 2v20M4.2 6.5l15.6 11M4.2 17.5l15.6-11" />
  </Icon>
);

export const TvIcon = (props) => (
  <Icon {...props}>
    <rect x="3" y="5" width="18" height="12" rx="1.5" />
    <path d="M8 21h8M12 17v4" />
  </Icon>
);

export const BedIcon = (props) => (
  <Icon {...props}>
    <path d="M3 18v-6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v6" />
    <path d="M3 18v2M21 18v2M3 12V7a1 1 0 0 1 1-1h5a1 1 0 0 1 1 1v3" />
  </Icon>
);

export const BathIcon = (props) => (
  <Icon {...props}>
    <path d="M4 12h16v2a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5v-2Z" />
    <path d="M4 12V7a2 2 0 0 1 2-2h1v3M7 21v1M17 21v1" />
  </Icon>
);

export const CupIcon = (props) => (
  <Icon {...props}>
    <path d="M5 3h11l-1 12a4 4 0 0 1-4 4H10a4 4 0 0 1-4-4L5 3Z" />
    <path d="M16 6h1.5a2.5 2.5 0 0 1 0 5H16" />
  </Icon>
);

export const BuildingIcon = (props) => (
  <Icon {...props}>
    <rect x="4" y="3" width="16" height="18" rx="1" />
    <path d="M8 7h1M8 11h1M8 15h1M15 7h1M15 11h1M15 15h1M10 21v-4h4v4" />
  </Icon>
);

export const UsersIcon = (props) => (
  <Icon {...props}>
    <circle cx="9" cy="8" r="3" />
    <path d="M2 20a7 7 0 0 1 14 0" />
    <path d="M16 4.5a3 3 0 0 1 0 5.9M22 20a6.5 6.5 0 0 0-5-6.3" />
  </Icon>
);

export const ShieldCheckIcon = (props) => (
  <Icon {...props}>
    <path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3Z" />
    <path d="m9 12 2 2 4-4" />
  </Icon>
);

export const CalendarCheckIcon = (props) => (
  <Icon {...props}>
    <rect x="3" y="4" width="18" height="17" rx="2" />
    <path d="M3 9h18M8 2v4M16 2v4" />
    <path d="m9 14 2 2 4-4" />
  </Icon>
);

export const CheckIcon = (props) => (
  <Icon {...props}>
    <path d="m5 12 5 5L20 7" />
  </Icon>
);

export const ClockIcon = (props) => (
  <Icon {...props}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 3" />
  </Icon>
);
