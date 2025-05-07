'use client';

import React, { useState, useEffect } from 'react';
import { TranslationRequestData } from '@/lib/api/interfaces';
import { TranslationRequestTable } from './translation-request-table/translation-request-table';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { AlertCircle, Loader2, Inbox, LucideIcon } from "lucide-react";

interface TranslationRequestSectionProps {
  title: string;
  icon?: LucideIcon;
  requestsLoading: boolean;
  requestsError: string | null;
  requestsData: TranslationRequestData[];
  currentFilterValue: string;
  onFilterChangeDebounced: (filter: string) => void;
  isAdminView?: boolean;
  emptyStateMessage?: string;
  emptyStateSubMessage?: string;
}

export const TranslationRequestSection: React.FC<TranslationRequestSectionProps> = ({
  title,
  icon: Icon,
  requestsLoading,
  requestsError,
  requestsData,
  currentFilterValue,
  onFilterChangeDebounced,
  isAdminView = false,
  emptyStateMessage = "No translation requests found.",
  emptyStateSubMessage,
}) => {
  const [inputValue, setInputValue] = useState(currentFilterValue);

  useEffect(() => {
    setInputValue(currentFilterValue);
  }, [currentFilterValue]);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value;
    setInputValue(newValue);
    onFilterChangeDebounced(newValue);
  };

  return (
    <section className="mt-12 p-6 rounded-lg shadow-md bg-gradient-to-br from-slate-50 to-gray-100 dark:from-slate-800 dark:to-gray-900">
      <div className="flex flex-wrap justify-between items-center mb-4 gap-4">
        <div className="flex items-center">
          {Icon && <Icon className="h-6 w-6 mr-2 text-gray-700 dark:text-gray-300" />}
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">{title}</h2>
        </div>
        <Input
          placeholder="Filter requests by title, file, language..."
          value={inputValue}
          onChange={handleInputChange}
          className="max-w-xs h-10 dark:bg-slate-700 dark:text-gray-200 dark:border-slate-600"
        />
      </div>
      {requestsLoading ? (
        <div className="flex justify-center items-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Loading requests...</span>
        </div>
      ) : requestsError ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error Loading Requests</AlertTitle>
          <AlertDescription>{requestsError}</AlertDescription>
        </Alert>
      ) : requestsData.length > 0 ? (
        <TranslationRequestTable
          data={requestsData}
          globalFilter={currentFilterValue}
          onGlobalFilterChange={onFilterChangeDebounced}
          isAdminView={isAdminView}
        />
      ) : (
        <Card className="text-center py-10 border-dashed bg-transparent dark:bg-slate-800/50">
          <CardContent className="flex flex-col items-center">
            <Inbox className="h-12 w-12 text-gray-400 dark:text-gray-500 mb-3" />
            <p className="text-gray-500 dark:text-gray-400">{emptyStateMessage}</p>
            {emptyStateSubMessage && <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">{emptyStateSubMessage}</p>}
          </CardContent>
        </Card>
      )}
    </section>
  );
};
