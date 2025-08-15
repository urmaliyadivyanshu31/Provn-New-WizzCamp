import React from 'react';
import { Calendar, MapPin, Plane, Hotel, Utensils, Camera, Sun, Star, DollarSign, LucideIcon } from 'lucide-react';
import { Card } from '@/components/ui/card'; // Assuming you have this component from your library

// --- Data Interfaces ---
interface Itinerary {
  day: number;
  activities: string[];
}

interface ItineraryCardProps {
  planData: {
    plan: {
      date: string;
      location: string;
      travel_by: string;
      hotel_stay: string;
      itinerary: Itinerary[];
    };
    messages: {
      content: string;
    };
    budget: number;
    score: number; // Score is expected to be between 0 and 1
  };
}

// --- Helper Functions ---
const getActivityIcon = (activity: string) => {
  const activityLower = activity.toLowerCase();
  if (activityLower.includes('flight') || activityLower.includes('arrive') || activityLower.includes('depart')) return Plane;
  if (activityLower.includes('hotel') || activityLower.includes('check-in')) return Hotel;
  if (activityLower.includes('visit') || activityLower.includes('explore') || activityLower.includes('tour')) return Camera;
  if (activityLower.includes('beach') || activityLower.includes('relax')) return Sun;
  if (activityLower.includes('lunch') || activityLower.includes('dinner') || activityLower.includes('breakfast') || activityLower.includes('food')) return Utensils;
  return MapPin;
};

// A small component for displaying key stats in the header
interface StatItemProps {
  icon: LucideIcon;
  value: string | number;
  label: string;
}

// Update the StatItem component with proper typing
const StatItem: React.FC<StatItemProps> = ({ icon: Icon, value, label }) => (
    <div className="flex items-center gap-2 text-gray-400">
        <Icon className="w-4 h-4" />
        <span className="text-sm">
            <span className="font-semibold text-white">{value}</span>
            <span className="text-gray-400"> {label}</span>
        </span>
    </div>
);



/**
 * A redesigned, modern card for displaying a detailed travel itinerary with a static 3D effect.
 */
const ItineraryCard: React.FC<ItineraryCardProps> = ({ planData }) => {
  if (!planData || !planData.plan) {
    return (
        <Card className="p-6 bg-gray-900/70 border-gray-700/50">
            <p className="text-center text-gray-400">Loading itinerary...</p>
        </Card>
    );
  }
  
  const { plan, budget, score } = planData;

  return (
    <div className="w-full"> {/* Ensure the div takes full width for responsiveness */}
        <Card 
            className="p-4 sm:p-6 bg-gray-900/70 border-gray-700/50 backdrop-blur-xl shadow-2xl" /* Adjusted padding for smaller screens */
            style={{
                boxShadow: '0px 20px 50px rgba(0, 0, 0, 0.3), 0px 5px 15px rgba(0, 0, 0, 0.2)'
            }}
        >
            {/* Header */}
            <div className="mb-4 sm:mb-6 pb-4 sm:pb-6 border-b border-gray-800"> {/* Adjusted margin and padding */}
                <h2 className="text-2xl sm:text-3xl font-bold text-white leading-tight">Your Itinerary: {plan.location}</h2> {/* Adjusted text size */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-3 p-2 sm:p-3 bg-black/20 rounded-xl border border-white/10"> {/* Adjusted gap and padding */}
                    <StatItem icon={Calendar} value={plan.itinerary.length} label="Days" />
                    <StatItem icon={Plane} value={plan.travel_by} label="" />
                    <StatItem icon={DollarSign} value={`₹${budget.toLocaleString()}`} label="Budget" />
                    <StatItem icon={Star} value={`${(score * 10).toFixed(0)}%`} label="Match" /> {/* Used toFixed(0) for whole number percentage */}
                </div>
            </div>

            {/* Daily Itinerary Timeline */}
            <div className="space-y-6 sm:space-y-8"> {/* Adjusted spacing */}
                {plan.itinerary.map((day, dayIndex) => (
                <div key={dayIndex} className="flex gap-4 sm:gap-5"> {/* Adjusted gap */}
                    {/* Timeline Day Marker */}
                    <div className="flex flex-col items-center">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-full flex items-center justify-center font-bold z-10 shadow-lg shadow-indigo-500/30 text-base sm:text-lg"> {/* Adjusted size and font size */}
                        {day.day}
                    </div>
                    {dayIndex < plan.itinerary.length - 1 && (
                        <div className="w-0.5 flex-grow bg-gray-700/50 -mt-1"></div>
                    )}
                    </div>
                    
                    {/* Activities for the Day */}
                    <div className="flex-1 space-y-3 sm:space-y-4 pb-2 sm:pb-4"> {/* Adjusted spacing and padding */}
                        <h3 className="text-lg sm:text-xl font-semibold text-white pt-1 sm:pt-2">Day {day.day}</h3> {/* Adjusted text size and padding */}
                        {day.activities.map((activity, activityIndex) => {
                            const Icon = getActivityIcon(activity);
                            return (
                                <div key={activityIndex} className="flex items-start gap-3 sm:gap-4"> {/* Adjusted gap */}
                                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex-shrink-0 flex items-center justify-center mt-1 bg-gray-800 border border-gray-700"> {/* Adjusted size */}
                                        <Icon className="w-3 h-3 sm:w-4 sm:h-4 text-indigo-400" /> {/* Adjusted icon size */}
                                    </div>
                                    <p className="text-sm sm:text-base text-gray-300 leading-relaxed pt-1 sm:pt-2">{activity}</p> {/* Adjusted text size and padding */}
                                </div>
                            );
                        })}
                    </div>
                </div>
                ))}
            </div>
        </Card>
    </div>
  );
};

export default ItineraryCard;