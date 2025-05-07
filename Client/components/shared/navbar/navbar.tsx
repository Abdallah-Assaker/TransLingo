"use client"; // Mark as a Client Component

import React, { Fragment, useState, useEffect } from 'react'; // Import Fragment and useState, useEffect
import Link from 'next/link';
import { usePathname } from 'next/navigation'; // Hook to get the current path

const NavBar = () => {
  const pathname = usePathname(); // Get the current path

  // Function to check if a segment looks like an ID (e.g., GUID or long number)
  const isLikelyId = (segment: string): boolean => {
    // Basic check: long alphanumeric string (like GUIDs without dashes) or purely numeric and long
    return (segment.length > 20 && /^[a-zA-Z0-9]+$/.test(segment)) ||
      (segment.length > 10 && /^\d+$/.test(segment)) ||
      // Check for standard GUID format
      /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(segment);
  };

  // Function to generate breadcrumb segments, filtering out IDs
  const generateBreadcrumbs = (path: string) => {
    const segments = path.split('/').filter(segment => segment); // Split and remove empty segments
    const breadcrumbs = [{ name: 'Home', href: '/' }]; // Start with Home

    let currentPath = '';
    segments.forEach(segment => {
      // Skip segments that look like IDs
      if (isLikelyId(segment)) {
        return; // Skip adding this segment to breadcrumbs
      }

      currentPath += `/${segment}`;
      const name = segment
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      breadcrumbs.push({ name, href: currentPath });
    });

    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs(pathname);

  return (
    <nav className="bg-gray-800 text-white p-4 shadow-md sticky top-0 z-50 h-20 flex items-center"> {/* Ensure consistent height */}
      <div className="container mx-auto flex justify-between items-center">
        {/* Brand Logo */}

        <span>
          <Link href="/" className="text-2xl font-bold hover:text-gray-300">
            Trans<strong className="text-purple-400">Lingo</strong>
          </Link>
        </span>
        {/* Desktop Breadcrumbs */}
        <div className="hidden md:flex items-center space-x-2 text-sm"> {/* Hide on small screens */}
          {breadcrumbs.map((crumb, index) => (
            <Fragment key={crumb.href}>
              <Link
                href={crumb.href}
                className={`hover:text-gray-300 ${index === breadcrumbs.length - 1 ? 'text-green-300 font-medium' : 'text-gray-400' // Highlight the last crumb
                  }`}
              >
                {crumb.name}
              </Link>
              {index < breadcrumbs.length - 1 && (
                <span className="text-gray-500">/</span> // Separator
              )}
            </Fragment>
          ))}
        </div>
      </div>

    </nav>
  );
};

export default NavBar;
