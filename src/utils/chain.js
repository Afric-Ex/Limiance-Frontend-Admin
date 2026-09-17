/**
 * Blockchain network registry and resolver for Limiance Ops Admin.
 * Resolves blockchain networks, native tokens, and visual badges
 * from real backend wallet and transaction models.
 */

const KNOWN_CHAINS = {
  ethereum: { name: 'Ethereum', symbol: 'ETH', color: '#627eea', bg: 'rgba(98, 126, 234, 0.15)' },
  eth: { name: 'Ethereum', symbol: 'ETH', color: '#627eea', bg: 'rgba(98, 126, 234, 0.15)' },
  bsc: { name: 'BNB Smart Chain', symbol: 'BNB', color: '#f0b90b', bg: 'rgba(240, 185, 11, 0.15)' },
  binance: { name: 'BNB Smart Chain', symbol: 'BNB', color: '#f0b90b', bg: 'rgba(240, 185, 11, 0.15)' },
  bnb: { name: 'BNB Smart Chain', symbol: 'BNB', color: '#f0b90b', bg: 'rgba(240, 185, 11, 0.15)' },
  bitcoin: { name: 'Bitcoin', symbol: 'BTC', color: '#f7931a', bg: 'rgba(247, 147, 26, 0.15)' },
  btc: { name: 'Bitcoin', symbol: 'BTC', color: '#f7931a', bg: 'rgba(247, 147, 26, 0.15)' },
  tron: { name: 'Tron', symbol: 'TRX', color: '#eb0029', bg: 'rgba(235, 0, 41, 0.15)' },
  trx: { name: 'Tron', symbol: 'TRX', color: '#eb0029', bg: 'rgba(235, 0, 41, 0.15)' },
  solana: { name: 'Solana', symbol: 'SOL', color: '#14f195', bg: 'rgba(20, 241, 149, 0.15)' },
  sol: { name: 'Solana', symbol: 'SOL', color: '#14f195', bg: 'rgba(20, 241, 149, 0.15)' },
  polygon: { name: 'Polygon', symbol: 'POL', color: '#8247e5', bg: 'rgba(130, 71, 229, 0.15)' },
  matic: { name: 'Polygon', symbol: 'POL', color: '#8247e5', bg: 'rgba(130, 71, 229, 0.15)' },
  arbitrum: { name: 'Arbitrum One', symbol: 'ARB', color: '#28a0f0', bg: 'rgba(40, 160, 240, 0.15)' },
  arb: { name: 'Arbitrum One', symbol: 'ARB', color: '#28a0f0', bg: 'rgba(40, 160, 240, 0.15)' },
  optimism: { name: 'Optimism', symbol: 'OP', color: '#ff0420', bg: 'rgba(255, 4, 32, 0.15)' },
  op: { name: 'Optimism', symbol: 'OP', color: '#ff0420', bg: 'rgba(255, 4, 32, 0.15)' },
  base: { name: 'Base', symbol: 'BASE', color: '#0052ff', bg: 'rgba(0, 82, 255, 0.15)' },
  avalanche: { name: 'Avalanche C-Chain', symbol: 'AVAX', color: '#e84142', bg: 'rgba(232, 65, 66, 0.15)' },
  avax: { name: 'Avalanche C-Chain', symbol: 'AVAX', color: '#e84142', bg: 'rgba(232, 65, 66, 0.15)' },
  celo: { name: 'Celo', symbol: 'CELO', color: '#35d07f', bg: 'rgba(53, 208, 127, 0.15)' },
  scroll: { name: 'Scroll', symbol: 'SCROLL', color: '#ffe7be', bg: 'rgba(255, 231, 190, 0.15)' },
  aptos: { name: 'Aptos', symbol: 'APT', color: '#2dd8a7', bg: 'rgba(45, 216, 167, 0.15)' },
  apt: { name: 'Aptos', symbol: 'APT', color: '#2dd8a7', bg: 'rgba(45, 216, 167, 0.15)' },
  ton: { name: 'The Open Network', symbol: 'TON', color: '#0098ea', bg: 'rgba(0, 152, 234, 0.15)' },
  polkadot: { name: 'Polkadot', symbol: 'DOT', color: '#e6007a', bg: 'rgba(230, 0, 122, 0.15)' },
  dot: { name: 'Polkadot', symbol: 'DOT', color: '#e6007a', bg: 'rgba(230, 0, 122, 0.15)' },
  monnify: { name: 'Monnify Fiat', symbol: 'NGN', color: '#00a859', bg: 'rgba(0, 168, 89, 0.15)' },
};

/**
 * Resolves blockchain network identity from wallet object or chain identifier.
 * Inspects chain, network, symbol, currency, and address structure.
 */
export function getBlockchainNetwork(item, address = '') {
  let raw = '';
  if (typeof item === 'string') {
    raw = item.trim().toLowerCase();
  } else if (item && typeof item === 'object') {
    raw = (item.chain || item.network || item.currency || item.symbol || '').trim().toLowerCase();
    if (!address && item.address) {
      address = item.address;
    }
  }

  if (raw && KNOWN_CHAINS[raw]) {
    return KNOWN_CHAINS[raw];
  }

  // Address-based heuristic fallback if chain was not set
  const addr = String(address || '').trim();
  if (addr.startsWith('0x') && addr.length === 42) {
    return { name: 'Ethereum / EVM', symbol: 'EVM', color: '#627eea', bg: 'rgba(98, 126, 234, 0.15)' };
  }
  if (addr.startsWith('T') && addr.length === 34) {
    return { name: 'Tron Network', symbol: 'TRX', color: '#eb0029', bg: 'rgba(235, 0, 41, 0.15)' };
  }
  if (addr.startsWith('1') || addr.startsWith('3') || addr.startsWith('bc1')) {
    return { name: 'Bitcoin Network', symbol: 'BTC', color: '#f7931a', bg: 'rgba(247, 147, 26, 0.15)' };
  }
  if (addr.length >= 43 && addr.length <= 44 && !addr.includes('0x')) {
    return { name: 'Solana Network', symbol: 'SOL', color: '#14f195', bg: 'rgba(20, 241, 149, 0.15)' };
  }

  if (raw) {
    const formatted = raw.charAt(0).toUpperCase() + raw.slice(1);
    return { name: formatted, symbol: raw.toUpperCase(), color: '#818cf8', bg: 'rgba(99, 102, 241, 0.15)' };
  }

  return { name: 'Custodial Multi-Chain', symbol: 'CHAIN', color: '#94a3b8', bg: 'rgba(148, 163, 184, 0.15)' };
}
