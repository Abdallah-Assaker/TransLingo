import React from 'react';
import Link from 'next/link';

/**
 * Component displaying Sign Up and Sign In links styled as buttons.
 */
const AuthRedirects = () => {
  return (
    <div className="flex justify-center items-center "> {/* Center card vertically and horizontally */}
      <div className="p-8 border border-purple-400 rounded-lg shadow-lg flex flex-col space-y-4 bg-white bg-opacity-10 backdrop-filter backdrop-blur-sm"> {/* Card styling with subtle background */}
        <h1 className="text-2xl font-semibold text-center mb-4 text-white">Welcome</h1> {/* Adjusted text color */}
        <Link
          href="/sign-up"
          className="px-4 py-2 text-center bg-purple-500 text-white rounded hover:bg-purple-600 transition duration-200" // Added text-center for link styling
        >
          Sign Up
        </Link>
        <Link
          href="/login"
          className="px-4 py-2 text-center bg-blue-500 text-white rounded hover:bg-blue-600 transition duration-200" // Added text-center for link styling
        >
          Sign In
        </Link>
      </div>
    </div>
  );
};

export default AuthRedirects;
