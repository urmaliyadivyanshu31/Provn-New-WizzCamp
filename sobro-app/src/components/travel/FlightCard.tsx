import React, { useRef } from 'react';
import { Plane, Clock, ArrowRight, Star, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

// Interface for a single flight's data
interface Flight {
  is_best: boolean;
  name: string;
  departure: string;
  arrival: string;
  duration: string;
  stops: number;
  price: string;
  delay?: string | null;
}

interface FlightCardProps {
  flight: Flight;
}

/**
 * A compact and modern card for displaying individual flight details, styled for a dark theme.
 */
const FlightCard: React.FC<FlightCardProps> = ({ flight }) => {
  const cardBaseStyle = "relative flex-shrink-0 w-72 sm:w-80 bg-gray-800/50 rounded-2xl border shadow-md hover:shadow-xl transition-all duration-300 ease-in-out";
  const bestFlightStyle = "border-2 border-indigo-500 shadow-indigo-500/20";

  return (
    <Card className={`${cardBaseStyle} ${flight.is_best ? bestFlightStyle : 'border-gray-700'}`}>
      {/* "Best" Badge */}
      {flight.is_best && (
        <div className="absolute -top-3 -right-3 bg-indigo-500 text-white p-2 rounded-full shadow-lg">
          <Star className="w-5 h-5" />
        </div>
      )}

      <div className="p-4 flex flex-col h-full">
        {/* Header: Airline and Price */}
        <div className="flex justify-between items-center pb-3 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-700 rounded-full">
              <Plane className="w-5 h-5 text-gray-300" />
            </div>
            <span className="font-bold text-gray-200">{flight.name}</span>
          </div>
          <div className="text-xl font-extrabold text-indigo-400">{flight.price}</div>
        </div>

        {/* Body: Timings */}
        <div className="flex-grow my-4 flex items-center justify-between">
          <div className="text-center">
            <p className="text-lg font-semibold text-gray-200">{flight.departure}</p>
            <p className="text-xs text-gray-400">Departure</p>
          </div>
          <div className="flex-grow flex items-center justify-center text-gray-600">
             <div className="w-full border-t border-dashed border-gray-600"></div>
             <ArrowRight className="w-5 h-5 text-gray-500 flex-shrink-0 mx-2"/>
          </div>
          <div className="text-center">
            <p className="text-lg font-semibold text-gray-200">{flight.arrival}</p>
            <p className="text-xs text-gray-400">Arrival</p>
          </div>
        </div>

        {/* Footer: Duration and Stops */}
        <div className="flex justify-between items-center pt-3 border-t border-gray-700 text-sm">
          <div className="flex items-center gap-2 text-gray-300">
            <Clock className="w-4 h-4" />
            <span>{flight.duration}</span>
          </div>
          <Badge variant="secondary" className="font-medium bg-gray-700 text-gray-300">
            {flight.stops === 0 ? 'Non-stop' : `${flight.stops} stop${flight.stops > 1 ? 's' : ''}`}
          </Badge>
        </div>
        
        {/* Delay Info */}
        {flight.delay && (
          <div className="mt-3 text-center">
            <Badge variant="destructive" className="bg-red-500/20 text-red-300">Delayed: {flight.delay}</Badge>
          </div>
        )}
      </div>
    </Card>
  );
};

/**
 * A container component that displays a list of flights in a horizontal carousel.
 * The scrollbar is hidden for a cleaner appearance.
 */
const FlightCarousel = ({ flights }: { flights: Flight[] }) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  if (!flights || flights.length === 0) {
    return null;
  }

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 300; // Adjust as needed
      if (direction === 'left') {
        scrollContainerRef.current.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
      } else {
        scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      }
    }
  };

  return (
    <div className="w-full mt-4">
      <style>
        {`
          /* Hide scrollbar for Chrome, Safari and Opera */
          .no-scrollbar::-webkit-scrollbar {
              display: none;
          }

          /* Hide scrollbar for IE, Edge and Firefox */
          .no-scrollbar {
              -ms-overflow-style: none;  /* IE and Edge */
              scrollbar-width: none;  /* Firefox */
          }
        `}
      </style>
      <h3 className="text-lg font-bold text-white mb-3 ml-1">Flights</h3>
      <div className="relative flex items-center">
        {/* Left Scroll Button */}
        <button
          onClick={() => scroll('left')}
          className="absolute left-0 z-10 p-2 bg-gray-700 rounded-full shadow-lg text-white hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-900 transition-colors duration-200 hidden md:block"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        <div
          ref={scrollContainerRef}
          className="flex gap-4 pb-4 overflow-x-auto no-scrollbar px-1" // Added px-1 for padding on smaller screens
        >
          {flights.map((flight, index) => (
            <FlightCard key={index} flight={flight} />
          ))}
        </div>

        {/* Right Scroll Button */}
        <button
          onClick={() => scroll('right')}
          className="absolute right-0 z-10 p-2 bg-gray-700 rounded-full shadow-lg text-white hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-900 transition-colors duration-200 hidden md:block"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
};

export default FlightCarousel;