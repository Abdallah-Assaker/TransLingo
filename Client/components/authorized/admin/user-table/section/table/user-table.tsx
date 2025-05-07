"use client";

import * as React from "react";
import { useRouter } from 'next/navigation';
import {
  ColumnDef,
  SortingState,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  getPaginationRowModel,
  getFilteredRowModel,
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { UserProfileData } from "@/lib/api/interfaces";
import { columns } from "./columns";

interface UserTableProps {
  data: UserProfileData[];
  globalFilter: string;
  onGlobalFilterChange: (filter: string) => void;
}

export function UserTable({ data, globalFilter, onGlobalFilterChange }: UserTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const router = useRouter();

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      globalFilter,
    },
    onGlobalFilterChange: onGlobalFilterChange,
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  const handleRowClick = (userId: string) => {
    router.push(`/admin/users/view/${userId}`);
  };

  return (
    <div>
      <div className="rounded-md border dark:border-slate-700">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="dark:border-slate-700">
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id} className="dark:text-slate-300">
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  onClick={() => handleRowClick(row.original.userId)}
                  className="cursor-pointer hover:bg-muted/50 dark:hover:bg-slate-700/50 dark:border-slate-700"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="dark:text-slate-400">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center dark:text-slate-400">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
          className="dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600 hover:dark:bg-slate-600"
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
          className="dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600 hover:dark:bg-slate-600"
        >
          Next
        </Button>
      </div>
    </div>
  );
}
