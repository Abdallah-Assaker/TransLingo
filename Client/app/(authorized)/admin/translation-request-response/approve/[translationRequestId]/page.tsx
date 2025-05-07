"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from 'react-toastify';

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { approveRequestAdmin, getRequestByIdAdmin } from "@/lib/api/requests";
import { TranslationStatus } from "@/lib/api/interfaces";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

// Define the validation schema using Zod
const approveFormSchema = z.object({
  comment: z.string().optional(),
});

type ApproveFormValues = z.infer<typeof approveFormSchema>;

interface ApproveTranslationRequestPageProps {
  params: {
    translationRequestId: string;
  };
}

export default function ApproveTranslationRequestPage({ params }: ApproveTranslationRequestPageProps) {
  const { translationRequestId } = params;
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(true);
  const [isActionAllowed, setIsActionAllowed] = useState(false);
  const [statusCheckError, setStatusCheckError] = useState<string | null>(null);

  const form = useForm<ApproveFormValues>({
    resolver: zodResolver(approveFormSchema),
    defaultValues: {
      comment: "",
    },
  });

  useEffect(() => {
    const checkRequestStatus = async () => {
      setIsCheckingStatus(true);
      setStatusCheckError(null);
      try {
        const result = await getRequestByIdAdmin(translationRequestId);
        if (result && "data" in result && result.data) {
          if (result.data.status === TranslationStatus.Pending) {
            setIsActionAllowed(true);
          } else {
            setStatusCheckError("The request was already Approved/Rejected or is not in a 'Pending' state.");
            setIsActionAllowed(false);
          }
        } else {
          setStatusCheckError(result?.error || "Failed to fetch request details.");
          setIsActionAllowed(false);
        }
      } catch (error) {
        console.error("Error fetching request status:", error);
        setStatusCheckError("An unexpected error occurred while fetching request details.");
        setIsActionAllowed(false);
      } finally {
        setIsCheckingStatus(false);
      }
    };

    if (translationRequestId) {
      checkRequestStatus();
    }
  }, [translationRequestId]);

  async function onSubmit(data: ApproveFormValues) {
    setIsLoading(true);
    toast.loading("Approving request...");

    const payload = data.comment ? { comment: data.comment } : undefined;

    const result = await approveRequestAdmin(translationRequestId, payload);

    toast.dismiss(); // Dismiss loading toast

    if (result && "data" in result && result.data) {
      toast.success("Translation request approved successfully!");
      // Optionally, redirect the admin to another page, e.g., the admin dashboard or request details
      router.push(`/admin/dashboard/`); // Example redirect
    } else {
      const errorMessage = result?.error || "Failed to approve translation request.";
      toast.error(errorMessage);
    }
    setIsLoading(false);
  }

  if (isCheckingStatus) {
    return (
      <section className="container mx-auto p-4">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Loading Request Details...</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Please wait while we check the status of the request.</p>
          </CardContent>
        </Card>
      </section>
    );
  }

  if (statusCheckError) {
    return (
      <section className="container mx-auto p-4">
        <Card className="max-w-2xl mx-auto" style={{ background: 'linear-gradient(to right, #ffebee, #a684ff)' }}>
          <CardHeader>
            <CardTitle>Action Not Allowed</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{statusCheckError}</p>
            <Button onClick={() => router.back()} className="mt-4">Go Back</Button>
          </CardContent>
        </Card>
      </section>
    );
  }

  if (!isActionAllowed) {
    // This case should ideally be covered by statusCheckError, but as a fallback:
    return (
      <section className="container mx-auto p-4">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Action Not Allowed</CardTitle>
          </CardHeader>
          <CardContent>
            <p>This action cannot be performed on the selected request.</p>
            <Button onClick={() => router.back()} className="mt-4">Go Back</Button>
          </CardContent>
        </Card>
      </section>
    );
  }

  return (
    <section className="container mx-auto p-4"> {/* Changed div to section */}
      <Card
        className="max-w-2xl mx-auto"
      >
        <CardHeader>
          <CardTitle>Approve Translation Request</CardTitle>
          <CardDescription>
            Review and approve the translation request. You can add an optional comment.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <FormField
                control={form.control}
                name="comment"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Optional Comment</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter any comments for the user or internal notes (optional)"
                        className="resize-none"
                        {...field}
                        rows={4}
                      />
                    </FormControl>
                    <FormDescription>
                      This comment will be visible to the user if provided.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Approving..." : "Approve Request"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </section>
  );
}
