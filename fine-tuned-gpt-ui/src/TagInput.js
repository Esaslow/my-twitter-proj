// src/TagInput.js
import React, { useState } from 'react';
import './TagInput.css';

function TagInput({ tags, setTags }) {
  const [input, setInput] = useState('');

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      const newTag = input.trim();
      if (newTag && !tags.includes(newTag)) {
        console.log("Adding tag:", newTag); // Debug log added here
        setTags([...tags, newTag]);
        setInput('');
      }
    }
  };

  return (
    <div className="tag-input-container">
      {tags.map((tag, index) => (
        <span key={index} className="tag-bubble">{tag}</span>
      ))}
      <input
        type="text"
        placeholder="Type a username and press enter or space..."
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
      />
    </div>
  );
}

export default TagInput;
