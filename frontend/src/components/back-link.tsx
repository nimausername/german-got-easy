import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type BackLinkProps = {
  readonly href: string;
  readonly label: string;
  readonly className?: string;
};

/**
 * Compact navigation control back to a parent route.
 */
export const BackLink = ({ href, label, className }: BackLinkProps) => (
  <Link
    href={href}
    className={cn(
      buttonVariants({ variant: "ghost", size: "sm" }),
      "-ml-2 w-fit gap-1.5 text-muted-foreground",
      className,
    )}
    aria-label={label}
  >
    <ArrowLeft data-icon="inline-start" />
    {label}
  </Link>
);
