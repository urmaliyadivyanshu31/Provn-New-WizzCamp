import React, { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import {
  Send,
  Bot,
  User,
  Wifi,
  WifiOff,
  Zap,
  MessageSquarePlus,
  Coins,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useSearchParams } from "react-router-dom";
import FlightCarousel from "./travel/FlightCard";
import HotelCarousel from "./travel/HotelCard";
import ItineraryCard from "./travel/ItineraryCard";
import TravelFormat from "./travel/TravelFormat";
import FollowUpQuestions from "./travel/FollowUpQuestions";
import SearchResultsList from "./travel/SearchCard";
import ToolDataCard from "./travel/ToolDataCard";

// Removed Reown imports - using Camp Network instead
import Sidebar from "./grants/sidebar";
import Orb from "./ui/Orb";
import { Textarea } from "./ui/textarea";

// Create modal (this part remains unchanged as it's configuration)
let embeddedWalletInfo = {
  user:{
    email:"sobro@gmail.com"
  }
}

interface Message {
  id: string;
  type: "user" | "bot" | "system";
  content: string;
  timestamp: Date;
  data?: any;
}

interface WebSocketMessage {
  type: string;
  payload: any;
}

const TravelChatUI = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [searchParams] = useSearchParams();
  const [inputValue, setInputValue] = useState("");
  const [isConnect, setIsConnected] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [credits, setCredits] = useState<number|null>(null);
  const [currentTypingStage, setCurrentTypingStage] = useState("");
  const [threadId, setThreadId] = useState(() => `thread_${Date.now()}`);
  const [agentMode, setAgentMode] = useState(false);
  const [isFirstQueryResponse, setIsFirstQueryResponse] = useState(true);
  const wsRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);


  const { toast } = useToast();

  // Get the query parameter from URL
  useEffect(() => {
    const queryParam = searchParams.get("query");
    if (queryParam) {
      setInputValue(`${decodeURIComponent(queryParam)}`);
    }
  }, [searchParams, isConnect]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (credits === 0.0) {
      toast({
        title: "Free tier expired",
        description: "Your free tier for this session is expired.We apologize for the inconvenience. Please try again in some time.",
        variant: "destructive",
      });
    }
  }, [credits]);

  useEffect(() => {
    connectWebSocket();
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  const connectWebSocket = () => {
    try {
      wsRef.current = new WebSocket("wss://sobro-production.up.railway.app/ws/sobro");

      wsRef.current.onopen = () => {
        setIsConnected(true);
        toast({
          title: "Connected",
          description: "Successfully connected to travel assistant",
        });
      };

      wsRef.current.onmessage = (event) => {
        const data: WebSocketMessage = JSON.parse(event.data);
        handleWebSocketMessage(data);
        console.log(data);
      };

      wsRef.current.onclose = () => {
        setIsConnected(false);
        setIsTyping(false);
        toast({
          title: "Disconnected",
          description: "Connection to travel assistant lost",
          variant: "destructive",
        });
      };

      wsRef.current.onerror = () => {
        toast({
          title: "Connection Error",
          description: "Failed to connect to travel assistant",
          variant: "destructive",
        });
      };
    } catch (error) {
      console.error("WebSocket connection error:", error);
    }
  };

  const TypingIndicator = ({ message }: { message: string }) => {
    const [dots, setDots] = useState("");

    useEffect(() => {
      const interval = setInterval(() => {
        setDots((prev) => {
          if (prev === "...") return "";
          return prev + ".";
        });
      }, 500);

      return () => clearInterval(interval);
    }, []);

    return (
      <div className="flex items-center gap-2 text-muted-foreground animate-pulse">
        <Bot className="w-4 h-4 text-primary" />
        <span className="text-sm font-medium">
          {message}
          {dots}
        </span>
      </div>
    );
  };

  const getTypingMessage = () => {
    if (agentMode) {
      return "Generating agent response";
    }

    switch (currentTypingStage) {
      case "format":
        return "Generating format";
      case "transport":
        return "Retrieving flights and hotels data";
      case "search":
        return "Searching the web";
      case "plan":
        return "Generating plan";
      case "followup":
        return "Preparing follow-ups";
      default:
        return "Processing";
    }
  };

  const handleWebSocketMessage = (data: WebSocketMessage) => {
    switch (data.type) {
      case "sobro_agent":
        if (data.payload?.messages.content) {
          addMessage("bot", data.payload.messages.content, data.payload);
        }
        break;
      case "user":
        if (data.payload?.content) {
          addMessage("user", data.payload.content, data.payload);
        }
        break;
      case "credits_update":
        setCredits(data.payload.available);
        break;

      case "error":
        toast({
          title: "Free tier expired",
          description:"Free tier of this session is expired.We apologize for the inconvenience caused.Please try again in some time.",
          variant: "destructive",
        });
        break;
      case "tools":
        addMessage("system", "Tool data received", {
          type: "TOOL_DATA",
          data: data.payload,
        });
        break;

      case "search":
        setCurrentTypingStage("plan");
        addMessage("system", "Search results received", {
          type: "SEARCH_RESULTS",
          data: data.payload,
        });
        break;

      case "structured_response":
        setCurrentTypingStage("transport");
        addMessage("system", "", {
          type: "STRUCTURED_RESPONSE",
          data: data.payload,
        });
        break;

      case "transport_details":
        setCurrentTypingStage("search");
        addMessage("system", "", {
          type: "TRANSPORT_DETAILS",
          data: data.payload,
        });
        break;

      case "plan_stage":
        setCurrentTypingStage("followup");
        addMessage("system", "", { type: "PLAN_STAGE", data: data.payload });
        addMessage("bot", data.payload.messages, data.payload);
        break;

      case "follow_up_questions":
        addMessage("system", "", {
          type: "FOLLOW_UP_QUESTIONS",
          data: data.payload,
        });
        break;

      case "complete":
        setIsTyping(false);
        setCurrentTypingStage("");
        // 3. ADD LOGIC TO ACTIVATE AGENT MODE ON FIRST 'COMPLETE'
        // If this 'complete' message is for the first query, activate agent mode.
        if (isFirstQueryResponse && credits!=0.0) {
          setAgentMode(true);
          toast({
            title: "Agent Mode Activated ⚡️",
            description:
              "The agent will now take over for enhanced capabilities.",
          });
          // Ensure this only runs once per chat session.
          setIsFirstQueryResponse(false);
        }
        break;

      default:
        console.log("Unhandled message type:", data.type);
        break;
    }
  };

  const addMessage = (
    type: "user" | "bot" | "system",
    content: string,
    data?: any
  ) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      type,
      content,
      timestamp: new Date(),
      data,
    };
    setMessages((prev) => [...prev, newMessage]);
  };

  const sendMessage = () => {
    if (!inputValue.trim() || !isConnect) return;

    const userMessage = inputValue.trim();
    addMessage("user", userMessage);
    setInputValue("");
    setIsTyping(true);

    if (!agentMode) {
      setCurrentTypingStage("format");
    }

    const messageData = {
      email: embeddedWalletInfo?.user?.email || "",
      message: userMessage,
      agent_mode: agentMode,
      config: {
        configurable: {
          thread_id: threadId,
        },
      },
    };

    wsRef.current?.send(JSON.stringify(messageData));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleNewChat = () => {
    setMessages([]);
    setAgentMode(false); // Reset agent mode for the new chat
    // 4. RESET NEW STATE HERE
    setIsFirstQueryResponse(true);
    const newThreadId = `thread_${Date.now()}`;
    setThreadId(newThreadId);
    toast({
      title: "New Chat Started",
      description: "Previous conversation has been cleared.",
    });
  };
  const handleQuestionSelect = (question: string) => {
    setInputValue(question);
  };

  // renderMessage and renderStructuredData functions remain unchanged...
  const renderMessage = (message: Message): JSX.Element | null => {
    if (message.type === "system" && message.data) {
      return renderStructuredData(message.data);
    }

    switch (message.type) {
      case "user":
        return (
          <div key={message.id} className="flex justify-end px-2 sm:px-0">
            {" "}
            {/* Added horizontal padding for mobile */}
            <div className="flex items-start gap-2 sm:gap-3 max-w-[calc(100%-40px)] sm:max-w-3xl">
              {" "}
              {/* Adjusted max-width and gap */}
              <div className="bg-primary text-primary-foreground p-3 sm:p-4 rounded-xl rounded-tr-sm">
                {" "}
                {/* Adjusted padding and rounded corners */}
                <p className="text-sm sm:text-base">{message.content}</p>{" "}
                {/* Adjusted text size */}
                <p className="text-xs text-primary-foreground/70 mt-1 sm:mt-2">
                  {" "}
                  {/* Adjusted margin-top */}
                  {new Date(message.timestamp).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
              <div className="w-7 h-7 sm:w-8 sm:h-8 bg-muted rounded-full flex items-center justify-center flex-shrink-0">
                {" "}
                {/* Adjusted size */}
                <User className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground" />{" "}
                {/* Adjusted icon size */}
              </div>
            </div>
          </div>
        );

      case "bot":
        return (
          <div key={message.id} className="flex justify-start px-2 sm:px-0">
            {" "}
            {/* Added horizontal padding for mobile */}
            <div className="flex items-start gap-2 sm:gap-3 max-w-[calc(100%-40px)] sm:max-w-4xl w-full">
              {" "}
              {/* Adjusted max-width and gap */}
              <div className="w-7 h-7 sm:w-8 sm:h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                {" "}
                {/* Adjusted size */}
                <Bot className="w-3 h-3 sm:w-4 text-primary" />{" "}
                {/* Adjusted icon size */}
              </div>
              <div className="flex-1">
                <div className="bg-muted/30 border border-border/50 p-3 sm:p-4 rounded-xl rounded-tl-sm">
                  {" "}
                  {/* Adjusted padding and rounded corners */}
                  <div className="text-sm prose prose-sm dark:prose-invert max-w-none [&>*:last-child]:mb-0">
                    <ReactMarkdown>{message.content}</ReactMarkdown>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {" "}
                    {/* Adjusted margin-top */}
                    {new Date(message.timestamp).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                {message.data && renderStructuredData(message.data)}
              </div>
            </div>
          </div>
        );

      case "system":
        return (
          <div key={message.id} className="flex justify-center px-2 sm:px-0">
            {" "}
            {/* Added horizontal padding for mobile */}
            <div className="bg-muted/50 text-muted-foreground p-2 rounded text-xs">
              {message.content}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const renderStructuredData = (messageData: any): JSX.Element | null => {
    const { type, data } = messageData;

    return (
      // Adjusted margin-top and horizontal padding for the structured data section
      <div className="mt-3 sm:mt-4 space-y-4 sm:space-y-6 px-0.5 sm:px-0">
        {type === "STRUCTURED_RESPONSE" && data.format && (
          <div>
            <TravelFormat data={data} />
          </div>
        )}

        {type === "TRANSPORT_DETAILS" && (
          <>
            {data.flights?.length > 0 && (
              <div className="w-[100vw] overflow-hidden">
                <FlightCarousel flights={data.flights} />
              </div>
            )}
            {data.hotels?.length > 0 && (
              <div className="w-[100vw] overflow-hidden">
                <HotelCarousel hotels={data.hotels} />
              </div>
            )}
          </>
        )}

        {type === "SEARCH_RESULTS" && (
          <div>
            <SearchResultsList data={data} />
          </div>
        )}

        {type === "PLAN_STAGE" && (
          <div>
            <ItineraryCard planData={data} />
          </div>
        )}

        {type === "TOOL_DATA" && (
          <div>
            <ToolDataCard data={data} />
          </div>
        )}

        {type === "FOLLOW_UP_QUESTIONS" && (
          <>
            <FollowUpQuestions
              questions={data.follow_up}
              onQuestionClick={handleQuestionSelect}
            />
          </>
        )}
      </div>
    );
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar - Hidden on small screens, shown on md and up */}
      <div className=" md:flex">
        <Sidebar />
      </div>

      {/* Main Content */}
      <div className="flex flex-col flex-1 relative h-screen">
        {/* Floating Header - Fixed at top */}
        <div className="fixed top-0 left-0 right-0 z-50 p-3 sm:p-4 md:ml-[280px]">
          {" "}
          {/* Adjusted padding and added md:ml */}
          <div className="w-full bg-background/80 backdrop-blur-md border border-border rounded-2xl shadow-lg px-3 py-2 sm:px-4 sm:py-2 transition-all duration-300">
            {" "}
            {/* Adjusted padding */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <img
                  src="logo.png"
                  alt="My sobro icon SVG"
                  className="h-10 sm:h-12"
                />{" "}
                {/* Adjusted logo size */}
              </div>
              <div className="flex items-center gap-2 sm:gap-4">
                {" "}
                {/* Adjusted gap */}
                {/* New Chat Button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNewChat}
                  className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 sm:py-2 text-xs sm:text-sm" /* Adjusted padding and text size */
                >
                  <MessageSquarePlus className="w-3 h-3 sm:w-4 sm:h-4" />{" "}
                  {/* Adjusted icon size */}
                  <span className="hidden sm:inline">New Chat</span>{" "}
                  {/* Hide text on very small screens */}
                </Button>
                {/* Credits Display */}
                <div className="flex items-center justify-between text-xs sm:text-sm">
                  {" "}
                  {/* Adjusted text size */}
                  <span className="text-gray-600 dark:text-gray-400 flex items-center gap-1 sm:gap-2">
                    {" "}
                    {/* Adjusted gap */}
                    <Coins className="w-3 h-3 sm:w-4 sm:h-4" />{" "}
                    {/* Adjusted icon size */}
                    <span className="hidden sm:inline">Credits:</span>{" "}
                    {/* Hide text on very small screens */}
                  </span>
                  <span className="font-medium text-gray-900 dark:text-white ml-1">
                    {credits !== null ? credits.toFixed(1) : "Loading..."}
                  </span>
                </div>
                {/* Connection Status */}
                <div className="flex items-center gap-1 sm:gap-2">
                  {" "}
                  {/* Adjusted gap */}
                  {isConnect ? (
                    <Wifi className="w-3 h-3 sm:w-4 sm:h-4 text-green-500" />
                  ) : (
                    <WifiOff className="w-3 h-3 sm:w-4 sm:h-4 text-red-500" />
                  )}
                  <Badge
                    variant={isConnect ? "default" : "destructive"}
                    className="text-xs"
                  >
                    {" "}
                    {/* Adjusted text size */}
                    {isConnect ? "Connected" : "Disconnected"}
                  </Badge>
                </div>
                
              </div>
            </div>
          </div>
        </div>

        {/* Orb Background */}
        <div className="absolute inset-0 z-0 pointer-events-auto h-[100vh]">
          {" "}
          {/* Changed to pointer-events-none */}
          <Orb
            hoverIntensity={0.5}
            rotateOnHover={true}
            hue={0}
            forceHoverState={false}
          />
        </div>

        {/* Chat Messages Area */}
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full px-4 text-center pb-[120px] pt-[100px]">
            <div className="space-y-6">
              <div className="mx-auto rounded-full flex items-center justify-center">
                <img
                  src="logo.png"
                  alt="My sobro icon SVG"
                  className="w-48 sm:w-64" // Adjusted logo size for mobile
                />
              </div>
            </div>
          </div>
        ) : (
           <ScrollArea className="flex-1 h-full pt-16 sm:pt-20 pb-4 px-2 sm:px-4 pointer-events-auto">
            <div className="space-y-4 sm:space-y-6 max-w-4xl mx-auto">
              {messages.map(renderMessage)}
              {isTyping && <TypingIndicator message={getTypingMessage()} />}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>
        )}

        {/* Floating Input Area - Fixed at bottom */}
        <div className="fixed bottom-0 left-0 right-0 z-50 p-3 sm:p-4 md:ml-[280px]">
          <div className="bg-background/80 backdrop-blur-md border border-border rounded-2xl shadow-lg p-3 sm:p-4">
            <div className="flex gap-2 sm:gap-3 items-center max-w-5xl mx-auto">
              <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 bg-muted/50 rounded-full border border-border">
                <Zap
                  className={`w-3 h-3 sm:w-4 sm:h-4 transition-colors ${
                    agentMode ? "text-orange-500" : "text-muted-foreground"
                  }`}
                />
                <span className="text-xs sm:text-sm text-muted-foreground">
                  Agent
                </span>

                <Switch
                  checked={agentMode}
                  onCheckedChange={setAgentMode}
                  className="scale-75 sm:scale-100" // Adjusted scale for mobile
                />
              </div>
              {/* Input and Send Button */}
             <Textarea
  value={inputValue}
  onChange={(e) => setInputValue(e.target.value)}
  onKeyDown={handleKeyPress}
  placeholder="Ask me anything about travel..."
  className="flex-1 bg-muted/50 border-muted rounded-xl text-sm sm:text-base p-3 resize-none"
/>
<Button
  onClick={sendMessage}
  disabled={!inputValue.trim() || !isConnect}
  size="icon"
  className="rounded-full h-9 w-9 sm:h-10 sm:w-10 shrink-0"
>
  <Send className="w-4 h-4" />
</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TravelChatUI;
