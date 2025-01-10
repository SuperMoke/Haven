import Link from "next/link";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white border-t">
      <div className="max-w-[1920px] mx-auto px-6 lg:px-20">
        <div className="py-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand Column */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-[#fdb040]">HAVEN</h2>
            <p className="text-gray-600 max-w-xs">
              Creating unforgettable events and experiences that bring people
              together.
            </p>
            <div className="flex space-x-4">
              {/* Social Media Icons */}
              {["facebook", "twitter", "instagram", "linkedin"].map(
                (social) => (
                  <a
                    key={social}
                    href={`https://${social}.com`}
                    className="text-gray-600 hover:text-[#fdb040] transition-colors"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <span className="sr-only">{social}</span>
                    <div className="w-6 h-6 border rounded-full flex items-center justify-center hover:border-[#fdb040]">
                      {/* You can replace these with actual social icons */}
                      {social[0].toUpperCase()}
                    </div>
                  </a>
                )
              )}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              {["Services", "Menu", "Venues", "Packages", "Testimonials"].map(
                (item) => (
                  <li key={item}>
                    <a
                      href={`#${item.toLowerCase()}`}
                      className="text-gray-600 hover:text-[#fdb040] transition-colors"
                    >
                      {item}
                    </a>
                  </li>
                )
              )}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="font-semibold mb-4">Contact Us</h3>
            <ul className="space-y-2 text-gray-600">
              <li>Phone: 09943720306</li>
              <li>Email: haven@gmail.com</li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t py-6 text-center text-gray-600">
          <p>© {currentYear} Haven Events. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
