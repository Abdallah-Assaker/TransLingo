import { Card, CardContent } from "@/components/ui/card";
import { User, Calendar, Mail } from "lucide-react"; // Added icons

/**
 * Props for the InformationCard component.
 * Based on the relevant fields from AuthResponse model.
 */
interface InformationCardProps {
  firstName?: string;
  lastName?: string;
  email?: string;
  createdAt?: string; // Assuming ISO string format from API
  updatedAt?: string; // Assuming ISO string format from API
  className?: string; // Allow passing custom classes for sizing etc.
}

/**
 * Displays user information in an ID card format.
 * @param {InformationCardProps} props - The user information to display.
 */
export function InformationCard({ firstName, lastName, email, createdAt, updatedAt, className }: InformationCardProps) {
  // Helper function to format date strings
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "N/A";
    try {
      // Short date format for card space
      return new Date(dateString).toLocaleDateString(undefined, {
        year: 'numeric', month: 'short', day: 'numeric'
      });
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Invalid Date";
    }
  };

  return (
    // Applied className prop, default size, gradient, centered content
    <Card className={`w-64 h-64 p-4 flex flex-col items-center justify-center text-center bg-gradient-to-tr from-blue-100 via-blue-50 to-purple-100 dark:from-slate-800 dark:via-slate-800 dark:to-slate-900 shadow-lg transition-transform duration-200 ease-in-out hover:scale-105 ${className}`}>
      <CardContent className="p-0 flex flex-col items-center justify-center space-y-3">
        <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full shadow-md">
          <User className="h-10 w-10 text-white" />
        </div>
        <div className="flex-grow text-center">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 truncate">
            {firstName} {lastName}
          </h2>
          <div className="flex items-center justify-center text-xs text-gray-600 dark:text-gray-400 mt-1 space-x-1">
            <Mail className="h-3 w-3" />
            <span className="truncate">{email}</span>
          </div>
          <div className="mt-3 text-xs text-gray-500 dark:text-gray-500 space-y-1">
            <div className="flex items-center justify-center space-x-1">
              <Calendar className="h-3 w-3" />
              <span>Joined: {formatDate(createdAt)}</span>
            </div>
            {/* Optionally show updated date if needed, might clutter the small card
            <div className="flex items-center justify-center space-x-1">
               <Calendar className="h-3 w-3" />
               <span>Updated: {formatDate(updatedAt)}</span>
            </div>
            */}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
