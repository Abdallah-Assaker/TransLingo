import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css"; // Your global styles
import { ToastContainer } from 'react-toastify'; // Import Container
import 'react-toastify/dist/ReactToastify.css'; // Import CSS
import NavBar from "@/components/shared/navbar/navbar"; // Import the NavBar component
import { getSessionOrThrow, Session } from "@/lib/api/requests";
import { redirect } from "next/navigation";
// Import SessionProvider
import { SessionProvider } from "next-auth/react"; // Adjust the import path if necessary
import CilentSessionProvider from "@/provider/ClientSessionProvider"; // Adjust the import path if necessary

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "Translator App",
    description: "Translate your text files easily.",
};

export default async function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {

    return (
        <html lang="en">
            <body className={`${inter.className}`}>
                <CilentSessionProvider>
                    {/* <NavBar /> */}
                    {children}

                    <ToastContainer
                        position="bottom-right"
                        autoClose={5000}
                        hideProgressBar={false}
                        newestOnTop={false}
                        closeOnClick
                        rtl={false}
                        pauseOnFocusLoss
                        draggable
                        pauseOnHover
                        theme="light"
                    />
                </CilentSessionProvider>
            </body>
        </html>
    );
}
