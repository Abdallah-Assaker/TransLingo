import { SignUpForm } from "@/components/unauthorized/signup-form/sign-up-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function SignUpPage() {
  return (
    <div className="flex items-center justify-center ">
      <Card className="w-full max-w-md bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm">
        <CardHeader className="text-center" >
          <CardTitle className="text-3xl font-bold text-gray-900 dark:text-gray-100">Sign Up</CardTitle>
          <CardDescription>Create a new account.</CardDescription>
        </CardHeader>
        <CardContent>
          <SignUpForm />
        </CardContent>
      </Card>
    </div>
  );
}

