import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement> & { size?: number };

function base({ size = 22, ...rest }: P) {
  return {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.6,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
    ...rest,
  };
}

export const SearchIcon = (p: P) => (
  <svg {...base(p)}>
    <circle cx="10.5" cy="10.5" r="6.5" />
    <path d="m20 20-4.6-4.6" />
  </svg>
);

export const UserIcon = (p: P) => (
  <svg {...base(p)}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4.5 20.5c1.2-3.6 4-5.5 7.5-5.5s6.3 1.9 7.5 5.5" />
  </svg>
);

export const HeartIcon = ({ filled, ...p }: P & { filled?: boolean }) => (
  <svg {...base(p)} fill={filled ? "currentColor" : "none"}>
    <path d="M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7a4.3 4.3 0 0 1 7.5 2.8C19.5 15.4 12 20 12 20Z" />
  </svg>
);

/** A shopping box rather than a bag: the store is called BOX. */
export const BoxIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M3.5 8 12 4l8.5 4v8.5L12 20.5 3.5 16.5Z" />
    <path d="M3.5 8 12 12l8.5-4M12 12v8.5" />
    <path d="m7.8 6 8.4 4" />
  </svg>
);

export const CloseIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M6 6l12 12M18 6 6 18" />
  </svg>
);

export const MenuIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M4 8h16M4 16h10" />
  </svg>
);

export const ChevronIcon = ({ dir = "down", ...p }: P & { dir?: "down" | "left" | "right" | "up" }) => {
  const r = { down: 0, left: 90, up: 180, right: 270 }[dir];
  return (
    <svg {...base(p)} style={{ transform: `rotate(${r}deg)`, ...p.style }}>
      <path d="m7 10 5 5 5-5" />
    </svg>
  );
};

export const ArrowIcon = ({ dir = "right", ...p }: P & { dir?: "left" | "right" | "down" }) => {
  const r = { right: 0, down: 90, left: 180 }[dir];
  return (
    <svg {...base(p)} style={{ transform: `rotate(${r}deg)`, ...p.style }}>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
};

export const PlusIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);

export const MinusIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M5 12h14" />
  </svg>
);

export const TruckIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M3 6.5h11v9H3zM14 9.5h3.8l3.2 3.3v2.7h-7" />
    <circle cx="7" cy="17.5" r="1.8" />
    <circle cx="17" cy="17.5" r="1.8" />
  </svg>
);

export const RulerIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="m3.5 15.5 12-12 5 5-12 12z" />
    <path d="m7 12 2 2M10 9l2 2M13 6l2 2" />
  </svg>
);

export const RotateIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M20 12a8 8 0 1 1-2.3-5.6" />
    <path d="M20 4v4.5h-4.5" />
  </svg>
);

export const LoupeIcon = (p: P) => (
  <svg {...base(p)}>
    <circle cx="10.5" cy="10.5" r="6.5" />
    <path d="m20 20-4.6-4.6M10.5 8v5M8 10.5h5" />
  </svg>
);

export const PhotoIcon = (p: P) => (
  <svg {...base(p)}>
    <rect x="3.5" y="5" width="17" height="14" rx="2" />
    <path d="m3.5 16 5-5 4 4 2.5-2.5 5.5 5.5" />
    <circle cx="15.5" cy="9.5" r="1.3" />
  </svg>
);

export const CubeIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 3.5 20 8v8l-8 4.5L4 16V8Z" />
    <path d="M4 8l8 4.5L20 8M12 12.5v8" />
  </svg>
);

export const CheckIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="m5 12.5 4.5 4.5L19 7.5" />
  </svg>
);

export const CareIcon = ({ kind, ...p }: P & { kind: string }) => {
  switch (kind) {
    case "wash30":
    case "wash40":
      return (
        <svg {...base(p)}>
          <path d="M3.5 7.5h17l-2 11h-13z" />
          <path d="M3.5 7.5c1.5 1.4 2.8 1.4 4.2 0 1.5 1.4 2.8 1.4 4.3 0 1.5 1.4 2.8 1.4 4.3 0 1.4 1.4 2.8 1.4 4.2 0" />
          <text x="12" y="16.5" textAnchor="middle" fontSize="6.5" fill="currentColor" stroke="none" fontWeight="700">
            {kind === "wash30" ? "30" : "40"}
          </text>
        </svg>
      );
    case "noBleach":
      return (
        <svg {...base(p)}>
          <path d="M12 4 21 19H3Z" />
          <path d="m6 7 12 12M18 7 6 19" />
        </svg>
      );
    case "ironLow":
    case "ironMid":
      return (
        <svg {...base(p)}>
          <path d="M4 17h16c0-5-2.5-8-7-8H7.5" />
          <path d="M4 17c0-3 1.5-5 3.5-6" />
          <circle cx={kind === "ironLow" ? 12 : 10.5} cy="14" r=".7" fill="currentColor" />
          {kind === "ironMid" && <circle cx="13.5" cy="14" r=".7" fill="currentColor" />}
        </svg>
      );
    case "noTumble":
    case "tumbleLow":
      return (
        <svg {...base(p)}>
          <rect x="4" y="4" width="16" height="16" />
          <circle cx="12" cy="12" r="5.5" />
          {kind === "noTumble" ? <path d="m5 5 14 14M19 5 5 19" /> : <circle cx="12" cy="12" r=".8" fill="currentColor" />}
        </svg>
      );
    case "dryFlat":
      return (
        <svg {...base(p)}>
          <rect x="4" y="4" width="16" height="16" />
          <path d="M8 12h8" />
        </svg>
      );
    default:
      return null;
  }
};

export const CARE_LABEL: Record<string, string> = {
  wash30: "Pranje na 30 °C",
  wash40: "Pranje na 40 °C",
  noBleach: "Bez izbjeljivača",
  ironLow: "Peglanje na niskoj temperaturi",
  ironMid: "Peglanje na srednjoj temperaturi",
  noTumble: "Bez sušenja u mašini",
  tumbleLow: "Sušenje u mašini na niskoj temperaturi",
  dryFlat: "Sušiti položeno",
};
