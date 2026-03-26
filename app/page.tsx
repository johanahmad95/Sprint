import { Navbar, Footer } from '@/components/layout';
import { AnimatedHeroBanner, FeaturedCourts, HowItWorks, BookingSearchBar } from '@/components/home';

export default function Home() {
  return (
    <main className="min-h-screen">
      <Navbar />
      {/* Mobile: bottom padding for floating dock, Desktop: no extra padding (navbar handles it) */}
      <div className="pb-32 md:pb-0 px-4 sm:px-6">
        <AnimatedHeroBanner />
        <BookingSearchBar />
        <FeaturedCourts />
        <HowItWorks />
        <Footer />
      </div>
    </main>
  );
}
