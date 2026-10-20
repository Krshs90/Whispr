import { motion } from 'framer-motion';

export function OrbIndicator() {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.7 }} 
      animate={{ opacity: 1, scale: 1 }} 
      exit={{ opacity: 0, scale: 0.7 }} 
      transition={{ duration: 0.28, ease: 'easeOut' }}
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        pointerEvents: 'none'
      }}
    >
      <div style={{ 
        width: 20, 
        height: 20, 
        borderRadius: '50%', 
        background: '#FFFFEB', 
        boxShadow: '0 0 20px 5px rgba(255,255,235,0.65)' 
      }} />
    </motion.div>
  );
}
