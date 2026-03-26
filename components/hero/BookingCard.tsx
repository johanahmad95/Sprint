'use client';

import { useState } from 'react';
import { MapPin, Calendar, Clock, Users, Gamepad2 } from 'lucide-react';
import { Button3D } from '@/components/ui';
import { Select3D, Input3D } from '@/components/ui/Input3D';
import { AREA_INFO, SPORT_INFO, KlangValleyArea, SportType } from '@/lib/types';

const BookingCard = () => {
  const [formData, setFormData] = useState({
    location: '',
    sport: '',
    date: '',
    time: '',
    duration: '1',
    players: '2',
  });

  const locationOptions = [
    { value: '', label: 'Select your preferred location' },
    ...Object.entries(AREA_INFO).map(([key, value]) => ({
      value: key,
      label: value.label,
    })),
  ];

  // Priority: Pickleball and Padel first
  const sportOptions = [
    { value: '', label: 'Court type (e.g., Padel, Tennis)' },
    { value: 'pickleball', label: 'Pickleball' },
    { value: 'padel', label: 'Padel' },
    { value: 'tennis', label: 'Tennis' },
    { value: 'badminton', label: 'Badminton' },
    { value: 'futsal', label: 'Futsal' },
    { value: 'basketball', label: 'Basketball' },
    { value: 'squash', label: 'Squash' },
  ];

  const durationOptions = [
    { value: '1', label: '1 hour' },
    { value: '2', label: '2 hours' },
    { value: '3', label: '3 hours' },
    { value: '4', label: '4 hours' },
  ];

  const playerOptions = [
    { value: '1', label: '1 player' },
    { value: '2', label: '2 players' },
    { value: '3', label: '3 players' },
    { value: '4', label: '4 players' },
    { value: '5', label: '5 players' },
    { value: '6', label: '6+ players' },
  ];

  const timeOptions = [
    { value: '', label: 'Choose time' },
    { value: '06:00', label: '6:00 AM' },
    { value: '07:00', label: '7:00 AM' },
    { value: '08:00', label: '8:00 AM' },
    { value: '09:00', label: '9:00 AM' },
    { value: '10:00', label: '10:00 AM' },
    { value: '11:00', label: '11:00 AM' },
    { value: '12:00', label: '12:00 PM' },
    { value: '13:00', label: '1:00 PM' },
    { value: '14:00', label: '2:00 PM' },
    { value: '15:00', label: '3:00 PM' },
    { value: '16:00', label: '4:00 PM' },
    { value: '17:00', label: '5:00 PM' },
    { value: '18:00', label: '6:00 PM' },
    { value: '19:00', label: '7:00 PM' },
    { value: '20:00', label: '8:00 PM' },
    { value: '21:00', label: '9:00 PM' },
    { value: '22:00', label: '10:00 PM' },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Navigate to venues page with filters
    const params = new URLSearchParams();
    if (formData.location) params.set('area', formData.location);
    if (formData.sport) params.set('sport', formData.sport);
    if (formData.date) params.set('date', formData.date);
    window.location.href = `/venues?${params.toString()}`;
  };

  return (
    <div className="glass-card p-6 lg:p-8 w-full max-w-md animate-slide-up">
      {/* Header */}
      <div className="mb-6">
        <p className="text-gray-500 text-sm mb-1">
          Discover and book top-quality courts effortlessly
        </p>
        <h2 className="text-xl font-bold text-gray-800">
          Find Your Perfect Court
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Location */}
        <Select3D
          label="Location"
          icon={<MapPin className="w-5 h-5" />}
          options={locationOptions}
          value={formData.location}
          onChange={(e) => setFormData({ ...formData, location: e.target.value })}
        />

        {/* Court Type */}
        <Select3D
          label="Court Type"
          icon={<Gamepad2 className="w-5 h-5" />}
          options={sportOptions}
          value={formData.sport}
          onChange={(e) => setFormData({ ...formData, sport: e.target.value })}
        />

        {/* Date & Time Row */}
        <div className="grid grid-cols-2 gap-3">
          <Input3D
            label="Date"
            type="date"
            icon={<Calendar className="w-5 h-5" />}
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            min={new Date().toISOString().split('T')[0]}
          />
          <Select3D
            label="Time"
            icon={<Clock className="w-5 h-5" />}
            options={timeOptions}
            value={formData.time}
            onChange={(e) => setFormData({ ...formData, time: e.target.value })}
          />
        </div>

        {/* Duration & Players Row */}
        <div className="grid grid-cols-2 gap-3">
          <Select3D
            label="Duration"
            options={durationOptions}
            value={formData.duration}
            onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
          />
          <Select3D
            label="Players"
            icon={<Users className="w-5 h-5" />}
            options={playerOptions}
            value={formData.players}
            onChange={(e) => setFormData({ ...formData, players: e.target.value })}
          />
        </div>

        {/* Submit Button */}
        <Button3D type="submit" variant="primary" size="lg" fullWidth>
          Book Court Now
        </Button3D>
      </form>
    </div>
  );
};

export default BookingCard;
