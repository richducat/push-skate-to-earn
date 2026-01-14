import React, { useState, useEffect, useCallback } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import {
  Wallet,
  Twitter,
  Search,
  Menu,
  X as XIcon,
  ExternalLink,
  Clock,
  CheckCircle2,
  ChevronRight,
  Info,
  Globe,
  MoreHorizontal,
  RefreshCw
} from 'lucide-react';

// --- Constants & Initial Data ---

const SKR_LAUNCH_DATE = new Date('2026-01-21T00:00:00Z');

// We add a 'query' field to map to DexScreener search terms
const INITIAL_TOKENS = [
  {
    id: 'skr',
    name: 'Seeker',
    ticker: 'SKR',
    status: 'Upcoming',
    date: 'Jan 21, 2026',
    value: '???',
    desc: 'The official governance utility token for the Seeker device ecosystem.',
    category: 'Hardware',
    change: 0,
    price: 0,
    query: null // Skip fetch
  },
  {
    id: 'pengu',
    name: 'Pudgy Penguins',
    ticker: 'PENGU',
    status: 'Live',
    date: 'Dec 17, 2025',
    value: 'Loading...',
    desc: 'Major allocation for Seeker Chapter 2 holders.',
    category: 'NFT',
    change: 0,
    price: 0,
    query: 'PENGU'
  },
  {
    id: 'happy',
    name: 'Happy Cat',
    ticker: 'HAPPY',
    status: 'Claimed',
    date: 'Nov 7, 2024',
    value: 'Loading...',
    desc: 'Meme token distribution for mobile users.',
    category: 'Meme',
    change: 0,
    price: 0,
    query: 'HAPPY'
  },
  {
    id: 'maneki',
    name: 'Maneki',
    ticker: 'MANEKI',
    status: 'Claimed',
    date: 'Apr 26, 2024',
    value: 'Loading...',
    desc: 'The Japanese lucky cat token airdropped to Saga owners.',
    category: 'Meme',
    change: 0,
    price: 0,
    query: 'MANEKI'
  },
  {
    id: 'mew',
    name: 'Cat in a Dogs World',
    ticker: 'MEW',
    status: 'Claimed',
    date: 'Apr 1, 2024',
    value: 'Loading...',
    desc: 'One of the first major airdrops for the Solana mobile stack.',
    category: 'Meme',
    change: 0,
    price: 0,
    query: 'MEW'
  },
  {
    id: 'wuffi',
    name: 'Wuffi',
    ticker: 'WUF',
    status: 'Claimed',
    date: 'May 1, 2024',
    value: 'Loading...',
    desc: 'Gaming meme coin integration rewards.',
    category: 'Gaming',
    change: 0,
    price: 0,
    query: 'WUF'
  },
];

// --- Components ---

const Header = ({ isWalletConnected, onConnectWallet }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0A0B0D] border-b border-[#2B2F36]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-6">
            <span className="text-xl font-sans font-bold text-white tracking-tight">
              seeker<span className="text-[#0052FF]">scan</span>
            </span>
            <div className="hidden md:flex items-center space-x-1">
              <a href="#dashboard" className="text-sm font-medium text-white px-4 py-2 hover:bg-[#1E2025] rounded-full transition-colors">Dashboard</a>
              <a href="#earn" className="text-sm font-medium text-[#8A919E] hover:text-white px-4 py-2 hover:bg-[#1E2025] rounded-full transition-colors">Earn</a>
              <a href="#learn" className="text-sm font-medium text-[#8A919E] hover:text-white px-4 py-2 hover:bg-[#1E2025] rounded-full transition-colors">Learning Rewards</a>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-4">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#5B616E] w-4 h-4" />
              <input
                type="text"
                placeholder="Search"
                className="bg-[#141519] border border-transparent group-hover:border-[#2B2F36] focus:border-[#0052FF] text-white text-sm rounded-full pl-10 pr-4 py-2 w-64 outline-none transition-all"
              />
            </div>
            <button
              onClick={onConnectWallet}
              className={`flex items-center gap-2 px-4 py-2 rounded-full font-medium text-sm transition-all duration-200 ${
                isWalletConnected ? 'bg-[#1E2025] text-white' : 'bg-[#0052FF] hover:bg-[#004AD9] text-white'
              }`}
            >
              {isWalletConnected ? 'Wallet Connected' : 'Connect Wallet'}
            </button>
            <button className="text-white p-2 hover:bg-[#1E2025] rounded-full">
              <MoreHorizontal className="w-5 h-5 text-[#8A919E]" />
            </button>
          </div>
          <div className="md:hidden flex items-center gap-4">
            <button
              onClick={onConnectWallet}
              className={`flex items-center justify-center px-4 py-2 rounded-full font-medium text-xs transition-all duration-200 ${
                isWalletConnected ? 'bg-[#1E2025] text-white' : 'bg-[#0052FF] text-white'
              }`}
            >
              {isWalletConnected ? 'Connected' : 'Connect'}
            </button>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-white"
            >
              {isMenuOpen ? <XIcon className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>
      {isMenuOpen && (
        <div className="md:hidden bg-[#0A0B0D] border-b border-[#2B2F36]">
          <div className="px-4 pt-2 pb-6 space-y-2">
            <a href="#dashboard" onClick={() => setIsMenuOpen(false)} className="text-white block py-3 text-base font-medium border-b border-[#1E2025]">Dashboard</a>
            <a href="#earn" onClick={() => setIsMenuOpen(false)} className="text-[#8A919E] block py-3 text-base font-medium border-b border-[#1E2025]">Earn</a>
            <a href="#learn" onClick={() => setIsMenuOpen(false)} className="text-[#8A919E] block py-3 text-base font-medium">Learning Rewards</a>
          </div>
        </div>
      )}
    </nav>
  );
};

const CountdownCard = () => {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const difference = SKR_LAUNCH_DATE - now;
      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        });
      }
    }, 1000);
    return () => clearInterval(timer);
  }, []);
  return (
    <div className="bg-[#141519] rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between border border-[#1E2025] hover:border-[#2B2F36] transition-colors cursor-default">
      <div className="flex items-center gap-4 mb-4 md:mb-0">
        <div className="w-12 h-12 rounded-full bg-[#0052FF] flex items-center justify-center">
          <Clock className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-white font-medium text-lg">SKR Token Launch</h2>
          <p className="text-[#8A919E] text-sm">Official Generation Event • Jan 21, 2026</p>
        </div>
      </div>
      <div className="flex gap-4">
        {Object.entries(timeLeft).map(([unit, value]) => (
          <div key={unit} className="text-center">
            <div className="text-xl md:text-2xl font-bold text-white tabular-nums">
              {String(value).padStart(2, '0')}
            </div>
            <div className="text-[10px] md:text-xs text-[#5B616E] uppercase font-medium">{unit}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Generates a curve that matches the REAL price and REAL 24h change
const LiveChart = ({ activeToken }) => {
  const [data, setData] = useState([]);
  const isPositive = activeToken.change >= 0;
  const color = isPositive ? '#05B169' : '#DF5F67';
  useEffect(() => {
    if (!activeToken) return;
    const currentPrice = activeToken.price || 0;
    const changePercent = activeToken.change || 0;
    const startPrice = currentPrice / (1 + (changePercent / 100));
    const pointsCount = 60;
    const newData = [];
    for (let i = 0; i < pointsCount; i++) {
      const progress = i / (pointsCount - 1);
      let linearValue = startPrice + (currentPrice - startPrice) * progress;
      const noiseFactor = Math.sin(progress * Math.PI);
      const randomVariance = (Math.random() - 0.5) * (Math.abs(currentPrice - startPrice) * 0.3) * noiseFactor;
      const val = i === pointsCount - 1 ? currentPrice : linearValue + randomVariance;
      newData.push({ time: i, value: Math.max(0, val) });
    }
    setData(newData);
  }, [activeToken]);
  if (activeToken.status === 'Upcoming') {
    return (
      <div className="h-[300px] w-full flex flex-col items-center justify-center bg-[#141519] rounded-xl border border-[#1E2025] border-dashed">
        <Clock className="w-12 h-12 text-[#2B2F36] mb-4" />
        <p className="text-[#8A919E] font-medium">Chart data available post-launch</p>
      </div>
    );
  }
  return (
    <div className="h-[300px] w-full">
      <div className="flex justify-between items-end mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-3xl font-medium text-white">{activeToken.ticker}</h3>
          </div>
          <p className="text-3xl font-medium text-white">
            {activeToken.price > 0 ? `$${activeToken.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}` : '---'}
          </p>
          <p className={`text-sm font-medium mt-1 flex items-center gap-1 ${isPositive ? 'text-[#05B169]' : 'text-[#DF5F67]'}`}>
            {isPositive ? '+' : ''}{activeToken.change.toFixed(2)}% <span className="text-[#5B616E]"> (1D)</span>
          </p>
        </div>
        <div className="flex gap-2">
          {['1H', '1D', '1W', '1M', '1Y'].map(tf => (
            <button key={tf} className={`text-xs font-medium px-3 py-1 rounded hover:bg-[#1E2025] transition-colors ${tf === '1D' ? 'text-[#0052FF] bg-[#0052FF]/10' : 'text-[#5B616E]'}`}>{tf}</button>
          ))}
        </div>
      </div>
      <ResponsiveContainer width="100%" height="70%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.1} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="time" hide />
          <YAxis domain={['auto', 'auto']} hide />
          <Tooltip
            contentStyle={{ backgroundColor: '#141519', borderColor: '#2B2F36', color: '#fff', borderRadius: '8px', padding: '8px 12px' }}
            itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: 600 }}
            formatter={value => [`$${value.toFixed(4)}`, '']}
            labelFormatter={() => ''}
            cursor={{ stroke: '#2B2F36', strokeWidth: 1 }}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorValue)"
            isAnimationActive={true}
            animationDuration={1000}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

const EarnSection = ({ isWalletConnected, isXConnected, onConnectX, onConnectWallet }) => {
  const isEligible = isWalletConnected && isXConnected;
  return (
    <div id="earn" className="my-10">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-medium text-white">Learning rewards</h2>
        <a href="#" className="text-[#0052FF] text-sm font-medium hover:text-[#004AD9]">See all</a>
      </div>
      <div className="bg-[#141519] border border-[#1E2025] rounded-2xl overflow-hidden">
        {/* Header of Card */}
        <div className="p-6 border-b border-[#1E2025]">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-medium text-white mb-1">SeekerScan Protocol</h3>
              <p className="text-[#8A919E] text-sm">Verify your identity to earn $SCAN tokens.</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[#05B169] font-bold text-lg">+$15.00</span>
              <span className="text-[#05B169] text-sm font-medium bg-[#05B169]/10 px-2 py-1 rounded">in SCAN</span>
            </div>
          </div>
        </div>
        {/* Tasks */}
        <div className="p-0">
          {/* Task 1 */}
          <div className="flex items-center justify-between p-6 hover:bg-[#1E2025] transition-colors cursor-pointer border-b border-[#1E2025] last:border-0 group">
            <div className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isWalletConnected ? 'bg-[#05B169]' : 'bg-[#2B2F36]'}`}>
                {isWalletConnected ? <CheckCircle2 className="w-5 h-5 text-white" /> : <Wallet className="w-5 h-5 text-white" />}
              </div>
              <div>
                <h4 className={`text-sm font-medium ${isWalletConnected ? 'text-[#5B616E] line-through' : 'text-white'}`}>Connect Solana Wallet</h4>
                <p className="text-[#5B616E] text-xs mt-0.5">Verify on-chain activity</p>
              </div>
            </div>
            <button
              onClick={onConnectWallet}
              disabled={isWalletConnected}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                isWalletConnected ? 'text-[#05B169]' : 'bg-[#0052FF] text-white hover:bg-[#004AD9]'
              }`}
            >
              {isWalletConnected ? 'Completed' : 'Start'}
            </button>
          </div>
          {/* Task 2 */}
          <div className="flex items-center justify-between p-6 hover:bg-[#1E2025] transition-colors cursor-pointer group">
            <div className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isXConnected ? 'bg-[#05B169]' : 'bg-[#2B2F36]'}`}>
                {isXConnected ? <CheckCircle2 className="w-5 h-5 text-white" /> : <Twitter className="w-5 h-5 text-white" />}
              </div>
              <div>
                <h4 className={`text-sm font-medium ${isXConnected ? 'text-[#5B616E] line-through' : 'text-white'}`}>Connect X Account</h4>
                <p className="text-[#5B616E] text-xs mt-0.5">Verify social reputation</p>
              </div>
            </div>
            <button
              onClick={onConnectX}
              disabled={isXConnected}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                isXConnected ? 'text-[#05B169]' : 'bg-[#0052FF] text-white hover:bg-[#004AD9]'
              }`}
            >
              {isXConnected ? 'Completed' : 'Start'}
            </button>
          </div>
        </div>
        {isEligible && (
          <div className="bg-[#05B169]/10 p-4 flex items-center justify-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#05B169]" />
            <span className="text-[#05B169] text-sm font-medium">You are eligible for the next distribution round.</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default function App() {
  const [tokens, setTokens] = useState(INITIAL_TOKENS);
  const [activeToken, setActiveToken] = useState(INITIAL_TOKENS[0]);
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const [isXConnected, setIsXConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const handleConnectWallet = () => setIsWalletConnected(true);
  const handleConnectX = () => setTimeout(() => setIsXConnected(true), 500);
  const fetchMarketData = useCallback(async () => {
    setLoading(true);
    const updatedTokens = await Promise.all(
      tokens.map(async token => {
        if (!token.query) return token;
        try {
          const response = await fetch(`https://api.dexscreener.com/latest/dex/search?q=${token.query}`);
          const data = await response.json();
          const pair = data.pairs?.find(p => p.chainId === 'solana') || data.pairs?.[0];
          if (pair) {
            return {
              ...token,
              price: parseFloat(pair.priceUsd),
              change: pair.priceChange?.h24 || 0,
              value: `$${parseFloat(pair.priceUsd).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}`,
              status: 'Live'
            };
          }
          return token;
        } catch (error) {
          console.error(`Failed to fetch ${token.ticker}:`, error);
          return token;
        }
      })
    );
    setTokens(updatedTokens);
    const currentActive = updatedTokens.find(t => t.id === activeToken.id);
    if (currentActive) setActiveToken(currentActive);
    setLoading(false);
  }, [tokens, activeToken.id]);
  useEffect(() => {
    fetchMarketData();
    const interval = setInterval(fetchMarketData, 30000);
    return () => clearInterval(interval);
  }, []);
  return (
    <div className="min-h-screen bg-[#0A0B0D] text-white font-sans selection:bg-[#0052FF]/30 pb-20">
      <Header isWalletConnected={isWalletConnected} onConnectWallet={handleConnectWallet} />
      <main className="pt-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: List */}
          <div className="lg:col-span-1 order-2 lg:order-1">
            <div className="mb-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-medium text-white">Airdrop Assets</h2>
                <button
                  onClick={fetchMarketData}
                  disabled={loading}
                  className={`p-2 rounded-full hover:bg-[#1E2025] transition-all ${loading ? 'animate-spin opacity-50' : 'opacity-100'}`}
                >
                  <RefreshCw className="w-4 h-4 text-[#8A919E]" />
                </button>
              </div>
              <div className="bg-[#141519] border border-[#1E2025] rounded-2xl overflow-hidden">
                {tokens.map(drop => (
                  <div
                    key={drop.id}
                    onClick={() => setActiveToken(drop)}
                    className={`p-4 flex items-center justify-between cursor-pointer border-b border-[#1E2025] last:border-0 transition-colors ${activeToken.id === drop.id ? 'bg-[#1E2025]' : 'hover:bg-[#1E2025]'}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#2B2F36] flex items-center justify-center text-xs font-bold text-white">
                        {drop.ticker[0]}
                      </div>
                      <div>
                        <div className="font-medium text-white text-sm">{drop.name}</div>
                        <div className="text-[#8A919E] text-xs">{drop.ticker}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-white text-sm">{drop.value}</div>
                      {drop.status === 'Upcoming' ? (
                        <span className="text-[#F4B731] text-xs font-medium">Upcoming</span>
                      ) : (
                        <span className={`text-xs font-medium ${drop.change >= 0 ? 'text-[#05B169]' : 'text-[#DF5F67]'}`}>
                          {drop.change > 0 && '+'}{drop.change.toFixed(2)}%
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <button className="w-full mt-4 text-[#0052FF] text-sm font-medium hover:text-[#004AD9] text-center">View all assets</button>
            </div>
          </div>
          {/* Right Column: Main Content */}
          <div className="lg:col-span-2 order-1 lg:order-2 space-y-8">
            <CountdownCard />
            <div>
              <LiveChart activeToken={activeToken} />
              <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-lg font-medium text-white mb-2">About {activeToken.name}</h3>
                  <p className="text-[#8A919E] text-sm leading-relaxed mb-4">{activeToken.desc}</p>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between py-2 border-b border-[#1E2025]">
                      <span className="text-[#8A919E] text-sm flex items-center gap-2"><Globe className="w-3 h-3" /> Website</span>
                      <span className="text-white text-sm font-medium flex items-center gap-1 cursor-pointer hover:text-[#0052FF]">
                        Visit <ExternalLink className="w-3 h-3" />
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-[#1E2025]">
                      <span className="text-[#8A919E] text-sm">Category</span>
                      <span className="text-white text-sm font-medium">{activeToken.category}</span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-[#1E2025]">
                      <span className="text-[#8A919E] text-sm">Status</span>
                      <span className={`text-sm font-medium px-2 py-0.5 rounded ${
                        activeToken.status === 'Upcoming' ? 'bg-[#F4B731]/10 text-[#F4B731]' : 'bg-[#05B169]/10 text-[#05B169]'
                      }`}>
                        {activeToken.status}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="bg-[#141519] rounded-xl p-4 border border-[#1E2025] h-fit">
                  <div className="flex items-start gap-3">
                    <Info className="w-5 h-5 text-[#0052FF] shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-white font-medium text-sm mb-1">Seeker Exclusive</h4>
                      <p className="text-[#8A919E] text-xs leading-relaxed mb-3">
                        This asset has specific requirements for Seeker device holders. Ensure your wallet is connected to verify ownership.
                      </p>
                      <button className="text-[#0052FF] text-xs font-bold hover:underline">Learn more</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <EarnSection
              isWalletConnected={isWalletConnected}
              isXConnected={isXConnected}
              onConnectX={handleConnectX}
              onConnectWallet={handleConnectWallet}
            />
          </div>
        </div>
      </main>
      <footer className="border-t border-[#1E2025] mt-12 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h4 className="text-white font-bold mb-4">seeker<span className="text-[#0052FF]">scan</span></h4>
              <p className="text-[#5B616E] text-xs">
                © 2026 SeekerScan Protocol<br />All rights reserved.
              </p>
            </div>
            <div>
              <h4 className="text-white font-medium mb-4 text-sm">Company</h4>
              <ul className="space-y-2 text-[#8A919E] text-xs">
                <li><a href="#" className="hover:text-[#0052FF]">About</a></li>
                <li><a href="#" className="hover:text-[#0052FF]">Careers</a></li>
                <li><a href="#" className="hover:text-[#0052FF]">Affiliates</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-medium mb-4 text-sm">Support</h4>
              <ul className="space-y-2 text-[#8A919E] text-xs">
                <li><a href="#" className="hover:text-[#0052FF]">Help Center</a></li>
                <li><a href="#" className="hover:text-[#0052FF]">Contact Us</a></li>
                <li><a href="#" className="hover:text-[#0052FF]">System Status</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-medium mb-4 text-sm">Legal</h4>
              <ul className="space-y-2 text-[#8A919E] text-xs">
                <li><a href="#" className="hover:text-[#0052FF]">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-[#0052FF]">Terms of Service</a></li>
              </ul>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}