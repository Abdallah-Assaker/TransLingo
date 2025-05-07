'use client';

import React, { useState, useEffect } from 'react';
import { UserProfileData } from '@/lib/api/interfaces';
import { UserTable } from './table/user-table'; // Adjusted path
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { AlertCircle, Loader2, Users } from "lucide-react";

interface UserTableSectionProps {
  usersLoading: boolean;
  usersError: string | null;
  allUsersData: UserProfileData[];
  currentFilterValue: string; // Renamed from globalFilter
  onFilterChangeDebounced: (filter: string) => void; // Renamed from setGlobalFilter
}

export const UserTableSection: React.FC<UserTableSectionProps> = ({
  usersLoading,
  usersError,
  allUsersData,
  currentFilterValue,
  onFilterChangeDebounced,
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
          <Users className="h-6 w-6 mr-2 text-gray-700 dark:text-gray-300" />
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">All Users</h2>
        </div>
        <Input
          placeholder="Filter users..."
          value={inputValue} // Use internal input value
          onChange={handleInputChange} // Use new handler
          className="max-w-xs h-10 dark:bg-slate-700 dark:text-gray-200 dark:border-slate-600"
        />
      </div>
      {usersLoading ? (
        <div className="flex justify-center items-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Loading all users...</span>
        </div>
      ) : usersError ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error Loading Users</AlertTitle>
          <AlertDescription>{usersError}</AlertDescription>
        </Alert>
      ) : allUsersData.length > 0 ? (
        <UserTable
          data={allUsersData}
          globalFilter={currentFilterValue} // Pass the debounced filter value to the table
          onGlobalFilterChange={onFilterChangeDebounced} // Table might not need this if parent controls filter fully
        />
      ) : (
        <Card className="text-center py-10 border-dashed bg-transparent dark:bg-slate-800/50">
          <CardContent className="flex flex-col items-center">
            <Users className="h-12 w-12 text-gray-400 dark:text-gray-500 mb-3" />
            <p className="text-gray-500 dark:text-gray-400">No users found in the system.</p>
          </CardContent>
        </Card>
      )}
    </section>
  );
};
