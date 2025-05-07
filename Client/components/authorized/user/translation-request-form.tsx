"use client"
import {
  useState
} from "react"
import { toast } from 'react-toastify';
import {
  useForm
} from "react-hook-form"
import {
  zodResolver
} from "@hookform/resolvers/zod"
import * as z from "zod"
import {
  cn
} from "@/lib/utils"
import {
  Button
} from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Input
} from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select" // Import Select components
import {
  CloudUpload,
  Paperclip
} from "lucide-react"
import {
  FileInput,
  FileUploader,
  FileUploaderContent,
  FileUploaderItem
} from "@/components/ui/file-upload"
import { createTranslationRequest } from "@/lib/api/requests"; // Import the server action
import { Textarea } from "@/components/ui/textarea"; // Import Textarea for Description/Comment
import { redirect, useRouter } from "next/navigation";

// Define allowed file types and size
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_FILE_TYPES = [
  "text/plain", // .txt
  "application/msword", // .doc
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
  "application/pdf", // .pdf
];
const ALLOWED_EXTENSIONS_STRING = ".txt, .doc, .docx, .pdf";

// Define language options for the dropdowns
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

// Update Zod schema for validation, including the file and language check
const formSchema = z.object({
  Title: z.string().min(1, "Title is required."),
  Description: z.string().max(500, "Description cannot exceed 500 characters.").optional(), // Match backend model
  SourceLanguage: z.string().min(1, "Source language is required."), // Keep as string, validation done via refine
  TargetLanguage: z.string().min(1, "Target language is required."), // Keep as string, validation done via refine
  UserComment: z.string().max(500, "Comment cannot exceed 500 characters.").optional(), // Match backend model
  File: z
    .any() // Use z.any() to avoid server-side errors with browser-specific types
    // Refine to check for File instance only on the client-side
    .refine((file): file is File => typeof window !== 'undefined' && file instanceof File, {
      message: "File is required.",
    })
    // Subsequent refinements check file properties
    .refine((file) => file?.size <= MAX_FILE_SIZE, `File size should be less than 10MB.`)
    .refine(
      (file) => file?.type && ALLOWED_FILE_TYPES.includes(file.type),
      `Only ${ALLOWED_EXTENSIONS_STRING} files are allowed.`
    ),
}).refine((data) => data.SourceLanguage !== data.TargetLanguage, { // Add refinement for language check
  message: "Source and Target languages cannot be the same.",
  path: ["TargetLanguage"], // Specify which field the error message should appear under
});


// Infer the type for the form values
type FormValues = z.infer<typeof formSchema>;

export default function TranslationRequestForm() {

  const router = useRouter();
  const [files, setFiles] = useState<File[] | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false); // State for loading indicator

  // Update dropZoneConfig with accepted file types
  const dropZoneConfig = {
    maxFiles: 1,
    maxSize: MAX_FILE_SIZE,
    multiple: false,
    accept: {
      "text/plain": [".txt"],
      "application/msword": [".doc"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
      "application/pdf": [".pdf"],
    },
  };

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { // Set default values if needed
      Title: "",
      Description: "",
      SourceLanguage: "", // Default to empty string or a specific default language value
      TargetLanguage: "", // Default to empty string
      UserComment: "",
      File: undefined, // Default file to undefined
    },
  });

  // Update the file state and trigger validation when the file changes
  const handleFileChange = (newFiles: File[] | null) => {
    setFiles(newFiles);
    console.log(newFiles);
    if (newFiles && newFiles.length > 0) {
      form.setValue("File", newFiles[0], { shouldValidate: true }); // Set and validate the file
    } else {
      // Use null or an empty File object based on how you want to handle clearing,
      // but ensure Zod validation triggers correctly. Setting to undefined might be best.
      form.setValue("File", undefined!, { shouldValidate: true }); // Clear and validate
    }
  };

  // Handle form submission
  async function onSubmit(values: FormValues) {
    setIsSubmitting(true); // Disable button, show loading state

    // Ensure file is present (Zod refinement should handle this, but double-check)
    if (!values.File || !(values.File instanceof File)) {
      toast.error("Please select a valid file to upload.");
      setIsSubmitting(false);
      return;
    }

    // Create FormData
    const formData = new FormData();
    formData.append("Title", values.Title);
    formData.append("SourceLanguage", values.SourceLanguage);
    formData.append("TargetLanguage", values.TargetLanguage);
    formData.append("File", values.File); // File is guaranteed to be a File instance here
    if (values.Description) {
      formData.append("Description", values.Description);
    }
    if (values.UserComment) {
      formData.append("UserComment", values.UserComment);
    }

    // Log the form values before sending (FormData is harder to log directly)
    console.log("Submitting form values (excluding file object):", {
      Title: values.Title,
      Description: values.Description,
      SourceLanguage: values.SourceLanguage,
      TargetLanguage: values.TargetLanguage,
      UserComment: values.UserComment,
      FileName: values.File.name, // Log file name instead of object
      FileSize: values.File.size,
      FileType: values.File.type,
    });


    try {
      // Call the server action
      console.log("Sending request to createTranslationRequest...");
      const result = await createTranslationRequest(formData);

      // Check if the result indicates an error (standardized error response)
      if ('error' in result) {
        console.error("Server Response (Error):", result);
        // Use the error message provided by handleApiError
        toast.error(result.error);
      } else {
        // Handle the successful response
        console.log("Server Response (Success):", result);
        // Access data from the standardized success response
        toast.success(`Request "${result.data.title}" created successfully! Status: ${result.statusText}`);
        form.reset(); // Reset form on success
        setFiles(null); // Clear file input display
        router.push('/')
        router.refresh()
        // Optionally redirect user or update UI
      }

    } catch (error: any) {
      // This catch block handles unexpected errors during the await createTranslationRequest call itself
      // (e.g., network errors, issues within the function before handleApiError is called)
      // It does NOT handle the standardized error object returned by createTranslationRequest when the API call fails gracefully.
      console.error("Unexpected error during form submission:", error);
      toast.error("An unexpected error occurred while submitting the request. Please try again.");
    } finally {
      setIsSubmitting(false); // Re-enable button
    }
  }

  return (
    <Form {...form}>
      {/* Use a more descriptive ID for the form if needed */}
      <form id="translation-request-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 max-w-3xl mx-auto py-10">

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

        {/* File Upload Field */}
        <FormField
          control={form.control}
          name="File" // Name matches the Zod schema key
          render={({ fieldState }) => ( // Use fieldState to access error easily if needed outside FormMessage
            <FormItem>
              <FormLabel>Document to Translate *</FormLabel>
              <FormControl>
                {/* Pass handleFileChange to the component */}
                <FileUploader
                  value={files}
                  onValueChange={handleFileChange} // Use the handler
                  dropzoneOptions={dropZoneConfig}
                  className={cn(
                    "relative bg-background rounded-lg p-2",
                    fieldState.invalid && "border-red-500 border" // Add red border on error
                  )}
                >
                  <FileInput
                    id="fileInput" // Ensure this ID is unique if form is used multiple times
                    className="outline-dashed outline-1 outline-slate-500"
                  >
                    <div className="flex items-center justify-center flex-col pt-3 pb-4 w-full ">
                      <CloudUpload className="h-8 w-8 text-gray-500" />
                      <p className="mb-1 text-sm text-gray-500 dark:text-gray-400">
                        <span className="font-semibold">Click to upload</span> or drag and drop
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {ALLOWED_EXTENSIONS_STRING} (Max 10MB)
                      </p>
                    </div>
                  </FileInput>
                  <FileUploaderContent className="mt-2">
                    {files &&
                      files.map((file, i) => (
                        <FileUploaderItem key={i} index={i} className="py-1 px-2" aria-label={`Uploaded file: ${file.name}`}>
                          <Paperclip className="h-4 w-4 stroke-current" />
                          <span className="text-sm font-medium">{file.name}</span>
                        </FileUploaderItem>
                      ))}
                  </FileUploaderContent>
                </FileUploader>
              </FormControl>
              <FormDescription>Select the document file (.txt, .doc, .docx, .pdf).</FormDescription>
              {/* FormMessage will display Zod validation errors for the File field */}
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
                {/* Use Textarea for potentially longer descriptions */}
                <Textarea
                  placeholder="Provide context about the document, its purpose, or specific terminology."
                  className="resize-y min-h-[80px]" // Allow vertical resizing
                  {...field}
                />
              </FormControl>
              <FormDescription>Brief description or context for the translator (max 500 chars).</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Language Fields */}
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
                      .sort()
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
                      .sort((a, b) => a.label.localeCompare(b.label)) // Sort alphabetically
                      .map((lang) => (
                        <SelectItem key={lang.value} value={lang.value}>
                          {lang.label}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                {/* FormMessage will display errors from Zod, including the refine check */}
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
              <FormLabel>Comments (Optional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Add any specific instructions or notes for the translation."
                  className="resize-y min-h-[80px]"
                  {...field}
                />
              </FormControl>
              <FormDescription>Any additional comments for the admin/translator (max 500 chars).</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Submit Button */}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Submitting..." : "Submit Request"}
        </Button>
      </form>
    </Form>
  )
}