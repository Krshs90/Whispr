import React from 'react';

export const s: Record<string, React.CSSProperties> = {
  container: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    background: '#1A1A1A', zIndex: 100, display: 'flex', color: '#FFFFEB'
  },
  sidebar: {
    width: 240, background: '#121212', borderRight: '1px solid #333',
    padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: 6,
    boxSizing: 'border-box'
  },
  backBtn: {
    display: 'flex', alignItems: 'center', gap: 8, background: 'transparent',
    border: 'none', color: '#888', cursor: 'pointer', padding: '8px 12px',
    borderRadius: 8, marginBottom: 16, width: 'fit-content', transition: 'all 0.2s',
  },
  settingsTitle: {
    fontSize: 20, fontWeight: 600, margin: '0 0 16px 12px', letterSpacing: '-0.02em'
  },
  tabList: { display: 'flex', flexDirection: 'column', gap: 4 },
  tabItem: {
    display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
    border: 'none', borderRadius: 8, cursor: 'pointer', transition: 'all 0.2s',
    fontSize: 14, fontWeight: 500, textAlign: 'left'
  },
  content: {
    flex: 1, padding: '40px 60px', overflowY: 'auto', boxSizing: 'border-box'
  },
  sectionTitle: {
    fontSize: 16, fontWeight: 600, borderBottom: '1px solid #333',
    paddingBottom: 8, marginBottom: 16, marginTop: 40, color: '#FFF'
  },
  sectionDesc: {
    fontSize: 13, color: '#888', marginBottom: 20, lineHeight: 1.5
  },
  field: { marginBottom: 24 },
  label: { display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 8, color: '#CCC' },
  input: {
    width: '100%', maxWidth: 400, background: '#222', border: '1px solid #444',
    padding: '10px 14px', borderRadius: 8, color: '#FFF', fontSize: 14,
    outline: 'none', boxSizing: 'border-box', transition: 'border 0.2s'
  },
  hint: { display: 'block', fontSize: 12, color: '#666', marginTop: 6 },
  link: { color: '#4DA6FF', textDecoration: 'none', fontSize: 13 },
};

export function Toggle({ label, value, onChange }: { label: string, value: boolean, onChange: (v: boolean) => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', maxWidth: 400, padding: '12px 0', borderBottom: '1px solid #333' }}>
      <span style={{ fontSize: 14 }}>{label}</span>
      <div 
        onClick={() => onChange(!value)}
        style={{
          width: 40, height: 24, borderRadius: 12, background: value ? '#FFF' : '#333',
          position: 'relative', cursor: 'pointer', transition: 'all 0.2s'
        }}
      >
        <div style={{
          position: 'absolute', top: 2, left: value ? 18 : 2,
          width: 20, height: 20, borderRadius: 10, background: value ? '#000' : '#888',
          transition: 'all 0.2s'
        }} />
      </div>
    </div>
  );
}
