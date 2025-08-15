
import React, { ReactNode, useRef } from 'react';
import { Star, ExternalLink, Bed, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

// This is a styled div for the "View Deal" button to avoid invalid HTML (nesting a button in a link)
interface ButtonLookalikeProps {
  className?: string;
  children?: ReactNode;
}

const ButtonLookalike: React.FC<ButtonLookalikeProps> = ({ className = '', children }) => (
  <div className={`inline-flex items-center justify-center px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium text-white transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-900 ${className}`}>
    {children}
  </div>
);

// Interface for a single hotel's data.
interface Hotel {
  demandStayListing: {
    description: {
      name: {
        localizedStringWithTranslationPreference: string;
      };
    };
    location: {
      coordinate: {
        latitude: number;
        longitude: number;
      };
    };
  };
  avgRatingA11yLabel?: string | null;
  structuredDisplayPrice: {
    primaryLine: {
      accessibilityLabel: string;
    };
  };
  url: string; // This is the listingUrl from the backend
}

interface HotelCardProps {
  hotel: Hotel;
}

/**
 * A compact, minimalist, data-only card for displaying hotel details, styled for a dark theme.
 * The layout is consistent even with missing data.
 */
const HotelCard: React.FC<HotelCardProps> = ({ hotel }) => {
  // --- Data Extraction and Cleanup ---
  const name = hotel.demandStayListing?.description?.name?.localizedStringWithTranslationPreference || 'Unnamed Hotel';
  const priceLabel = hotel.structuredDisplayPrice?.primaryLine?.accessibilityLabel || 'Price not available';
  const ratingLabel = hotel.avgRatingA11yLabel;
  
  const ratingMatch = ratingLabel?.match(/(\d+\.\d+|\d+)/);
  const ratingNumber = ratingMatch ? parseFloat(ratingMatch[0]) : null;
  
  // Extract price and number of nights
  let price = priceLabel;
  let numberOfNights: string | null = null;

  const nightsMatch = priceLabel.match(/for (\d+)\s*nights?/i);
  if (nightsMatch && nightsMatch[1]) {
    numberOfNights = nightsMatch[1];
    price = priceLabel.replace(/for \d+\s*nights?/i, '').replace(' total', '').trim();
  } else {
    price = priceLabel.replace(' total', '').trim();
  }

  return (
    <a 
      href={hotel.url} 
      target="_blank" 
      rel="noopener noreferrer" 
      // Mobile-first responsive design with proper breakpoints
      className="block flex-shrink-0 w-[280px] xs:w-[300px] sm:w-64 group"
    >
      <Card 
        className="bg-gray-800/50 border-gray-700 shadow-lg hover:shadow-xl transition-all duration-300 ease-in-out relative flex flex-col justify-between p-3 sm:p-5 h-full"
      >
        <div>
          <div className="flex items-start gap-3 sm:gap-4">
            <div className="p-2 sm:p-3 bg-gradient-to-br from-pink-500 to-rose-500 text-white rounded-lg shadow-md flex-shrink-0">
                <Bed className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="flex-1 min-w-0">
                {/* Container to ensure consistent height whether rating exists or not */}
                <div className="h-6 sm:h-7 mb-1">
                  {ratingNumber && (
                      <Badge className="border-yellow-400/50 bg-yellow-900/50 text-yellow-300 flex items-center gap-1 text-xs px-2 py-1">
                          <Star className="w-3 h-3 text-yellow-400 flex-shrink-0" />
                          <span className="font-bold">{ratingNumber.toFixed(1)}</span>
                      </Badge>
                  )}
                </div>
              {/* Responsive text sizing and consistent height */}
              <h3 className="font-bold text-gray-200 text-base sm:text-lg leading-tight min-h-[2.5rem] sm:min-h-[2.5rem] line-clamp-2">{name}</h3>
            </div>
          </div>

          <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-700">
            <p className="text-xs text-gray-400">Starting from</p>
            <p className="text-xl sm:text-2xl font-extrabold text-white line-clamp-1">{price}</p>
            {numberOfNights && (
              <p className="text-xs sm:text-sm text-gray-400 mt-1">{numberOfNights} night{parseInt(numberOfNights) > 1 ? 's' : ''}</p>
            )}
          </div>
        </div>

        <ButtonLookalike className="w-full mt-3 sm:mt-4 bg-gray-700 group-hover:bg-gray-600">
            <span className="truncate">View Deal</span>
            <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4 ml-1 sm:ml-2 flex-shrink-0" />
        </ButtonLookalike>
      </Card>
    </a>
  );
};

/**
 * A container component that displays a list of hotels in a horizontal carousel with a hidden scrollbar.
 */
const HotelCarousel = ({ hotels }: { hotels: Hotel[] }) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  if (!hotels || hotels.length === 0) {
    return null;
  }

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 280; // Adjusted for mobile card width
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
      <h3 className="text-base sm:text-lg font-bold text-white mb-3 ml-1 px-2 sm:px-0">Hotels</h3>
      <div className="relative flex items-center">
        {/* Left Scroll Button */}
        <button
          onClick={() => scroll('left')}
          className="absolute left-1 sm:left-0 z-10 p-1.5 sm:p-2 bg-gray-700 rounded-full shadow-lg text-white hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-900 transition-colors duration-200 hidden md:block"
        >
          <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>

        <div 
          ref={scrollContainerRef}
          className="flex gap-4 sm:gap-6 pb-4 overflow-x-auto no-scrollbar px-2 sm:px-1"
        >
          {hotels.map((hotel, index) => (
            <HotelCard key={index} hotel={hotel} />
          ))}
        </div>

        {/* Right Scroll Button */}
        <button
          onClick={() => scroll('right')}
          className="absolute right-1 sm:right-0 z-10 p-1.5 sm:p-2 bg-gray-700 rounded-full shadow-lg text-white hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-900 transition-colors duration-200 hidden md:block"
        >
          <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
      </div>
    </div>
  );
};

export default HotelCarousel;