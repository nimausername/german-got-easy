"use client";

import type { ComponentPropsWithoutRef } from "react";
import {
  ArrowRight,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  ChevronUp,
  Filter,
  GripVertical,
  LoaderCircle,
  MoreHorizontal,
  Plus,
  Search,
  Star,
  X,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

const LUCIDE_BY_NAME: Record<string, LucideIcon> = {
  ArrowRight01Icon: ArrowRight,
  ArrowRightIcon: ArrowRight,
  CaretRightIcon: ChevronRight,
  CheckIcon: Check,
  ChevronDownIcon: ChevronDown,
  ChevronLeftIcon: ChevronLeft,
  ChevronRightIcon: ChevronRight,
  ChevronsUpDownIcon: ChevronsUpDown,
  ChevronUpIcon: ChevronUp,
  FilterIcon: Filter,
  GripVerticalIcon: GripVertical,
  LoaderCircleIcon: LoaderCircle,
  MoreHorizontalIcon: MoreHorizontal,
  PlusIcon: Plus,
  SearchIcon: Search,
  StarIcon: Star,
  XIcon: X,
};

type IconPlaceholderProps = ComponentPropsWithoutRef<"svg"> & {
  readonly lucide?: string;
  readonly tabler?: string;
  readonly hugeicons?: string;
  readonly phosphor?: string;
  readonly remixicon?: string;
};

/**
 * Minimal ReUI IconPlaceholder stand-in that resolves lucide icon names.
 */
export const IconPlaceholder = ({
  className,
  lucide,
  tabler: _t,
  hugeicons: _h,
  phosphor: _p,
  remixicon: _r,
  ...props
}: IconPlaceholderProps) => {
  void _t;
  void _h;
  void _p;
  void _r;
  const Icon = (lucide && LUCIDE_BY_NAME[lucide]) || ChevronRight;
  return <Icon className={cn(className)} aria-hidden={props["aria-hidden"] ?? true} {...props} />;
};
