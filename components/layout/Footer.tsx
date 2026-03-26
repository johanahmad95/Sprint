import Link from 'next/link';

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <Link href="/" className="inline-flex items-center gap-2 text-xl font-bold text-white hover:text-gray-200">
              <img src="/sprinto-logo.png?v=3" alt="Sprinto" className="h-8 w-auto object-contain bg-transparent" />
              <span>Sprinto</span>
            </Link>
            <p className="mt-3 text-sm max-w-sm">
              Book premium sports courts across Klang Valley. Pickleball, Padel, Tennis, and more — all in one place.
            </p>
          </div>

          {/* Legal / Undang-Undang */}
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider">
              Legal / Undang-Undang
            </h3>
            <ul className="mt-4 space-y-2">
              <li>
                <Link href="/privacy" className="text-sm hover:text-white transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/refund" className="text-sm hover:text-white transition-colors">
                  Refund Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-sm hover:text-white transition-colors">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider">
              Support
            </h3>
            <ul className="mt-4 space-y-2">
              <li>
                <Link href="/venues" className="text-sm hover:text-white transition-colors">
                  Find Courts
                </Link>
              </li>
              <li>
                <Link href="/refund" className="text-sm hover:text-white transition-colors">
                  Cancellation Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-800">
          <p className="text-sm text-gray-500">
            © {new Date().getFullYear()} Sprint. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
