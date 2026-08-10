import { useState, useRef } from 'react';
import { Languages, ArrowDown, Loader } from 'lucide-react';

const LANGUAGES = [
  { code: 'es', label: 'Spanish' },
  { code: 'fr', label: 'French' },
  { code: 'de', label: 'German' },
  { code: 'ja', label: 'Japanese' },
  { code: 'zh', label: 'Chinese' },
  { code: 'pt', label: 'Portuguese' },
  { code: 'ar', label: 'Arabic' },
  { code: 'hi', label: 'Hindi' },
  { code: 'ko', label: 'Korean' },
  { code: 'ru', label: 'Russian' },
  { code: 'it', label: 'Italian' },
];

export function TranslationPill() {
  const [inputText, setInputText] = useState('');
  const [targetLang, setTargetLang] = useState('es');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const translate = async () => {
    const text = inputText.trim();
    if (!text || loading) return;
    const langLabel = LANGUAGES.find(l => l.code === targetLang)?.label || targetLang;

    setLoading(true);
    setResult('');
    setError('');

    try {
      const defaultModel = localStorage.getItem('whispr_default_model') || 'llama3.2';
      const apiKeys = {};

      // Use the chat API directly for translation
      let translated = '';
      const api = (window as any).electronAPI;
      if (!api) throw new Error('electronAPI not available');

      await new Promise<void>((resolve, reject) => {
        const cleanToken = api.onChatToken((token: string) => {
          if (token !== '__CLEAR_LAST__') translated += token;
          setResult(translated);
        });
        const cleanEnd = api.onChatEnd(() => {
          cleanToken();
          cleanEnd();
          resolve();
        });

        api.chatRequest({
          messages: [
            { role: 'user', content: `Translate the following text to ${langLabel}. Respond with ONLY the translation, no explanation or extra text:\n\n"${text}"` }
          ],
          defaultModel,
          apiKeys,
          userData: {}
        });

        // Safety timeout
        setTimeout(() => {
          cleanToken();
          cleanEnd();
          reject(new Error('Translation timed out'));
        }, 30000);
      });
    } catch (e: any) {
      setError('Translation failed. Make sure Ollama is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      translate();
    }
  };

  const surface = '#1C1C1E';
  const inputBg = '#111113';
  const textPrimary = '#F5F5EB';
  const textMuted = '#6A6A70';

  return (
    <div style={{
      width: '100%',
      background: surface,
      padding: '16px',
      display: 'flex', flexDirection: 'column', gap: 10,
      boxSizing: 'border-box', borderRadius: 16,
    }}>
      {/* Language selector row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Languages size={13} color={textMuted} />
          <span style={{ fontSize: 11, color: textMuted, fontWeight: 600 }}>Auto-detect</span>
        </div>
        <ArrowDown size={10} color={textMuted} style={{ transform: 'rotate(-90deg)', flexShrink: 0 }} />
        <select
          value={targetLang}
          onChange={e => setTargetLang(e.target.value)}
          style={{
            background: '#252527', border: '1px solid #333', borderRadius: 6,
            color: textPrimary, fontSize: 11, padding: '3px 6px', cursor: 'pointer',
            fontFamily: 'inherit', outline: 'none',
          }}
        >
          {LANGUAGES.map(l => (
            <option key={l.code} value={l.code}>{l.label}</option>
          ))}
        </select>
      </div>

      {/* Input */}
      <textarea
        ref={textareaRef}
        value={inputText}
        onChange={e => setInputText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Enter text to translate..."
        rows={3}
        style={{
          background: inputBg, border: '1px solid #2A2A2A', borderRadius: 10,
          color: textPrimary, fontSize: 13, padding: '10px 12px',
          resize: 'none', fontFamily: 'inherit', outline: 'none', lineHeight: 1.5,
        }}
      />

      {/* Translate button */}
      <button
        onClick={translate}
        disabled={!inputText.trim() || loading}
        style={{
          background: loading || !inputText.trim() ? '#252527' : '#4ADE80',
          color: loading || !inputText.trim() ? textMuted : '#111',
          border: 'none', borderRadius: 8, padding: '8px',
          fontSize: 12, fontWeight: 600, cursor: loading || !inputText.trim() ? 'default' : 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          fontFamily: 'inherit', transition: 'background 0.15s',
        }}
      >
        {loading ? <Loader size={13} style={{ animation: 'spin 1s linear infinite' }} /> : null}
        {loading ? 'Translating…' : 'Translate  (Ctrl+Enter)'}
      </button>

      {/* Result */}
      {(result || error) && (
        <div style={{
          background: inputBg, border: `1px solid ${error ? '#E85A4A33' : '#2A2A2A'}`,
          borderRadius: 10, padding: '10px 12px', minHeight: 52,
        }}>
          {error ? (
            <div style={{ fontSize: 12, color: '#E85A4A' }}>{error}</div>
          ) : (
            <div style={{ fontSize: 13, color: '#4ADE80', lineHeight: 1.6, fontWeight: 500 }}>{result}</div>
          )}
        </div>
      )}

      <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export const translationPillMeta = { name: 'Translation', height: 340, keywords: ['translate', 'translation', 'language'] };

