// In-house icons for what Lucide doesn't cover (football kit, movement,
// body parts). Each is drawn to Lucide's spec so they sit side by side:
//   24×24 viewBox, 2px padding, stroke-width 2, round caps and joins,
//   no fills, at least 2px between strokes, stroke="currentColor".
// Review them next to Lucide icons in #/icon-lab.

export function makeIcon(displayName, children) {
  function CustomIcon({ size = 24, strokeWidth = 2, className, ...rest }) {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        {...rest}
      >
        {children}
      </svg>
    )
  }
  CustomIcon.displayName = displayName
  return CustomIcon
}

export const CUSTOM = {
  // ---- kit ----
  football: makeIcon('Football', <>
    <circle cx="12" cy="12" r="10" />
    <path d="M12 8.5l3.33 2.42-1.27 3.91H9.94l-1.27-3.91z" />
    <path d="M12 2v6.5M21.51 8.91l-6.18 2.01M17.88 20.09l-3.82-5.26M6.12 20.09l3.82-5.26M2.49 8.91l6.18 2.01" />
  </>),
  'football-goal': makeIcon('FootballGoal', <>
    <path d="M2 20V5h20v15" />
    <path d="M8.5 5v15M15.5 5v15M2 12.5h20" />
  </>),
  bib: makeIcon('Bib', <>
    <path d="M8 3H6L5 7c1.5 1 2 2.5 2 4v9a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-9c0-1.5.5-3 2-4l-1-4h-2" />
    <path d="M8 3a4 4 0 0 0 8 0" />
  </>),
  'agility-ladder': makeIcon('AgilityLadder', <>
    <path d="M9 3L5 21M15 3l4 18" />
    <path d="M8.1 7h7.8M7 12h10M5.9 17h12.2" />
  </>),
  'marker-disc': makeIcon('MarkerDisc', <>
    <ellipse cx="12" cy="16.5" rx="10" ry="3" />
    <path d="M4.5 14.5c1.3-3 3.2-4.5 5.5-4.5h4c2.3 0 4.2 1.5 5.5 4.5" />
  </>),
  hurdle: makeIcon('Hurdle', <>
    <path d="M5 20V7M19 20V7M5 8h14" />
    <path d="M3 20h4M17 20h4" />
  </>),
  'corner-flag': makeIcon('CornerFlag', <>
    <path d="M5 22V2" />
    <rect x="5" y="3" width="14" height="9" rx="1" />
    <path d="M5 12L19 3" />
    <path d="M2 22h6" />
  </>),
  rebounder: makeIcon('Rebounder', <>
    <rect x="3" y="3" width="18" height="12" rx="2" />
    <path d="M3 10l7-7M7 15L19 3M14 15l7-7" />
    <path d="M7 15l-2 6M17 15l2 6" />
  </>),
  'gk-glove': makeIcon('GoalkeeperGlove', <>
    <path d="M6 12V7a2 2 0 0 1 4 0V5a2 2 0 0 1 4 0v1a2 2 0 0 1 4 0v8c0 2-1 4-3 4" />
    <path d="M6 12l-1.6-1.6a1.7 1.7 0 0 0-2.4 2.4L7 18" />
    <path d="M10 7v4M14 6v5" />
    <rect x="7" y="18" width="8" height="4" rx="1" />
  </>),

  // ---- movement ----
  runner: makeIcon('Runner', <>
    <circle cx="15" cy="4" r="2" />
    <path d="M13 8l-2 6" />
    <path d="M7 11l2.5-3H13l3 3h3" />
    <path d="M14 21l1-5-4-2" />
    <path d="M11 14l-3 3H4" />
  </>),
  dribble: makeIcon('Dribble', <>
    <circle cx="17" cy="17" r="4" />
    <path d="M3 3c6 0 7 4 3.5 6.5S4 15 10 16" />
  </>),
  'one-v-one': makeIcon('OneVOne', <>
    <circle cx="6" cy="6" r="2.5" />
    <circle cx="18" cy="6" r="2.5" />
    <path d="M2 15a4 4 0 0 1 8 0M14 15a4 4 0 0 1 8 0" />
    <circle cx="12" cy="19.5" r="2" />
  </>),

  // ---- body ----
  leg: makeIcon('Leg', <>
    <path d="M7 2l2 9-1 8.5a1.5 1.5 0 0 0 1.5 1.5H19a1 1 0 0 0 1-1 1.5 1.5 0 0 0-1.3-1.5L13 18l2-8-2-8" />
  </>),
  shorts: makeIcon('Shorts', <>
    <path d="M5 3h14l2 17h-6l-3-8-3 8H3z" />
    <path d="M5 6.5h14" />
  </>),
  tooth: makeIcon('Tooth', <>
    <path d="M7 3C4.5 3 3 5 3 7.5c0 3 1.5 4.5 2 7.5.4 3 1 6 2.5 6s2-3 2.5-5c.3-1.2 1-2 2-2s1.7.8 2 2c.5 2 1 5 2.5 5s2.1-3 2.5-6c.5-3 2-4.5 2-7.5C21 5 19.5 3 17 3c-2 0-3 1-5 1S9 3 7 3z" />
  </>),
  lungs: makeIcon('Lungs', <>
    <path d="M12 3v8M12 10l-2.5 2M12 10l2.5 2" />
    <path d="M8.5 7C6 7 3 11 3 16c0 3 1.5 4 3 4 2 0 3.5-1 3.5-3V9c0-1.2-.4-2-1-2z" />
    <path d="M15.5 7c2.5 0 5.5 4 5.5 9 0 3-1.5 4-3 4-2 0-3.5-1-3.5-3V9c0-1.2.4-2 1-2z" />
  </>),
}
