// hooks/useCursorGlow.js
import { useState, useEffect } from 'react';

export const useCursorGlow = () => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e) => {
      setPosition({ x: e.clientX, y: e.clientY });
    };

    if (isHovering) {
      document.addEventListener('mousemove', handleMouseMove);
    } else {
      setPosition({ x: 0, y: 0 }); // Reset position when not hovering
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
    };
  }, [isHovering]);

  return {
    position,
    setIsHovering,
    glowStyle: isHovering
      ? {
          '--glow-x': `${position.x}px`,
          '--glow-y': `${position.y}px`,
        }
      : {
          '--glow-x': `-9999px`, // Move glow off-screen when not hovering
          '--glow-y': `-9999px`,
        },
  };
};