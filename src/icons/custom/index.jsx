// In-house icons for what Lucide doesn't cover (football kit, animals,
// body parts). Draw each to Lucide's spec so they sit side by side:
//   24×24 viewBox, 2px padding, stroke-width 2, round caps and joins,
//   no fills, at least 2px between strokes, stroke="currentColor".
// Then add it here as  name: makeIcon('Name', <>…paths…</>)
// using the name declared in CUSTOM_ICONS (src/icons/iconMap.js).

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

export const CUSTOM = {}
