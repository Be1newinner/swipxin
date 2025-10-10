import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { ChevronLeft, ChevronRight, Video, Zap, Crown, Coins } from 'lucide-react';

const slides = [
  {
    icon: Video,
    title: "Random Video Chats",
    description: "Connect with people worldwide through instant 1:1 video calls. Swipe to meet someone new anytime!",
    image: "video chat connection"
  },
  {
    icon: Zap,
    title: "Simple Swipe Controls",
    description: "Swipe right to connect with the next person or swipe left to stop and return to the home screen. It's that easy!",
    image: "swipe gesture mobile"
  },
  {
    icon: Crown,
    title: "Premium Features",
    description: "Upgrade to Premium to filter by specific countries and gender preferences for more targeted connections.",
    image: "premium features crown"
  },
  {
    icon: Coins,
    title: "Token System",
    description: "Purchase tokens (₹100 = 150 tokens) to unlock Premium features. 8 tokens are used when premium users swipe.",
    image: "token coins currency"
  }
];

export function Onboarding({ onComplete }) {
  const [currentSlide, setCurrentSlide] = useState(0);

  const nextSlide = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      onComplete();
    }
  };

  const prevSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const goToSlide = (index) => {
    setCurrentSlide(index);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-xl flex items-center justify-center">
            <Video className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-semibold">Swipx</span>
        </div>
        <Button variant="ghost" onClick={onComplete} className="text-muted-foreground">
          Skip
        </Button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <Card className="glass w-full max-w-md p-8 text-center space-y-6">
          {/* Icon */}
          <div className="w-20 h-20 bg-gradient-to-br from-primary to-accent rounded-3xl flex items-center justify-center mx-auto">
            {React.createElement(slides[currentSlide].icon, {
              className: "w-10 h-10 text-white"
            })}
          </div>

          {/* Content */}
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">
              {slides[currentSlide].title}
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              {slides[currentSlide].description}
            </p>
          </div>

          {/* Illustration Placeholder */}
          <div className="w-full h-48 bg-gradient-to-br from-primary/10 to-accent/10 rounded-2xl flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <div className="w-16 h-16 bg-primary/20 rounded-xl flex items-center justify-center mx-auto mb-3">
                {React.createElement(slides[currentSlide].icon, {
                  className: "w-8 h-8 text-primary"
                })}
              </div>
              <p className="text-sm">Illustration: {slides[currentSlide].image}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Bottom Controls */}
      <div className="p-6 space-y-4">
        {/* Progress Dots */}
        <div className="flex justify-center gap-2">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-3 h-3 rounded-full transition-colors ${
                index === currentSlide ? 'bg-primary' : 'bg-muted'
              }`}
            />
          ))}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between gap-4">
          <Button
            variant="outline"
            onClick={prevSlide}
            disabled={currentSlide === 0}
            className="flex-1"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <Button onClick={nextSlide} className="flex-1">
            {currentSlide === slides.length - 1 ? 'Get Started' : 'Next'}
            {currentSlide < slides.length - 1 && <ChevronRight className="w-4 h-4 ml-2" />}
          </Button>
        </div>
      </div>
    </div>
  );
}