import React, { useState, useEffect, useRef } from 'react';
import { 
  AlertTriangle, Globe, Crosshair, TrendingUp, TrendingDown, ShieldAlert, 
  Radio, Rocket, Zap, RefreshCw, Search, MessageSquare, FileText, 
  ExternalLink, Newspaper, Siren, ArrowLeft, Glasses, Thermometer, Share2, 
  CheckCircle, Link, Copy, Wind, IceCream, DollarSign, Bomb, Vote, Hash, 
  Repeat, ThumbsUp, BarChart3, Eye, Skull, Triangle, Megaphone, ShoppingBag, 
  Mail, Sun, CloudRain, CloudLightning, ChevronRight, Menu as MenuIcon, 
  Video, Moon, Star, Sparkles, CreditCard, Gift, Tag, Lock, Map, Activity,
  Info, Shield
} from 'lucide-react';

// --- UTILS ---

const getArticleImage = (item) => {
  if (!item) return null;
  if (item.enclosure && item.enclosure.link) return item.enclosure.link;
  if (item.thumbnail) return item.thumbnail;
  const imgMatch = (item.description || item.content)?.match(/<img[^>]+src="([^">]+)"/);
  if (imgMatch) return imgMatch[1];
  return null;
};

// --- MOCK DATA ---

const GENERATED_ADVERSARIES = [
  { name: "The Federal Reserve", reason: "Interest rates exist", status: "Critical", icon: "💸", reaction: "Printing money in panic" },
  { name: "Windmills", reason: "They're killing the birds, very sad", status: "Ongoing", icon: "🌬️", reaction: "Spinning menacingly" },
  { name: "NATO", reason: "Didn't pay the lunch bill", status: "Elevated", icon: "🛡️", reaction: "Holding an emergency meeting" },
  { name: "The Ocean", reason: "Too wet, very un-American", status: "Mild", icon: "🌊", reaction: "Waving back" },
  { name: "Mars", reason: "Hasn't been colonized yet. Low energy.", status: "Watching", icon: "🪐", reaction: "Being red" },
  { name: "Standard Time", reason: "Daylight Savings is for winners", status: "Heated", icon: "⏰", reaction: "Ticking loudly" }
];

const SATIRE_HEADLINES = [
  { 
    id: 1, 
    title: "US Navy conducts 'Freedom of Navigation' drill in a puddle, claims it's international waters", 
    category: "Military", 
    severity: "low",
    description: "Admiral Nelson stated that the puddle was 'clearly navigable' by a toy boat and thus subject to maritime law. China has issued a strong condemnation of the splash damage.",
    link: "#"
  },
  { 
    id: 2, 
    title: "Congress votes to rename 'French Fries' to 'Freedom Taters' again", 
    category: "Political", 
    severity: "medium",
    description: "In a bipartisan effort to waste time, the House has passed a bill declaring that potatoes are now patriotic citizens. France declined to comment, mostly because they are busy eating better food.",
    link: "#"
  },
  { 
    id: 3, 
    title: "Pentagon budget increases by $800 billion to develop 'invisibility cloaks' for tanks", 
    category: "Military", 
    severity: "high",
    description: "The project, codenamed 'Where's Waldo', aims to hide 60-ton vehicles using a series of mirrors and smoke machines. Critics argue you can still hear the tank engine from 3 miles away.",
    link: "#"
  },
  { 
    id: 4, 
    title: "Diplomatic cables reveal the Ambassador to France just really wanted a croissant", 
    category: "Diplomacy", 
    severity: "low",
    description: "Leaked memos show 400 pages of correspondence requesting 'the buttery flaky ones' and zero mention of nuclear treaties. The State Department calls it 'strategic gastronomy'.",
    link: "#"
  },
  { 
    id: 5, 
    title: "Space Force officially adopts 'Pew Pew' as official motto", 
    category: "Military", 
    severity: "medium",
    description: "General Spacey announced the change after a Twitter poll. The uniform will now include mandatory laser pointers and capes.",
    link: "#"
  },
  { 
    id: 6, 
    title: "Trade War update: Avocados are now contraband, Millennial toast market crashes", 
    category: "Economy", 
    severity: "high",
    description: "Customs agents seized 4 million tons of guacamole at the border. Brunch prices in Brooklyn have skyrocketed to $45 per slice.",
    link: "#"
  },
];

const POLL_OPTIONS = [
  { text: "Panic immediately", votes: 45 },
  { text: "Blame the other party", votes: 82 },
  { text: "Tweet about it", votes: 12 },
  { text: "Just go back to sleep", votes: 99 }
];

const RANT_TEMPLATES = [
  "Total disaster! {target} is treating us very badly. Unfair! Sad!",
  "Many people are saying {target} is a loser. I don't know, but that's what they say!",
  "If I were in charge of {target}, it would be huge. Currently? Tiny. Very small.",
  "We are looking into {target} very strongly. Powerful investigation!",
  "Why does {target} hate freedom? We love freedom. We have the best freedom.",
];

const VEGAS_ODDS = [
  { name: "The Metric System", odds: "+150", trend: "up" },
  { name: "Vegetables", odds: "+300", trend: "steady" },
  { name: "Clouds", odds: "+500", trend: "down" },
  { name: "TikTok Teens", odds: "+1000", trend: "up" },
  { name: "Shark Attacks", odds: "+2500", trend: "steady" }
];

const HOROSCOPES = [
  { sign: "Aries", text: "You will start a fight with a vending machine today. The machine will win." },
  { sign: "Taurus", text: "Avoid making eye contact with squirrels. They know what you did." },
  { sign: "Gemini", text: "Today is a great day to start a rumor about yourself just to feel something." },
  { sign: "Cancer", text: "You will cry during a commercial for car insurance. Embrace it." },
  { sign: "Leo", text: "Your hair looks fantastic, but everyone is actually looking at the spinach in your teeth." },
  { sign: "Virgo", text: "Organizing your desktop icons won't fix your life, but you'll try anyway." },
  { sign: "Libra", text: "Indecision will strike when choosing lunch. You will starve until dinner." },
  { sign: "Scorpio", text: "Revenge is a dish best served cold, but you're too impatient. Microwaved revenge it is." },
  { sign: "Sagittarius", text: "You will feel an urge to travel. Your bank account will respectfully disagree." },
  { sign: "Capricorn", text: "Work harder. The simulation demands productivity." },
  { sign: "Aquarius", text: "Your unique ideas are valid, but maybe keep the one about 'hamster-powered cars' to yourself." },
  { sign: "Pisces", text: "You will dissociate during a Zoom meeting and agree to lead a project by accident." }
];

const CONSPIRACY_PRODUCTS = [
  { name: "BRAIN FORCE ULTRA", desc: "Now with 50% more rage.", price: "$59.99" },
  { name: "Tactical Wipes", desc: "For when the grid goes down.", price: "$29.99" },
  { name: "Male Vitality Bone Broth", desc: "Made from real dinosaur bones.", price: "$89.99" },
  { name: "Tinfoil Beanie (Heavy Duty)", desc: "Blocks 6G waves.", price: "$15.00" }
];

const RSS_FEEDS = {
  political: { url: 'https://thehill.com/homenews/administration/feed/', name: 'Political Intel' },
  defense: { url: 'https://www.military.com/rss-feeds/content?type=news', name: 'Military Ops' },
  conspiracy: { url: 'https://www.upi.com/rss/Odd_News/', name: 'The Files' },
  finance: { url: 'https://www.cnbc.com/id/10000664/device/rss/rss.html', name: 'Market Watch' }
};

const SATIRE_TEMPLATES = {
  openers: ["In a move that surprised absolutely no one,", "Sources close to the situation,", "It has come to our attention that reality is glitching again, as"],
  middles: ["Experts believe this is basically just a fancy way of saying 'oops'.", "The Pentagon has not confirmed if aliens are involved.", "This will likely result in a 3-hour committee meeting."],
  closers: ["We recommend panicking slightly, then taking a nap.", "History will remember this moment as 'that Tuesday when things got weird'.", "The stock market reacted by doing absolutely nothing."]
};

const generateSatire = (article) => {
  const opener = SATIRE_TEMPLATES.openers[Math.floor(Math.random() * SATIRE_TEMPLATES.openers.length)];
  const middle = SATIRE_TEMPLATES.middles[Math.floor(Math.random() * SATIRE_TEMPLATES.middles.length)];
  const closer = SATIRE_TEMPLATES.closers[Math.floor(Math.random() * SATIRE_TEMPLATES.closers.length)];
  const cleanDesc = article.description ? article.description.replace(/<[^>]*>?/gm, '') : "Details are scarce.";
  return {
    headline: `BREAKING: ${article.title} (But Make It Dramatic)`,
    body: `${opener} ${article.title}. \n\nOfficial story: "${cleanDesc}" \n\nHowever, here at The Daily Diss-patch, we know the truth. ${middle} \n\n${closer}`,
    panicLevel: Math.floor(Math.random() * 10) + 1,
    keywords: article.title.split(' ').filter(w => w.length > 4).slice(0, 3)
  };
};

const CONSPIRACY_NOUNS = ["The Globalists", "Interdimensional Vampires", "The Water Filters", "Big Bigfoot", "The Cloud People", "Clockwork Elves"];
const CONSPIRACY_VERBS = ["harvesting", "programming", "melting", "downloading", "eating", "suppressing"];
const CONSPIRACY_OBJECTS = ["your pineal gland", "freedom", "the frogs", "Mars colonies", "human DNA", "the supplements"];


// --- HELPER COMPONENTS ---

const NewsImage = ({ item, category, className }) => {
  const [imgSrc, setImgSrc] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const src = getArticleImage(item);
    if (src) setImgSrc(src);
    else setError(true);
  }, [item]);

  if (!imgSrc || error) {
    let Icon = Globe;
    let color = "bg-slate-200 text-slate-400";
    if (category === 'defense') { Icon = ShieldAlert; color = "bg-green-100 text-green-700"; }
    if (category === 'weird') { Icon = Eye; color = "bg-purple-100 text-purple-700"; }
    if (category === 'finance') { Icon = DollarSign; color = "bg-emerald-100 text-emerald-700"; }
    if (category === 'shopping') { Icon = ShoppingBag; color = "bg-pink-100 text-pink-700"; }

    return (
      <div className={`flex items-center justify-center ${color} ${className}`}>
        <Icon className="w-1/3 h-1/3 opacity-50" />
      </div>
    );
  }

  return (
    <img 
      src={imgSrc} 
      alt={item.title} 
      className={`object-cover w-full h-full ${className}`} 
      onError={() => setError(true)}
    />
  );
};

const BeefMeter = ({ level }) => {
  const rotation = { low: 'rotate-0', medium: 'rotate-45', high: 'rotate-90', critical: 'rotate-180' };
  return (
    <div className="relative w-32 h-16 overflow-hidden mx-auto mt-4">
      <div className="w-32 h-32 rounded-full border-8 border-slate-200 border-b-0 border-l-slate-300 border-r-slate-300 border-t-slate-300 bg-slate-100 absolute top-0 left-0 box-border"></div>
      <div className={`absolute bottom-0 left-1/2 w-1 h-14 bg-black origin-bottom transition-transform duration-700 ease-out ${rotation[level] || 'rotate-0'} -ml-0.5 z-10 rounded-full`}></div>
      <div className="absolute bottom-0 left-1/2 w-4 h-4 bg-slate-800 rounded-full -ml-2 z-20"></div>
    </div>
  );
};

const SatiricalReader = ({ article, onBack }) => {
  const [satireData, setSatireData] = useState(null);
  const [showFactCheck, setShowFactCheck] = useState(false);
  const [copyStatus, setCopyStatus] = useState('Copy Rant');

  useEffect(() => {
    if (article) {
      setSatireData(generateSatire(article));
    }
  }, [article]);

  const handleCopyRant = () => {
    const rant = `I CAN'T BELIEVE THIS! ${article.title.toUpperCase()} is just another example of the swamp draining itself into my living room! WAKE UP PEOPLE! #TheDailyDispatch`;
    navigator.clipboard.writeText(rant);
    setCopyStatus('Copied!');
    setTimeout(() => setCopyStatus('Copy Rant'), 2000);
  };

  const toggleFactCheck = () => {
    setShowFactCheck(!showFactCheck);
  };

  if (!satireData) return <div className="p-10 text-center"><RefreshCw className="animate-spin mx-auto"/> Generating Cynicism...</div>;

  return (
    <div className="animate-in fade-in zoom-in-95 duration-300">
      <div className="bg-white rounded-xl shadow-2xl overflow-hidden border-2 border-slate-900 mb-8 relative z-20">
        <div className="bg-slate-900 p-6 text-white border-b-4 border-red-600 relative overflow-hidden">
          <div className="relative z-10">
            <span className="inline-block bg-red-600 text-white text-xs font-bold px-2 py-1 rounded mb-3 uppercase tracking-wider">Satire Filter: ACTIVE</span>
            <h1 className="text-2xl md:text-3xl font-black font-serif italic leading-tight mb-4">{satireData.headline}</h1>
            <div className="flex flex-wrap items-center gap-4 text-slate-400 text-sm font-mono">
              <span className="flex items-center gap-1"><Glasses className="w-4 h-4"/> Analyst: Dr. Sarcasm</span>
              <span>•</span>
              <span className="flex items-center gap-1"><ShieldAlert className="w-4 h-4"/> Clearance: G-14 Classified</span>
            </div>
            <div className="flex gap-2 mt-6">
               <button onClick={handleCopyRant} className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-4 py-2 rounded flex items-center gap-2 transition-colors">{copyStatus === 'Copied!' ? <CheckCircle className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}{copyStatus.toUpperCase()}</button>
               <button onClick={toggleFactCheck} className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2 rounded flex items-center gap-2 transition-colors"><CheckCircle className="w-4 h-4" />INSTANT FACT CHECK</button>
            </div>
            {showFactCheck && (
              <div className="mt-4 bg-yellow-100 text-yellow-900 p-3 rounded border-l-4 border-yellow-600 text-xs font-mono animate-in fade-in slide-in-from-top-2">
                <strong>OFFICIAL VERDICT:</strong> Mostly Boring. While technically accurate, the excitement level of this event is significantly lower than reported.
              </div>
            )}
          </div>
          <div className="absolute top-0 right-0 opacity-10 transform translate-x-10 -translate-y-10"><FileText className="w-64 h-64" /></div>
        </div>
        <div className="p-6 md:p-8 bg-[#fdfbf7]">
          <div className="flex flex-col md:flex-row gap-8">
            <div className="flex-1">
              <div className="prose prose-slate max-w-none">
                <p className="text-lg leading-relaxed font-serif text-slate-800 whitespace-pre-line"><span className="float-left text-5xl font-black mr-3 mt-[-10px] text-slate-900">\"{satireData.body.charAt(0)}\"</span>{satireData.body.slice(1)}</p>
              </div>
              <div className="mt-8 p-6 bg-slate-100 border-l-4 border-slate-400 rounded-r-lg">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-bold text-slate-700 uppercase text-xs">Original Context</h4>
                  <div className="flex gap-2">
                    {satireData.keywords.map((word, idx) => (
                      <a key={idx} href={`https://www.google.com/search?q=${word}+news`} target="_blank" rel="noreferrer" className="text-[10px] bg-white px-2 py-1 rounded border border-slate-300 hover:bg-blue-50 hover:text-blue-600 transition-colors">Search \"{word}\"</a>
                    ))}
                  </div>
                </div>
                <p className="text-sm text-slate-600 italic mb-3">\"{article.description ? article.description.replace(/<[^>]*>?/gm, '') : article.title}\"</p>
                <a href={article.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:underline">Read Full Source at {new URL(article.link || 'http://localhost').hostname} <ExternalLink className="w-3 h-3"/></a>
              </div>
            </div>
            <div className="w-full md:w-64 space-y-6">
              <div className="bg-white p-4 rounded border border-slate-200 shadow-sm">
                <h3 className="font-bold text-slate-900 text-sm uppercase mb-3 flex items-center gap-2"><Thermometer className="w-4 h-4 text-red-500" /> Panic Meter</h3>
                <div className="flex items-end gap-1 h-32 bg-slate-100 rounded p-2 relative">
                  <div className={`w-full rounded-t transition-all duration-1000 ${satireData.panicLevel > 7 ? 'bg-red-600 animate-pulse' : satireData.panicLevel > 4 ? 'bg-orange-500' : 'bg-green-500'}`} style={{ height: `${satireData.panicLevel * 10}%` }}></div>
                  <span className="absolute bottom-2 left-1/2 transform -translate-x-1/2 font-black text-2xl text-slate-900 mix-blend-multiply">{satireData.panicLevel}/10</span>
                </div>
                <p className="text-xs text-center mt-2 text-slate-500">{satireData.panicLevel > 7 ? "Stock up on canned beans." : "Carry on, citizen."}</p>
              </div>
              <button onClick={onBack} className="w-full py-3 bg-slate-900 text-white font-bold rounded hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"><ArrowLeft className="w-4 h-4" /> Return to Safety</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
