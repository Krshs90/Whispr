import React from 'react';
import { motion } from 'framer-motion';

export function OrbIndicator() {
  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }} 
      transition={{ duration: 0.15 }}
      style={{ width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}
    >
      <div style={{ 
        width: 20, 
        height: 20, 
        borderRadius: '50%', 
        background: '#FFFFEB', 
        boxShadow: '0 0 18px 4px rgba(255,255,235,0.6)' 
      }} />
    </motion.div>
  );
}
