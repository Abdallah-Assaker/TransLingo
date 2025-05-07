"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from 'react-toastify';
// Ensure react-toastify CSS is imported, typically in a global layout or here if not.
// import 'react-toastify/dist/ReactToastify.css';

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
import { rejectRequestAdmin, getRequestByIdAdmin } from "@/lib/api/requests";
import { TranslationStatus } from "@/lib/api/interfaces";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

// Define the validation schema using Zod
const rejectFormSchema = z.object({
  comment: z.string().min(1, { message: "Rejection reason is required." }),
});

type RejectFormValues = z.infer<typeof rejectFormSchema>;

interface RejectTranslationRequestPageProps {
  params: {
    translationRequestId: string;
  };
}

export default function RejectTranslationRequestPage({ params }: RejectTranslationRequestPageProps) {
  const { translationRequestId } = params;
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(true);
  const [isActionAllowed, setIsActionAllowed] = useState(false);
  const [statusCheckError, setStatusCheckError] = useState<string | null>(null);

  const form = useForm<RejectFormValues>({
    resolver: zodResolver(rejectFormSchema),
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

  async function onSubmit(data: RejectFormValues) {
    setIsLoading(true);
    const toastId = toast.loading("Rejecting request...");

    const payload = { comment: data.comment };

    try {
      const result = await rejectRequestAdmin(translationRequestId, payload);

      if (result && "data" in result && result.data) {
        toast.update(toastId, { render: "Translation request rejected successfully!", type: "success", isLoading: false, autoClose: 5000 });
        router.push(`/admin/dashboard/request-details/${translationRequestId}`);
      } else {
        const errorMessage = result?.error || "Failed to reject translation request.";
        toast.update(toastId, { render: errorMessage, type: "error", isLoading: false, autoClose: 5000 });
      }
    } catch (error) {
      console.error("Rejection error:", error);
      toast.update(toastId, { render: "An unexpected error occurred.", type: "error", isLoading: false, autoClose: 5000 });
    } finally {
      setIsLoading(false);
    }
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
        <Card className="max-w-2xl mx-auto" style={{ background: 'linear-gradient(to right, #ffebee, #ffcdd2)' }}>
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
    <section className="container mx-auto p-4">
      <Card
        className="max-w-2xl mx-auto"
        style={{ background: 'linear-gradient(to right, #e0e0e0, #a684ff)' }}
      >
        <CardHeader>
          <CardTitle>Reject Translation Request</CardTitle>
          <CardDescription>
            Provide a reason for rejecting this translation request. This comment will be visible to the user.
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
                    <FormLabel>Rejection Reason</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Explain why the request is being rejected..."
                        className="resize-none"
                        {...field}
                        rows={4}
                      />
                    </FormControl>
                    <FormDescription>
                      This comment is mandatory and will help the user understand the rejection.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" variant="destructive" disabled={isLoading}>
                {isLoading ? "Rejecting..." : "Reject Request"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </section>
  );
}
