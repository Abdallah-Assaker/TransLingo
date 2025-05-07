'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Menu, X, type LucideIcon, LayoutDashboard, ListChecks, Settings, FilePlus, UserCircle, ShieldCheck } from 'lucide-react';
import { SignOutButton } from '@/components/unauthorized/sign-out-button';
import { cn } from '@/lib/utils';
// Import the custom/shadcn sidebar components
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton } from '@/components/ui/sidebar'; // Adjust path if needed
import { Button } from '@/components/ui/button'; // Keep for hamburger/close buttons if Sidebar doesn't provide them

// Map string names to actual Lucide icon components
const iconMap: { [key: string]: LucideIcon } = {
  LayoutDashboard,
  ListChecks,
  Settings,
  FilePlus,
  UserCircle,
  ShieldCheck,
};

export interface NavItem {
  href: string;
  label: string;
  icon: keyof typeof iconMap;
}

interface SidebarProps {
  navItems: NavItem[];
  className?: string;
}

/**
 * A responsive sidebar component using custom Sidebar components,
 * with dynamic links and lucide-react icons.
 */
export function AppSidebar({ navItems, className }: SidebarProps) {
  // Assuming the Sidebar component itself doesn't manage the open/close state
  // based on the previous code structure provided. If it does, this state
  // might need to be removed or handled differently based on the Sidebar component's API.
  const [isOpen, setIsOpen] = useState(false);

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  // Get the Icon component from the map based on the string name
  const renderIcon = (iconName: keyof typeof iconMap) => {
    const IconComponent = iconMap[iconName];
    return IconComponent ? (
      <IconComponent className="mr-3 flex-shrink-0 h-5 w-5" aria-hidden="true" /> // Adjusted size
    ) : (
      <span className="mr-3 w-5 h-5 inline-block" /> // Placeholder
    );
  };

  return (
    <>
      {/* Hamburger Menu Button - Mobile Only (Assuming Sidebar component doesn't provide one) */}
      {/* Overlay for Mobile - Closes sidebar on click (Assuming Sidebar component doesn't provide one) */}
      <Sidebar collapsible="icon" >
        {/* <SidebarHeader>
          <Link href="/" className="text-2xl font-bold hover:text-muted-foreground">
            Trans<strong className="text-purple-600">Lingo</strong>
          </Link>
        </SidebarHeader> */}
        <SidebarContent>
          {/* Navigation Links */}
          {/* Allow scrolling */}
          <SidebarMenu>
            {navItems.map((item) => (
              <SidebarMenuButton key={item.href} asChild >
                <Link href={item.href} onClick={() => setIsOpen(false)} /* Close on mobile click */ >
                  {renderIcon(item.icon)}
                  <span>{item.label}</span>
                </Link>
              </SidebarMenuButton>
            ))}
          </SidebarMenu>


          {/* Sign Out Button Area */}
        </SidebarContent>

        <SidebarFooter> {/* Ensure it stays at bottom */}
          <SignOutButton />
        </SidebarFooter>
      </Sidebar>
    </>
  );
}