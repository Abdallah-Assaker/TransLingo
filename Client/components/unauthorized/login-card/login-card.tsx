import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoginForm } from "@/components/unauthorized/login-card/login-form/login-form";

export function LoginCard() {
    return (
        <Card className="w-full max-w-md shadow-xl bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm">
            <CardHeader className="text-center" >
                <CardTitle className="text-3xl font-bold text-gray-900 dark:text-gray-100">Login</CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400">
                    Enter your credentials to access your account.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <LoginForm /> {/* Render the LoginForm component */}
            </CardContent>
        </Card>
    );
}

