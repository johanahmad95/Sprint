import { Navbar, Footer } from '@/components/layout';
import Link from 'next/link';

export const metadata = {
  title: 'Terms of Service | Sprint',
  description: 'Sprint Terms of Service - Legal terms governing the use of our sports court booking platform.',
};

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-cream">
      <Navbar />
      <div className="pt-24 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <Link href="/" className="text-sm text-tomato hover:text-tomato-dark mb-6 inline-block">
            ← Back to Home
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Terms of Service</h1>
          <p className="text-gray-500 text-sm mb-10">Last updated: January 2025</p>

          <article className="max-w-none text-gray-700 space-y-6">
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">1. Acceptance of Terms</h2>
              <p>
                By accessing or using Sprint&apos;s platform, you agree to be bound by these Terms of Service. If you do not agree, please do not use our services.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">2. Use of Service</h2>
              <p>
                Sprint provides a platform for booking sports courts in Klang Valley. You agree to use the service only for lawful purposes and in accordance with these terms. You must provide accurate information when creating an account and making bookings.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">3. Bookings & Payments</h2>
              <p>
                Bookings are subject to availability. Payment is required at the time of booking. Our Refund & Cancellation Policy applies to all bookings—please review it before confirming.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">4. User Responsibilities</h2>
              <p>
                You are responsible for maintaining the confidentiality of your account and for all activities under your account. You must not misuse the platform, harass other users, or damage venue property.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">5. Limitation of Liability</h2>
              <p>
                Sprint acts as an intermediary between users and venues. We are not liable for disputes between users and venues, or for any loss or damage arising from your use of booked facilities.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">6. Changes</h2>
              <p>
                We may update these terms from time to time. Continued use of the service after changes constitutes acceptance of the updated terms.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">7. Contact</h2>
              <p>
                For questions about these Terms of Service, contact us at legal@sprint.my.
              </p>
            </section>
          </article>
        </div>
      </div>
      <Footer />
    </main>
  );
}
