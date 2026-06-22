import Link from "next/link";

export function RoleCard({
  href,
  index,
  title,
  description,
}: {
  href: string;
  index: string;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="focus-ring group block rounded-sm border-2 border-ink bg-paper-card p-5 transition-colors hover:bg-ink hover:text-paper-card"
    >
      <span className="font-mono text-xs text-ink-soft group-hover:text-paper-card/60">{index}</span>
      <h3 className="mt-1 font-display text-lg font-semibold">{title}</h3>
      <p className="mt-1.5 font-body text-sm text-ink-soft group-hover:text-paper-card/80">{description}</p>
    </Link>
  );
}
