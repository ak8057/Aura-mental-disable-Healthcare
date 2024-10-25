import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, Send, MessageCircle, Volume2, VolumeX, Moon, Sun, HelpCircle } from "lucide-react";
import { XIcon } from '@heroicons/react/solid';


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

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen transition-all duration-500 relative overflow-hidden bg-gradient-to-br from-gray-900 to-gray-800"
    >
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 180, 360],
            opacity: [0.1, 0.2, 0.1],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-purple-600 opacity-10 blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            rotate: [360, 180, 0],
            opacity: [0.1, 0.2, 0.1],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-blue-600 opacity-10 blur-3xl"
        />
      </div>

      <div className="max-w-4xl mx-auto p-4 h-screen flex flex-col relative z-10">
        {/* Header */}
        <motion.div 
          initial={{ y: -20 }}
          animate={{ y: 0 }}
          className="p-4 rounded-t-lg shadow-lg flex items-center justify-between backdrop-blur-md bg-white/10"
        >
          <motion.div 
            className="flex items-center space-x-3"
            whileHover={{ scale: 1.02 }}
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            >
              <MessageCircle className="w-6 h-6 text-purple-400" />
            </motion.div>
            <span className="text-xl font-semibold text-white">
              AURA+ Assistant
            </span>
          </motion.div>
          
          <div className="flex space-x-4">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setAutoSpeak(!autoSpeak)}
              className={`p-2 rounded-full hover:bg-white/10 transition-all duration-300 ${
                autoSpeak ? 'text-green-400' : 'text-gray-400'
              }`}
            >
              {autoSpeak ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-full hover:bg-white/10 transition-all duration-300"
            >
              {darkMode ? (
                <Sun className="w-5 h-5 text-yellow-400" />
              ) : (
                <Moon className="w-5 h-5 text-purple-400" />
              )}
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setError("Help documentation coming soon!")}
              className="p-2 rounded-full hover:bg-white/10 transition-all duration-300"
            >
              <HelpCircle className="w-5 h-5 text-purple-400" />
            </motion.button>
          </div>
        </motion.div>

        {/* Chat Container */}
        <div className="flex-1 backdrop-blur-md bg-white/5 overflow-hidden flex flex-col rounded-b-lg shadow-lg">
          {/* Error Alert */}
          <AnimatePresence>
  {error && (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className="p-4 bg-red-500/20 text-white"
    >
      <div className="flex justify-between items-center">
        <p>{error}</p>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setError(null)}
          className="text-white/80 hover:text-white"
        >
          <XIcon className="w-4 h-4" />
        </motion.button>
      </div>
    </motion.div>
  )}
</AnimatePresence>


          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <AnimatePresence>
              {messages.map((message, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div className="flex items-end space-x-2 max-w-[80%]">
                    {message.type === "bot" && (
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => speakMessage(message.content, true)}
                        className="p-1 rounded-full hover:bg-white/10 text-purple-400"
                      >
                        {isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                      </motion.button>
                    )}
                    <motion.div
                      className={`px-4 py-2 rounded-2xl ${
                        message.type === "user"
                          ? "bg-purple-600 text-white"
                          : "bg-white/10 text-white"
                      }`}
                    >
                      <p>{message.content}</p>
                    </motion.div>
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
                <motion.div
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 0.6, repeat: Infinity }}
                  className="w-2 h-2 bg-purple-400 rounded-full"
                />
                <motion.div
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 0.6, delay: 0.2, repeat: Infinity }}
                  className="w-2 h-2 bg-purple-400 rounded-full"
                />
                <motion.div
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 0.6, delay: 0.4, repeat: Infinity }}
                  className="w-2 h-2 bg-purple-400 rounded-full"
                />
              </motion.div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <form onSubmit={handleSubmit} className="p-4 border-t border-white/10">
            <div className="flex space-x-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 p-3 rounded-lg bg-white/10 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="button"
                onClick={toggleListening}
                disabled={isSpeaking}
                className={`p-3 rounded-lg ${
                  isListening 
                    ? 'bg-red-500 hover:bg-red-600' 
                    : isSpeaking
                    ? 'bg-gray-600 cursor-not-allowed'
                    : 'bg-purple-500 hover:bg-purple-600'
                } text-white`}
              >
                {isListening ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="submit"
                disabled={isSpeaking || !inputMessage.trim()}
                className={`p-3 rounded-lg ${
                  isSpeaking || !inputMessage.trim()
                    ? 'bg-gray-600 cursor-not-allowed'
                    : 'bg-purple-500 hover:bg-purple-600'
                } text-white`}
              >
                <Send className="w-6 h-6" />
              </motion.button>
            </div>
          </form>
        </div>
      </div>
    </motion.div>
  );
};

export default MentalHealthChat;
