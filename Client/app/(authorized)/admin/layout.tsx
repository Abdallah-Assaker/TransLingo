import React from 'react';
import Navbar from "@/components/shared/navbar/navbar";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
// Import getSessionOrThrow, Session type and redirect
import { getSessionOrThrow, Session } from "@/lib/api/requests"; // Assuming Session type is exported
import { redirect } from "next/navigation";
import { AppSidebar, NavItem } from '@/components/shared/sidebar/app-sidebar';
import { SidebarProvider } from '@/components/ui/sidebar';
import NavBarAuthorized from '@/components/shared/navbar/navbar-authorized';

/**
 * AdminLayout component provides the base structure for admin pages,
 * including the navigation bar and toast notifications.
 * @param children - The page content to be rendered within the layout.
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let session: Session | null = null;

  try {
    // Attempt to fetch session information
    session = await getSessionOrThrow();
  } catch (error) {
    // Log the error and redirect to home/login as session is required
    console.error("Failed to get session in admin layout:", error);
    redirect("/");
  }

  // Check if the logged-in user has the ADMIN role
  const isAdmin = session.user.roles?.includes("Admin");
  if (!isAdmin) {
    // If logged in but not an admin, check if user and redirect there, otherwise to home
    const isUser = session.user.roles?.includes("User");
    if (isUser) {
      redirect("/user/dashboard"); // Redirect non-admins (likely users) to user dashboard
    }
  }

  // Define navigation items specific to the User role using string icon names
  const userNavItems: NavItem[] = [
    { href: "/admin/dashboard", label: "Dashboard", icon: "LayoutDashboard" }, // Use string name
    { href: "/admin/translation-requests", label: "Request Translation", icon: "ListChecks" },    // Use string name
    // { href: "/user/requests/new", label: "New Request", icon: "FilePlus" },   // Use string name
    // { href: "/user/settings", label: "Settings", icon: "Settings" },        // Use string name
  ];


  // If user is logged in and has the ADMIN role, render the layout
  return (
    // <div className="min-h-screen flex flex-col">
    //   <Navbar />

    //   <AppSidebar className="hidden lg:block w-72 border-r" /> {/* Adjust width and classes as needed */}
    //   <main className="flex-grow container mx-auto px-4 py-8">
    //     {children}
    //   </main>
    //   {/* ToastContainer might be better placed in a top-level layout or provider */}
    //   <ToastContainer />
    // </div>
    <div className="flex h-screen border-collapse overflow-hidden">
      <SidebarProvider> {/* Pass session to SidebarProvider */}
        {/* Pass the updated userNavItems array to the Sidebar */}
        <AppSidebar navItems={userNavItems} className="w-72" /> {/* Pass className for base width */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden bg-secondary/10"> {/* Added padding-top */}
          <NavBarAuthorized />
          {/* <SidebarTrigger /> */}
          <section className="flex-1 overflow-y-auto overflow-x-hidden bg-secondary/10 pt-16 lg:pt-6 px-6 pb-6"
          >{children}</section>
        </main>
      </SidebarProvider>
    </div>
  );
}
