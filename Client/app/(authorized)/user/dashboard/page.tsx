'use client'; // Add this directive as we are using hooks

import React, { useEffect, useState, useMemo } from 'react'; // Import useMemo
import { useSession } from 'next-auth/react'; // Import useSession
import Link from 'next/link'; // Import Link
import { getUserProfile } from '@/lib/api/auth';
import { getUserRequests } from '@/lib/api/requests'; // Import request fetching function
import type { UserProfileData, TranslationRequestData } from '@/lib/api/interfaces'; // Import interfaces
import { InformationCard } from '@/components/shared/user-information-card/information-card';
import { InformationCardSkeleton } from '@/components/shared/user-information-card/information-card.skeleton'; // Import the skeleton
import { TranslationRequestSection } from '@/components/shared/translation-request/table-section/translation-request-section'; // Import TranslationRequestSection
import { Card, CardContent } from "@/components/ui/card"; // Import Card components
import { AlertCircle, Plus, Loader2, ListOrdered } from "lucide-react"; // Import icons, ListOrdered for requests
import { toast } from 'react-toastify'; // Optional: for notifications
import { debounce } from '@/lib/utils'; // Import debounce

const DEBOUNCE_DELAY = 300; // milliseconds

const DashboardPage = () => {
  const { data: session, status: sessionStatus } = useSession(); // Get session data

  // Profile state
  const [userData, setUserData] = useState<UserProfileData | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Requests state
  const [requests, setRequests] = useState<TranslationRequestData[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(true);
  const [requestsError, setRequestsError] = useState<string | null>(null);
  const [requestsGlobalFilter, setRequestsGlobalFilter] = useState(''); // Filter state for user requests

  // Debounced setter for requests filter
  const debouncedSetRequestsGlobalFilter = useMemo(
    () => debounce((value: string) => {
      setRequestsGlobalFilter(value);
    }, DEBOUNCE_DELAY),
    [] // Empty dependency array means this is created once
  );

  useEffect(() => {
    // Only fetch if the session is authenticated and we have an access token
    if (sessionStatus === 'authenticated' && session?.accessToken) {
      const fetchData = async () => {
        // Fetch Profile
        setProfileLoading(true);
        setProfileError(null);
        const profileResult = await getUserProfile();
        if ('error' in profileResult) {
          console.error("Failed to fetch user profile:", profileResult.error);
          setProfileError(profileResult.error);
          setUserData(null);
        } else {
          console.log("User profile data fetched successfully:", profileResult.data); // Log the fetched data
          setUserData(profileResult.data);
        }
        setProfileLoading(false);

        // Fetch Requests
        setRequestsLoading(true);
        setRequestsError(null);
        const requestsResult = await getUserRequests();
        if ('error' in requestsResult) {
          console.error("Failed to fetch translation requests:", requestsResult.error);
          setRequestsError(requestsResult.error);
          toast.error(`Failed to load requests: ${requestsResult.error}`); // Optional
          setRequests([]);
        } else {
          console.log("Translation requests fetched successfully:", requestsResult.data);
          setRequests(requestsResult.data);
        }
        setRequestsLoading(false);
      };

      fetchData();
    } else if (sessionStatus === 'loading') {
      // Still loading session, keep both loading states true
      setProfileLoading(true);
      setRequestsLoading(true);
    } else {
      // Not authenticated or no token
      setProfileLoading(false);
      setRequestsLoading(false);
      const authError = "User is not authenticated or session is invalid.";
      setProfileError(authError);
      setRequestsError(authError);
      setUserData(null);
      setRequests([]);
    }
  }, [session?.accessToken, sessionStatus]);

  // Combined loading state for initial page load feel
  const isLoading = profileLoading || sessionStatus === 'loading';

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8 text-center text-gray-800 dark:text-gray-200">User Dashboard</h1>

      {/* Top Section: Profile Info & Create Request */}
      <div className="flex flex-wrap justify-center md:justify-start gap-8 mb-12">
        {/* Profile Card Area */}
        <div className="flex-shrink-0">
          {isLoading && <InformationCardSkeleton className="w-64 h-64" />}
          {profileError && !isLoading && (
            <Card className="w-64 h-64 flex items-center justify-center border-destructive bg-destructive/10">
              <CardContent className="text-center p-4">
                <AlertCircle className="h-8 w-8 text-destructive mx-auto mb-2" />
                <p className="text-sm font-medium text-destructive">Profile Error</p>
                <p className="text-xs text-destructive/80">{profileError}</p>
              </CardContent>
            </Card>
          )}
          {userData && !isLoading && !profileError && (
            <InformationCard
              firstName={userData.firstName}
              lastName={userData.lastName}
              email={userData.email}
              createdAt={userData.createdAt}
              updatedAt={userData.updatedAt}
            />
          )}
        </div>

        {/* Create Request Card Area - Show only if profile loaded successfully */}
        <div className="flex-shrink-0">
          {!isLoading && !profileError && userData && (
            <Link href="/user/translation-request/create" passHref>
              <Card className="w-64 h-64 p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-transform duration-200 ease-in-out hover:scale-105 hover:shadow-lg border-2 border-dashed border-gray-300 hover:border-primary group">
                <CardContent className="flex flex-col items-center justify-center p-0">
                  <Plus className="h-16 w-16 text-gray-500 mb-4 group-hover:text-primary transition-colors" />
                  <p className="text-lg font-medium text-gray-700 group-hover:text-primary transition-colors">
                    Create New Translation Request
                  </p>
                </CardContent>
              </Card>
            </Link>
          )}
          {/* Optional: Show a placeholder or disabled state if profile hasn't loaded */}
          {(isLoading || profileError || !userData) && (
            <Card className="w-64 h-64 p-4 flex flex-col items-center justify-center text-center border-2 border-dashed border-gray-300 bg-gray-50 opacity-60">
              <CardContent className="flex flex-col items-center justify-center p-0">
                <Plus className="h-16 w-16 text-gray-400 mb-4" />
                <p className="text-lg font-medium text-gray-500">New Request</p>
                <p className="text-sm text-gray-400 mt-1">Load profile first</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Recent Requests Section - Now uses TranslationRequestSection */}
      <TranslationRequestSection
        title="My Recent Requests"
        icon={ListOrdered}
        requestsLoading={requestsLoading}
        requestsError={requestsError}
        requestsData={requests}
        currentFilterValue={requestsGlobalFilter} // Pass current debounced value
        onFilterChangeDebounced={debouncedSetRequestsGlobalFilter} // Pass debounced setter
        isAdminView={false} // Explicitly false for user dashboard
        emptyStateMessage="No translation requests found."
        emptyStateSubMessage="Create a new request to get started."
      />
    </div>
  );
};

export default DashboardPage;
