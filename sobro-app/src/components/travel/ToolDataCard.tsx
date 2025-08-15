import React, { useState } from 'react';
import { Settings, ChevronDown, Plane, Hotel, Search } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

// --- Data Interfaces ---
interface ToolMessage {
  name: string;
  content: any;
}

interface ToolDataCardProps {
  data: {
    messages: ToolMessage[];
  };
}

// --- Helper Functions ---
const getToolIcon = (toolName: string) => {
  const name = toolName.toLowerCase();
  if (name.includes('search')) return { Icon: Search, color: 'text-blue-400', bg: 'bg-blue-900/50' };
  if (name.includes('flight')) return { Icon: Plane, color: 'text-sky-400', bg: 'bg-sky-900/50' };
  if (name.includes('hotel')) return { Icon: Hotel, color: 'text-emerald-400', bg: 'bg-emerald-900/50' };
  return { Icon: Settings, color: 'text-indigo-400', bg: 'bg-indigo-900/50' };
};

/**
 * A simple JSON syntax highlighter component for displaying tool responses.
 */
interface JsonSyntaxHighlighterProps {
  jsonString: string;
}

/**
 * A simple JSON syntax highlighter component for displaying tool responses.
 */
const JsonSyntaxHighlighter: React.FC<JsonSyntaxHighlighterProps> = ({ jsonString }) => {
    const highlighted = jsonString.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, (match) => {
        let cls = 'text-green-400'; // number
        if (/^"/.test(match)) {
            if (/:$/.test(match)) {
                cls = 'text-cyan-400'; // key
            } else {
                cls = 'text-amber-400'; // string
            }
        } else if (/true|false/.test(match)) {
            cls = 'text-rose-400'; // boolean
        } else if (/null/.test(match)) {
            cls = 'text-gray-500'; // null
        }
        return `<span class="${cls}">${match}</span>`;
    });

    // Adjusted text size for smaller screens
    return <pre className="text-xs sm:text-sm whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: highlighted }} />;
};

interface ToolItemProps {
  message: ToolMessage;
}
/**
 * An individual, collapsible item for the ToolDataCard accordion.
 */
const ToolItem: React.FC<ToolItemProps> = ({ message}) => {
  const [isOpen, setIsOpen] = useState(false);
  const { Icon, color, bg } = getToolIcon(message.name);

  return (
    <div className="border-b border-gray-800 last:border-b-0">
      <button
        // Adjusted padding for mobile: p-3 on small screens, p-4 on larger
        className="w-full flex items-center justify-between p-3 sm:p-4 text-left hover:bg-gray-800/50 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-3 sm:gap-4 min-w-0"> {/* Adjusted gap for mobile */}
          <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${bg}`}> {/* Adjusted icon container size for mobile */}
            <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${color}`} /> {/* Adjusted icon size for mobile */}
          </div>
          <div className="flex-1 text-left">
            <p className="font-semibold text-gray-200 truncate text-sm sm:text-base">{message.name}</p> {/* Adjusted text size for mobile */}
            <p className="text-xs text-gray-400">Tool execution details</p>
          </div>
        </div>
        <ChevronDown
          className={`w-4 h-4 sm:w-5 sm:h-5 text-gray-500 transition-transform duration-300 flex-shrink-0 ml-1 sm:ml-2 ${isOpen ? 'rotate-180' : ''}`} /* Adjusted icon size and margin for mobile */
        />
      </button>
      {isOpen && (
        <div className="px-3 pb-3 sm:px-4 sm:pb-4"> {/* Adjusted padding for mobile */}
          <div className="p-3 bg-black/50 rounded-lg"> {/* Adjusted padding for mobile */}
            <JsonSyntaxHighlighter jsonString={JSON.stringify(message.content, null, 2)} />
          </div>
        </div>
      )}
    </div>
  );
};


/**
 * A redesigned card for displaying tool execution data in a clean accordion interface.
 */
const ToolDataCard: React.FC<ToolDataCardProps> = ({ data }) => {
  if (!data || !data.messages || data.messages.length === 0) {
    return (
      <Card className="p-4 bg-gray-900 border-gray-700">
        <p className="text-center text-gray-400">No tool data available.</p>
      </Card>
    );
  }

  return (
    <Card className="p-0 bg-gray-900 border-gray-700">
      <div className="flex items-center gap-3 p-3 sm:p-4 border-b border-gray-800"> {/* Adjusted padding for mobile */}
        <Settings className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-400" /> {/* Adjusted icon size for mobile */}
        <h3 className="font-bold text-base sm:text-lg text-white">Tool Execution</h3> {/* Adjusted text size for mobile */}
        <Badge className="border-gray-600 bg-gray-800 text-gray-300 text-xs sm:text-sm">{data.messages.length} steps</Badge> {/* Adjusted text size for mobile */}
      </div>
      
      <div className="space-y-0"> {/* No change needed here for mobile responsiveness directly */}
        {data.messages.map((message, index) => (
          <ToolItem key={index} message={message} />
        ))}
      </div>
    </Card>
  );
};

export default ToolDataCard;