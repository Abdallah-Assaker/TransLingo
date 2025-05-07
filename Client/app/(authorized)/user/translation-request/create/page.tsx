import TranslationRequestForm from "@/components/authorized/user/translation-request-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * Page component for creating a new translation request.
 * Renders the TranslationRequestForm within a styled card.
 */
export default function CreateTranslateRequestPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <Card className="max-w-4xl mx-auto shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold text-gray-800">
            Create New Translation Request
          </CardTitle>
          <CardDescription>
            Fill out the form below to submit a document for translation. Please provide all required details and upload your file.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Render the form component */}
          <TranslationRequestForm />
        </CardContent>
      </Card>
    </div>
  );
}
