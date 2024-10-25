import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, Send, MessageCircle, Volume2, VolumeX, Moon, Sun, HelpCircle } from "lucide-react";

const MentalHealthChat = () => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(true);
  const [darkMode, setDarkMode] = useState(true);
  const [error, setError] = useState(null);
  const [canListen, setCanListen] = useState(true);
  
  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);
  const speechSynthRef = useRef(null);
  const speakQueueRef = useRef([]);
  const currentUtteranceRef = useRef(null);
  const transcriptRef = useRef(""); // New ref to store ongoing transcript
  
  useEffect(() => {
    if ('speechSynthesis' in window) {
      speechSynthRef.current = window.speechSynthesis;
      
      const loadVoices = () => {
        const voices = speechSynthRef.current.getVoices();
        if (voices.length > 0) {
          const englishVoice = voices.find(voice => 
            voice.lang.startsWith('en') && !voice.localService
          ) || voices[0];
          return englishVoice;
        }
        return null;
      };
      
      loadVoices();
      speechSynthRef.current.onvoiceschanged = loadVoices;
    }

    // Initialize speech recognition with fixes
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false; // Changed to false to prevent duplicate recognition
      recognitionRef.current.interimResults = true;
      
      recognitionRef.current.onstart = () => {
        transcriptRef.current = ""; // Clear transcript when starting new recognition
        setIsListening(true);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
        // Only send message if there's content and we're not currently speaking
        if (transcriptRef.current.trim() && !isSpeaking) {
          handleSendMessage(transcriptRef.current.trim());
          transcriptRef.current = ""; // Clear transcript after sending
        }
      };
      
      recognitionRef.current.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map(result => result[0].transcript)
          .join(' ');
        
        transcriptRef.current = transcript;
        setInputMessage(transcript); // Update input field with current transcript
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        setError("Speech recognition failed. Please try again.");
        transcriptRef.current = ""; // Clear transcript on error
      };
    }

    return () => {
      stopSpeaking();
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const stopSpeaking = () => {
    if (speechSynthRef.current) {
      speechSynthRef.current.cancel();
      setIsSpeaking(false);
      currentUtteranceRef.current = null;
      speakQueueRef.current = [];
    }
  };

  const speakMessage = async (text, force = false) => {
    if (!force && !autoSpeak) return;
    
    try {
      if (!speechSynthRef.current) {
        throw new Error("Speech synthesis not supported");
      }

      return new Promise((resolve, reject) => {
        stopSpeaking();
        
        const utterance = new SpeechSynthesisUtterance(text);
        currentUtteranceRef.current = utterance;
        
        utterance.rate = 1;
        utterance.pitch = 1;
        utterance.volume = 1;
        utterance.lang = 'en-US';
        
        const voices = speechSynthRef.current.getVoices();
        const englishVoice = voices.find(voice => 
          voice.lang.startsWith('en') && !voice.localService
        ) || voices[0];
        
        if (englishVoice) {
          utterance.voice = englishVoice;
        }
        
        utterance.onstart = () => {
          setIsSpeaking(true);
          setCanListen(false);
        };
        
        utterance.onend = () => {
          setIsSpeaking(false);
          setCanListen(true);
          currentUtteranceRef.current = null;
          resolve();
        };
        
        utterance.onerror = (event) => {
          console.error('Speech synthesis error:', event);
          setError("Failed to play audio. Please try again.");
          setIsSpeaking(false);
          setCanListen(true);
          currentUtteranceRef.current = null;
          resolve();
        };

        const timeout = setTimeout(() => {
          if (currentUtteranceRef.current === utterance) {
            stopSpeaking();
            setError("Speech synthesis timed out. Please try again.");
            resolve();
          }
        }, 30000);

        try {
          speechSynthRef.current.speak(utterance);
          
          setTimeout(() => {
            if (!speechSynthRef.current.speaking && currentUtteranceRef.current === utterance) {
              clearTimeout(timeout);
              stopSpeaking();
              setError("Speech synthesis failed to start. Please try again.");
              resolve();
            }
          }, 1000);
        } catch (err) {
          clearTimeout(timeout);
          console.error('Speech synthesis speak error:', err);
          setError("Failed to initialize speech. Please try again.");
          setIsSpeaking(false);
          setCanListen(true);
          resolve();
        }
      });
    } catch (err) {
      console.error('Speech synthesis setup error:', err);
      setError("Speech synthesis is not supported in your browser.");
      setIsSpeaking(false);
      setCanListen(true);
      return Promise.resolve();
    }
  };

  const handleSendMessage = async (message) => {
    if (!message.trim() || isSpeaking) return;

    const userMessage = message.trim();
    setInputMessage("");
    
    setMessages(prev => [...prev, { type: "user", content: userMessage }]);
    setIsTyping(true);

    try {
      const response = await fetch("http://localhost:5000/chat", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          chatHistory: messages
        }),
      });
      
      const data = await response.json();
      const newMessage = { type: "bot", content: data.response };
      setMessages(prev => [...prev, newMessage]);
      
      // Only speak if not currently speaking and either autoSpeak is on or force speaking
      if (!isSpeaking) {
        await speakMessage(data.response);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      setError("Failed to send message. Please try again.");
    } finally {
      setIsTyping(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isSpeaking) {
      handleSendMessage(inputMessage);
    } else {
      setError("Please wait for the assistant to finish speaking.");
    }
  };

  const toggleListening = () => {
    if (!recognitionRef.current) {
      setError("Speech recognition is not supported in your browser.");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else if (canListen && !isSpeaking) {
      setInputMessage("");
      transcriptRef.current = ""; // Clear transcript before starting new recognition
      recognitionRef.current.start();
    } else {
      setError("Please wait for the assistant to finish speaking.");
    }
  };

  const backgroundPattern = `
    radial-gradient(circle at 10% 20%, ${darkMode ? 'rgb(25, 25, 52)' : 'rgb(248, 250, 252)'} 0%, ${darkMode ? 'rgb(15, 15, 35)' : 'rgb(241, 245, 249)'} 90.2%),
    linear-gradient(${darkMode ? '140deg, rgba(93, 58, 201, 0.1), rgba(63, 38, 171, 0.1)' : '140deg, rgba(147, 197, 253, 0.1), rgba(196, 181, 253, 0.1)'})
  `;

  return (
    <div 
      style={{ background: backgroundPattern }}
      className="min-h-screen transition-colors duration-300"
    >
      <div className="max-w-4xl mx-auto p-4 h-screen flex flex-col">
        {/* Header */}
        <div className={`p-4 rounded-t-lg shadow-lg flex items-center justify-between backdrop-blur-md ${
          darkMode ? 'bg-opacity-30 bg-gray-900' : 'bg-opacity-30 bg-white'
        }`}>
          <div className="flex items-center space-x-3">
            <MessageCircle className={`w-6 h-6 ${darkMode ? 'text-purple-400' : 'text-purple-600'}`} />
            <span className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
              AURA+ Assistant
            </span>
          </div>
          <div className="flex space-x-4">
            <button
              onClick={() => setAutoSpeak(!autoSpeak)}
              className={`p-2 rounded-full hover:bg-opacity-20 hover:bg-purple-500 transition-colors ${
                autoSpeak ? 'text-green-400' : darkMode ? 'text-gray-400' : 'text-gray-600'
              }`}
              aria-label={autoSpeak ? "Disable auto-speak" : "Enable auto-speak"}
            >
              {autoSpeak ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </button>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-full hover:bg-opacity-20 hover:bg-purple-500 transition-colors"
              aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {darkMode ? (
                <Sun className="w-5 h-5 text-yellow-400" />
              ) : (
                <Moon className="w-5 h-5 text-purple-600" />
              )}
            </button>
            <button
              onClick={() => setError("Help documentation coming soon!")}
              className="p-2 rounded-full hover:bg-opacity-20 hover:bg-purple-500 transition-colors"
              aria-label="Help"
            >
              <HelpCircle className={`w-5 h-5 ${darkMode ? 'text-purple-400' : 'text-purple-600'}`} />
            </button>
          </div>
        </div>

        {/* Chat Container */}
        <div className={`flex-1 backdrop-blur-md ${
          darkMode ? 'bg-opacity-30 bg-gray-900' : 'bg-opacity-30 bg-white'
        } overflow-hidden flex flex-col rounded-b-lg shadow-lg`}>
          {/* Error Alert */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={`p-4 ${darkMode ? 'bg-red-900 bg-opacity-50' : 'bg-red-100'} ${darkMode ? 'text-white' : 'text-red-900'}`}
              >
                <div className="flex justify-between items-center">
                  <p>{error}</p>
                  <button
                    onClick={() => setError(null)}
                    className="text-sm hover:opacity-75"
                  >
                    Dismiss
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4">
            <AnimatePresence>
              {messages.map((message, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={`mb-4 ${message.type === "user" ? "text-right" : "text-left"}`}
                >
                  <div className={`flex items-center ${message.type === "user" ? "justify-end" : "justify-start"} space-x-2`}>
                    {message.type === "bot" && (
                      <button
                        onClick={() => speakMessage(message.content, true)}
                        className={`p-1 rounded-full hover:bg-opacity-20 hover:bg-purple-500 transition-colors ${
                          isSpeaking ? 'text-green-400' : darkMode ? 'text-purple-400' : 'text-purple-600'
                        }`}
                        aria-label={isSpeaking ? "Stop speaking" : "Speak message"}
                      >
                        {isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                      </button>
                    )}
                    <div
                      className={`inline-block max-w-[80%] px-4 py-2 rounded-lg backdrop-blur-sm ${
                        message.type === "user"
                          ? 'bg-purple-600 bg-opacity-90'
                          : darkMode ? 'bg-gray-700 bg-opacity-60' : 'bg-gray-200 bg-opacity-60'
                      } ${
                        darkMode ? 'text-white' : message.type === "user" ? 'text-white' : 'text-gray-800'
                      }`}
                    >
                      <p>{message.content}</p>
                    </div>
                    </div>
                </motion.div>
              ))}
            </AnimatePresence>
            
            {isTyping && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex space-x-2 p-2"
              >
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce delay-100" />
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce delay-200" />
              </motion.div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <form onSubmit={handleSubmit} className="p-4 border-t border-opacity-20 border-purple-300">
            <div className="flex space-x-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Type your message..."
                className={`flex-1 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors backdrop-blur-sm ${
                  darkMode 
                    ? 'bg-gray-700 bg-opacity-50 text-white placeholder-gray-400'
                    : 'bg-white bg-opacity-50 text-gray-900 placeholder-gray-500'
                }`}
              />
              <button
                type="button"
                onClick={toggleListening}
                disabled={isSpeaking}
                className={`p-2 rounded-lg transition-colors ${
                  isListening 
                    ? 'bg-red-500 hover:bg-red-600' 
                    : isSpeaking
                    ? 'bg-gray-500 cursor-not-allowed'
                    : 'bg-purple-500 hover:bg-purple-600'
                } text-white`}
                aria-label={isListening ? "Stop listening" : "Start listening"}
              >
                {isListening ? (
                  <MicOff className="w-6 h-6" />
                ) : (
                  <Mic className="w-6 h-6" />
                )}
              </button>
              <button
                type="submit"
                disabled={isSpeaking || !inputMessage.trim()}
                className={`p-2 rounded-lg transition-colors ${
                  isSpeaking || !inputMessage.trim()
                    ? 'bg-gray-500 cursor-not-allowed'
                    : 'bg-purple-500 hover:bg-purple-600'
                } text-white`}
                aria-label="Send message"
              >
                <Send className="w-6 h-6" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default MentalHealthChat;
