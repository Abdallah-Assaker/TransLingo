'use client'; // Add this directive as we are using hooks

import React, { useEffect, useState, useMemo } from 'react'; // Import useMemo
import { useSession } from 'next-auth/react'; // Import useSession
import { getUserProfile, getAllUsersAdmin } from '@/lib/api/auth';
import { getAllRequestsAdmin } from '@/lib/api/requests';
import type { UserProfileData, TranslationRequestData } from '@/lib/api/interfaces';
import { InformationCard } from '@/components/shared/user-information-card/information-card';
import { InformationCardSkeleton } from '@/components/shared/user-information-card/information-card.skeleton';
// Import TranslationRequestSection
import { TranslationRequestSection } from '@/components/shared/translation-request/table-section/translation-request-section';
import { UserTableSection } from '@/components/authorized/admin/user-table/section/user-table-section';
import { AlertCircle, Loader2, Users, ListChecks } from "lucide-react"; // ListChecks for admin requests
import { toast } from 'react-toastify';
import { debounce } from '@/lib/utils'; // Import debounce
import { Card, CardContent } from '@/components/ui/card';

const DEBOUNCE_DELAY = 300; // milliseconds

const AdminDashboardPage = () => {
  const { data: session, status: sessionStatus } = useSession();

  // Profile state
  const [adminData, setAdminData] = useState<UserProfileData | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Requests state
  const [requests, setRequests] = useState<TranslationRequestData[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(true);
  const [requestsError, setRequestsError] = useState<string | null>(null);
  const [adminRequestsGlobalFilter, setAdminRequestsGlobalFilter] = useState('');

  // All Users state
  const [allUsersData, setAllUsersData] = useState<UserProfileData[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [userTableGlobalFilter, setUserTableGlobalFilter] = useState('');

  // Debounced setters
  const debouncedSetAdminRequestsGlobalFilter = useMemo(
    () => debounce((value: string) => {
      setAdminRequestsGlobalFilter(value);
    }, DEBOUNCE_DELAY),
    []
  );

  const debouncedSetUserTableGlobalFilter = useMemo(
    () => debounce((value: string) => {
      setUserTableGlobalFilter(value);
    }, DEBOUNCE_DELAY),
    []
  );

  useEffect(() => {
    if (sessionStatus === 'authenticated' && session?.accessToken) {
      const fetchData = async () => {
        setProfileLoading(true);
        setProfileError(null);
        const profileResult = await getUserProfile();
        if ('error' in profileResult) {
          setProfileError(profileResult.error);
          setAdminData(null);
        } else {
          setAdminData(profileResult.data);
        }
        setProfileLoading(false);

        setRequestsLoading(true);
        setRequestsError(null);
        const requestsResult = await getAllRequestsAdmin();
        if ('error' in requestsResult) {
          setRequestsError(requestsResult.error);
          toast.error(`Failed to load requests: ${requestsResult.error}`);
          setRequests([]);
        } else {
          setRequests(requestsResult.data);
        }
        setRequestsLoading(false);

        setUsersLoading(true);
        setUsersError(null);
        const usersResult = await getAllUsersAdmin();
        if ('error' in usersResult) {
          setUsersError(usersResult.error);
          toast.error(`Failed to load users: ${usersResult.error}`);
          setAllUsersData([]);
        } else {
          setAllUsersData(usersResult.data);
        }
        setUsersLoading(false);
      };
      fetchData();
    } else if (sessionStatus === 'loading') {
      setProfileLoading(true);
      setRequestsLoading(true);
      setUsersLoading(true);
    } else {
      setProfileLoading(false);
      setRequestsLoading(false);
      setUsersLoading(false);
      const authError = "User is not authenticated or session is invalid.";
      setProfileError(authError);
      setRequestsError(authError);
      setUsersError(authError);
      setAdminData(null);
      setRequests([]);
      setAllUsersData([]);
    }
  }, [session?.accessToken, sessionStatus]);

  const isLoading = profileLoading || sessionStatus === 'loading';

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8 text-center text-gray-800 dark:text-gray-200">Admin Dashboard</h1>

      {/* Top Section: Admin Info */}
      <div className="flex flex-wrap justify-center md:justify-start gap-8 mb-12">
        {/* Admin Profile Card Area */}
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
          {adminData && !isLoading && !profileError && (
            <InformationCard
              firstName={adminData.firstName}
              lastName={adminData.lastName}
              email={adminData.email}
              createdAt={adminData.createdAt}
              updatedAt={adminData.updatedAt}
            />
          )}
        </div>
        {/* Placeholder for other admin-specific cards if needed in the future */}
      </div>

      {/* All Translation Requests Section - Now uses TranslationRequestSection */}
      <TranslationRequestSection
        title="All Translation Requests"
        icon={ListChecks}
        requestsLoading={requestsLoading}
        requestsError={requestsError}
        requestsData={requests}
        currentFilterValue={adminRequestsGlobalFilter} // Pass current debounced value
        onFilterChangeDebounced={debouncedSetAdminRequestsGlobalFilter} // Pass debounced setter
        isAdminView={true} // Explicitly true for admin dashboard
        emptyStateMessage="No translation requests found in the system."
      />

      {/* All Users Section - Uses UserTableSection */}
      <UserTableSection
        usersLoading={usersLoading}
        usersError={usersError}
        allUsersData={allUsersData}
        currentFilterValue={userTableGlobalFilter} // Pass current debounced value
        onFilterChangeDebounced={debouncedSetUserTableGlobalFilter} // Pass debounced setter
      />
    </div>
  );
};

export default AdminDashboardPage;

