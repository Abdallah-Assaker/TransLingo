'use client'; // Required for useState, useEffect, and event handlers

import React, { useState, useEffect } from 'react';
import {
  TranslationRequestData,
  OriginalFileDownloadResponse,
  TranslatedFileDownloadResponse,
  TranslationStatus,
} from '@/lib/api/interfaces'; // Adjust path as needed
import { Card, CardContent, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'; // Assuming shadcn/ui Card
import { Badge } from '@/components/ui/badge'; // Assuming shadcn/ui Badge
import { Document, Page, pdfjs } from 'react-pdf'; // Import pdfjs
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import { format } from 'date-fns'; // For date formatting
import { RequestButtons } from './request-buttons'; // Import the new component

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

// --- Helper Function ---
function getStatusBadgeVariant(status: TranslationStatus): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case TranslationStatus.Pending:
    case TranslationStatus.Resubmitted:
      return 'secondary';
    case TranslationStatus.Approved:
      return 'outline';
    case TranslationStatus.Completed:
      return 'default'; // Or a success variant if you have one
    case TranslationStatus.Rejected:
      return 'destructive';
    default:
      return 'secondary';
  }
}

function getStatusText(status: TranslationStatus): string {
  return TranslationStatus[status] || 'Unknown';
}

// --- Component Props ---
interface TranslationRequestCardProps {
  /** Data for the translation request */
  requestData: TranslationRequestData;
  /** Data for the file to display (original or translated) */
  fileData: OriginalFileDownloadResponse | TranslatedFileDownloadResponse;
  /** Label for the action button */
  downloadButtonLabel: string;
  /** Function to call when the button is clicked */
  onDownloadButtonClick: () => void;
  /** Indicates if the displayed file is the 'original' or 'translated' */
  fileType: 'original' | 'translated';
  /** Optional label for the redirect button */
  redirectButtonLabel?: string;
  /** Optional function to call when the redirect button is clicked */
  onRedirectClick?: (translateRequestId: string) => void;
  /** Role of the current user */
  userRole: 'admin' | 'user'; // New prop
  /** Optional label for the secondary download button */
  secondaryDownloadButtonLabel?: string;
  /** Optional function to call when the secondary download button is clicked */
  onSecondaryDownloadButtonClick?: () => void;
}

// --- Component ---
export const TranslationRequestCard: React.FC<TranslationRequestCardProps> = ({
  requestData,
  fileData,
  downloadButtonLabel,
  onDownloadButtonClick: onMainDownloadButtonClick, // Renamed for clarity when passing to RequestButtons
  fileType,
  redirectButtonLabel,
  onRedirectClick,
  userRole, // Destructure new prop
  secondaryDownloadButtonLabel, // Destructure new prop
  onSecondaryDownloadButtonClick, // Destructure new prop
}) => {
  const [textContent, setTextContent] = useState<string | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [numPages, setNumPages] = useState<number | null>(null);
  const [isLoadingFile, setIsLoadingFile] = useState<boolean>(true);
  const [fileError, setFileError] = useState<string | null>(null);

  const fileExtension = fileData?.fileName?.split('.').pop()?.toLowerCase();

  useEffect(() => {
    // Reset states when fileData changes
    setIsLoadingFile(true);
    setFileError(null);
    setTextContent(null);
    setFileUrl(null);
    setNumPages(null);
    let objectUrl: string | null = null; // Local variable for cleanup

    // Check if we have valid Blob data
    if (fileData?.fileData && fileData.fileData instanceof Blob) {
      const currentBlob = fileData.fileData; // Get the Blob

      try {
        // Create an Object URL from the Blob
        objectUrl = URL.createObjectURL(currentBlob);
        console.log("Object URL created:", objectUrl, fileExtension); // Debugging
        setFileUrl(objectUrl); // Store the URL in state for react-pdf

        if (!fileExtension) {
          setFileError('Could not determine file extension.');
          setIsLoadingFile(false);
          if (objectUrl) URL.revokeObjectURL(objectUrl); // Clean up URL
          setFileUrl(null);
          return;
        }

        // Handle based on file type
        if (fileExtension === 'txt') {
          const reader = new FileReader();
          reader.onload = (e) => {
            setTextContent(e.target?.result as string);
            setIsLoadingFile(false); // Loading done for txt
          };
          reader.onerror = () => {
            setFileError('Failed to read text file.');
            setIsLoadingFile(false);
          };
          reader.readAsText(currentBlob);
        } else if (fileExtension === 'pdf') {
          // For PDF, react-pdf handles loading via the URL.
          setIsLoadingFile(false) //will be called in onDocumentLoadSuccess/Error.
          // No immediate action needed here, just provide the fileUrl.
        } else {
          setFileError(`Unsupported file type for preview: .${fileExtension}`);
          setIsLoadingFile(false); // Loading done (with error) for unsupported
        }

      } catch (error) {
        console.error("Error processing file blob:", error);
        setFileError('An error occurred while processing the file.');
        setIsLoadingFile(false);
        if (objectUrl) URL.revokeObjectURL(objectUrl); // Clean up URL on error
        setFileUrl(null);
      }
    } else {
      // Handle cases where fileData is missing or invalid
      if (!fileData || !fileData.fileData) {
        setFileError('File content not available for preview.');
      } else {
        // It exists but is not a Blob (shouldn't happen if API is correct)
        setFileError('Invalid file data format received.');
        console.error("Expected Blob, received:", typeof fileData.fileData);
      }
      setIsLoadingFile(false);
    }

    // --- Cleanup Function ---
    // This runs when the component unmounts or before the effect runs again.
    return () => {
      if (objectUrl) {
        console.log("Revoking Object URL:", objectUrl); // Debugging
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [fileData, fileExtension]); // Depend on fileData and calculated extension

  // --- PDF Load Handlers ---
  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setIsLoadingFile(false); // PDF is loaded
    setFileError(null); // Clear any previous error
  };

  const onDocumentLoadError = (error: Error) => {
    console.error('PDF Load Error:', error);
    // Provide more specific messages based on common errors
    let message = `Failed to load PDF: ${error.message}`;
    if (error.message.includes('Missing PDF')) {
      message = 'Error: Missing PDF file or invalid URL.';
    } else if (error.message.includes('Password required')) {
      message = 'Error: PDF is password protected.';
    } else if (error.message.includes('Invalid PDF structure')) {
      message = 'Error: Invalid or corrupted PDF file.';
    }
    setFileError(message);
    setIsLoadingFile(false); // Loading finished (with error)
    setNumPages(null); // Reset page count on error
  };

  return (
    // Add top padding to the Card
    <Card className="w-full shadow-lg pt-6">
      <CardContent className="flex flex-col md:flex-row gap-6">
        {/* Left Side: File Viewer - Adjust width as needed */}
        <div className="md:w-2/5 lg:w-1/2 border rounded-md p-4 bg-muted/40 min-h-[400px] max-h-[70vh] overflow-auto flex flex-col items-center justify-center">
          <h3 className="text-lg font-semibold mb-3 self-start">
            {fileType === 'original' ? 'Original Document' : 'Translated Document'} Preview
          </h3>

          {isLoadingFile && <p>Loading file preview...</p>}

          {!isLoadingFile && fileError && <p className="text-red-600">{fileError}</p>}

          {!isLoadingFile && !fileError && fileUrl && (
            <>
              {fileExtension === 'pdf' && (
                <div className="w-full pdf-container"> {/* Add a class for potential styling */}
                  <Document
                    file={fileUrl} // *** Pass the object URL state here ***
                    onLoadSuccess={onDocumentLoadSuccess}
                    onLoadError={onDocumentLoadError}
                    loading={<p>Loading PDF document...</p>} // Loading specific to Document
                    error={<p className="text-red-600">Error loading PDF structure.</p>} // Error specific to Document
                    className="flex flex-col items-center" // Center pages
                  >
                    {/* Render pages only after numPages is set */}
                    {numPages && Array.from(new Array(numPages), (el, index) => (
                      <Page
                        key={`page_${index + 1}`}
                        pageNumber={index + 1}
                        // Adjust width based on container - let Document handle scaling
                        // width={Math.min(600, window.innerWidth * 0.4)} // Responsive width
                        renderTextLayer={true} // Enable text selection
                        renderAnnotationLayer={true} // Enable links
                        className="mb-2 shadow-sm"
                      />
                    ))}
                  </Document>
                  {numPages && <p className="text-center text-sm mt-2">Total Pages: {numPages}</p>}
                </div>
              )}
              {fileExtension === 'txt' && textContent !== null && (
                <pre className="text-sm whitespace-pre-wrap break-words w-full bg-white p-3 rounded border max-h-[60vh] overflow-auto">
                  {textContent}
                </pre>
              )}
              {/* Message for unsupported types */}
              {fileExtension !== 'pdf' && fileExtension !== 'txt' && (
                <p className="text-muted-foreground">Preview not available for .{fileExtension} files.</p>
              )}
            </>
          )}
          {/* Fallback if file loading finished but no URL/content (e.g., unsupported or initial error) */}
          {!isLoadingFile && !fileError && !fileUrl && !textContent && (
            <p className="text-muted-foreground">No preview available.</p>
          )}
        </div>

        {/* Right Side: Header Info, Details & Actions */}
        <div className="md:w-3/5 lg:w-1/2 space-y-4 flex flex-col">
          {/* Moved Header Content Here */}
          <div className="space-y-2 border-b pb-4 mb-4"> {/* Group header info */}
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="mb-1">{requestData.title}</CardTitle>
                <CardDescription>
                  Request ID: {requestData.id} | Created: {format(new Date(requestData.createdAt), 'PPp')}
                </CardDescription>
              </div>
              <Badge variant={getStatusBadgeVariant(requestData.status)}>
                {getStatusText(requestData.status)}
              </Badge>
            </div>
            <div className="text-sm text-muted-foreground pt-1"> {/* Reduced top padding */}
              {requestData.sourceLanguage} to {requestData.targetLanguage}
            </div>
            {requestData.description && <p className="text-sm mt-2 text-muted-foreground">{requestData.description}</p>}
          </div>

          {/* Existing Details Section */}
          <h3 className="text-lg font-semibold">Request Details</h3>
          <div className="text-sm space-y-2 flex-grow">
            <p>
              <strong>Original File:</strong> {requestData.originalFileName}
            </p>
            {requestData.translatedFileName && (
              <p>
                <strong>Translated File:</strong> {requestData.translatedFileName}
              </p>
            )}
            {requestData.userComment && (
              <div className="mt-2"> {/* Add margin for spacing */}
                <strong>User Comment:</strong>
                <p className="text-muted-foreground pl-2 italic border-l-2 ml-1">{requestData.userComment}</p>
              </div>
            )}
            {requestData.adminComment && (
              <div className="mt-2"> {/* Add margin for spacing */}
                <strong>Admin Comment:</strong>
                <p className="text-muted-foreground pl-2 italic border-l-2 ml-1">{requestData.adminComment}</p>
              </div>
            )}
            {requestData.updatedAt && (
              <p className="mt-2"> {/* Add margin for spacing */}
                <strong>Last Updated:</strong> {format(new Date(requestData.updatedAt), 'PPp')}
              </p>
            )}
            {requestData.completedAt && (
              <p className="mt-2"> {/* Add margin for spacing */}
                <strong>Completed:</strong> {format(new Date(requestData.completedAt), 'PPp')}
              </p>
            )}
          </div>

          {/* Buttons at the bottom - Replaced with RequestButtons component */}
          <RequestButtons
            status={requestData.status}
            requestId={requestData.id}
            userRole={userRole}
            downloadButtonLabel={downloadButtonLabel}
            onDownloadButtonClick={onMainDownloadButtonClick}
            redirectButtonLabel={redirectButtonLabel}
            onRedirectClick={onRedirectClick}
            secondaryDownloadButtonLabel={secondaryDownloadButtonLabel} // Pass new prop
            onSecondaryDownloadButtonClick={onSecondaryDownloadButtonClick} // Pass new prop
          />
        </div>
      </CardContent>
      <CardFooter className="text-xs text-muted-foreground">
        Displaying {fileType} file: {fileData.fileName}
      </CardFooter>
    </Card>
  );
};
