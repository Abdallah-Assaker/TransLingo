'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { getRequestById, downloadOriginalFile } from '@/lib/api/requests';
import { TranslationRequestData, OriginalFileDownloadResponse, TranslationStatus, ApiErrorResponse } from '@/lib/api/interfaces';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal } from "lucide-react";
import { TranslateRequestSection } from '@/components/shared/translation-request/card-section/translation-request-card-section';

// Helper function to check if the response is an error
function isApiError(response: any): response is ApiErrorResponse {
  return response && typeof response.error === 'string';
}

export default function TranslateRequestDetailPage() {
  const params = useParams();
  const router = useRouter();
  const translateRequestId = params.translateRequestId as string;

  const { data: session, status: sessionStatus } = useSession();

  const [requestData, setRequestData] = useState<TranslationRequestData | null>(null);
  const [fileData, setFileData] = useState<OriginalFileDownloadResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<'user' | 'admin' | null>(null);

  useEffect(() => {
    if (sessionStatus === 'loading') {
      return;
    }

    // if (sessionStatus === 'unauthenticated') {
    //   setError("User is not authenticated. Redirecting to login...");
    //   router.push('/auth/login');
    //   return;
    // }

    if (session && session.user && Array.isArray(session.user.roles) && session.user.roles.length > 0) {
      const roleFromServer = session.user.roles[0].toLowerCase();
      if (roleFromServer === 'user' || roleFromServer === 'admin') {
        setUserRole(roleFromServer as 'user' | 'admin');
      } else {
        console.error("Unknown user role received:", session.user.roles[0]);
        setError("Invalid user role. Please contact support.");
      }
    } else {
      console.error("User role not found in session or session is invalid:", session);
      setError("User role not found. Please log in again.");
    }
  }, [session, sessionStatus, router]);

  const fetchData = useCallback(async () => {
    if (!translateRequestId) {
      setError("Request ID is missing.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const requestDetailsResponse = await getRequestById(translateRequestId);
      if (isApiError(requestDetailsResponse)) throw new Error(requestDetailsResponse.error);
      if (!requestDetailsResponse.data) throw new Error("Failed to fetch request details: No data received.");

      const fetchedRequestData = requestDetailsResponse.data;
      setRequestData(fetchedRequestData);

      const fileApiResponse = await downloadOriginalFile(translateRequestId);
      if (isApiError(fileApiResponse)) {
        setError(`Failed to load file preview: ${fileApiResponse.error}`);
        setFileData({ fileName: fetchedRequestData.originalFileName, fileData: null });
      } else if (fileApiResponse.data) {
        setFileData({ fileName: fileApiResponse.data.fileName, fileData: fileApiResponse.data.fileBlob });
      } else {
        setError("Failed to load file preview: No file data received from API.");
        setFileData({ fileName: fetchedRequestData.originalFileName, fileData: null });
      }
    } catch (err: any) {
      console.error("Error fetching translation request details or file:", err);
      setError(err.message || "An unknown error occurred.");
    } finally {
      setIsLoading(false);
    }
  }, [translateRequestId]);

  useEffect(() => {
    if (userRole && sessionStatus === 'authenticated') {
      fetchData();
    }
  }, [userRole, sessionStatus, fetchData]);

  if (sessionStatus === 'loading' || isLoading || (sessionStatus === 'authenticated' && !userRole && !error)) {
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

  if (error && !isLoading) {
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

  if (requestData && fileData && userRole && sessionStatus === 'authenticated') {
    return (
      <div className="container mx-auto p-4">
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
          translateRequestId={translateRequestId}
          userRole={userRole}
          onError={setError}
          onRequestUpdate={fetchData}
        />
      </div>
    );
  }

  return <div className="container mx-auto p-4">Unable to display translation request details. Please try again or contact support if the issue persists.</div>;
}
