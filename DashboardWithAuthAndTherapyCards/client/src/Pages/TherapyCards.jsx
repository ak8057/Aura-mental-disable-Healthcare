import React, { useState, useEffect } from "react";
import { Palette, Music, GamepadIcon, X, Waves, Cloud, Sun } from "lucide-react";

// Enhanced Decorative Background Component
const AnimatedBackground = () => (
  <div className="fixed inset-0 -z-10 overflow-hidden">
    <div className="absolute inset-0 bg-gradient-to-br from-blue-200 via-green-200 to-pink-200">
      <div className="absolute inset-0">
        <div className="animate-clouds">
          <Cloud className="absolute top-10 left-[10%] w-24 h-24 text-white/30 animate-float-slow" />
          <Cloud className="absolute top-32 right-[15%] w-32 h-32 text-white/20 animate-float-slow" />
          <Cloud className="absolute bottom-20 left-[5%] w-28 h-28 text-white/30 animate-float-slow" />
        </div>
        <div className="animate-sun">
          <Sun className="absolute top-5 right-[30%] w-24 h-24 text-yellow-300/40 animate-pulse-slow" />
        </div>
      </div>
      <Waves className="absolute bottom-10 left-[20%] w-48 h-48 text-blue-300/30 animate-wave" />
    </div>
    <div className="absolute inset-0 bg-gradient-to-t from-white/50 to-transparent" />
  </div>
);

const Card = ({ children, className, ...props }) => (
  <div
    className={`bg-white/80 backdrop-blur-lg rounded-2xl shadow-lg ${className}`}
    {...props}
  >
    {children}
  </div>
);

const CardContent = ({ children, className, ...props }) => (
  <div className={`p-8 ${className}`} {...props}>
    {children}
  </div>
);

const TherapyCards = () => {
  const [showCanvas, setShowCanvas] = useState(false);
  const [selectedColor, setSelectedColor] = useState("#000000");
  const [isPlaying, setIsPlaying] = useState(false);
  const [showGame, setShowGame] = useState(false);
  const [score, setScore] = useState(0);
  const [position, setPosition] = useState({ x: 50, y: 50 });

  const handleArtClick = () => setShowCanvas(true);
  const handleMusicClick = () => setIsPlaying(!isPlaying);
  const handleGameClick = () => window.location.href = 'https://krunker.io';

  const moveBox = (direction) => {
    setPosition(prev => {
      const newPos = { ...prev };
      switch (direction) {
        case 'ArrowUp': newPos.y = Math.max(0, prev.y - 10); break;
        case 'ArrowDown': newPos.y = Math.min(290, prev.y + 10); break;
        case 'ArrowLeft': newPos.x = Math.max(0, prev.x - 10); break;
        case 'ArrowRight': newPos.x = Math.min(290, prev.x + 10); break;
        default: break;
      }
      return newPos;
    });
    setScore(prev => prev + 1);
  };

  const cards = [
    {
      title: "Art Therapy",
      icon: <Palette className="w-8 h-8" />,
      description: "Express emotions through creative visual art to enhance mental clarity and find inner peace.",
      onClick: handleArtClick,
      bgClass: "bg-gradient-to-br from-purple-400 to-purple-600",
      hoverEffect: "hover:shadow-purple-300"
    },
    {
      title: "Music Therapy",
      icon: <Music className="w-8 h-8" />,
      description: "Experience the healing power of music to improve emotional well-being and reduce stress.",
      onClick: handleMusicClick,
      bgClass: "bg-gradient-to-br from-blue-400 to-blue-600",
      hoverEffect: "hover:shadow-blue-300"
    },
    {
      title: "Game Therapy",
      icon: <GamepadIcon className="w-8 h-8" />,
      description: "Engage in interactive games to reduce stress, improve focus, and boost mental agility.",
      onClick: handleGameClick,
      bgClass: "bg-gradient-to-br from-green-400 to-green-600",
      hoverEffect: "hover:shadow-green-300"
    }
  ];

  return (
    <div className="relative min-h-screen overflow-hidden">
      <AnimatedBackground />

      <div className="container mx-auto px-6 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-purple-600 via-blue-600 to-green-600">
            Mindful Therapy Space
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Welcome to your sanctuary of healing. Choose an activity that resonates with your current state of mind.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 max-w-7xl mx-auto px-4">
          {cards.map((card, index) => (
            <Card
              key={card.title}
              className={`transform transition-all duration-500 hover:scale-105 cursor-pointer
                ${card.hoverEffect} hover:shadow-xl overflow-hidden
                ${index === 0 ? 'hover:rotate-2' : index === 1 ? 'hover:-rotate-2' : 'hover:rotate-2'}`}
              style={{
                animation: `fadeIn 0.5s ease-out forwards`,
                animationDelay: `${index * 200}ms`
              }}
              onClick={card.onClick}
            >
              <CardContent className={`h-full ${card.bgClass} text-white`}>
                <div className="flex flex-col items-center text-center gap-6 mb-6">
                  <div className="transform transition-all duration-300 hover:rotate-12 hover:scale-110 p-4 bg-white/20 rounded-full">
                    {card.icon}
                  </div>
                  <h2 className="text-3xl font-bold">{card.title}</h2>
                </div>
                <p className="text-lg opacity-90 leading-relaxed">{card.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {showCanvas && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-3xl p-10 w-[700px] relative shadow-2xl">
            <button
              onClick={() => setShowCanvas(false)}
              className="absolute right-6 top-6 p-2 hover:bg-gray-100 rounded-full transition-all duration-300 hover:rotate-90"
            >
              <X className="w-6 h-6" />
            </button>
            <h2 className="text-3xl font-bold mb-8 text-gray-800">Express Your Emotions</h2>
            <div className="mb-6 flex items-center gap-4">
              <input
                type="color"
                value={selectedColor}
                onChange={(e) => setSelectedColor(e.target.value)}
                className="w-16 h-16 rounded-2xl cursor-pointer hover:scale-105 transition-transform"
              />
              <span className="text-lg text-gray-600">Choose a color that matches your mood</span>
            </div>
            <CanvasPainting color={selectedColor} />
          </div>
        </div>
      )}

      {isPlaying && (
        <div className="fixed bottom-8 right-8 bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-2xl shadow-lg z-40">
          <div className="flex items-center gap-6">
            <Music className="w-8 h-8 animate-bounce" />
            <div>
              <p className="text-lg font-semibold">Relaxing Melody</p>
              <p className="text-base opacity-90">Let the music calm your mind...</p>
            </div>
            <button
              onClick={() => setIsPlaying(false)}
              className="p-2 hover:bg-blue-600/50 rounded-full transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}

      {showGame && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-3xl p-10 relative shadow-2xl">
            <button
              onClick={() => {
                setShowGame(false);
                setScore(0);
              }}
              className="absolute right-6 top-6 p-2 hover:bg-gray-100 rounded-full transition-all duration-300 hover:rotate-90"
            >
              <X className="w-6 h-6" />
            </button>
            <h2 className="text-3xl font-bold mb-6 text-gray-800">Focus Exercise</h2>
            <p className="mb-6 text-xl font-semibold text-green-600">Points: {score}</p>
            <div
              className="relative w-[400px] h-[400px] border-2 border-gray-300 rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100"
              tabIndex={0}
              onKeyDown={(e) => moveBox(e.key)}
            >
              <div
                className="absolute w-10 h-10 bg-gradient-to-br from-green-400 to-green-600 rounded-xl transition-all duration-200 shadow-lg"
                style={{
                  left: `${position.x}px`,
                  top: `${position.y}px`,
                  transform: 'translate3d(0, 0, 0)'
                }}
              />
            </div>
            <p className="mt-6 text-gray-600 text-center">
              Use arrow keys to move the box. Focus on your breathing as you play.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

const CanvasPainting = ({ color }) => {
  const canvasRef = React.useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [lastPosition, setLastPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.strokeStyle = color;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.lineWidth = 5;
  }, [color]);

  const draw = (e) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(lastPosition.x, lastPosition.y);
    ctx.lineTo(x, y);
    ctx.stroke();

    setLastPosition({ x, y });
  };

  return (
    <canvas
      ref={canvasRef}
      width={650}
      height={450}
      className="border-2 border-gray-200 rounded-2xl cursor-crosshair shadow-inner bg-white transition-shadow duration-300 hover:shadow-lg"
      onMouseDown={(e) => {
        const rect = canvasRef.current.getBoundingClientRect();
        setLastPosition({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top
        });
        setIsDrawing(true);
      }}
      onMouseUp={() => setIsDrawing(false)}
      onMouseOut={() => setIsDrawing(false)}
      onMouseMove={draw}
    />
  );
};

export default TherapyCards;