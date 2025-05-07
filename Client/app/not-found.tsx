"use client";

import Image from 'next/image';
import Link from 'next/link';

// The prompt mentioned "import a random image from @/assets/image".
// The path below is an example. Please adjust it to your actual image file.
// - If "@/assets/image" refers to a specific file like "assets/image.png" (assuming 'assets' is in your src or root):
//   you might use: import displayImage from '@/assets/image.png';
// - If "@/assets/image" is a directory (e.g., "assets/image/your-file.png"):
//   use: import displayImage from '@/assets/image/your-file.png';
// For this example, a common convention is used:
import notFound from '@/assets/image/Na_Nov_26.jpg';

export default function NotFound() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      textAlign: 'center',
      padding: '20px',
      fontFamily: 'sans-serif',
    }}>
      <h1 style={{ color: '#333', marginBottom: '20px' }}>404 - Page Not Found</h1>
      <div style={{ marginBottom: '30px', borderRadius: '8px', overflow: 'hidden' }}>
        <Image
          src={notFound}
          alt="Illustration indicating a page was not found"
          width={400} // Adjust width as needed
          height={300} // Adjust height as needed
          style={{ filter: 'blur(1px)' }} // Slight blur effect
          priority // Helps with LCP if this image is important
        />
      </div>
      <Link
        href="/"
        style={{
          padding: '10px 20px',
          backgroundColor: '#0070f3',
          color: 'white',
          textDecoration: 'none',
          borderRadius: '5px',
          fontSize: '16px',
        }}
      >
        Back to homepage
      </Link>
    </div>
  );
}
