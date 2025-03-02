// src/TweetBubblesContainer.js
import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import './TweetBubble.css';

// Utility function to generate a random style for a bubble that avoids the central "safe zone"
const getRandomStyle = () => {
  const randomInRange = (min, max) => Math.random() * (max - min) + min;
  
  // Define the safe zone: vertical safe zone from 40% to 60% and horizontal safe zone from 30% to 70%
  // For top: choose either between 0-40% (above) or 60-100% (below)
  const top = Math.random() < 0.5 ? randomInRange(0, 40) : randomInRange(60, 100);
  // For left: choose either between 0-30% (left side) or 70-100% (right side)
  const left = Math.random() < 0.5 ? randomInRange(0, 30) : randomInRange(70, 100);
  
  const rotation = randomInRange(-10, 10);
  return { top: `${top}%`, left: `${left}%`, transform: `rotate(${rotation}deg)` };
};

// New utility function to choose a more futuristic color palette that pairs well with white text
const getRandomColor = () => {
  const futuristicColors = [
    "#2979FF", // Electric Blue
    "#651FFF", // Vivid Purple
    "#00E676", // Neon Green
    "#D500F9", // Vivid Magenta/Purple
    "#00B8D4", // Turquoise
    "#00C853", // Neon Green-Teal
  ];
  return futuristicColors[Math.floor(Math.random() * futuristicColors.length)];
};

const sampleTweets = [
  "Learning to fly in 3D.",
  "Ethereum vibes only.",
  "AI agents are the future!",
  "Futuristic tweets incoming.",
  "Blockchain meets AI!",
  "Powered by neural networks.",
  "Fluffy cats and crypto dreams.",
  "Digital revolution in motion.",
  "Next-gen AI is here.",
  "Cybernetic horizons await.",
  "Neon pulses, digital hearts.",
  "Hacking the matrix, one line at a time.",
  "Robotic minds, human dreams.",
  "Synthwave spirit in every byte.",
  "Quantum leaps in AI evolution.",
  "Data streams, cosmic dreams.",
  "Neural networks, infinite possibilities.",
  "Virtual reality, real emotions.",
  "Augmented intelligence, unstoppable force.",
  "Pixelated dreams in a digital cosmos.",
  "Holographic visions on the blockchain.",
  "Code that dances with light.",
  "Futuristic algorithms on fire.",
  "Synaptic sparks, futuristic art.",
  "Beyond the binary: digital renaissance.",
  "Machine learning, human yearning.",
  "Virtual dreams, neon realities.",
  "Cryptic codes, cosmic loads.",
  "Techno poetry in every line.",
  "Digital stardust and AI magic.",
  "Neural symphonies in the cyberverse.",
  "Electric hearts, futuristic starts.",
  "Synth minds forging tomorrow.",
  "Digital guardians of a new era.",
  "Pixels, circuits, and neon nights.",
  "Innovate. Integrate. Elevate.",
  "Infinite loops of creative chaos.",
  "Where code meets cosmic energy.",
  "Revolutionizing reality with AI.",
  "Coded dreams and virtual schemes.",
  "Electrifying algorithms, cosmic vibes.",
  "Unleashing digital power, one pixel at a time.",
  "Infinite data, infinite inspiration.",
  "Tomorrow's tech, today’s vision.",
  "Crypto currents and algorithmic art.",
  "Digital symphony: the code of the future.",
  "Virtual threads weaving new realities.",
  "Pioneering the future with code and passion.",
  "Neural pulses, futuristic impulses.",
  "Sparking innovation in the digital realm.",
  "Where AI dreams and crypto schemes merge.",
  "Building tomorrow’s reality today.",
  "Digital artisans crafting neon futures.",
  "Cryptographic wonders and AI wonders.",
  "Futuristic code, infinite potential.",
  "Beyond binary, into the future.",
  "Digital musings from a cybernetic mind.",
  "AI revolution: powered by passion.",
  "Cyber dreams, neon streams.",
  "Virtual innovation, timeless inspiration.",
  "Synthetic thoughts and cosmic bytes.",
  "Coding the future with every keystroke.",
  "Electric dreams in a binary world.",
  "Transcending reality with digital art.",
  "Illuminating the dark with neon code.",
  "Neon pulse and quantum leaps.",
  "AI-powered and blockchain bound.",
  "Digital echoes from a futuristic mind.",
  "Bytes of brilliance in every line.",
  "Holograms and high-speed data.",
  "Digital dreams fuel futuristic scenes.",
  "Crypto charisma meets AI elegance.",
  "Pulsing with energy, powered by code.",
  "Cybernetic creativity in every byte.",
  "Coding beyond the limits of reality.",
  "Digital sparks lighting up the future.",
  "AI, crypto, and everything electric.",
  "Futuristic minds create luminous realities.",
  "Glowing circuits and visionary code.",
  "From code to cosmos: the digital journey.",
  "Neon narratives in a digital age.",
  "The future is coded, and it's glowing.",
  "Algorithmic artistry in every pixel.",
  "Innovate, inspire, ignite the future.",
  "Digital dreams sculpting tomorrow.",
  "AI-powered artistry in neon lights.",
  "Cyber visions that defy reality.",
  "Electric code, celestial creativity.",
  "Digital rebels forging a new era.",
  "The pulse of the future is in the code.",
  "Neon bytes and futuristic flights.",
  "Digital destiny written in code.",
  "Synthesized reality, glowing with promise.",
  "Where digital art meets AI heart.",
  "Code in motion, futures in bloom.",
  "Electric souls in a digital universe.",
  "Innovative algorithms with neon dreams.",
  "The next wave of tech: luminous and limitless."
];

function TweetBubblesContainer() {
  const [bubbles, setBubbles] = useState([]);

  // Add a new bubble at random intervals between 300-500 ms
  useEffect(() => {
    const addBubble = () => {
      const newBubble = {
        id: Date.now() + Math.random(),
        text: sampleTweets[Math.floor(Math.random() * sampleTweets.length)],
        style: {
          ...getRandomStyle(),
          backgroundColor: getRandomColor(), // <-- apply futuristic color here
          border: '2px dashed #212121', // scratchy outline for added grit
          padding: '8px', // optional: adds a bit of spacing inside the bubble
          borderRadius: '8px'
        },
        created: Date.now(),
      };
      setBubbles(prev => [...prev, newBubble]);
    };

    // Random interval between 300ms and 500ms
    const getRandomInterval = () => Math.floor(Math.random() * 300) + 500;
    let timerId;
    const scheduleNextBubble = () => {
      timerId = setTimeout(() => {
        addBubble();
        scheduleNextBubble();
      }, getRandomInterval());
    };

    scheduleNextBubble();
    return () => clearTimeout(timerId);
  }, []);

  // Remove bubbles that are older than 10 seconds if there are more than 10 on screen
  useEffect(() => {
    const intervalId = setInterval(() => {
      setBubbles(prev => {
        if (prev.length > 10) {
          const now = Date.now();
          return prev.filter(bubble => now - bubble.created < 10000);
        }
        return prev;
      });
    }, 1000);
    return () => clearInterval(intervalId);
  }, []);

  return (
    <div style={{ position: 'absolute', width: '100%', height: '100%' }}>
      <AnimatePresence>
        {bubbles.map(bubble => (
          <motion.div
            key={bubble.id}
            className="tweet-bubble"
            style={bubble.style}
            initial={{ opacity: 0, scale: 0.5, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.5, y: -20 }}
            transition={{ duration: 0.5 }}
          >
            {bubble.text}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

export default TweetBubblesContainer;
