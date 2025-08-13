"use client";

import React, { useEffect, useState } from 'react';

interface ConfettiPiece {
  id: number;
  x: number;
  y: number;
  rotation: number;
  scale: number;
  color: string;
  animationDuration: number;
  delay: number;
}

const colors = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', 
  '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F',
  '#BB8FCE', '#85C1E9', '#F8C471', '#82E0AA'
];

export function Confetti() {
  const [confetti, setConfetti] = useState<ConfettiPiece[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  const createConfetti = () => {
    const pieces: ConfettiPiece[] = [];
    for (let i = 0; i < 150; i++) {
      pieces.push({
        id: i,
        x: Math.random() * window.innerWidth,
        y: -10,
        rotation: Math.random() * 360,
        scale: Math.random() * 0.5 + 0.5,
        color: colors[Math.floor(Math.random() * colors.length)],
        animationDuration: Math.random() * 3 + 2,
        delay: Math.random() * 0.5
      });
    }
    setConfetti(pieces);
    setIsVisible(true);
  };

  useEffect(() => {
    createConfetti();
    
    // Hide confetti after animation
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {confetti.map((piece) => (
        <div
          key={piece.id}
          className="absolute w-2 h-2 rounded-full"
          style={{
            left: piece.x,
            top: piece.y,
            backgroundColor: piece.color,
            transform: `rotate(${piece.rotation}deg) scale(${piece.scale})`,
            animation: `fall ${piece.animationDuration}s ${piece.delay}s ease-in forwards`,
          }}
        />
      ))}
      
      <style jsx>{`
        @keyframes fall {
          0% {
            transform: translateY(-10px) rotate(0deg) scale(1);
            opacity: 1;
          }
          100% {
            transform: translateY(${window.innerHeight + 100}px) rotate(720deg) scale(0.1);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}

export function ConfettiTrigger({ trigger, onComplete }: { trigger: boolean; onComplete?: () => void }) {
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (trigger && !showConfetti) {
      setShowConfetti(true);
      const timer = setTimeout(() => {
        setShowConfetti(false);
        onComplete?.();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [trigger, showConfetti, onComplete]);

  return showConfetti ? <Confetti /> : null;
}
