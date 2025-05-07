'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { getRequestById, downloadOriginalFileAdmin, getRequestByIdAdmin } from '@/lib/api/requests';
import { TranslationRequestData, OriginalFileDownloadResponse, ApiErrorResponse } from '@/lib/api/interfaces';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal } from "lucide-react";
import { TranslateRequestSection } from '@/components/shared/translation-request/card-section/translation-request-card-section';

// Helper function to check if the response is an error
function isApiError(response: any): response is ApiErrorResponse {
  return response && typeof response.error === 'string';
}

export default function AdminTranslateRequestDetailPage() {
  const params = useParams();
  const router = useRouter();
  const translationRequestId = params.translationRequestId as string;

  const { data: session, status: sessionStatus } = useSession();

  const [requestData, setRequestData] = useState<TranslationRequestData | null>(null);
  const [fileData, setFileData] = useState<OriginalFileDownloadResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<'admin' | null>(null); // Explicitly admin or null

  useEffect(() => {
    if (sessionStatus === 'loading') {
      return;
    }

    if (sessionStatus === 'unauthenticated') {
      setError("Admin access required. Redirecting to login...");
      router.push('/auth/login'); // Or admin login page
      return;
    }

    if (session && session.user && Array.isArray(session.user.roles) && session.user.roles.map(r => r.toLowerCase()).includes('admin')) {
      setUserRole('admin');
    } else {
      console.error("AdminTranslateRequestDetailPage: Access Denied. Admin role not found or session invalid.", session);
      setError("Access Denied. You do not have permission to view this page.");
      // Optionally, redirect to a 'forbidden' page or dashboard
      // router.push('/admin/dashboard');
    }
  }, [session, sessionStatus, router]);

  const fetchData = useCallback(async () => {
    if (!translationRequestId) {
      console.error("AdminTranslateRequestDetailPage: fetchData - Request ID is missing.");
      setError("Request ID is missing.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const requestDetailsResponse = await getRequestByIdAdmin(translationRequestId);
      if (isApiError(requestDetailsResponse)) throw new Error(requestDetailsResponse.error);
      if (!requestDetailsResponse.data) throw new Error("Failed to fetch request details: No data received.");

      const fetchedRequestData = requestDetailsResponse.data;
      setRequestData(fetchedRequestData);

      const fileApiResponse = await downloadOriginalFileAdmin(translationRequestId);
      if (isApiError(fileApiResponse)) {
        console.error("AdminTranslateRequestDetailPage: fetchData - Error loading file preview (admin):", fileApiResponse.error);
        setError(`Failed to load file preview (admin): ${fileApiResponse.error}`);
        setFileData({ fileName: fetchedRequestData.originalFileName, fileData: null });
      } else if (fileApiResponse.data && fetchedRequestData.originalFileName) {
        setFileData({ fileName: fetchedRequestData.originalFileName, fileData: fileApiResponse.data });
      } else {
        console.error("AdminTranslateRequestDetailPage: fetchData - Failed to load file preview (admin): No file data or original file name missing.");
        setError("Failed to load file preview (admin): No file data received or original file name missing.");
        setFileData({ fileName: fetchedRequestData.originalFileName || "Unknown File", fileData: null });
      }
    } catch (err: any) {
      console.error("AdminTranslateRequestDetailPage: fetchData - Error during fetch:", err);
      setError(err.message || "An unknown error occurred.");
    } finally {
      setIsLoading(false);
    }
  }, [translationRequestId]);

  useEffect(() => {
    // Fetch data only if userRole is 'admin' and session is authenticated
    if (userRole === 'admin' && sessionStatus === 'authenticated') {
      fetchData();
    } else {
    }
  }, [userRole, sessionStatus, fetchData]);

  if (sessionStatus === 'loading' || isLoading || (sessionStatus === 'authenticated' && !userRole && !error)) {
    // Show loading skeleton if session is loading, data is loading,
    // or if session is authenticated but userRole is not yet set (and no error has occurred)
    return (
      <div className="space-y-4 p-4">
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
          <Skeleton className="h-[400px] w-full" />
          <div className="space-y-4">
            <Skeleton className="h-6 w-1/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-10 w-32 mt-4" />
          </div>
        </div>
      </div>
    );
  }

  if (error && !isLoading) { // Display error if an error occurred and not actively loading
    return (
      <div className="container mx-auto p-4">
        <Alert variant="destructive">
          <Terminal className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  // Render content if data is available, user is admin, and session is authenticated
  if (requestData && fileData && userRole === 'admin' && sessionStatus === 'authenticated') {
    return (
      <div className="container mx-auto p-4">
        {/* Display file preview error specifically if fileData is null but an error related to it exists */}
        {error && fileData.fileData === null && (
          <Alert variant="destructive" className="mb-4">
            <Terminal className="h-4 w-4" />
            <AlertTitle>File Preview Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <TranslateRequestSection
          requestData={requestData}
          fileData={fileData}
          translateRequestId={translationRequestId}
          userRole={userRole} // Will be 'admin'
          onError={setError}
          onRequestUpdate={fetchData}
        />
      </div>
    );
  }

  // Fallback message if none of the above conditions are met (e.g., unexpected state)
  // This also covers the case where userRole is not 'admin' but no specific error was set to redirect.
  if (!isLoading && sessionStatus === 'authenticated' && userRole !== 'admin' && !error) {
    return (
      <div className="container mx-auto p-4">
        <Alert variant="destructive">
          <Terminal className="h-4 w-4" />
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>You do not have the necessary permissions to view this page.</AlertDescription>
        </Alert>
      </div>
    );
  }

  return <div className="container mx-auto p-4">Unable to display translation request details. Please try again or contact support if the issue persists.</div>;
}