export function VerifiedStamp({
  label = "VERIFIED GENUINE",
  tone = "rust",
}: {
  label?: string;
  tone?: "rust" | "green";
}) {
  const color = tone === "rust" ? "#B23A2E" : "#2F6F62";
  const id = label.replace(/\s+/g, "-").toLowerCase();

  return (
    <svg
      viewBox="0 0 140 140"
      width="110"
      height="110"
      className="-rotate-[8deg] select-none"
      role="img"
      aria-label={label}
    >
      <defs>
        <path id={`circle-${id}`} d="M 70, 70 m -50, 0 a 50,50 0 1,1 100,0 a 50,50 0 1,1 -100,0" />
      </defs>
      <circle cx="70" cy="70" r="62" fill="none" stroke={color} strokeWidth="2.5" opacity="0.85" />
      <circle cx="70" cy="70" r="50" fill="none" stroke={color} strokeWidth="1.5" opacity="0.6" />
      <text fontSize="11.5" fontWeight="700" letterSpacing="1.5" fill={color} opacity="0.9">
        <textPath href={`#circle-${id}`} startOffset="2%">
          {label} • {label} •
        </textPath>
      </text>
      <text
        x="70"
        y="76"
        textAnchor="middle"
        fontSize="22"
        fontWeight="800"
        fill={color}
        opacity="0.9"
        style={{ fontFamily: "var(--font-fraunces), serif" }}
      >
        SCT
      </text>
    </svg>
  );
}
