import React from 'react';
import { MessageCircle, HelpCircle } from 'lucide-react';
import { Card } from '@/components/ui/card'; // Assuming you have this component from your library

// --- Data Interfaces ---
interface FollowUpQuestionsProps {
  questions: string[];
  onQuestionClick: (question: string) => void;
}

/**
 * A redesigned component for displaying suggested follow-up questions, styled for a dark theme.
 *
 * @param {string[]} questions - An array of suggested question strings.
 * @param {function} onQuestionClick - A callback function that is triggered when a question is clicked. It receives the question string as an argument.
 */
const FollowUpQuestions: React.FC<FollowUpQuestionsProps> = ({ questions, onQuestionClick }) => {
  if (!questions || questions.length === 0) {
    return null;
  }

  return (
    <Card className="p-4 sm:p-6 bg-gray-900 border-gray-700"> {/* Adjusted card padding for mobile */}
      <div className="flex items-center gap-3 sm:gap-4 mb-4"> {/* Adjusted gap for mobile */}
        <div className="p-2 bg-gradient-to-br from-purple-600 to-indigo-600 text-white rounded-lg shadow-md flex-shrink-0"> {/* Added flex-shrink-0 */}
          <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6" /> {/* Adjusted icon size for mobile */}
        </div>
        <div>
          <h3 className="font-bold text-base sm:text-lg text-white">Continue the conversation...</h3> {/* Adjusted text size for mobile */}
          <p className="text-sm text-gray-400">
            Here are some suggestions:
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 sm:gap-3"> {/* Adjusted gap between buttons for mobile */}
        {questions.map((question, index) => (
          <button
            key={index}
            onClick={() => onQuestionClick(question)}
            // Adjusted padding and text size for mobile
            className="flex items-center gap-2 px-3 py-2 sm:p-3 rounded-full bg-gray-800/50 hover:bg-gray-700/50 border border-gray-700/50 transition-colors duration-200 text-left"
          >
            <HelpCircle className="w-4 h-4 text-indigo-400 flex-shrink-0" />
            <span className="text-sm text-gray-200 leading-tight">{question}</span>
          </button>
        ))}
      </div>
    </Card>
  );
};

export default FollowUpQuestions;