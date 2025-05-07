"use client";

import { ColumnDef, createColumnHelper } from "@tanstack/react-table";
import { TranslationRequestData } from "@/lib/api/interfaces";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowUpDown } from "lucide-react";
import { TranslationStatus } from "@/lib/api/interfaces";

// Helper function to get status text and badge variant
const getStatusInfo = (
  status: number
): { text: string; variant: "default" | "secondary" | "destructive" | "outline" | "warning" } => {
  switch (status) {
    case TranslationStatus.Pending:
      return { text: "Pending", variant: "secondary" };
    case TranslationStatus.Approved:
      return { text: "Approved", variant: "default" }; // Use default for positive/in-progress
    case TranslationStatus.Completed:
      return { text: "Completed", variant: "outline" }; // Use outline for success/completed
    case TranslationStatus.Rejected:
      return { text: "Rejected", variant: "destructive" };
    case TranslationStatus.Resubmitted:
      return { text: "Resubmitted", variant: "warning" }; // Custom variant if defined, else fallback
    default:
      return { text: "Unknown", variant: "secondary" };
  }
};

// Helper function to get a consistent color class based on language string
const getLanguageColorClass = (language: string): string => {
  // Simple hash function to get a number between 0 and 4
  let hash = 0;
  for (let i = 0; i < language.length; i++) {
    hash = language.charCodeAt(i) + ((hash << 5) - hash);
    hash = hash & hash; // Convert to 32bit integer
  }
  const index = Math.abs(hash) % 5; // Use modulo 5 for 5 color options

  // Define Tailwind background color classes
  const colors = [
    "bg-blue-100 text-blue-800", // Example color
    "bg-green-100 text-green-800",
    "bg-yellow-100 text-yellow-800",
    "bg-purple-100 text-purple-800",
    "bg-pink-100 text-pink-800",
  ];
  return colors[index] || "bg-gray-100 text-gray-800"; // Fallback
};

const columnHelper = createColumnHelper<TranslationRequestData>();

export const columns: ColumnDef<TranslationRequestData>[] = [
  columnHelper.accessor("title", {
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Title
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: (info) => <span className="font-medium">{info.getValue()}</span>,
    enableSorting: true,
  }),
  columnHelper.accessor("sourceLanguage", {
    header: "Source Lang.",
    cell: (info) => {
      const language = info.getValue();
      const colorClass = getLanguageColorClass(language);
      return <Badge className={cn("px-2 py-0.5", colorClass)}>{language}</Badge>;
    },
    enableSorting: false, // Sorting language might not be useful
  }),
  columnHelper.accessor("targetLanguage", {
    header: "Target Lang.",
    cell: (info) => {
      const language = info.getValue();
      const colorClass = getLanguageColorClass(language);
      return <Badge className={cn("px-2 py-0.5", colorClass)}>{language}</Badge>;
    },
    enableSorting: false,
  }),
  columnHelper.accessor("originalFileName", {
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Original File
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: (info) => <span className="text-sm text-muted-foreground">{info.getValue()}</span>,
    enableSorting: true,
  }),
  columnHelper.accessor("status", {
    header: "Status",
    cell: (info) => {
      const statusValue = info.getValue();
      const { text, variant } = getStatusInfo(statusValue);
      // Add 'warning' variant style if not built-in
      const variantClass = variant === 'warning' ? 'bg-orange-100 text-orange-800 border-orange-300' : '';
      // Apply appropriate variant and custom class if needed
      return <Badge variant={variant === 'warning' ? 'outline' : variant} className={cn(variantClass, "capitalize")}>{text}</Badge>;
    },
    enableSorting: false, // Sorting by status might be less common, can enable if needed
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
      return <span className="text-sm">{`${formattedDate} ${formattedTime}`}</span>;
    },
    enableSorting: true,
  }),
  // Add more columns as needed (e.g., actions)
  // columnHelper.display({
  //   id: 'actions',
  //   cell: ({ row }) => {
  //     const request = row.original;
  //     // Add action buttons here (View, Edit, Delete, Download etc.)
  //     return (
  //       <div className="flex space-x-2">
  //         {/* Example: <Button variant="outline" size="sm">View</Button> */}
  //       </div>
  //     );
  //   },
  // }),
];

// Helper function cn for merging class names (if not already globally available)
function cn(...inputs: any[]) {
  // Simplified version, consider using clsx and tailwind-merge for production
  return inputs.filter(Boolean).join(' ');
}
