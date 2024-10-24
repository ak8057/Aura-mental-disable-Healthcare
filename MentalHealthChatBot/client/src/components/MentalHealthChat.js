import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { Mic, MicOff } from "lucide-react";
import logo from "../assets/white-logo.png";
import BackgroundSVG from "../components/BackgroundSVG";

const MentalHealthChat = () => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (message) => {
    if (!message.trim()) return;

    const userMessage = message.trim();
    setInputMessage("");
    
    // Add user message to chat
    setMessages(prev => [...prev, { type: "user", content: userMessage }]);
    setIsTyping(true);

    try {
      const response = await axios.post("http://localhost:5000/chat", {
        message: userMessage,
        chatHistory: messages
      });

      setMessages(prev => [...prev, { type: "bot", content: response.data.response }]);
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages(prev => [...prev, {
        type: "bot",
        content: "I'm sorry, I'm having trouble responding right now. Please try again."
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  // Handle form submit for typed messages
  const handleSubmit = (e) => {
    e.preventDefault();
    handleSendMessage(inputMessage);
  };

  useEffect(() => {
    // Initialize speech recognition
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;

      recognitionRef.current.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map(result => result[0])
          .map(result => result.transcript)
          .join('');
        
        setInputMessage(transcript);
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
        // Send the message when recording stops if there's content
        if (inputMessage.trim()) {
          handleSendMessage(inputMessage);
        }
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [inputMessage]); // Added inputMessage as dependency to access latest value

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("Speech recognition is not supported in your browser.");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setInputMessage(""); // Clear any existing input when starting new recording
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  return (
    <div className="min-h-screen text-white flex flex-col">
      <BackgroundSVG />
      
      {/* Navbar */}
      <nav className="flex justify-between items-center px-4 py-3">
        <div className="flex space-x-3">
          <img src={logo} alt="Limbiks Logo" className="h-8 w-8" />
          <div className="text-white tracking-[0.5rem] text-[18px] font-sans">
            AURA+
          </div>
        </div>
      </nav>

      {/* Main Chat Container */}
      <div className="flex-grow container mx-auto px-2 py-2 max-w-3xl flex flex-col">
        <div className="bg-gray-800 rounded-lg shadow-xl p-3 flex flex-col flex-grow">
          <h1 className="text-md font-bold mb-3 text-center">
            Aiding Understanding & Recovery For All
          </h1>
          
          {/* Chat Messages */}
          <div className="flex-grow overflow-y-auto mb-3 p-2" style={{ maxHeight: "400px" }}>
            {messages.map((message, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className={`mb-2 ${message.type === "user" ? "text-right" : "text-left"}`}
              >
                <div
                  className={`inline-block p-2 rounded-lg ${
                    message.type === "user" ? "bg-blue-600 text-white" : "bg-gray-700 text-white"
                  }`}
                >
                  {message.content}
                </div>
              </motion.div>
            ))}
            {isTyping && (
              <div className="text-left mb-2">
                <div className="inline-block p-2 rounded-lg bg-gray-700">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Form */}
          <form onSubmit={handleSubmit} className="flex space-x-2">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Type your message here..."
              className="flex-1 p-2 rounded-lg bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="button"
              onClick={toggleListening}
              className={`p-2 rounded-lg transition-colors ${
                isListening 
                  ? 'bg-red-600 hover:bg-red-700' 
                  : 'bg-green-600 hover:bg-green-700'
              }`}
              title={isListening ? "Stop recording" : "Start recording"}
            >
              {isListening ? (
                <MicOff className="w-6 h-6" />
              ) : (
                <Mic className="w-6 h-6" />
              )}
            </button>
            <button
              type="submit"
              className="bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default MentalHealthChat;
