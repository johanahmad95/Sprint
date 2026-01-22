'use client';

import { Card3D } from '@/components/ui';
import { Quote } from 'lucide-react';

const TESTIMONIALS = [
  {
    id: 1,
    quote: "Sprint makes booking a court so easy and convenient. The facilities are top-notch, and I love the flexibility of the membership plans.",
    author: "Jerome Bell",
    role: "Regular Pickleball Player",
    avatar: "JB",
  },
  {
    id: 2,
    quote: "As a frequent player, I appreciate the variety of courts available. The booking process is seamless and customer service is excellent.",
    author: "Theresa Webb",
    role: "Tennis Enthusiast",
    avatar: "TW",
  },
  {
    id: 3,
    quote: "The padel courts at Ace Padel Club are world-class. Sprint helped me discover this amazing venue just 10 minutes from my home!",
    author: "Ahmad Rahman",
    role: "Padel Club Member",
    avatar: "AR",
  },
];

const Testimonials = () => {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-12">
          <p className="text-sm font-medium text-tomato mb-2">What Our Members Say</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-800 max-w-lg">
            See what our satisfied members have to say about their experience with Sprint.
          </h2>
        </div>

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {TESTIMONIALS.map((testimonial) => (
            <Card3D
              key={testimonial.id}
              variant="clay"
              hover="lift"
              padding="lg"
              className="relative"
            >
              {/* Quote Icon */}
              <div className="absolute top-6 right-6">
                <Quote className="w-8 h-8 text-chartreuse opacity-50" />
              </div>

              {/* Quote */}
              <blockquote className="text-gray-600 leading-relaxed mb-6 pr-8">
                &ldquo;{testimonial.quote}&rdquo;
              </blockquote>

              {/* Author */}
              <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                {/* Avatar */}
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-vista-blue to-vista-blue-dark 
                  flex items-center justify-center text-white font-bold shadow-md">
                  {testimonial.avatar}
                </div>
                <div>
                  <p className="font-semibold text-gray-800">{testimonial.author}</p>
                  <p className="text-sm text-gray-500">{testimonial.role}</p>
                </div>
              </div>
            </Card3D>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
