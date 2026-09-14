import Link from "next/link";
import { LEGAL_LINKS } from "@/lib/legal";
import { cn } from "@/lib/utils";

type LegalFooterLinksProps = {
  readonly className?: string;
};

/**
 * Compact Privacy / Terms / Impressum links for auth and marketing surfaces.
 */
export const LegalFooterLinks = ({ className }: LegalFooterLinksProps) => (
  <nav
    className={cn(
      "flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-center text-xs text-muted-foreground",
      className,
    )}
    aria-label="Legal"
  >
    {LEGAL_LINKS.map((item, index) => (
      <span key={item.href} className="inline-flex items-center gap-3">
        {index > 0 ? <span aria-hidden className="text-border">
          ·
        </span> : null}
        <Link
          href={item.href}
          className="underline-offset-4 hover:text-foreground hover:underline"
        >
          {item.label}
        </Link>
      </span>
    ))}
  </nav>
);
