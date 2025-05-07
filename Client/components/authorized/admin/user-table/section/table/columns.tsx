"use client";

import { ColumnDef, createColumnHelper } from "@tanstack/react-table";
import { UserProfileData } from "@/lib/api/interfaces"; // Assuming UserProfileData is the correct interface
import { Button } from "@/components/ui/button";
import { ArrowUpDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const columnHelper = createColumnHelper<UserProfileData>();

export const columns: ColumnDef<UserProfileData>[] = [
  columnHelper.accessor("firstName", {
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          First Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: (info) => <span className="font-medium">{info.getValue()}</span>,
    enableSorting: true,
  }),
  columnHelper.accessor("lastName", {
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Last Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: (info) => info.getValue(),
    enableSorting: true,
  }),
  columnHelper.accessor("email", {
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Email
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: (info) => <Badge variant="outline">{info.getValue()}</Badge>,
    enableSorting: true,
  }),
  columnHelper.accessor("userName", {
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Username
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: (info) => info.getValue(),
    enableSorting: true,
  }),
  columnHelper.accessor("createdAt", {
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Created At
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: (info) => {
      const date = new Date(info.getValue());
      const formattedDate = date.toLocaleDateString(undefined, {
        year: 'numeric', month: 'short', day: 'numeric'
      });
      const formattedTime = date.toLocaleTimeString(undefined, {
        hour: '2-digit', minute: '2-digit'
      });
      return <span className="text-sm text-muted-foreground">{`${formattedDate} ${formattedTime}`}</span>;
    },
    enableSorting: true,
  }),
  // columnHelper.accessor("updatedAt", {
  //   header: ({ column }) => {
  //     return (
  //       <Button
  //         variant="ghost"
  //         onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
  //       >
  //         Updated At
  //         <ArrowUpDown className="ml-2 h-4 w-4" />
  //       </Button>
  //     );
  //   },
  //   cell: (info) => {
  //     const date = new Date(info.getValue());
  //     const formattedDate = date.toLocaleDateString(undefined, {
  //       year: 'numeric', month: 'short', day: 'numeric'
  //     });
  //     const formattedTime = date.toLocaleTimeString(undefined, {
  //       hour: '2-digit', minute: '2-digit'
  //     });
  //     return <span className="text-sm text-muted-foreground">{`${formattedDate} ${formattedTime}`}</span>;
  //   },
  //   enableSorting: true,
  // }),
  // Hidden userId column, can be used for row actions or navigation if needed directly
  // columnHelper.accessor("userId", {
  //   header: "User ID",
  //   cell: (info) => info.getValue(),
  //   enableSorting: false,
  //   meta: {
  //     hidden: true, // Example of how you might hide it if not directly displayed
  //   },
  // }),
];
