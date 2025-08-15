import React from 'react';
import { Globe, ExternalLink } from 'lucide-react';
import { Card } from '@/components/ui/card'; // Assuming you have this component from your library

// --- Data Interfaces ---
interface SearchResult {
  snippet: string;
  title: string;
  link: string; // FIX: Changed from 'url' to 'link' to match your data
}

interface SearchCardProps {
  result: SearchResult;
}

interface SearchResultsListProps {
  // The component expects the 'data' prop to be the object { search: [...] }
  data: {
    search: SearchResult[];
  };
}

/**
 * An individual card for displaying a single web search result, styled for a dark theme.
 */
const SearchCard: React.FC<SearchCardProps> = ({ result }) => {
  const { title, snippet, link } = result;

  // Helper to get a clean domain name from a URL
  const getDomainFromUrl = (urlString: string) => {
    try {
      return new URL(urlString).hostname;
    } catch (e) {
      return '';
    }
  };

  // Construct a URL to fetch the website's favicon
  const faviconUrl = `https://www.google.com/s2/favicons?domain=${getDomainFromUrl(link)}&sz=32`;

  return (
    <a
      href={link}
      target="_blank"
      rel="noopener noreferrer"
      // Adjusted padding for mobile: p-3 on small screens, p-4 on larger
      className="block p-3 sm:p-4 rounded-xl bg-gray-800/50 hover:bg-gray-700/50 border border-gray-700/50 transition-colors duration-200"
    >
      {/* Changed to flex-row and added gap for mobile */}
      <div className="flex flex-row items-start gap-3 sm:gap-4">
        {/* Favicon / Fallback Icon */}
        <img
          src={faviconUrl}
          alt="favicon"
          className="w-7 h-7 sm:w-8 sm:h-8 rounded-full mt-1 flex-shrink-0" // Adjusted size for mobile
          onError={(e) => {
            // Fallback to a generic icon if the favicon fails to load
            e.currentTarget.style.display = 'none';
            const fallback = e.currentTarget.nextSibling as HTMLElement;
            if (fallback) fallback.style.display = 'flex';
          }}
        />
        {/* Fallback Globe Icon - initially hidden, shown if favicon fails */}
        <div style={{display: 'none'}} className="w-7 h-7 sm:w-8 sm:h-8 rounded-full mt-1 flex-shrink-0 bg-gray-700 items-center justify-center">
          <Globe className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400"/> {/* Adjusted size for mobile */}
        </div>

        {/* Text Content */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-indigo-400 line-clamp-1 truncate text-base sm:text-lg">{title}</h3> {/* Adjusted text size for mobile */}
          <p className="text-xs text-gray-400 line-clamp-1 truncate mt-0.5">{getDomainFromUrl(link)}</p> {/* Added slight top margin */}
          <p className="mt-2 text-sm text-gray-300 line-clamp-2">{snippet}</p>
        </div>
        
        {/* External Link Icon */}
        <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500 flex-shrink-0 mt-1" /> {/* Adjusted size for mobile */}
      </div>
    </a>
  );
};

/**
 * A container component that displays a list of search results, styled for a dark theme.
 */
const SearchResultsList: React.FC<SearchResultsListProps> = ({ data }) => {
  // FIX: Access the 'search' array from the data object
  const searchResults = data?.search;

  if (!searchResults || searchResults.length === 0) {
    return (
      <Card className="p-4 bg-gray-900 border-gray-700">
        <p className="text-center text-gray-400">No search results to display.</p>
      </Card>
    );
  }

  return (
    <Card className="p-3 sm:p-4 bg-gray-900 border-gray-700"> {/* Adjusted padding for the main card */}
        <h2 className="text-lg font-bold text-white mb-3 px-1 sm:px-2">Web Search Results</h2> {/* Adjusted margin and padding */}
        <div className="space-y-3">
            {searchResults.map((result, index) => (
                <SearchCard key={index} result={result} />
            ))}
        </div>
    </Card>
  );
};

export default SearchResultsList;