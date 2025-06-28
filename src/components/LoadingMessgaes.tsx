import React, { useState, useEffect } from 'react';
import { Loader2, Clock, Brain, CheckCircle } from 'lucide-react';

const LoadingMessages = () => {
  const [messageIndex, setMessageIndex] = useState(0);
  const [dots, setDots] = useState('');

  // Rotating messages to keep users engaged
  const messages = [
    "Processing your submission...",
    "Our AI agent is analyzing your data...", 
    "Running comprehensive evaluation...",
    "Almost there, finalizing results...",
    "Generating your personalized insights..."
  ];

  // Animated dots effect
  useEffect(() => {
    const dotsInterval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 500);

    return () => clearInterval(dotsInterval);
  }, []);

  // Rotate messages every 3 seconds
  useEffect(() => {
    const messageInterval = setInterval(() => {
      setMessageIndex(prev => (prev + 1) % messages.length);
    }, 3000);

    return () => clearInterval(messageInterval);
  }, []);

  // Example usage variations
  const LoadingVariant1 = () => (
    <div className="flex items-center gap-3 px-6 py-4 bg-blue-50 border border-blue-200 rounded-lg">
      <Loader2 className="animate-spin h-5 w-5 text-blue-600" />
      <div>
        <span className="font-medium text-blue-900">
          {messages[messageIndex]}{dots}
        </span>
        <p className="text-sm text-blue-700 mt-1">
          This may take 30-60 seconds. Thank you for your patience.
        </p>
      </div>
    </div>
  );

  const LoadingVariant2 = () => (
    <div className="flex flex-col items-center gap-4 px-8 py-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl">
      <div className="flex items-center gap-3">
        <Brain className="animate-pulse h-6 w-6 text-indigo-600" />
        <Loader2 className="animate-spin h-5 w-5 text-blue-600" />
      </div>
      <div className="text-center">
        <h3 className="font-semibold text-gray-900 mb-2">
          Processing Your Submission
        </h3>
        <p className="text-gray-600 mb-3">
          Our AI agent is working hard to analyze and evaluate your data{dots}
        </p>
        <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
          <Clock className="h-4 w-4" />
          <span>Expected time: 30-90 seconds</span>
        </div>
      </div>
    </div>
  );

  const LoadingVariant3 = () => (
    <div className="px-6 py-4 bg-white border-l-4 border-blue-500 shadow-sm">
      <div className="flex items-start gap-3">
        <Loader2 className="animate-spin h-5 w-5 text-blue-600 mt-0.5" />
        <div>
          <h4 className="font-medium text-gray-900 mb-1">
            Evaluating Your Submission
          </h4>
          <p className="text-gray-600 mb-2">
            {messages[messageIndex]}{dots}
          </p>
          <p className="text-sm text-gray-500">
            ⏱️ Please allow 30-90 seconds for completion • Thank you for your patience
          </p>
        </div>
      </div>
    </div>
  );

  const LoadingVariant4 = () => (
    <div className="flex items-center justify-between px-6 py-4 bg-gray-50 rounded-lg border">
      <div className="flex items-center gap-3">
        <div className="relative">
          <Loader2 className="animate-spin h-5 w-5 text-blue-600" />
        </div>
        <div>
          <span className="font-medium text-gray-900">
            Processing submission{dots}
          </span>
          <p className="text-sm text-gray-600">
            Our AI is analyzing your data thoroughly
          </p>
        </div>
      </div>
      <div className="text-right">
        <div className="text-sm text-gray-500">Est. time</div>
        <div className="text-sm font-medium text-gray-700">30-90 sec</div>
      </div>
    </div>
  );

  return (
    <div className="space-y-8 p-6">
      <div>
        <h2 className="text-xl font-bold mb-4">Option 1: Rotating Messages</h2>
        <LoadingVariant1 />
      </div>
      
      <div>
        <h2 className="text-xl font-bold mb-4">Option 2: Centered with Icons</h2>
        <LoadingVariant2 />
      </div>
      
      <div>
        <h2 className="text-xl font-bold mb-4">Option 3: Left Border Style</h2>
        <LoadingVariant3 />
      </div>
      
      <div>
        <h2 className="text-xl font-bold mb-4">Option 4: Time Estimate</h2>
        <LoadingVariant4 />
      </div>

      <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h3 className="font-semibold text-yellow-800 mb-2">💡 Recommended Messages:</h3>
        <ul className="text-sm text-yellow-700 space-y-1">
          <li>• Set clear expectations (30-90 seconds)</li>
          <li>• Explain what's happening ("AI agent is analyzing...")</li>
          <li>• Show appreciation ("Thank you for your patience")</li>
          <li>• Use engaging animations and visual feedback</li>
          <li>• Consider rotating messages for longer waits</li>
        </ul>
      </div>
    </div>
  );
};

export default LoadingMessages;