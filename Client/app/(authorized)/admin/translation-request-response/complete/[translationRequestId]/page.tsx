"use client";

import React, { useState, use, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { completeRequestAdmin, getRequestByIdAdmin } from "@/lib/api/requests";
import { TranslationStatus } from "@/lib/api/interfaces";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_FILE_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
];

// Define the validation schema using Zod
const completeFormSchema = z.object({
  File: z
    .any()
    .refine((files): files is FileList => files instanceof FileList && files.length > 0, "Translated file is required.")
    .refine((files: FileList) => files?.[0]?.size <= MAX_FILE_SIZE, `Max file size is 10MB.`)
    .refine(
      (files: FileList) => ALLOWED_FILE_TYPES.includes(files?.[0]?.type),
      "Unsupported file type. Allowed: PDF, DOC, DOCX, TXT."
    ),
  AdminComment: z.string().optional(),
});

type CompleteFormValues = z.infer<typeof completeFormSchema>;

interface CompleteTranslationRequestPageProps {
  params: Promise<{
    translationRequestId: string;
  }>;
}

export default function CompleteTranslationRequestPage({ params }: CompleteTranslationRequestPageProps) {
  const { translationRequestId } = use(params);
  console.log("CompleteTranslationRequestPage: translationRequestId", translationRequestId);
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(true);
  const [isActionAllowed, setIsActionAllowed] = useState(false);
  const [statusCheckError, setStatusCheckError] = useState<string | null>(null);

  const form = useForm<CompleteFormValues>({
    resolver: zodResolver(completeFormSchema),
    defaultValues: {
      AdminComment: "",
      File: undefined,
    },
  });

  useEffect(() => {
    const checkRequestStatus = async () => {
      if (!translationRequestId) {
        setIsCheckingStatus(false);
        setStatusCheckError("Translation Request ID is missing.");
        setIsActionAllowed(false);
        return;
      }

      setIsCheckingStatus(true);
      setStatusCheckError(null);
      try {
        const result = await getRequestByIdAdmin(translationRequestId);
        if (result && "data" in result && result.data) {
          if (result.data.status === TranslationStatus.Approved) {
            setIsActionAllowed(true);
          } else {
            setStatusCheckError("The request must be in 'Approved' state to be completed. Current status: " + TranslationStatus[result.data.status] + ".");
            setIsActionAllowed(false);
          }
        } else {
          setStatusCheckError(result?.error || "Failed to fetch request details to verify status.");
          setIsActionAllowed(false);
        }
      } catch (error) {
        console.error("Error fetching request status for completion:", error);
        setStatusCheckError("An unexpected error occurred while fetching request details.");
        setIsActionAllowed(false);
      } finally {
        setIsCheckingStatus(false);
      }
    };

    checkRequestStatus();
  }, [translationRequestId]);

  async function onSubmit(data: CompleteFormValues) {
    console.log("onSubmit: data", data);
    setIsLoading(true);
    const toastId = toast.loading("Completing request...");

    const formData = new FormData();
    if (data.File && data.File.length > 0) {
      formData.append("File", data.File[0]);
    }
    if (data.AdminComment) {
      formData.append("AdminComment", data.AdminComment);
    }

    try {
      const result = await completeRequestAdmin(translationRequestId, formData);
      console.log("onSubmit: API result", result);

      if (result && "data" in result && result.data) {
        toast.update(toastId, { render: "Translation request completed successfully!", type: "success", isLoading: false, autoClose: 5000 });
        router.push(`/admin/dashboard`);
      } else {
        const errorMessage = result?.error || "Failed to complete translation request.";
        toast.update(toastId, { render: errorMessage, type: "error", isLoading: false, autoClose: 5000 });
      }
    } catch (error) {
      console.error("Completion error (caught in onSubmit):", error);
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

  if (statusCheckError || !isActionAllowed) {
    return (
      <section className="container mx-auto p-4">
        <Card className="max-w-2xl mx-auto" style={{ background: 'linear-gradient(to right, #ffebee, #ffcdd2)' }}>
          <CardHeader>
            <CardTitle>Action Not Allowed</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{statusCheckError || "This action cannot be performed on the selected request at this time."}</p>
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
      >
        <CardHeader>
          <CardTitle>Complete Translation Request</CardTitle>
          <CardDescription>
            Upload the translated document and add an optional comment. The request must be approved.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <FormField
                control={form.control}
                name="File"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Translated Document</FormLabel>
                    <FormControl>
                      <Input
                        type="file"
                        accept={ALLOWED_FILE_TYPES.join(",")}
                        onChange={(e) => field.onChange(e.target.files)}
                      />
                    </FormControl>
                    <FormDescription>
                      Upload the completed translation (PDF, DOC, DOCX, TXT). Max 10MB.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="AdminComment"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Optional Admin Comment</FormLabel>
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
                {isLoading ? "Completing..." : "Mark as Complete & Upload"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </section>
  );
}
