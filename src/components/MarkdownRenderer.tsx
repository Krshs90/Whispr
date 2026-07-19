import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import MathGraph from './MathGraph';

interface MarkdownProps {
  content: string;
}

function preprocessLaTeX(text: string) {
  if (!text) return text;
  
  // Convert \[ \] to $$ $$
  let processed = text.replace(/\\\[([\s\S]*?)\\\]/g, '$$$$$1$$$$');
  // Convert \( \) to $ $
  processed = processed.replace(/\\\(([\s\S]*?)\\\)/g, '$$$1$$');

  // Wrap raw \begin{...} ... \end{...} in $$ if not already
  // We also automatically translate align/align* to aligned because KaTeX does not support align natively in math blocks!
  processed = processed.replace(/\\begin\{(align\*?|equation|pmatrix|bmatrix|vmatrix|cases|eqnarray)\}([\s\S]*?)\\end\{\1\}/g, (match, env, inner) => {
    let safeEnv = env;
    if (env === 'align' || env === 'align*') {
      return `\n\n$$\n\\begin{aligned}${inner}\\end{aligned}\n$$\n\n`;
    }
    return `\n\n$$\n${match}\n$$\n\n`;
  });

  // Cleanup stray or duplicate $$ from LLM formatting quirks
  // Collapse 3 or more $ into $$
  processed = processed.replace(/\${3,}/g, '$$');
  // Collapse $$ followed by whitespace and $$ into just $$
  processed = processed.replace(/\$\$\s+\$\$/g, '$$');

  // Sanitize broken LaTeX: if a $$ block has unclosed braces or broken commands, strip it
  processed = processed.replace(/\$\$([\s\S]*?)\$\$/g, (match, inner) => {
    // Count braces
    const opens = (inner.match(/\{/g) || []).length;
    const closes = (inner.match(/\}/g) || []).length;
    if (opens !== closes) {
      // Broken LaTeX — render as plain text instead of crashing KaTeX
      return `\n\n> ⚠️ *LaTeX rendering error — equation may be incomplete:*\n> \`${inner.trim().substring(0, 200)}\`\n\n`;
    }
    return match;
  });

  return processed;
}

export default function MarkdownRenderer({ content }: MarkdownProps) {
  const processedContent = preprocessLaTeX(content);
  return (
    <div className="markdown-body" style={{ fontSize: 14, lineHeight: 1.7, color: '#FFFFEB', opacity: 0.92, fontFamily: 'system-ui, -apple-system, sans-serif', width: '100%', wordBreak: 'break-word' }}>
      <style dangerouslySetInnerHTML={{__html: `
        .markdown-body p { margin-top: 0; margin-bottom: 12px; }
        .markdown-body p:last-child { margin-bottom: 0; }
        .markdown-body a { color: #4ADE80; text-decoration: none; border-bottom: 1px dotted #4ADE80; }
        .markdown-body strong { color: #FFF; font-weight: 600; }
        .markdown-body em { font-style: italic; opacity: 0.9; }
        .markdown-body ul, .markdown-body ol { margin: 0 0 12px 18px; padding-left: 0; }
        .markdown-body li { margin-bottom: 4px; }
        .markdown-body li::marker { color: #6A6A70; }
        .markdown-body h1, .markdown-body h2, .markdown-body h3 { font-weight: 600; color: #FFF; margin: 20px 0 10px; }

        /* ─── ChatGPT-style Premium KaTeX Rendering ─── */
        .katex-display {
          margin: 20px 0 !important;
          padding: 16px 0 !important;
          overflow-x: auto !important;
          overflow-y: hidden !important;
        }
        .katex-display > .katex {
          font-size: 1.3em !important;
          text-align: center;
        }
        .katex {
          font-size: 1.05em !important;
          color: #FFFFEB !important;
        }
        .katex .mord, .katex .mbin, .katex .mrel, .katex .mopen, .katex .mclose,
        .katex .mpunct, .katex .mop, .katex .minner {
          color: #FFFFEB !important;
        }
        .katex .mop .mop { color: #FFFFEB !important; }
        .katex .katex-html { color: #FFFFEB !important; }

        /* Numbered list styling for step-by-step math explanations */
        .markdown-body ol { counter-reset: step-counter; list-style: none; padding-left: 0; margin-left: 0; }
        .markdown-body ol > li { counter-increment: step-counter; padding-left: 28px; position: relative; margin-bottom: 8px; }
        .markdown-body ol > li::before {
          content: counter(step-counter) ".";
          position: absolute; left: 0; top: 0;
          font-weight: 700; color: #4ADE80; font-size: 14px;
        }
      `}} />
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[[rehypeKatex, { throwOnError: false, errorColor: '#FF8C00', strict: false }]]}
        components={{
          a({ node, href, children, ...props }: any) {
            if (href?.startsWith('action:pullModel:')) {
              return (
                <button
                  onClick={() => window.dispatchEvent(new CustomEvent('open-settings', { detail: 'ai' }))}
                  style={{ background: '#4ADE80', color: '#000', padding: '6px 14px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 13, marginTop: 8, marginRight: 8 }}
                >
                  {children}
                </button>
              );
            }
            return <a href={href} {...props}>{children}</a>;
          },
          code({ node, inline, className, children, ...props }: any) {
            const match = /language-(\w+)/.exec(className || '');
            const codeString = String(children).replace(/\n$/, '');
            
            // ── Interactive graph rendering ──
            if (!inline && match && match[1] === 'graph') {
              const functions = codeString.split('\n').map(l => l.trim()).filter(Boolean);
              return <MathGraph functions={functions} />;
            }
            
            if (!inline && match) {
              return <CodeBlock language={match[1]} code={codeString} />;
            } else if (!inline) {
               return <CodeBlock language="text" code={codeString} />;
            }
            return (
              <code style={{
                background: '#444',
                padding: '2px 6px',
                borderRadius: 4,
                fontFamily: 'monospace',
                fontSize: 13,
                color: '#4ADE80',
                border: '1px solid #555'
              }} {...props}>
                {children}
              </code>
            );
          },
          p({ children }) {
            return <div style={{ marginBottom: 12 }}>{children}</div>;
          }
        }}
      >
        {processedContent}
      </ReactMarkdown>
    </div>
  );
}

function CodeBlock({ language, code }: { language: string, code: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const langConfig: Record<string, { name: string; color: string }> = {
    js: { name: 'JavaScript', color: '#F7DF1E' },
    javascript: { name: 'JavaScript', color: '#F7DF1E' },
    ts: { name: 'TypeScript', color: '#3178C6' },
    typescript: { name: 'TypeScript', color: '#3178C6' },
    jsx: { name: 'React', color: '#61DAFB' },
    tsx: { name: 'React', color: '#61DAFB' },
    python: { name: 'Python', color: '#3572A5' },
    py: { name: 'Python', color: '#3572A5' },
    html: { name: 'HTML', color: '#E34C26' },
    css: { name: 'CSS', color: '#563D7C' },
    json: { name: 'JSON', color: '#CBCB41' },
    bash: { name: 'Terminal', color: '#4ADE80' },
    sh: { name: 'Terminal', color: '#4ADE80' },
    sql: { name: 'SQL', color: '#CC2927' },
    text: { name: 'Text', color: '#888' },
  };

  const lang = langConfig[language.toLowerCase()] || { name: language || 'Code', color: '#888' };

  return (
    <div style={{
      borderRadius: 12,
      overflow: 'hidden',
      margin: '12px 0',
      border: '1px solid #2A2A2A',
      background: '#0D0D0D',
      maxWidth: '100%',
      minWidth: 0,
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '8px 14px',
        background: '#161616',
        borderBottom: '1px solid #2A2A2A',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: lang.color }} />
          <span style={{ fontSize: 12, color: '#888', fontWeight: 500 }}>{lang.name}</span>
        </div>
        <button
          onClick={handleCopy}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            background: 'transparent',
            border: 'none',
            color: copied ? '#4ADE80' : '#666',
            fontSize: 12,
            cursor: 'pointer',
            padding: '3px 8px',
            borderRadius: 6,
            transition: 'color 0.2s',
          }}
        >
          {copied ? <Check size={13} /> : <Copy size={13} />}
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <pre style={{
        margin: 0,
        padding: '16px 18px',
        overflowX: 'auto',
        fontSize: 13,
        lineHeight: 1.6,
        fontFamily: '"Fira Code", "Cascadia Code", "JetBrains Mono", Consolas, monospace',
        color: '#D4D4D4',
        tabSize: 2,
      }}>
        <code>{highlightSyntax(code, language)}</code>
      </pre>
    </div>
  );
}

function highlightSyntax(code: string, lang: string): React.ReactNode[] {
  const keywords = ['const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while', 'import', 'export', 'from', 'default', 'class', 'new', 'this', 'true', 'false', 'null', 'undefined', 'async', 'await', 'try', 'catch', 'throw', 'typeof', 'interface', 'type', 'extends', 'implements', 'def', 'self', 'print', 'None', 'True', 'False', 'in', 'not', 'and', 'or', 'with', 'as', 'lambda', 'yield'];
  const builtins = ['console', 'document', 'window', 'require', 'process', 'BrowserWindow', 'app', 'ipcMain', 'screen'];

  if (!lang || lang === 'text') return [code];

  const parts: React.ReactNode[] = [];
  const tokenRegex = /(\/\/[^\n]*|\/\*[\s\S]*?\*\/|#[^\n]*|'[^']*'|"[^"]*"|`[^`]*`|\b\d+\.?\d*\b|\b[a-zA-Z_]\w*\b|[^\s])/g;
  let match;
  let lastIdx = 0;
  let key = 0;

  while ((match = tokenRegex.exec(code)) !== null) {
    if (match.index > lastIdx) {
      parts.push(code.slice(lastIdx, match.index));
    }

    const token = match[0];
    if (token.startsWith('//') || token.startsWith('#') || token.startsWith('/*')) {
      parts.push(<span key={key++} style={{ color: '#6A9955', fontStyle: 'italic' }}>{token}</span>);
    } else if (token.startsWith("'") || token.startsWith('"') || token.startsWith('`')) {
      parts.push(<span key={key++} style={{ color: '#CE9178' }}>{token}</span>);
    } else if (/^\d/.test(token)) {
      parts.push(<span key={key++} style={{ color: '#B5CEA8' }}>{token}</span>);
    } else if (keywords.includes(token)) {
      parts.push(<span key={key++} style={{ color: '#569CD6' }}>{token}</span>);
    } else if (builtins.includes(token)) {
      parts.push(<span key={key++} style={{ color: '#4EC9B0' }}>{token}</span>);
    } else {
      parts.push(token);
    }
    lastIdx = match.index + match[0].length;
  }

  if (lastIdx < code.length) {
    parts.push(code.slice(lastIdx));
  }

  return parts;
}
