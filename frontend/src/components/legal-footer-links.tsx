import Link from "next/link";
import { LEGAL_LINKS } from "@/lib/legal";
import { cn } from "@/lib/utils";

type LegalFooterLinksProps = {
  readonly className?: string;
  /** Show the necessary-cookies info line (default true). */
  readonly showCookieNotice?: boolean;
};

/**
 * Compact Privacy / Terms / Impressum links for auth and marketing surfaces,
 * plus a non-blocking note that only necessary session cookies are used.
 */
export const LegalFooterLinks = ({
  className,
  showCookieNotice = true,
}: LegalFooterLinksProps) => (
  <div
    className={cn(
      "flex flex-col gap-2 text-center text-xs text-muted-foreground",
      className,
    )}
  >
    {showCookieNotice ? (
      <p className="text-balance">
        We use necessary session cookies only.{" "}
        <Link
          href="/privacy#cookies"
          className="font-medium text-inherit underline-offset-4 hover:underline"
        >
          Privacy
        </Link>
      </p>
    ) : null}
    <nav
      className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1"
      aria-label="Legal"
    >
      {LEGAL_LINKS.map((item, index) => (
        <span key={item.href} className="inline-flex items-center gap-3">
          {index > 0 ? (
            <span aria-hidden className="opacity-40">
              ·
            </span>
          ) : null}
          <Link
            href={item.href}
            className="underline-offset-4 hover:opacity-100 hover:underline opacity-90"
          >
            {item.label}
          </Link>
        </span>
      ))}
    </nav>
  </div>
);
