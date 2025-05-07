import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils"; // Import cn utility for merging classes

/**
 * Props for the InformationCardSkeleton component.
 */
interface InformationCardSkeletonProps {
  className?: string; // Allow passing custom classes
}

/**
 * Skeleton component mimicking the InformationCard layout.
 * Used as a placeholder while user data is loading.
 * @param {InformationCardSkeletonProps} props - Component props.
 */
export const InformationCardSkeleton = ({ className }: InformationCardSkeletonProps) => (
  // Use cn to merge default classes with the passed className
  <Card className={cn("w-full max-w-md mx-auto bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 shadow-md animate-pulse", className)}>
    <CardContent className="p-6 flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6">
      <div className="flex-shrink-0 p-3 bg-primary/10 rounded-full">
        <Skeleton className="h-12 w-12 rounded-full bg-gray-300 dark:bg-gray-700" />
      </div>
      <div className="flex-grow text-center sm:text-left space-y-2">
        <Skeleton className="h-6 w-3/4 bg-gray-300 dark:bg-gray-700 mx-auto sm:mx-0" />
        <Skeleton className="h-4 w-1/2 bg-gray-300 dark:bg-gray-700 mx-auto sm:mx-0" />
        <div className="mt-2 flex flex-wrap justify-center sm:justify-start gap-2">
          <Skeleton className="h-5 w-16 bg-gray-300 dark:bg-gray-700 rounded-full" />
          <Skeleton className="h-5 w-16 bg-gray-300 dark:bg-gray-700 rounded-full" />
        </div>
        <div className="mt-3 space-y-1">
          <Skeleton className="h-3 w-full bg-gray-300 dark:bg-gray-700" />
          <Skeleton className="h-3 w-full bg-gray-300 dark:bg-gray-700" />
        </div>
      </div>
    </CardContent>
  </Card>
);
