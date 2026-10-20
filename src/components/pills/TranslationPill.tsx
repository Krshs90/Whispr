import React, { useState, useEffect, useRef } from 'react';
import { Languages, ArrowRight, Loader, Copy, Check, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const QUICK_LANGS = [
  { code: 'Spanish', label: 'Spanish' },
  { code: 'Japanese', label: 'Japanese' },
  { code: 'French', label: 'French' },
  { code: 'German', label: 'German' },
  { code: 'Chinese', label: 'Chinese' },
  { code: 'Korean', label: 'Korean' },
];

const MORE_LANGS = [
  { code: 'Italian', label: 'Italian' },
  { code: 'Portuguese', label: 'Portuguese' },
  { code: 'Arabic', label: 'Arabic' },
  { code: 'Hindi', label: 'Hindi' },
  { code: 'Russian', label: 'Russian' },
  { code: 'Spanish and Japanese', label: 'Spanish + Japanese' },
];

interface TranslationEntry {
  language: string;
  langLabel?: string;
  code?: string;
  langCode?: string;
  translatedText: string;
  pronunciation?: string;
  phonetic?: string;
}

export function TranslationPill({ data }: { data?: any } = {}) {
  const [inputText, setInputText] = useState<string>(data?.sourceText || data?.text || '');
  const [targetLang, setTargetLang] = useState<string>(data?.targetLanguage || data?.target_language || 'Spanish');
  const [translations, setTranslations] = useState<TranslationEntry[]>(data?.translations || []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Sync incoming AI tool result data
  useEffect(() => {
    if (data?.sourceText || data?.text) {
      setInputText(data.sourceText || data.text);
    }
    if (data?.targetLanguage || data?.target_language) {
      setTargetLang(data.targetLanguage || data.target_language);
    }
    if (Array.isArray(data?.translations) && data.translations.length > 0) {
      setTranslations(data.translations);
      setError('');
    }
  }, [data]);

  const translateWithLang = async (lang: string) => {
    const text = inputText.trim();
    if (!text || loading) return;

    setLoading(true);
    setError('');

    try {
      const resStr = await window.electronAPI?.executeTool?.('get_translation', {
        text,
        target_language: lang,
        target_languages: lang
      }, {});
      if (resStr) {
        const parsed = typeof resStr === 'string' ? JSON.parse(resStr) : resStr;
        if (Array.isArray(parsed?.translations) && parsed.translations.length > 0) {
          setTranslations(parsed.translations);
        } else if (parsed?.error) {
          setError(parsed.error);
        }
      }
    } catch {
      setError('Translation failed. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectLanguage = (lang: string) => {
    setTargetLang(lang);
    setIsDropdownOpen(false);
    if (inputText.trim()) {
      translateWithLang(lang);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey || !e.shiftKey)) {
      e.preventDefault();
      translateWithLang(targetLang);
    }
  };

  const handleCopy = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 1500);
  };

  const isMoreSelected = MORE_LANGS.some(l => l.code.toLowerCase() === targetLang.toLowerCase());

  return (
    <div
      onWheel={e => e.stopPropagation()}
      style={{
        width: '100%',
        maxHeight: 380,
        overflowY: 'auto',
        background: '#1C1C1E',
        padding: '16px 18px',
        display: 'flex', flexDirection: 'column', gap: 10,
        boxSizing: 'border-box', borderRadius: 16,
      }}
    >
      {/* Header bar: Auto-Detect -> Target Language Chips */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Languages size={15} color="#4ADE80" />
            <span style={{ fontSize: 12, color: '#8A8A92', fontWeight: 600 }}>Auto-Detect</span>
            <ArrowRight size={12} color="#666" />
            <span style={{ fontSize: 12, color: '#FFFFEB', fontWeight: 700 }}>{targetLang}</span>
          </div>
          {loading && <Loader size={13} color="#4ADE80" style={{ animation: 'spin 1s linear infinite' }} />}
        </div>

        {/* Quick Language Selection Chips */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, alignItems: 'center' }}>
          {QUICK_LANGS.map(l => {
            const isSelected = targetLang.toLowerCase() === l.code.toLowerCase();
            return (
              <button
                key={l.code}
                onClick={() => handleSelectLanguage(l.code)}
                style={{
                  background: isSelected ? '#4ADE80' : '#26262B',
                  color: isSelected ? '#111' : '#AAA',
                  border: isSelected ? '1px solid #4ADE80' : '1px solid #333',
                  borderRadius: 6,
                  padding: '3px 8px',
                  fontSize: 11,
                  fontWeight: isSelected ? 700 : 500,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {l.label}
              </button>
            );
          })}

          {/* More Languages Dropdown */}
          <div style={{ position: 'relative' }} ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              style={{
                background: isMoreSelected ? '#4ADE80' : '#26262B',
                color: isMoreSelected ? '#111' : '#AAA',
                border: isMoreSelected ? '1px solid #4ADE80' : '1px solid #333',
                borderRadius: 6,
                padding: '3px 8px',
                fontSize: 11,
                fontWeight: isMoreSelected ? 700 : 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 4
              }}
            >
              <span>{isMoreSelected ? targetLang : 'More'}</span>
              <ChevronDown size={11} style={{ transform: isDropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
            </button>

            <AnimatePresence>
              {isDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.95 }}
                  animate={{ opacity: 1, y: 4, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.95 }}
                  transition={{ duration: 0.12 }}
                  style={{
                    position: 'absolute',
                    top: '100%',
                    right: 0,
                    background: '#1A1A1E',
                    border: '1px solid #383840',
                    borderRadius: 8,
                    padding: 4,
                    zIndex: 60,
                    boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
                    minWidth: 140,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2
                  }}
                >
                  {MORE_LANGS.map(m => (
                    <div
                      key={m.code}
                      onClick={() => handleSelectLanguage(m.code)}
                      style={{
                        padding: '6px 10px',
                        borderRadius: 5,
                        fontSize: 11,
                        fontWeight: targetLang.toLowerCase() === m.code.toLowerCase() ? 700 : 400,
                        color: targetLang.toLowerCase() === m.code.toLowerCase() ? '#FFFFEB' : '#AAA',
                        background: targetLang.toLowerCase() === m.code.toLowerCase() ? '#2E2E36' : 'transparent',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = '#2E2E36'}
                      onMouseLeave={e => e.currentTarget.style.background = targetLang.toLowerCase() === m.code.toLowerCase() ? '#2E2E36' : 'transparent'}
                    >
                      <span>{m.label}</span>
                      {targetLang.toLowerCase() === m.code.toLowerCase() && <Check size={12} color="#4ADE80" />}
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Input */}
      <textarea
        ref={textareaRef}
        value={inputText}
        onChange={e => setInputText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Enter text to translate..."
        rows={2}
        style={{
          background: '#121215', border: '1px solid #2A2A30', borderRadius: 10,
          color: '#F5F5EB', fontSize: 13, padding: '9px 12px',
          resize: 'none', fontFamily: 'inherit', outline: 'none', lineHeight: 1.45,
        }}
      />

      {/* Translate button */}
      <button
        onClick={() => translateWithLang(targetLang)}
        disabled={!inputText.trim() || loading}
        style={{
          background: loading || !inputText.trim() ? '#252529' : '#4ADE80',
          color: loading || !inputText.trim() ? '#8A8A92' : '#111',
          border: 'none', borderRadius: 8, padding: '8px',
          fontSize: 12, fontWeight: 700, cursor: loading || !inputText.trim() ? 'default' : 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          fontFamily: 'inherit', transition: 'background 0.15s',
        }}
      >
        {loading ? <Loader size={13} style={{ animation: 'spin 1s linear infinite' }} /> : null}
        {loading ? 'Translating…' : 'Translate'}
      </button>

      {/* Error */}
      {error && (
        <div style={{
          background: 'rgba(232, 90, 74, 0.1)', border: '1px solid rgba(232, 90, 74, 0.3)',
          borderRadius: 10, padding: '8px 12px', fontSize: 12, color: '#E85A4A'
        }}>
          {error}
        </div>
      )}

      {/* Multi-Language Native Script + Pronunciation Cards */}
      {translations.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {translations.map((item, idx) => {
            const langLabel = item.language || item.langLabel || 'Translation';
            const pron = item.pronunciation || item.phonetic;
            return (
              <div
                key={idx}
                style={{
                  background: '#121215',
                  border: '1px solid #2C2C32',
                  borderRadius: 10,
                  padding: '10px 12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 4,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{
                    fontSize: 10, fontWeight: 700, color: '#4ADE80',
                    textTransform: 'uppercase', letterSpacing: '0.05em'
                  }}>
                    {langLabel}
                  </span>
                  <button
                    onClick={() => handleCopy(item.translatedText, idx)}
                    style={{
                      background: 'transparent', border: 'none', color: '#888',
                      cursor: 'pointer', padding: 2, display: 'flex', alignItems: 'center', gap: 4, fontSize: 10
                    }}
                    title="Copy translation"
                  >
                    {copiedIdx === idx ? <Check size={12} color="#4ADE80" /> : <Copy size={12} />}
                  </button>
                </div>
                <div style={{ fontSize: 15, color: '#FFFFEB', fontWeight: 600, lineHeight: 1.45 }}>
                  {item.translatedText}
                </div>
                {pron && (
                  <div style={{ fontSize: 11, color: '#9A9AA2', fontStyle: 'italic' }}>
                    {pron}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export const translationPillMeta = { name: 'Translation', height: 320, keywords: ['translate', 'translation', 'language', 'spanish', 'japanese', 'french'] };
