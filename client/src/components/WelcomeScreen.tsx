import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { FaTruck } from "react-icons/fa";

interface WelcomeScreenProps {
  companyName: string;
  onAnimationComplete?: () => void;
}

export function WelcomeScreen({ companyName, onAnimationComplete }: WelcomeScreenProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      onAnimationComplete?.();
    }, 3000);

    return () => clearTimeout(timer);
  }, [onAnimationComplete]);

  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-zinc-900 flex items-center justify-center z-50"
    >
      <div className="text-center space-y-8">
        {/* Logo Animation */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{
            type: "spring",
            stiffness: 260,
            damping: 20
          }}
          className="relative"
        >
          <div className="relative">
            {/* Background Circle */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="absolute inset-0 bg-primary/20 rounded-full"
              style={{ width: '180px', height: '180px', top: '-24px', left: '-24px' }}
            />

            {/* Forklift Icon */}
            <motion.div 
              animate={{
                y: [0, -8, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatType: "reverse",
                ease: "easeInOut"
              }}
              className="relative z-10"
            >
              <FaTruck className="w-32 h-32 text-primary" />
            </motion.div>
          </div>
        </motion.div>

        {/* Text Animations */}
        <div className="space-y-4">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-4xl md:text-5xl font-bold"
          >
            <span className="bg-gradient-to-r from-primary to-primary/60 text-transparent bg-clip-text">
              Forklift Master
            </span>
          </motion.h1>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="flex items-center justify-center gap-2 text-xl text-primary/80"
          >
            <span>{companyName}</span>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}