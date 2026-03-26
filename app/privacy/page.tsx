import { Navbar, Footer } from '@/components/layout';
import Link from 'next/link';

export const metadata = {
  title: 'Privacy Policy | Sprint',
  description: 'Sprint Privacy Policy - How we collect, use, and protect your personal information.',
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-cream">
      <Navbar />
      <div className="pt-24 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <Link href="/" className="text-sm text-tomato hover:text-tomato-dark mb-6 inline-block">
            ← Back to Home
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
          <p className="text-gray-500 text-sm mb-10">Last updated: January 2025</p>

          <article className="max-w-none text-gray-700 space-y-6">
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">1. Information We Collect</h2>
              <p>
                We collect information you provide when creating an account, making a booking, or contacting us. This includes your name, email address, phone number, and payment details.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">2. How We Use Your Information</h2>
              <p>
                We use your information to process bookings, send confirmations, improve our services, and communicate with you about your account. We do not sell your personal data to third parties.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">3. Data Security</h2>
              <p>
                We implement industry-standard security measures to protect your personal information. Payment data is processed securely through our payment providers.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">4. Cookies</h2>
              <p>
                We use cookies and similar technologies to improve your experience, remember your preferences, and analyse site traffic. You can manage cookie settings in your browser.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">5. Contact Us</h2>
              <p>
                If you have questions about this Privacy Policy or your personal data, please contact us at privacy@sprint.my.
              </p>
            </section>
          </article>
        </div>
      </div>
      <Footer />
    </main>
  );
}
