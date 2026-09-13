import Link from "next/link";
import { cn } from "@/lib/utils";

const productName = process.env.NEXT_PUBLIC_PRODUCT_NAME ?? "German Got Easy";

type BrandLinkProps = {
  readonly className?: string;
  readonly href?: string;
};

/**
 * Product wordmark used across marketing and app shells.
 */
export const BrandLink = ({ className, href = "/" }: BrandLinkProps) => (
  <Link
    href={href}
    className={cn(
      "font-display text-2xl tracking-tight text-brand-ink transition-colors hover:text-primary",
      className,
    )}
    aria-label={`${productName} home`}
  >
    {productName}
  </Link>
);
