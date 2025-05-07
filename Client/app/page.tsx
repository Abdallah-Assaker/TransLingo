'use client';
import React, { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Footer from '@/components/unauthorized/footer';
import { WelcomeText } from '@/components/unauthorized/welcome-text';
import Image from 'next/image';
import heroBackground from "@/assets/image/hero-background.jpg";
import AuthRedirects from '@/components/unauthorized/auth-redirects';
import NavBar from '@/components/shared/navbar/navbar';

export default function LandingPage() {
    const { data: session, status } = useSession();
    const router = useRouter();

    useEffect(() => {
        if (status === 'authenticated') {
            router.push('/user/dashboard'); // Or your desired authenticated route
        }
    }, [status, router]);

    // Optional: Show loading state or return null while checking session/redirecting
    if (status === 'loading' || status === 'authenticated') {
        return null; // Or a loading spinner component
    }

    return (
        <main className="flex flex-col min-h-screen relative">
            <NavBar className="relative z-10" />
            <Image
                src={heroBackground}
                alt="Abstract background"
                fill
                style={{ objectFit: 'cover' }}
                quality={85}
                priority
                className="fixed inset-0 z-0 filter blur-md brightness-50"
            />

            <div className="relative z-10 flex-grow container mx-auto px-4 py-8 flex flex-col items-center justify-center">
                <div className="flex flex-col md:flex-row items-center justify-between w-full max-w-4xl gap-8">
                    <WelcomeText />
                    <AuthRedirects />
                </div>
            </div>

            <Footer className="relative z-10" />
        </main>
    );
}
