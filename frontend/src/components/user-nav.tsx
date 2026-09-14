"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { BookOpen, BookText, ChevronsUpDown, Layers, LogOut, MapPin } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useClearSessionQueries } from "@/hooks/use-me";
import { apiFetch } from "@/lib/api";

export type UserNavUser = {
  readonly email: string | null;
  readonly username: string | null;
  readonly displayName: string | null;
};

type UserNavProps = {
  readonly user: UserNavUser;
};

const getDisplayLabel = (user: UserNavUser) =>
  user.displayName?.trim() ||
  user.username?.trim() ||
  user.email?.trim() ||
  "Learner";

const getInitials = (user: UserNavUser) => {
  const label = getDisplayLabel(user);
  const parts = label.split(/[\s@_]+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
  }
  return label.slice(0, 2).toUpperCase();
};

/**
 * Compact avatar dropdown for account actions (logout + primary destinations).
 * Pattern adapted from ReUI c-avatar-35 + shadcn dropdown-menu avatar example.
 */
export const UserNav = ({ user }: UserNavProps) => {
  const router = useRouter();
  const clearSessionQueries = useClearSessionQueries();
  const label = getDisplayLabel(user);
  const email = user.email?.trim() || null;

  const handleLogout = async () => {
    try {
      await apiFetch("/v1/auth/logout", { method: "POST" });
    } catch {
      // Clear remote session best-effort; local navigation still proceeds.
    }
    clearSessionQueries();
    router.push("/login");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 rounded-full pr-2.5 pl-1"
            aria-label="Open user menu"
          />
        }
      >
        <Avatar size="sm">
          <AvatarFallback>{getInitials(user)}</AvatarFallback>
        </Avatar>
        <span className="hidden max-w-24 truncate text-sm md:inline lg:max-w-28">
          {label}
        </span>
        <ChevronsUpDown className="size-3.5 opacity-60" aria-hidden />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col gap-0.5">
              <span className="truncate text-sm font-medium text-foreground">{label}</span>
              {email ? (
                <span className="truncate text-xs text-muted-foreground">{email}</span>
              ) : null}
            </div>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem render={<Link href="/learn" />}>
            <BookOpen />
            Continue lesson
          </DropdownMenuItem>
          <DropdownMenuItem render={<Link href="/flashcards" />}>
            <Layers />
            Flashcards
          </DropdownMenuItem>
          <DropdownMenuItem render={<Link href="/vocabulary" />}>
            <BookText />
            Vocabulary
          </DropdownMenuItem>
          <DropdownMenuItem render={<Link href="/placement" />}>
            <MapPin />
            Placement check
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={() => void handleLogout()}>
          <LogOut />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
