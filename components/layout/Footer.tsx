'use client';

import Link from 'next/link';
import { 
  Facebook, 
  Instagram, 
  Twitter, 
  Mail, 
  Phone, 
  MapPin 
} from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    company: [
      { label: 'About Us', href: '/about' },
      { label: 'Careers', href: '/careers' },
      { label: 'Blog', href: '/blog' },
      { label: 'Press', href: '/press' },
    ],
    support: [
      { label: 'Help Center', href: '/help' },
      { label: 'Safety', href: '/safety' },
      { label: 'Cancellation Policy', href: '/cancellation' },
      { label: 'Contact Us', href: '/contact' },
    ],
    legal: [
      { label: 'Terms of Service', href: '/terms' },
      { label: 'Privacy Policy', href: '/privacy' },
      { label: 'Cookie Policy', href: '/cookies' },
    ],
    sports: [
      { label: 'Pickleball', href: '/venues?sport=pickleball' },
      { label: 'Padel', href: '/venues?sport=padel' },
      { label: 'Tennis', href: '/venues?sport=tennis' },
      { label: 'Badminton', href: '/venues?sport=badminton' },
      { label: 'Futsal', href: '/venues?sport=futsal' },
    ],
  };

  return (
    <footer className="bg-gray-900 text-white">
      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
          {/* Brand Column */}
          <div className="col-span-2 md:col-span-3 lg:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-tomato to-tomato-dark flex items-center justify-center">
                <span className="text-white font-bold text-xl">S</span>
              </div>
              <span className="text-xl font-bold">Sprint</span>
            </div>
            <p className="text-gray-400 text-sm mb-6 max-w-xs">
              Book sports courts across Klang Valley. The easiest way to find and 
              reserve your perfect court for pickleball, padel, tennis, and more.
            </p>
            
            {/* Contact Info */}
            <div className="space-y-2 text-sm text-gray-400">
              <p className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                hello@sprint.my
              </p>
              <p className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                +60 12-345 6789
              </p>
              <p className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Klang Valley, Malaysia
              </p>
            </div>

            {/* Social Links */}
            <div className="flex gap-3 mt-6">
              <a 
                href="#" 
                className="w-10 h-10 rounded-full bg-gray-800 hover:bg-tomato flex items-center justify-center transition-colors"
              >
                <Facebook className="w-5 h-5" />
              </a>
              <a 
                href="#" 
                className="w-10 h-10 rounded-full bg-gray-800 hover:bg-tomato flex items-center justify-center transition-colors"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a 
                href="#" 
                className="w-10 h-10 rounded-full bg-gray-800 hover:bg-tomato flex items-center justify-center transition-colors"
              >
                <Twitter className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Sports */}
          <div>
            <h4 className="font-semibold mb-4 text-chartreuse">Sports</h4>
            <ul className="space-y-2">
              {footerLinks.sports.map((link) => (
                <li key={link.href}>
                  <Link 
                    href={link.href}
                    className="text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-semibold mb-4 text-chartreuse">Company</h4>
            <ul className="space-y-2">
              {footerLinks.company.map((link) => (
                <li key={link.href}>
                  <Link 
                    href={link.href}
                    className="text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-semibold mb-4 text-chartreuse">Support</h4>
            <ul className="space-y-2">
              {footerLinks.support.map((link) => (
                <li key={link.href}>
                  <Link 
                    href={link.href}
                    className="text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold mb-4 text-chartreuse">Legal</h4>
            <ul className="space-y-2">
              {footerLinks.legal.map((link) => (
                <li key={link.href}>
                  <Link 
                    href={link.href}
                    className="text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-sm text-gray-500">
              &copy; {currentYear} Sprint. All rights reserved.
            </p>
            <p className="text-sm text-gray-500">
              Made with ❤️ in Malaysia
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
