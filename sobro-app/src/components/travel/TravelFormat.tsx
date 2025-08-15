import React from 'react';
import { Calendar, Users, Plane, DollarSign, MessageSquareQuote, PawPrint, ArrowRight } from 'lucide-react';
import { Card } from '@/components/ui/card'; // Assuming you have this component from your library
import { Badge } from '@/components/ui/badge'; // Assuming you have this component from your library

// Props interface for the TravelFormat component
interface TravelFormatProps {
  data: {
    format: {
      travel_date: string;
      start: string;
      to: string;
      location: string;
      preference: string;
      budget: number;
      checkIn: string;
      checkOut: string;
      adults: number;
      children: number;
      infants: number;
      pets: number;
      seat_class: string;
      trip: string;
    };
    task: string;
  };
}

/**
 * A reusable component for displaying a detail item with an icon, label, and value, styled for a dark theme.
 */
const DetailItem = ({ icon: Icon, label, value }: { icon: React.ElementType, label: string, value: string | React.ReactNode }) => (
  <div className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-lg border border-gray-700">
    <Icon className="w-5 h-5 text-gray-400 flex-shrink-0" />
    <div>
      <p className="text-sm font-semibold text-gray-200">{value}</p>
      <p className="text-xs text-gray-400">{label}</p>
    </div>
  </div>
);


/**
 * A sleek and modern card component to display a travel request summary, styled for a dark theme.
 */
const TravelFormat: React.FC<TravelFormatProps> = ({ data }) => {
  // If data is not available, render a placeholder or nothing at all.
  if (!data || !data.format) {
    return (
        <Card className="w-full max-w-3xl mx-auto bg-gray-900 p-6 border-gray-700">
            <p className="text-center text-gray-500">Loading travel details...</p>
        </Card>
    );
  }

  const { format, task } = data;
  
  const formatDate = (dateString: string): string => {
    if (!dateString || dateString.toLowerCase() === 'n/a') return 'Not specified';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid Date';
      return date.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    } catch (e) {
      return 'Invalid Date';
    }
  };

  const totalTravelers = format.adults + format.children + format.infants;
  const travelersBreakdown = [
    format.adults > 0 && `${format.adults} Adults`,
    format.children > 0 && `${format.children} Children`,
    format.infants > 0 && `${format.infants} Infants`,
  ].filter(Boolean).join(', ');

  return (
    <Card className="w-full max-w-3xl mx-auto bg-gray-900 border-gray-700">
      {/* Header Section */}
      <div className="p-5 bg-gray-900/50 border-b border-gray-800">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-0"> {/* Added flex-col and sm:flex-row for responsiveness */}
            <div className='flex items-center gap-3'>
                <div className='p-2 bg-blue-900/50 rounded-full'>
                    <Plane className="w-5 h-5 text-blue-400"/>
                </div>
                <div>
                    <h2 className="text-lg font-bold text-gray-200">Travel Plan Summary</h2>
                    <p className="text-sm text-gray-400">{format.location}</p>
                </div>
            </div>
            <div className="flex items-center gap-2 text-2xl font-bold text-gray-300 mt-3 sm:mt-0"> {/* Added margin-top for mobile spacing */}
              <span>{format.start || 'N/A'}</span>
              <ArrowRight className="w-6 h-6 text-blue-500" />
              <span>{format.to || 'N/A'}</span>
            </div>
        </div>
      </div>
      
      {/* Body Section */}
      <div className="p-6 space-y-6">
        {/* Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           <DetailItem 
             icon={Calendar} 
             label="Check-in & Check-out"
             value={`${formatDate(format.checkIn)} - ${formatDate(format.checkOut)}`}
           />
           <DetailItem 
             icon={Users} 
             label={travelersBreakdown}
             value={`${totalTravelers} Traveler${totalTravelers > 1 ? 's' : ''}`}
           />
           {format.budget > 0 && (
             <DetailItem 
               icon={DollarSign}
               label="Budget"
               value={`₹${format.budget.toLocaleString('en-IN')}`}
             />
           )}
        </div>

        {/* Preferences & Task */}
        <div className="space-y-4">
            <div>
                <h3 className="text-sm font-semibold text-gray-400 mb-2">Preferences</h3>
                <div className="flex flex-wrap gap-2">
                    {format.preference && <Badge variant="secondary" className="bg-gray-700 text-gray-300 border-gray-600">{format.preference}</Badge>}
                    {format.seat_class && <Badge variant="secondary" className="bg-gray-700 text-gray-300 border-gray-600">{format.seat_class}</Badge>}
                    {format.trip && <Badge variant="secondary" className="bg-gray-700 text-gray-300 border-gray-600">{format.trip}</Badge>}
                    {format.pets > 0 && (
                      <Badge variant="secondary" className="bg-gray-700 text-gray-300 border-gray-600 flex items-center gap-1.5">
                        <PawPrint className="w-3 h-3"/> {format.pets} Pet{format.pets > 1 ? 's' : ''}
                      </Badge>
                    )}
                </div>
            </div>
            <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                <div className="flex items-start gap-3">
                    <MessageSquareQuote className="w-4 h-4 mt-1 text-gray-400 flex-shrink-0" />
                    <p className="text-sm text-gray-300 italic">"{task}"</p>
                </div>
            </div>
        </div>
      </div>
    </Card>
  );
};

export default TravelFormat;