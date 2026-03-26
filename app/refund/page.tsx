import { Navbar, Footer } from '@/components/layout';
import Link from 'next/link';

export const metadata = {
  title: 'Refund & Cancellation Policy | Sprint',
  description: 'Sprint Refund and Cancellation Policy - Learn about our booking cancellation and refund terms.',
};

export default function RefundPage() {
  return (
    <main className="min-h-screen bg-cream">
      <Navbar />
      <div className="pt-24 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <Link href="/" className="text-sm text-tomato hover:text-tomato-dark mb-6 inline-block">
            ← Back to Home
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Refund & Cancellation Policy</h1>
          <p className="text-gray-500 text-sm mb-10">Last updated: January 2025</p>

          <article className="max-w-none text-gray-700 space-y-6">
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">1. Cancellation Window</h2>
              <p>
                Cancellations made at least 24 hours before your booking start time are eligible for a full refund. Cancellations made within 24 hours may be subject to a partial or no refund, depending on the venue&apos;s policy.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">2. How to Cancel</h2>
              <p>
                You can cancel your booking through the MyBooking section of your account or by contacting our support team. Ensure you receive a cancellation confirmation.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">3. Refund Process</h2>
              <p>
                Approved refunds are processed within 5–10 business days to your original payment method. Refund timelines may vary depending on your bank or card issuer.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">4. No-Show Policy</h2>
              <p>
                If you do not show up for your booking without prior cancellation, you will not be eligible for a refund.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">5. Contact Us</h2>
              <p>
                For refund or cancellation enquiries, please contact us at support@sprint.my.
              </p>
            </section>
          </article>
        </div>
      </div>
      <Footer />
    </main>
  );
}
