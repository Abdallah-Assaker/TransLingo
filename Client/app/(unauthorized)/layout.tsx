import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Image from 'next/image';
import 'react-toastify/dist/ReactToastify.css';
import NavBar from "@/components/shared/navbar/navbar";
import Footer from "@/components/unauthorized/footer";
import heroBackground from "@/assets/image/hero-background.jpg";
import { getSessionOrThrow, Session } from "@/lib/api/requests";
import { redirect } from "next/navigation";
import { headers } from 'next/headers';


export default async function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    let session: Session | null = null;

    try {
        session = await getSessionOrThrow();
    } catch (error) {
        console.error("Failed to get session:", error);
    }

    if (session?.user) {
        const isAdmin = session.user.roles?.includes("ROLE_ADMIN");
        const isUser = session.user.roles?.includes("ROLE_USER");

        if (isAdmin) {
            redirect("/admin/dashboard");
        } else if (isUser) {
            redirect("/user/dashboard");
        }
    }

    return (
        <section lang="en">
            <NavBar />
            <Image
                src={heroBackground}
                alt="Abstract background"
                fill
                style={{ objectFit: 'cover' }}
                quality={85}
                priority
                className="fixed inset-0 z-0 filter blur-md brightness-50"
            />
            <div className="relative z-10 flex flex-col min-h-screen">
                {/* <NavBar /> */}
                <main className="flex-grow container mx-auto px-4 py-8 flex items-center justify-center">
                    {children}
                </main>
                <Footer />
            </div>
        </section>
    );
}
