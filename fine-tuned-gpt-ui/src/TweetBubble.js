// src/TweetBubble.js
import React from 'react';
import { motion } from 'framer-motion';
import './TweetBubble.css';

function TweetBubble({ text, style }) {
  return (
    <motion.div
      className="tweet-bubble"
      style={style}
      initial={{ opacity: 0, scale: 0.5, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {text}
    </motion.div>
  );
}

export default TweetBubble;
