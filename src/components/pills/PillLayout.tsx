import React from 'react';

// Shared base styling for all dynamic pills
export interface PillLayoutProps {
  children: React.ReactNode;
  height?: number;
}

export function PillLayout({ children, height = 80 }: PillLayoutProps) {
  return (
    <div style={{
      width: '100%',
      minHeight: height,
      height: height,
      display: 'flex',
      alignItems: 'center',
      padding: '0 16px',
      boxSizing: 'border-box',
      overflow: 'hidden',
    }}>
      {children}
    </div>
  );
}

// Shared mini button style
export const miniBtn: React.CSSProperties = {
  width: 24,
  height: 24,
  borderRadius: '50%',
  border: 'none',
  background: 'transparent',
  color: '#FFFFEB',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  cursor: 'pointer',
  padding: 0,
};
