'use client';

import { Search, UserCheck, CreditCard, Trophy } from 'lucide-react';
import { Card3D } from '@/components/ui';

const STEPS = [
  {
    icon: Search,
    title: 'Find a Court Near You',
    description: 'Start by selecting your preferred location from our extensive list of available courts across Klang Valley.',
  },
  {
    icon: UserCheck,
    title: 'Provide Personal Info',
    description: 'Fill in your personal information including name, email address, and phone number to complete your profile.',
  },
  {
    icon: CreditCard,
    title: 'Confirm and Pay',
    description: 'Choose your preferred payment method and enter the necessary details securely. Single payment, no split bills.',
  },
  {
    icon: Trophy,
    title: 'Enjoy Your Game',
    description: 'Enjoy your game with top-notch facilities. Show up, play, and have a fantastic sports experience!',
  },
];

const HowItWorks = () => {
  return (
    <section id="how-it-works" className="py-20 bg-white">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <p className="text-sm font-medium text-tomato mb-2">How It Works</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-4">
            Easily Book Your Ideal Court
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            in Just a Few Simple and Convenient Steps
          </p>
        </div>

        {/* Steps Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {STEPS.map((step, index) => (
            <Card3D
              key={index}
              variant="clay"
              hover="lift"
              padding="lg"
              className="text-center group"
            >
              {/* Icon Container */}
              <div className="relative inline-flex mb-6">
                {/* 3D Icon background */}
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-white to-gray-50
                  shadow-[6px_6px_12px_rgba(0,0,0,0.08),-4px_-4px_10px_rgba(255,255,255,0.9),inset_1px_1px_2px_rgba(255,255,255,0.8)]
                  flex items-center justify-center
                  group-hover:shadow-[8px_8px_16px_rgba(0,0,0,0.1),-5px_-5px_12px_rgba(255,255,255,0.95)]
                  transition-shadow duration-300"
                >
                  <step.icon className="w-8 h-8 text-teal-dark" strokeWidth={1.5} />
                </div>
                
                {/* Step number */}
                <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-chartreuse 
                  flex items-center justify-center text-sm font-bold text-gray-800
                  shadow-[0_0_10px_rgba(214,247,76,0.5)]"
                >
                  {index + 1}
                </div>
              </div>

              {/* Content */}
              <h3 className="text-lg font-bold text-gray-800 mb-3">
                {step.title}
              </h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                {step.description}
              </p>
            </Card3D>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
