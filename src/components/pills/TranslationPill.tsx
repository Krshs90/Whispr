import { Languages, ArrowRight } from 'lucide-react';

export function TranslationPill() {
  const source = 'Hello, how can I help you?';
  const target = 'Bonjour, comment puis-je vous aider?';

  return (
    <div style={{
      width: '100%',
      background: '#1A1A1A',
      padding: '20px',
      display: 'flex', flexDirection: 'column', boxSizing: 'border-box',
      borderRadius: 16, border: '1px solid #2A2A2A',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8,
          background: '#4ADE8022', display: 'flex', justifyContent: 'center', alignItems: 'center',
          flexShrink: 0,
        }}>
          <Languages size={16} color="#4ADE80" />
        </div>
        <span style={{ fontSize: 13, fontWeight: 600, color: '#A0A0A5', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          Translator
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {/* Source Language Box */}
        <div style={{
          background: '#0D0D0D', borderRadius: 12, padding: '16px',
          border: '1px solid #2A2A2A', display: 'flex', flexDirection: 'column', minHeight: 80
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 11, color: '#6A6A70', fontWeight: 600, textTransform: 'uppercase' }}>
            <span>Detect Language</span>
          </div>
          <div style={{ fontSize: 15, color: '#FFFFEB', lineHeight: 1.5 }}>
            {source}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', padding: '4px 0', opacity: 0.5 }}>
          <ArrowRight size={16} color="#FFFFEB" style={{ transform: 'rotate(90deg)' }} />
        </div>

        {/* Target Language Box */}
        <div style={{
          background: '#0D0D0D', borderRadius: 12, padding: '16px',
          border: '1px solid #2A2A2A', display: 'flex', flexDirection: 'column', minHeight: 80
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 11, color: '#4ADE80', fontWeight: 600, textTransform: 'uppercase' }}>
            <span>Translation</span>
          </div>
          <div style={{ fontSize: 15, color: '#4ADE80', lineHeight: 1.5, fontWeight: 500 }}>
            {target}
          </div>
        </div>
      </div>
      <div style={{ marginTop: 16, fontSize: 11, color: '#555', textAlign: 'center' }}>
        Translating locally via Whispr LLM Model
      </div>
    </div>
  );
}

export const translationPillMeta = { name: 'Translation', height: 340, keywords: ['translate', 'translation', 'language'] };
