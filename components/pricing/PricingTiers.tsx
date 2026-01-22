'use client';

import { useState } from 'react';
import { Check } from 'lucide-react';
import { Button3D, Card3D, Badge3D } from '@/components/ui';
import { PricingTier, formatPrice } from '@/lib/types';

const PRICING_TIERS: PricingTier[] = [
  {
    id: 'basic',
    name: 'Basic Membership',
    price: 49.99,
    yearlyPrice: 479.99,
    description: 'Ideal for casual players',
    features: [
      'Access to all standard courts',
      '5% discount on court bookings',
      'Free cancellation up to 24 hours before booking',
      'Access to member-only events',
      'Complimentary guest passes (2 per month)',
      'Priority booking 24 hours in advance',
    ],
    isRecommended: false,
    ctaText: 'Subscribe Now',
  },
  {
    id: 'premium',
    name: 'Premium Membership',
    price: 99.99,
    yearlyPrice: 959.99,
    description: 'Perfect for regular players',
    features: [
      'All Basic Membership benefits',
      'Access to premium courts',
      '10% discount on court bookings',
      'Free cancellation up to 12 hours before booking',
      'Complimentary guest passes (4 per month)',
      'Early access to new court listings',
      'Free equipment rental (2x per month)',
    ],
    isRecommended: true,
    ctaText: 'Subscribe Now',
  },
  {
    id: 'elite',
    name: 'Elite Membership',
    price: 199.99,
    yearlyPrice: 1919.99,
    description: 'Designed for dedicated players',
    features: [
      'All Premium Membership benefits',
      '15% discount on court bookings',
      'Free cancellation up to 1 hour before booking',
      'Unlimited guest passes',
      'Personal locker rental',
      'Exclusive invites to tournaments',
      'Priority customer support',
      'Free coaching session (1x per month)',
    ],
    isRecommended: false,
    ctaText: 'Subscribe Now',
  },
];

const PricingTiers = () => {
  const [isYearly, setIsYearly] = useState(false);

  return (
    <section id="pricing" className="py-20 bg-apricot-light">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <p className="text-sm font-medium text-tomato mb-2">Membership Pricing</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-4">
            Join Sprint today and enjoy exclusive benefits
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            designed to enhance your sports experience.
          </p>

          {/* Toggle */}
          <div className="flex items-center justify-center gap-4 mt-8">
            <span className={`text-sm font-medium ${!isYearly ? 'text-gray-800' : 'text-gray-400'}`}>
              Monthly
            </span>
            <button
              onClick={() => setIsYearly(!isYearly)}
              className={`
                relative w-14 h-7 rounded-full transition-colors duration-300
                ${isYearly ? 'bg-teal-dark' : 'bg-gray-300'}
              `}
            >
              <div
                className={`
                  absolute top-1 w-5 h-5 bg-white rounded-full shadow-md
                  transition-transform duration-300
                  ${isYearly ? 'translate-x-8' : 'translate-x-1'}
                `}
              />
            </button>
            <span className={`text-sm font-medium ${isYearly ? 'text-gray-800' : 'text-gray-400'}`}>
              Yearly
              <span className="ml-1 text-chartreuse-dark">(Save 20%)</span>
            </span>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-6 lg:gap-8 items-end">
          {PRICING_TIERS.map((tier) => (
            <div
              key={tier.id}
              className={`
                relative transition-all duration-300
                ${tier.isRecommended ? 'md:-mt-8' : ''}
              `}
            >
              {/* Recommended Badge */}
              {tier.isRecommended && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                  <Badge3D variant="glow" color="chartreuse" size="md">
                    Recommendation Plan
                  </Badge3D>
                </div>
              )}

              <Card3D
                variant={tier.isRecommended ? 'glass' : 'clay'}
                hover="lift"
                padding="lg"
                className={`
                  h-full
                  ${tier.isRecommended 
                    ? 'ring-2 ring-chartreuse shadow-[0_0_30px_rgba(214,247,76,0.3)]' 
                    : ''
                  }
                `}
              >
                {/* Header */}
                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold text-gray-800 mb-1">
                    {tier.name}
                  </h3>
                  <p className="text-sm text-gray-500">{tier.description}</p>
                </div>

                {/* Price */}
                <div className="text-center mb-6">
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-4xl font-bold text-gray-800">
                      {formatPrice(isYearly ? tier.yearlyPrice / 12 : tier.price)}
                    </span>
                    <span className="text-gray-500">/month</span>
                  </div>
                  {isYearly && (
                    <p className="text-sm text-gray-400 mt-1">
                      Billed {formatPrice(tier.yearlyPrice)} yearly
                    </p>
                  )}
                </div>

                {/* Features */}
                <ul className="space-y-3 mb-8">
                  {tier.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-5 h-5 rounded-full bg-chartreuse/20 flex items-center justify-center mt-0.5">
                        <Check className="w-3 h-3 text-chartreuse-dark" />
                      </div>
                      <span className="text-sm text-gray-600">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <Button3D
                  variant={tier.isRecommended ? 'primary' : 'outline'}
                  size="lg"
                  fullWidth
                >
                  {tier.ctaText}
                </Button3D>
              </Card3D>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PricingTiers;
