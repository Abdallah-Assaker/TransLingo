import React from 'react';

export function WelcomeText() {
  return (
    <div className="w-full max-w-md text-left text-gray-100"> {/* Ensure high contrast text color */}
      <h1 className="text-4xl md:text-6xl font-bold mb-4">Welcome to Trans<strong className="text-purple-400">Lingo</strong></h1> {/* Larger title */}
      <p className="text-md md:text-lg"> {/* Slightly larger description text */}
        Your reliable partner for seamless document translation. Upload your files, choose your language, and let us handle the rest. Log in to manage your translation requests.
      </p>
    </div>
  );
}
