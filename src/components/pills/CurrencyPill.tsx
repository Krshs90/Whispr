import { ArrowRightLeft } from 'lucide-react';

export function CurrencyPill({ data, defaultExpanded: _defaultExpanded = false }: { data?: any; defaultExpanded?: boolean }) {
  const amount = data?.amount || 1;
  const from = data?.from || 'USD';
  const to = data?.to || 'EUR';
  const converted = data?.converted || 0.85;
  const rate = data?.rate || 0.85;

  return (
    <div style={{
      width: '100%',
      background: '#1A1A1A',
      padding: '20px',
      display: 'flex', flexDirection: 'column',
      boxSizing: 'border-box', color: '#FFFFEB',
      borderRadius: 16, border: '1px solid #2A2A2A',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8,
          background: '#4ADE8022', display: 'flex', justifyContent: 'center', alignItems: 'center',
          flexShrink: 0,
        }}>
          <ArrowRightLeft size={16} color="#4ADE80" />
        </div>
        <span style={{ fontSize: 13, fontWeight: 600, color: '#A0A0A5', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          Currency Exchange
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
        {/* From */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontSize: 24, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{amount.toFixed(2)}</span>
          <span style={{ fontSize: 13, color: '#6A6A70', fontWeight: 600 }}>{from}</span>
        </div>

        <div style={{ padding: '0 10px', opacity: 0.5 }}>
          <ArrowRightLeft size={16} color="#FFFFEB" />
        </div>

        {/* To */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
          <span style={{ fontSize: 24, fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: '#4ADE80' }}>
            {converted.toFixed(2)}
          </span>
          <span style={{ fontSize: 13, color: '#6A6A70', fontWeight: 600 }}>{to}</span>
        </div>
      </div>

      <div style={{ marginTop: 24, fontSize: 11, color: '#555', textAlign: 'center' }}>
        Live Exchange Rate: 1 {from} = {rate.toFixed(4)} {to}
      </div>
    </div>
  );
}

export const currencyPillMeta = { name: 'Currency', height: 160, keywords: ['currency', 'exchange', 'convert', 'rate', 'usd', 'eur'] };
