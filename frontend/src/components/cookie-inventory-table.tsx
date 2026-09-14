"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AUTH_COOKIES } from "@/lib/legal";

/**
 * Cookie inventory for the Privacy Policy (shadcn Table).
 */
export const CookieInventoryTable = () => (
  <Table aria-label="Cookies used by German Got Easy">
    <TableHeader>
      <TableRow>
        <TableHead scope="col">Name</TableHead>
        <TableHead scope="col">Purpose</TableHead>
        <TableHead scope="col">Category</TableHead>
        <TableHead scope="col">Duration</TableHead>
        <TableHead scope="col">Path</TableHead>
        <TableHead scope="col">Flags</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {AUTH_COOKIES.map((cookie) => (
        <TableRow key={cookie.name}>
          <TableCell className="font-medium text-foreground whitespace-nowrap">
            {cookie.name}
          </TableCell>
          <TableCell className="min-w-[12rem] whitespace-normal text-muted-foreground">
            {cookie.purpose}
          </TableCell>
          <TableCell className="whitespace-nowrap">{cookie.category}</TableCell>
          <TableCell className="min-w-[10rem] whitespace-normal text-muted-foreground">
            {cookie.duration}
          </TableCell>
          <TableCell className="font-mono text-xs whitespace-nowrap">{cookie.path}</TableCell>
          <TableCell className="min-w-[10rem] whitespace-normal text-muted-foreground">
            {cookie.flags}
          </TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>
);
