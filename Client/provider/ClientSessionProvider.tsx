// filepath: components/providers.tsx
'use client'; // Mark this as a Client Component

import { SessionProvider } from 'next-auth/react';
import React from 'react';

// Define the props type to accept children
interface ProvidersProps {
  children: React.ReactNode;
}

export default function CilentSessionProvider({ children }: ProvidersProps) {
  // Render SessionProvider here, within the Client Component boundary
  return <SessionProvider>{children}</SessionProvider>;
}