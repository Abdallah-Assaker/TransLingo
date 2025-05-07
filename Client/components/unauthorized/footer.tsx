import React from 'react';
import Link from 'next/link';

// Destructure className from props
const Footer = ({ className = '' }: { className?: string }) => {
  const currentYear = new Date().getFullYear();

  return (
    // Combine default classes with the passed className prop
    <footer className={`bg-gray-800 text-white p-6 mt-auto ${className}`}> {/* Apply className here */}
      <div className="container mx-auto text-center md:text-left">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* About Section */}
          <div>
            <h5 className="font-bold mb-2 uppercase">Translstor App</h5>
            <p className="text-sm text-gray-400">
              Providing seamless and efficient text file translation services.
            </p>
          </div>

          {/* Quick Links Section */}
          <div>
            <h5 className="font-bold mb-2 uppercase">Quick Links</h5>
            <ul className="list-none mb-0 text-sm">
              <li><Link href="/about" className="text-gray-300 hover:text-white">About Us</Link></li>
              <li><Link href="/services" className="text-gray-300 hover:text-white">Services</Link></li>
              <li><Link href="/contact" className="text-gray-300 hover:text-white">Contact</Link></li>
              <li><Link href="/privacy" className="text-gray-300 hover:text-white">Privacy Policy</Link></li>
            </ul>
          </div>

          {/* Contact Info Section (Dummy) */}
          <div>
            <h5 className="font-bold mb-2 uppercase">Contact</h5>
            <p className="text-sm text-gray-400">
              123 Translation Ave<br />
              Linguist City, LC 12345<br />
              Email: support@translstr.com
            </p>
          </div>
        </div>

        {/* Copyright */}
        <div className="text-center text-gray-500 pt-4 mt-4 border-t border-gray-700 text-xs">
          © {currentYear} Translstor App. All Rights Reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
