// src/components/HeroTypingText.jsx
import React, { useState, useEffect, useRef } from 'react';

const HeroTypingText = ({ 
  texts = [], 
  typingSpeed = 100, 
  pauseTime = 3000,
  loop = true,
  showCursor = true,
  className = '',
  onCompleteCycle = null
}) => {
  const [typingText, setTypingText] = useState("");
  const [typingIndex, setTypingIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [speed, setSpeed] = useState(typingSpeed);
  const typingRef = useRef(null);
  
  // Default texts if none provided
  const defaultTexts = [
    "Find Your Dream Home in Ethiopia",
    "Verified Properties • Trusted Brokers",
    "Secure Transactions • Easy Process",
    "Your Journey Starts Here"
  ];
  
  const textsToUse = texts.length > 0 ? texts : defaultTexts;

  useEffect(() => {
    const currentText = textsToUse[typingIndex];
    
    const handleTyping = () => {
      if (!isDeleting) {
        // Typing forward
        if (typingText.length < currentText.length) {
          setTypingText(currentText.slice(0, typingText.length + 1));
          setSpeed(typingSpeed);
        } else {
          // Finished typing, start deleting after pause
          setSpeed(pauseTime);
          setIsDeleting(true);
        }
      } else {
        // Deleting
        if (typingText.length > 0) {
          setTypingText(currentText.slice(0, typingText.length - 1));
          setSpeed(typingSpeed / 2); // Faster deletion
        } else {
          // Finished deleting, move to next text
          setIsDeleting(false);
          if (typingIndex === textsToUse.length - 1) {
            // Last text completed
            if (loop) {
              setTypingIndex(0);
            }
            if (onCompleteCycle) {
              onCompleteCycle();
            }
          } else {
            setTypingIndex(typingIndex + 1);
          }
          setSpeed(500); // Pause before starting next text
        }
      }
    };

    const timer = setTimeout(handleTyping, speed);
    return () => clearTimeout(timer);
  }, [typingText, typingIndex, isDeleting, speed, textsToUse, typingSpeed, pauseTime, loop, onCompleteCycle]);

  return (
    <span
      ref={typingRef}
      className={`inline-block ${className} ${showCursor ? 'relative' : ''}`}
    >
      {typingText}
      {showCursor && (
        <span className="inline-block w-[2px] h-[1.2em] bg-current ml-0.5 animate-pulse"></span>
      )}
    </span>
  );
};

// Alternative simpler version if you prefer:
export const SimpleTypingText = ({ texts, speed = 100, className = '' }) => {
  const [displayText, setDisplayText] = useState('');
  const [textIndex, setTextIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const textsToUse = texts || [
      "Find Your Dream Home with Confidence",
      "Rent with Security and Peace of Mind",
      "Verified Properties, Trusted Process",
      "Your Journey to Perfect Living Starts Here"
    ];

    const currentText = textsToUse[textIndex];

    const timeout = setTimeout(() => {
      if (!isDeleting) {
        // Typing
        if (charIndex < currentText.length) {
          setDisplayText(currentText.substring(0, charIndex + 1));
          setCharIndex(charIndex + 1);
        } else {
          // Start deleting after pause
          setTimeout(() => setIsDeleting(true), 2000);
        }
      } else {
        // Deleting
        if (charIndex > 0) {
          setDisplayText(currentText.substring(0, charIndex - 1));
          setCharIndex(charIndex - 1);
        } else {
          // Move to next text
          setIsDeleting(false);
          setTextIndex((textIndex + 1) % textsToUse.length);
        }
      }
    }, isDeleting ? speed / 2 : speed);

    return () => clearTimeout(timeout);
  }, [charIndex, isDeleting, textIndex, texts, speed]);

  return (
    <span className={`${className} typing-animation`}>
      {displayText}
      <span className="cursor">|</span>
    </span>
  );
};

// Even simpler version for basic use
export const BasicTypingText = () => {
  const [text, setText] = useState('');
  const [index, setIndex] = useState(0);
  const texts = [
    "Find Your Dream Home in Ethiopia",
    "Verified Properties • Trusted Brokers",
    "Secure Transactions • Easy Process"
  ];

  useEffect(() => {
    const currentText = texts[index];
    let charIndex = 0;
    
    const type = () => {
      if (charIndex <= currentText.length) {
        setText(currentText.substring(0, charIndex));
        charIndex++;
        setTimeout(type, 100);
      } else {
        setTimeout(() => {
          setIndex((index + 1) % texts.length);
        }, 2000);
      }
    };

    type();
  }, [index]);

  return (
    <span className="relative">
      {text}
      <span className="animate-pulse">|</span>
    </span>
  );
};

export default HeroTypingText;