"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { TranslationRequestData, UpdateTranslationRequestPayload } from "@/lib/api/interfaces"; // Import necessary types
import { toast } from 'react-toastify';

// Define language options (reuse or import if defined elsewhere)
const languageOptions = [
  { value: "English", label: "English" },
  { value: "Spanish", label: "Spanish" },
  { value: "French", label: "French" },
  { value: "German", label: "German" },
  { value: "Japanese", label: "Japanese" },
  { value: "Chinese", label: "Chinese" },
  { value: "Arabic", label: "Arabic" },
  // Add more languages as needed
];

// Define Zod schema for validation (similar to create, but without file)
// Include 'id' as it's part of the update payload, though not directly edited in the form.
const formSchema = z.object({
  id: z.string().uuid("Invalid request ID."), // Keep track of the ID
  Title: z.string().min(1, "Title is required."),
  Description: z.string().max(500, "Description cannot exceed 500 characters.").optional(),
  SourceLanguage: z.string().min(1, "Source language is required."),
  TargetLanguage: z.string().min(1, "Target language is required."),
  UserComment: z.string().max(500, "Comment cannot exceed 500 characters.").optional(),
}).refine((data) => data.SourceLanguage !== data.TargetLanguage, {
  message: "Source and Target languages cannot be the same.",
  path: ["TargetLanguage"],
});

// Infer the type for the form values
type FormValues = z.infer<typeof formSchema>;

// Define props for the component
interface UpdateTranslationRequestFormProps {
  /** Initial data for the translation request to populate the form */
  translationRequestData: TranslationRequestData;
  /** Async function to handle the form submission with validated data */
  onSubmit: (data: UpdateTranslationRequestPayload) => Promise<void>;
}

export default function UpdateTranslationRequestForm({
  translationRequestData,
  onSubmit,
}: UpdateTranslationRequestFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      id: translationRequestData.id,
      Title: translationRequestData.title || "",
      Description: translationRequestData.description || "",
      SourceLanguage: translationRequestData.sourceLanguage || "",
      TargetLanguage: translationRequestData.targetLanguage || "",
      UserComment: translationRequestData.userComment || "",
    },
  });

  // Handle form submission
  async function handleFormSubmit(values: FormValues) {
    setIsSubmitting(true);
    console.log("Submitting updated values:", values);

    // Prepare the payload matching UpdateTranslationRequestPayload
    const payload: UpdateTranslationRequestPayload = {
      id: values.id,
      title: values.Title,
      description: values.Description,
      sourceLanguage: values.SourceLanguage,
      targetLanguage: values.TargetLanguage,
      userComment: values.UserComment,
    };

    try {
      await onSubmit(payload); // Call the onSubmit function passed via props
      // Success handling (e.g., toast notification) is expected within the passed onSubmit function
      // or the parent component.
      // toast.success("Request updated successfully!"); // Optionally add success toast here too
      // form.reset(); // Optionally reset form if needed after successful submission
    } catch (error: any) {
      // Error handling (e.g., toast notification) is also expected within the passed onSubmit
      // or the parent component, but we can add a fallback here.
      console.error("Error submitting update form:", error);
      toast.error(error.message || "Failed to update request. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form
        id="update-translation-request-form"
        onSubmit={form.handleSubmit(handleFormSubmit)}
        className="space-y-8 max-w-3xl mx-auto py-10"
      >
        {/* Title Field */}
        <FormField
          control={form.control}
          name="Title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title *</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Marketing Document Q3" {...field} />
              </FormControl>
              <FormDescription>A short, descriptive title for your request.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Description Field */}
        <FormField
          control={form.control}
          name="Description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description (Optional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Provide context about the document, its purpose, or specific terminology."
                  className="resize-y min-h-[80px]"
                  {...field}
                  // Handle potential null value from defaultValues
                  value={field.value ?? ""}
                />
              </FormControl>
              <FormDescription>Brief description or context for the translator (max 500 chars).</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Language Fields - Responsive Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Source Language Select */}
          <FormField
            control={form.control}
            name="SourceLanguage"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Original Language *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select original language" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {languageOptions
                      .sort((a, b) => a.label.localeCompare(b.label))
                      .map((lang) => (
                        <SelectItem key={lang.value} value={lang.value}>
                          {lang.label}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          {/* Target Language Select */}
          <FormField
            control={form.control}
            name="TargetLanguage"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Target Language *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select target language" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {languageOptions
                      .sort((a, b) => a.label.localeCompare(b.label))
                      .map((lang) => (
                        <SelectItem key={lang.value} value={lang.value}>
                          {lang.label}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* User Comment Field */}
        <FormField
          control={form.control}
          name="UserComment"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Your Comments (Optional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Add any specific instructions or notes for the translation."
                  className="resize-y min-h-[80px]"
                  {...field}
                  // Handle potential null value from defaultValues
                  value={field.value ?? ""}
                />
              </FormControl>
              <FormDescription>Update or add comments for the admin/translator (max 500 chars).</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Submit Button */}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Updating..." : "Update Request"}
        </Button>
      </form>
    </Form>
  );
}
