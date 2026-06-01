import React, { useEffect, useState, useRef } from 'react';
import { __ } from '@wordpress/i18n';
import confetti from 'canvas-confetti';
import SvgLoader from '@Components/SvgLoader';
import LoadingIcon from '@AC/LoadingIcon';

const PROGRESS_MESSAGES = [
  { percent: 5, message: __('Initializing upgrade process...', 'smashballoon-wpchat-livechat-customer-support') },
  { percent: 10, message: __('Preparing system checks...', 'smashballoon-wpchat-livechat-customer-support') },
  { percent: 15, message: __('Verifying requirements...', 'smashballoon-wpchat-livechat-customer-support') },
  { percent: 20, message: __('Connecting to upgrade server...', 'smashballoon-wpchat-livechat-customer-support') },
  { percent: 25, message: __('Downloading WPChat Pro...', 'smashballoon-wpchat-livechat-customer-support') },
  { percent: 35, message: __('Download in progress...', 'smashballoon-wpchat-livechat-customer-support') },
  { percent: 45, message: __('Verifying package integrity...', 'smashballoon-wpchat-livechat-customer-support') },
  { percent: 50, message: __('Extracting Pro features...', 'smashballoon-wpchat-livechat-customer-support') },
  { percent: 55, message: __('Installing Pro version...', 'smashballoon-wpchat-livechat-customer-support') },
  { percent: 60, message: __('Configuring advanced features...', 'smashballoon-wpchat-livechat-customer-support') },
  { percent: 65, message: __('Migrating your settings...', 'smashballoon-wpchat-livechat-customer-support') },
  { percent: 70, message: __('Updating database schema...', 'smashballoon-wpchat-livechat-customer-support') },
  { percent: 75, message: __('Activating Pro modules...', 'smashballoon-wpchat-livechat-customer-support') },
  { percent: 80, message: __('Optimizing performance...', 'smashballoon-wpchat-livechat-customer-support') },
  { percent: 85, message: __('Finalizing installation...', 'smashballoon-wpchat-livechat-customer-support') },
  { percent: 90, message: __('Running final checks...', 'smashballoon-wpchat-livechat-customer-support') },
  { percent: 95, message: __('Almost there...', 'smashballoon-wpchat-livechat-customer-support') },
  { percent: 100, message: __('Upgrade completed successfully! 🎉', 'smashballoon-wpchat-livechat-customer-support') }
];

export default function UpgradeProgress({
  isActive = false,
  realProgress = null,
  onComplete,
  className = ''
}) {
  const [fakeProgress, setFakeProgress] = useState(0);
  const [currentMessage, setCurrentMessage] = useState('');
  const [showConfetti, setShowConfetti] = useState(false);
  const progressIntervalRef = useRef(null);
  const messageIndexRef = useRef(0);
  const completedRef = useRef(false);

  useEffect(() => {
    if (!isActive) {
      // Reset when not active
      setFakeProgress(0);
      setCurrentMessage('');
      setShowConfetti(false);
      messageIndexRef.current = 0;
      completedRef.current = false;
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      return;
    }

    // Check if we already have completed progress from backend
    if (realProgress?.percentage === 100 && realProgress?.status === 'completed') {
      if (!completedRef.current) {
        completedRef.current = true;
        setFakeProgress(100);
        setCurrentMessage(realProgress.message);
        setShowConfetti(true);
        triggerConfetti();

        // Reload after 5 seconds as requested
        setTimeout(() => {
          if (onComplete) {
            onComplete();
          } else {
            window.location.reload();
          }
        }, 5000);
      }
      return;
    }

    // Start fake progress animation
    let currentProgress = 0;

    const updateProgress = () => {
      // Progress at a rate to complete in ~90 seconds (18 steps * 5 seconds)
      // 100% / 90 seconds = ~1.11% per second
      // With 100ms intervals, that's ~0.111% per tick
      let increment = 0.111;

      // Slightly vary speed for realism
      if (currentProgress > 20 && currentProgress < 40) {
        increment = 0.095; // Slower during download
      } else if (currentProgress > 50 && currentProgress < 70) {
        increment = 0.105; // Slower during installation
      } else if (currentProgress > 90) {
        increment = 0.08; // Much slower near the end
      }

      currentProgress = Math.min(currentProgress + increment, 99); // Stop at 99% until backend completes
      setFakeProgress(currentProgress);

      // Update message based on progress
      const messageItem = PROGRESS_MESSAGES.find((item, index) => {
        if (currentProgress >= item.percent && index > messageIndexRef.current) {
          messageIndexRef.current = index;
          return true;
        }
        return false;
      });

      if (messageItem) {
        setCurrentMessage(messageItem.message);
      }
    };

    progressIntervalRef.current = setInterval(updateProgress, 100);

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, [isActive, realProgress, onComplete]);

  const triggerConfetti = () => {
    // Fire confetti from multiple angles
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 999999 };

    function randomInRange(min, max) {
      return Math.random() * (max - min) + min;
    }

    const interval = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);

      // Confetti from the left
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
      });

      // Confetti from the right
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
      });
    }, 250);

    // Also fire a big burst in the center
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { x: 0.5, y: 0.6 },
      colors: ['#26A69A', '#42A5F5', '#66BB6A', '#FFA726', '#AB47BC'],
      zIndex: 999999
    });
  };

  if (!isActive) {
    return null;
  }

  const displayProgress = Math.round(fakeProgress);
  const isCompleted = displayProgress === 100;

  return (
    <div className={`wpchat:bg-white wpchat:border wpchat:border-gray-200 wpchat:rounded-lg wpchat:p-6 wpchat:shadow-lg ${className}`}>
      <div className="wpchat:flex wpchat:items-center wpchat:gap-4 wpchat:mb-4">
        <div className="wpchat:flex-shrink-0">
          {isCompleted ? (
            <SvgLoader
              name="check"
              className="wpchat:h-6 wpchat:w-6 wpchat:text-green-600"
            />
          ) : (
            <LoadingIcon
              size="wpchat:h-6 wpchat:w-6"
              className="wpchat:text-blue-600"
            />
          )}
        </div>
        <div className="wpchat:flex-1">
          <h4 className="wpchat:m-0 wpchat:text-lg wpchat:font-semibold wpchat:text-gray-900">
            {isCompleted
              ? __('🎉 Upgrade Complete!', 'smashballoon-wpchat-livechat-customer-support')
              : __('Upgrading to WPChat Pro', 'smashballoon-wpchat-livechat-customer-support')
            }
          </h4>
          <p className="wpchat:m-0 wpchat:mt-1 wpchat:text-sm wpchat:text-gray-600">
            {currentMessage || __('Preparing upgrade...', 'smashballoon-wpchat-livechat-customer-support')}
          </p>
        </div>
        <div className="wpchat:text-lg wpchat:font-bold wpchat:text-gray-700">
          {displayProgress}%
        </div>
      </div>

      {/* Progress bar */}
      <div className="wpchat:relative wpchat:w-full wpchat:bg-gray-200 wpchat:rounded-full wpchat:h-3 wpchat:overflow-hidden">
        <div
          className={`wpchat:h-full wpchat:rounded-full wpchat:transition-all wpchat:duration-300 wpchat:ease-out ${
            isCompleted ? 'wpchat:bg-green-500' : 'wpchat:bg-blue-500'
          }`}
          style={{ width: `${displayProgress}%` }}
        >
          {/* Animated stripes */}
          {!isCompleted && (
            <div className="wpchat:absolute wpchat:inset-0 wpchat:opacity-20">
              <div
                className="wpchat:h-full wpchat:w-full"
                style={{
                  backgroundImage: 'linear-gradient(45deg, rgba(255,255,255,.15) 25%, transparent 25%, transparent 50%, rgba(255,255,255,.15) 50%, rgba(255,255,255,.15) 75%, transparent 75%, transparent)',
                  backgroundSize: '1rem 1rem',
                  animation: 'move 1s linear infinite'
                }}
              />
            </div>
          )}
        </div>
      </div>

      {isCompleted && (
        <div className="wpchat:mt-4 wpchat:p-3 wpchat:bg-green-50 wpchat:border wpchat:border-green-200 wpchat:rounded-md">
          <p className="wpchat:text-sm wpchat:text-green-800 wpchat:text-center wpchat:font-medium">
            {__('🚀 Welcome to WPChat Pro! Reloading page to activate all features...', 'smashballoon-wpchat-livechat-customer-support')}
          </p>
        </div>
      )}

      <style jsx>{`
        @keyframes move {
          0% {
            background-position: 0 0;
          }
          100% {
            background-position: 1rem 1rem;
          }
        }
      `}</style>
    </div>
  );
}