import NavBar from "@/components/shared/navbar/navbar";
import NavBarAuthorized from "@/components/shared/navbar/navbar-authorized";
import { AppSidebar, type NavItem } from "@/components/shared/sidebar/app-sidebar"; // Adjust import path and ensure NavItem type is exported
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
// Import getSessionOrThrow, Session type and redirect
import { getSessionOrThrow, Session } from "@/lib/api/requests"; // Assuming Session type is exported
import { redirect } from "next/navigation";
// Remove icon imports here, they are handled in the Sidebar component now

interface UserLayoutProps {
  children: React.ReactNode;
}

// Define navigation items specific to the User role using string icon names
const userNavItems: NavItem[] = [
  { href: "/user/dashboard", label: "Dashboard", icon: "LayoutDashboard" }, // Use string name
  { href: "/user/translation-request", label: "Request Translation", icon: "ListChecks" },    // Use string name
  // { href: "/user/requests/new", label: "New Request", icon: "FilePlus" },   // Use string name
  // { href: "/user/settings", label: "Settings", icon: "Settings" },        // Use string name
];

export default async function UserLayout({ children }: UserLayoutProps) {
  let session: Session | null = null;

  try {
    session = await getSessionOrThrow();
  } catch (error) {
    console.error("Failed to get session:", error);
    redirect("/login");
  }

  if (session?.user) {
    console.log(session, "user layout");
    const isAdmin = session.user.roles?.includes("Admin");

    if (isAdmin) {
      redirect("/admin/dashboard");
    }
  }

  // If user is logged in and has the USER role, render the layout
  return (
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
