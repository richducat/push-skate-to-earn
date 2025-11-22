import React, { useEffect, useMemo, useRef, useState } from "react";
// Wallet adapter hooks and components for multi-wallet support
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

/**
 * PUSH — Skate-to-Earn (Solana) — Launch-Ready (devnet)
 * - Wallet connect via Phantom (window.solana)
 * - SIWS (sign-in-with-solana) challenge & verify
 * - Airdrop registration (wallet + email + twitter + referral)
 * - Off-chain PUSH Points with serverless anti-cheat checks
 * - Leaderboard
 * - NFT Board mint: stub button calls /api/nft/mint (wire Metaplex later)
 */

const API = (path) => `${window.location.origin}${path}`;
const isPreview = () => typeof window !== "undefined" && window.location.hostname.includes("chatgpt");

const metersToKm = (m) => m / 1000;
const secondsToHMS = (s) => {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = Math.floor(s % 60);
  return [h, m, sec].map((v) => String(v).padStart(2, "0")).join(":");
};

const randomId = () => Math.random().toString(36).slice(2, 10);

function createDemoBoard(rarity = "Common") {
  const rarities = {
    Common: { speed: [0.9, 1.1], control: [0.9, 1.1], luck: [0.9, 1.1], dura: [0.9, 1.1] },
    Uncommon: { speed: [1.05, 1.2], control: [1.05, 1.2], luck: [1.05, 1.2], dura: [1.05, 1.2] },
    Rare: { speed: [1.15, 1.35], control: [1.15, 1.35], luck: [1.15, 1.35], dura: [1.15, 1.35] },
    Epic: { speed: [1.3, 1.55], control: [1.3, 1.55], luck: [1.3, 1.55], dura: [1.3, 1.55] },
    Legendary: { speed: [1.5, 1.8], control: [1.5, 1.8], luck: [1.5, 1.8], dura: [1.5, 1.8] },
  };
  const pick = (min, max) => +(min + Math.random() * (max - min)).toFixed(2);
  const r = rarities[rarity] || rarities.Common;
  return {
    id: randomId(),
    name: `${rarity} Deck #${Math.floor(Math.random() * 9999)}`,
    rarity,
    lvl: 1,
    stats: {
      speed: pick(...r.speed),
      control: pick(...r.control),
      luck: pick(...r.luck),
      durability: pick(...r.dura),
    },
  };
}

const loadLS = (k, def) => {
  try {
    const v = localStorage.getItem(k);
    return v ? JSON.parse(v) : def;
  } catch (e) {
    return def;
  }
};
const saveLS = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (_) {} };

export default function App() {
  const [wallet, setWallet] = useState(() => loadLS("push_wallet", { demo: true, address: "" }));
  const [session, setSession] = useState(() => loadLS("push_session", null)); // server-issued JWT

  const [boards, setBoards] = useState(() => loadLS("push_boards", [
    createDemoBoard("Common"),
    createDemoBoard("Uncommon"),
    createDemoBoard("Rare"),
  ]));
  const [equippedId, setEquippedId] = useState(() => loadLS("push_equipped", null));
  const equipped = useMemo(() => boards.find((b) => b.id === equippedId) || boards[0], [boards, equippedId]);

  const [rideActive, setRideActive] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [meters, setMeters] = useState(0);
  const [energy, setEnergy] = useState(() => loadLS("push_energy", 5));
  const [earnPts, setEarnPts] = useState(0);

  const [demoMode, setDemoMode] = useState(true);
  const [tab, setTab] = useState("ride"); // ride | airdrop | leaderboard | market

  // Use the wallet adapter hook to access the currently connected wallet.
  const { publicKey, connected, signMessage } = useWallet();

  // When the wallet connection changes, update the local wallet state.
  useEffect(() => {
    if (connected && publicKey) {
      setWallet({ demo: false, address: publicKey.toString() });
    } else {
      setWallet({ demo: true, address: "" });
    }
  }, [connected, publicKey]);

  const geoWatchId = useRef(null);
  const lastPos = useRef(null);
  const simTick = useRef(0);

  useEffect(() => saveLS("push_boards", boards), [boards]);
  useEffect(() => saveLS("push_equipped", equippedId), [equippedId]);
  useEffect(() => saveLS("push_energy", energy), [energy]);
  useEffect(() => saveLS("push_wallet", wallet), [wallet]);
  useEffect(() => saveLS("push_session", session), [session]);

  useEffect(() => { if (!rideActive) return; const iv = setInterval(() => setSeconds((s) => s + 1), 1000); return () => clearInterval(iv); }, [rideActive]);

  useEffect(() => {
    if (!rideActive) return;

    setEnergy((e) => (e > 0 ? +(e - 1 / 300).toFixed(3) : 0));
    const boardSpeed = equipped?.stats?.speed ?? 1;

    const pointsPerSecBase = 0.6;
    const paceMultiplier = (speed) => {
      if (!speed || Number.isNaN(speed)) return 0.3;
      if (speed < 6) return 0.6 * (speed / 6);
      if (speed > 25) return 0.6 * (25 / speed);
      return 1 + (speed - 6) / 28;
    };

    if (!demoMode && "geolocation" in navigator) {
      if (geoWatchId.current == null) {
        geoWatchId.current = navigator.geolocation.watchPosition(
          (pos) => {
            const { latitude, longitude } = pos.coords;
            if (lastPos.current) {
              const dist = haversine(lastPos.current, { latitude, longitude });
              setMeters((m) => m + dist);
              const speedKmh = (dist / 1000) * 3600;
              const energyMult = Math.max(0.25, Math.min(1, energy / 5));
              const perSec = pointsPerSecBase * boardSpeed * paceMultiplier(speedKmh) * energyMult;
              setEarnPts((p) => p + perSec);
            }
            lastPos.current = { latitude, longitude };
          },
          () => setDemoMode(true),
          { enableHighAccuracy: true, maximumAge: 1000, timeout: 10000 }
        );
      }
    } else {
      const iv = setInterval(() => {
        simTick.current += 1;
        const speedKmh = 10 + Math.sin(simTick.current / 10) * 5;
        const dist = (speedKmh * 1000) / 3600;
        setMeters((m) => m + dist);
        const energyMult = Math.max(0.25, Math.min(1, energy / 5));
        const perSec = pointsPerSecBase * boardSpeed * paceMultiplier(speedKmh) * energyMult;
        setEarnPts((p) => p + perSec);
      }, 1000);
      return () => clearInterval(iv);
    }

    return () => {
      if (geoWatchId.current != null) {
        navigator.geolocation.clearWatch(geoWatchId.current);
        geoWatchId.current = null;
        lastPos.current = null;
      }
    };
  }, [rideActive, demoMode, equipped, energy]);

  const km = metersToKm(meters);
  const avgKmh = seconds > 0 ? (km / (seconds / 3600)) : 0;

  async function siws() {
    if (!wallet.address) return alert("Connect wallet first.");
    const r1 = await fetch(API("/api/siws-challenge?address=" + wallet.address));
    const { message } = await r1.json();
    const enc = new TextEncoder();
    // Use the wallet adapter's signMessage for SIWS; ensure the wallet supports it
    if (!signMessage) return alert("Wallet does not support message signing.");
    const signed = await signMessage(enc.encode(message));
    const sigB64 = btoa(String.fromCharCode(...signed));
    const r2 = await fetch(API("/api/siws-verify"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address: wallet.address, message, signature: sigB64 }),
      credentials: "include",
    });
    if (!r2.ok) return alert("SIWS verification failed.");
    const data = await r2.json();
    setSession(data);
    alert("Signed in.");
  }

  function startRide() { if (energy <= 0 && !confirm("Energy is empty. Continue in low-earn mode?")) return; setRideActive(true); }
  function stopRide() { setRideActive(false); }
  function resetRide() { setRideActive(false); setSeconds(0); setMeters(0); setEarnPts(0); }

  async function claimPoints() {
    if (!session) return alert("Sign-in required.");
    if (!wallet.address) return alert("Wallet required.");
    const proof = {
      wallet: wallet.address,
      distanceMeters: meters,
      seconds,
      avgKmh,
      energyUsed: 5 - energy,
      device: navigator.userAgent.slice(0, 120),
      startedAt: Date.now() - seconds * 1000,
      endedAt: Date.now(),
    };
    const enc = new TextEncoder();
    // Sign the ride proof using the connected wallet via the wallet adapter
    if (!signMessage) return alert("Wallet does not support message signing.");
    const signed = await signMessage(enc.encode(JSON.stringify(proof)));
    const sigB64 = btoa(String.fromCharCode(...signed));
    const r = isPreview()
      ? { ok: true, json: async () => ({ delta: Math.round(earnPts), total: Math.round(earnPts) }) }
      : await fetch(API("/api/points/claim"), {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${session?.token || ""}` },
          body: JSON.stringify({ proof, signature: sigB64 }),
        });
    if (!r.ok) return alert("Claim failed.");
    const data = await r.json();
    alert(`Claimed +${data.delta} PUSH Points. Total: ${data.total}`);
    resetRide();
  }

  const [airdrop, setAirdrop] = useState({ email: "", twitter: "", ref: "" });
  async function registerAirdrop() {
    if (!session) return alert("Sign-in required.");
    const payload = { email: airdrop.email, twitter: airdrop.twitter, ref: airdrop.ref };
    const r = isPreview()
      ? { ok: true, json: async () => ({ ok: true }) }
      : await fetch(API("/api/airdrop/register"), {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${session?.token || ""}` },
          body: JSON.stringify(payload),
        });
    if (!r.ok) return alert("Airdrop registration failed.");
    alert("Registered for airdrop. Watch @pushskate for updates.");
  }

  // Signup state and handler for collecting customer signup data
  const [signup, setSignup] = useState({ name: "", email: "" });
  async function registerSignup() {
    if (!wallet.address) return alert("Wallet required.");
    const payload = { wallet: wallet.address, name: signup.name, email: signup.email };
    const r = isPreview()
      ? { ok: true, json: async () => ({ ok: true }) }
      : await fetch(API("/api/signup-register"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
    if (!r.ok) return alert("Signup failed.");
    alert("Signed up successfully.");
  }

  const [lb, setLb] = useState([]);
  async function loadLeaderboard() {
    const r = isPreview()
      ? { ok: true, json: async () => ({ items: [] }) }
      : await fetch(API("/api/leaderboard"));
    if (!r.ok) return;
    const data = await r.json();
    setLb(data.items || []);
  }
  useEffect(() => { if (tab === "leaderboard") loadLeaderboard(); }, [tab]);

  const tickerFeed = [
    { symbol: "SOL", name: "Solana", price: "$148.22", change: +2.4 },
    { symbol: "PUSH", name: "PUSH Points", price: "12,430", change: +6.3 },
    { symbol: "USDC", name: "USDC", price: "$1.00", change: 0.02 },
    { symbol: "BTC", name: "Bitcoin", price: "$68,402", change: -1.2 },
  ];

  const newsroom = [
    { title: "Crew challenges unlock this week", tag: "Community", time: "2h ago" },
    { title: "Energy regeneration now tuned to 5 / day", tag: "Product", time: "6h ago" },
    { title: "PUSH x Phantom: mobile-first SIWS", tag: "Partnership", time: "Yesterday" },
  ];

  const performanceSignals = [
    { label: "Avg. session", value: `${avgKmh.toFixed(1)} km/h`, delta: "+12%" },
    { label: "Energy health", value: `${Math.max(0, energy).toFixed(1)} / 5`, delta: "Live" },
    { label: "Est. payout", value: `${earnPts.toFixed(0)} pts`, delta: "Auto" },
  ];

  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-50 relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-emerald-500/20 blur-3xl" />
        <div className="absolute bottom-10 right-0 h-80 w-80 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.04),_transparent_35%)]" />
      </div>

      <header className="sticky top-0 z-30 backdrop-blur-xl bg-slate-950/70 border-b border-white/10">
        <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-emerald-400 via-cyan-400 to-blue-500 shadow-lg shadow-emerald-500/30 grid place-items-center text-black font-black">🛹</div>
            <div>
              <div className="text-xl font-bold tracking-tight">PUSH Skate</div>
              <div className="text-[11px] text-slate-400 -mt-0.5">Ride • Finance-grade dashboards • Solana</div>
            </div>
          </div>
          <nav className="hidden md:flex items-center gap-2 text-sm">
            <NavBtn onClick={() => setTab("ride")} active={tab === "ride"}>Ride</NavBtn>
            <NavBtn onClick={() => setTab("airdrop")} active={tab === "airdrop"}>Airdrop</NavBtn>
            <NavBtn onClick={() => setTab("signup")} active={tab === "signup"}>Sign Up</NavBtn>
            <NavBtn onClick={() => setTab("leaderboard")} active={tab === "leaderboard"}>Leaderboard</NavBtn>
            <NavBtn onClick={() => setTab("market")} active={tab === "market"}>Boards</NavBtn>
          </nav>
          <div className="flex items-center gap-2">
            <div className="hidden sm:block text-xs text-slate-400 text-right">
              <div>{wallet.address ? wallet.address.slice(0, 4) + "…" + wallet.address.slice(-4) : "Demo wallet"}</div>
              <div className="text-emerald-300">{session ? "SIWS active" : "SIWS pending"}</div>
            </div>
            <WalletMultiButton className="rounded-xl px-3 py-2 text-sm bg-white/10 hover:bg-white/20" />
            <button onClick={siws} className="rounded-xl px-3 py-2 bg-emerald-500 hover:bg-emerald-400 text-black text-sm border border-emerald-400/60 shadow-lg shadow-emerald-500/30">Sign In</button>
          </div>
        </div>
        <TickerStrip items={tickerFeed} />
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 space-y-8 relative z-10">
        <section className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="rounded-3xl bg-gradient-to-br from-emerald-500/20 via-slate-900 to-slate-950 border border-emerald-300/30 shadow-xl shadow-emerald-500/10 p-6 relative overflow-hidden">
              <div className="absolute right-6 top-6 h-24 w-24 rounded-full border border-emerald-300/40 bg-emerald-300/10 blur-2xl" />
              <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                <div className="space-y-3 max-w-xl">
                  <div className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/10 px-3 py-1 text-xs uppercase tracking-[0.08em] text-emerald-200">StepN-inspired motion • Finance-grade clarity</div>
                  <h1 className="text-3xl font-bold leading-tight text-white">Ride to earn <span className="text-emerald-300">PUSH</span> with live performance telemetry.</h1>
                  <p className="text-slate-200/80 text-sm max-w-xl">Mix the kinetic vibe of m.stepn.com with the signal-dense cards of finance.yahoo.com. Track energy, payout potential, and leaderboard momentum in one responsive cockpit.</p>
                  <div className="flex flex-wrap gap-3">
                    <button onClick={startRide} className="rounded-2xl px-4 py-2 bg-emerald-400 text-black font-semibold shadow-lg shadow-emerald-500/30 hover:bg-emerald-300">▶ Start ride</button>
                    <button onClick={() => setTab("market")} className="rounded-2xl px-4 py-2 bg-white/10 text-slate-50 border border-white/10 hover:bg-white/20">View boards</button>
                    <Tag>Devnet ready</Tag>
                    <Tag subtle>Anti-cheat • SIWS • Wallet adapter</Tag>
                  </div>
                </div>
                <div className="w-full lg:w-72 rounded-2xl bg-slate-950/70 border border-white/10 p-4 space-y-4 backdrop-blur">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>Ride health</span>
                    <span className="text-emerald-300">Live</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <Stat label="Avg speed" value={`${avgKmh.toFixed(1)} km/h`} accent />
                    <Stat label="Distance" value={`${km.toFixed(2)} km`} />
                    <Stat label="Energy" value={`${Math.max(0, energy).toFixed(2)} / 5`} />
                    <Stat label="Est. payout" value={`${earnPts.toFixed(0)} pts`} />
                  </div>
                  <ProgressBar value={(energy / 5) * 100} label="Energy reserve" />
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>Equipped</span>
                    <span className="text-slate-100 font-semibold">{equipped?.name || "None"}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="space-y-3">
            <Panel title="Performance signals">
              <div className="space-y-3">
                {performanceSignals.map((s) => (
                  <div key={s.label} className="flex items-center justify-between text-sm">
                    <div>
                      <div className="text-slate-300">{s.label}</div>
                      <div className="text-lg font-semibold text-white">{s.value}</div>
                    </div>
                    <span className="text-emerald-300 text-xs bg-emerald-500/10 border border-emerald-400/30 px-2 py-1 rounded-full">{s.delta}</span>
                  </div>
                ))}
              </div>
            </Panel>
            <Panel title="Quick utilities">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <button onClick={() => setDemoMode((v) => !v)} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 hover:bg-white/10 text-left">
                  <div className="text-slate-400 text-xs">Mode</div>
                  <div className="text-white font-semibold">{demoMode ? "Demo" : "GPS"}</div>
                </button>
                <button onClick={resetRide} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 hover:bg-white/10 text-left">
                  <div className="text-slate-400 text-xs">Session</div>
                  <div className="text-white font-semibold">Reset</div>
                </button>
                <button onClick={claimPoints} className="rounded-xl border border-emerald-400/40 bg-emerald-500/20 px-3 py-2 hover:bg-emerald-500/30 text-left">
                  <div className="text-slate-400 text-xs">Earnings</div>
                  <div className="text-white font-semibold">Claim pts</div>
                </button>
                <button onClick={() => setTab("leaderboard")} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 hover:bg-white/10 text-left">
                  <div className="text-slate-400 text-xs">Community</div>
                  <div className="text-white font-semibold">Leaderboard</div>
                </button>
              </div>
            </Panel>
          </div>
        </section>

        <section className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs uppercase tracking-[0.08em] text-slate-400">Control center</div>
                <h2 className="text-xl font-semibold text-white">Actionable tabs</h2>
              </div>
              <div className="flex flex-wrap gap-2">
                <NavBtn onClick={() => setTab("ride")} active={tab === "ride"}>Ride</NavBtn>
                <NavBtn onClick={() => setTab("airdrop")} active={tab === "airdrop"}>Airdrop</NavBtn>
                <NavBtn onClick={() => setTab("signup")} active={tab === "signup"}>Sign Up</NavBtn>
                <NavBtn onClick={() => setTab("leaderboard")} active={tab === "leaderboard"}>Leaderboard</NavBtn>
                <NavBtn onClick={() => setTab("market")} active={tab === "market"}>Boards</NavBtn>
              </div>
            </div>

            <Panel>
              {tab === "ride" && (
                <div className="grid lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 space-y-4">
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-lg shadow-black/30">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold">Live ride</h3>
                        <div className="flex items-center gap-2 text-xs text-slate-400">
                          <span>Demo Mode</span>
                          <Toggle on={demoMode} setOn={setDemoMode} />
                        </div>
                      </div>
                      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                        <Stat label="Time" value={secondsToHMS(seconds)} />
                        <Stat label="Distance" value={`${km.toFixed(2)} km`} />
                        <Stat label="Avg Speed" value={`${avgKmh.toFixed(1)} km/h`} />
                        <Stat label="PUSH (est.)" value={`${earnPts.toFixed(0)} pts`} accent />
                      </div>
                      <div className="mt-4">
                        <ProgressBar value={(energy / 5) * 100} label={`Energy • ${Math.max(0, energy).toFixed(2)} / 5`} />
                      </div>
                      <div className="mt-5 flex flex-wrap gap-3">
                        {!rideActive ? (
                          <button onClick={startRide} className="flex-1 rounded-xl py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold shadow-lg shadow-emerald-500/40">▶ Start Ride</button>
                        ) : (
                          <button onClick={stopRide} className="flex-1 rounded-xl py-3 bg-rose-500 hover:bg-rose-400 text-black font-semibold shadow-lg shadow-rose-500/40">■ Stop Ride</button>
                        )}
                        <button onClick={resetRide} className="rounded-xl px-4 py-3 bg-white/10 hover:bg-white/20 border border-white/10">Reset</button>
                        <button onClick={claimPoints} className="rounded-xl px-4 py-3 bg-cyan-500 hover:bg-cyan-400 text-black">Claim Points</button>
                      </div>
                      <p className="mt-3 text-xs text-slate-400">Earning scales with the StepN-inspired speed window (≈6–25 km/h), board stats, and remaining energy.</p>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900 to-slate-950 p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold">Your boards</h3>
                        <span className="text-xs text-slate-400">{boards.length} owned</span>
                      </div>
                      <div className="grid grid-cols-1 gap-3">
                        {boards.map((b) => (
                          <BoardCard key={b.id} board={b} equipped={b.id === equippedId} onEquip={() => setEquippedId(b.id)} />
                        ))}
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-3">
                        <button onClick={() => setBoards([createDemoBoard(), ...boards])} className="rounded-xl px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/10">Mint demo board</button>
                        <button onClick={() => alert("Mint via /api/nft/mint (Metaplex) after configuring server.")} className="rounded-xl px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black">Mint on Solana</button>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <h3 className="font-semibold">Equipped board</h3>
                      {equipped ? <BoardCard board={equipped} equipped onEquip={() => {}} /> : <div className="text-sm text-slate-400">No board.</div>}
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-emerald-500/10 p-4">
                      <h3 className="font-semibold">Session notes</h3>
                      <ul className="mt-2 text-sm text-slate-200 space-y-2 list-disc list-inside">
                        <li>Auto anti-cheat tap-in for abnormal pace.</li>
                        <li>Use SIWS to bind rides to wallet identity.</li>
                        <li>Devnet payouts shown; swap for mainnet in config.</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {tab === "airdrop" && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-5">
                    <h3 className="text-lg font-semibold text-white">Join the PUSH Airdrop</h3>
                    <p className="text-sm text-slate-200 mt-2">Connect wallet, sign in, and register. Complete rides to earn PUSH Points—convertible at TGE per the airdrop rules.</p>
                    <div className="mt-4 grid gap-3">
                      <input className="rounded-xl bg-white/10 border border-white/10 px-3 py-2" placeholder="Email" value={airdrop.email} onChange={(e)=>setAirdrop(v=>({...v, email: e.target.value}))} />
                      <input className="rounded-xl bg-white/10 border border-white/10 px-3 py-2" placeholder="Twitter / X (optional)" value={airdrop.twitter} onChange={(e)=>setAirdrop(v=>({...v, twitter: e.target.value}))} />
                      <input className="rounded-xl bg-white/10 border border-white/10 px-3 py-2" placeholder="Referral code (optional)" value={airdrop.ref} onChange={(e)=>setAirdrop(v=>({...v, ref: e.target.value}))} />
                      <button onClick={()=>registerAirdrop()} className="rounded-xl px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold">Register</button>
                    </div>
                    <p className="text-[11px] text-slate-200/70 mt-3">By registering, you agree to our Terms & that this is not financial advice. Airdrop eligibility may be restricted in some regions.</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                    <h3 className="font-semibold">Refer friends</h3>
                    <p className="text-sm text-slate-300">After registering, get your referral code in your profile to earn bonus points when friends ride.</p>
                    <ul className="text-sm mt-3 space-y-2 text-slate-200 list-disc list-inside">
                      <li>+100 pts per verified signup</li>
                      <li>+10% of their first 7 days’ ride points</li>
                      <li>Weekly streak bonuses for active crews</li>
                    </ul>
                  </div>
                </div>
              )}

              {tab === "signup" && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900 to-slate-950 p-5">
                    <h3 className="text-lg font-semibold">Sign Up</h3>
                    <p className="text-sm text-slate-300">Provide your name and email to join our community.</p>
                    <div className="mt-4 grid gap-3">
                      <input className="rounded-xl bg-white/10 border border-white/10 px-3 py-2" placeholder="Name" value={signup.name} onChange={(e) => setSignup(v => ({ ...v, name: e.target.value }))} />
                      <input className="rounded-xl bg-white/10 border border-white/10 px-3 py-2" placeholder="Email" value={signup.email} onChange={(e) => setSignup(v => ({ ...v, email: e.target.value }))} />
                      <button onClick={() => registerSignup()} className="rounded-xl px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold">Sign Up</button>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-5">
                    <h3 className="font-semibold">Why we ask</h3>
                    <p className="text-sm text-slate-200">We mirror the finance.yahoo.com trust layer: opt-in communication for drops, city activations, and product alerts.</p>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs">
                      <Chip>Product alerts</Chip>
                      <Chip>City drops</Chip>
                      <Chip>Security notices</Chip>
                    </div>
                  </div>
                </div>
              )}

              {tab === "leaderboard" && (
                <section>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <h3 className="font-semibold mb-3">Leaderboard</h3>
                    <table className="w-full text-sm">
                      <thead className="text-slate-400"><tr><th className="text-left py-2">#</th><th className="text-left">Wallet</th><th className="text-right">Points</th></tr></thead>
                      <tbody>
                        {lb.map((row, i) => (
                          <tr key={row.address} className="border-t border-white/5">
                            <td className="py-2">{i+1}</td>
                            <td>{row.address.slice(0,6)}…{row.address.slice(-6)}</td>
                            <td className="text-right">{row.points}</td>
                          </tr>
                        ))}
                        {lb.length === 0 && <tr><td colSpan="3" className="py-6 text-center text-slate-500">No entries yet.</td></tr>}
                      </tbody>
                    </table>
                  </div>
                </section>
              )}

              {tab === "market" && (
                <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900 to-slate-950 p-5">
                    <h3 className="text-lg font-semibold">Marketplace (Soon)</h3>
                    <div className="text-sm text-slate-300">List/buy/sell Boards with royalties; devnet first. Anti-cheat, Geo events, Streaks, Crews.</div>
                    <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
                      <Chip>Royalties</Chip><Chip>Anti‑cheat</Chip><Chip>Geo‑events</Chip>
                      <Chip>Crews</Chip><Chip>Streaks</Chip><Chip>Leaderboards</Chip>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-5">
                    <h3 className="font-semibold">Faucet</h3>
                    <p className="text-sm text-slate-200">Prime your wallet with SOL before minting. Devnet faucet recommended for testing the new marketplace rails.</p>
                    <a className="mt-3 inline-flex text-sm underline text-emerald-200 hover:text-emerald-100" href="https://faucet.solana.com/" target="_blank" rel="noreferrer">Get devnet SOL →</a>
                  </div>
                </section>
              )}
            </Panel>
          </div>

          <aside className="space-y-4">
            <Panel title="Market pulse">
              <div className="space-y-2">
                {tickerFeed.map((item) => (
                  <div key={item.symbol} className="flex items-center justify-between rounded-xl border border-white/5 bg-white/5 px-3 py-2">
                    <div>
                      <div className="text-sm font-semibold text-white">{item.symbol}</div>
                      <div className="text-xs text-slate-400">{item.name}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-white">{item.price}</div>
                      <div className={`text-xs ${item.change >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>{item.change >= 0 ? '+' : ''}{item.change}%</div>
                    </div>
                  </div>
                ))}
              </div>
            </Panel>
            <Panel title="PUSH newsroom">
              <div className="space-y-3">
                {newsroom.map((n) => <NewsCard key={n.title} {...n} />)}
              </div>
            </Panel>
          </aside>
        </section>
      </main>

      <footer className="mx-auto max-w-6xl px-4 pb-10 text-xs text-slate-400 relative z-10">
        © {new Date().getFullYear()} PUSH (devnet). Not financial advice. Points are off-chain; airdrop subject to eligibility.
      </footer>
    </div>
  );
}

function NavBtn({ children, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-lg border transition ${active ? 'border-emerald-400 bg-emerald-400/10 text-white shadow-sm shadow-emerald-500/30' : 'border-white/10 bg-white/5 text-slate-200 hover:bg-white/10'}`}
    >
      {children}
    </button>
  );
}

function Panel({ children, title }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-4 shadow-xl shadow-black/30 backdrop-blur">
      {title && <h3 className="text-sm font-semibold text-slate-200 mb-3 flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-emerald-400 inline-block" />{title}</h3>}
      {children}
    </div>
  );
}

function Stat({ label, value, accent }) {
  return (
    <div className={`rounded-2xl border border-white/10 p-3 bg-gradient-to-br ${accent ? "from-emerald-500/20 to-cyan-500/10" : "from-white/5 to-white/0"}`}>
      <div className="text-xs text-slate-400">{label}</div>
      <div className={`text-lg font-semibold mt-1 ${accent ? "text-emerald-200" : "text-slate-100"}`}>{value}</div>
    </div>
  );
}

function Chip({ children }) { return <span className="px-3 py-1 rounded-full bg-white/10 border border-white/10 text-slate-200 inline-flex items-center justify-center">{children}</span>; }

function Toggle({ on, setOn }) { return (<button onClick={() => setOn(!on)} className={`h-6 w-11 rounded-full border border-white/10 p-0.5 transition ${on ? "bg-emerald-500" : "bg-white/10"}`} aria-pressed={on}><span className={`block h-5 w-5 rounded-full bg-white transition ${on ? "translate-x-5" : "translate-x-0"}`}></span></button>); }

function BoardCard({ board, onEquip, equipped }) {
  const rColors = { Common: "from-slate-600 to-slate-800", Uncommon: "from-emerald-600 to-emerald-800", Rare: "from-indigo-600 to-indigo-800", Epic: "from-fuchsia-600 to-fuchsia-800", Legendary: "from-amber-500 to-orange-700" };
  return (
    <div className="rounded-xl border border-white/10 p-3 bg-white/5">
      <div className="flex items-center gap-3">
        <div className={`h-12 w-12 rounded-lg bg-gradient-to-br ${rColors[board.rarity]} grid place-items-center text-black text-lg font-black`}>🛹</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <div className="font-semibold truncate">{board.name}</div>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 border border-white/10">Lv {board.lvl}</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 border border-white/10">{board.rarity}</span>
          </div>
          <div className="mt-1 text-xs text-slate-400 grid grid-cols-2 gap-2">
            <span>Speed <b className="text-slate-200">×{board.stats.speed}</b></span>
            <span>Control <b className="text-slate-200">×{board.stats.control}</b></span>
            <span>Luck <b className="text-slate-200">×{board.stats.luck}</b></span>
            <span>Durab. <b className="text-slate-200">×{board.stats.durability}</b></span>
          </div>
        </div>
        {!equipped && <button onClick={onEquip} className="rounded-lg px-3 py-2 bg-white/10 hover:bg-white/20 border border-white/10 text-sm">Equip</button>}
        {equipped && <span className="text-xs text-emerald-300">Equipped</span>}
      </div>
    </div>
  );
}

function ProgressBar({ value, label }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs text-slate-400">
        <span>{label}</span>
        <span className="text-emerald-300">{Math.round(value)}%</span>
      </div>
      <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
        <div className="h-full bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-500" style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
      </div>
    </div>
  );
}

function Tag({ children, subtle }) {
  return (
    <span className={`px-3 py-1 rounded-full border text-xs ${subtle ? 'border-white/10 text-slate-300 bg-white/5' : 'border-emerald-300/50 text-emerald-50 bg-emerald-500/10'}`}>
      {children}
    </span>
  );
}

function TickerStrip({ items }) {
  return (
    <div className="border-t border-white/10 bg-black/40">
      <div className="mx-auto max-w-6xl px-4 py-2 flex flex-wrap gap-3 text-xs">
        {items.map((item) => (
          <div key={item.symbol} className="flex items-center gap-2 rounded-full bg-white/5 px-3 py-1 border border-white/10">
            <span className="font-semibold text-white">{item.symbol}</span>
            <span className="text-slate-300">{item.price}</span>
            <span className={`font-semibold ${item.change >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>{item.change >= 0 ? '+' : ''}{item.change}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function NewsCard({ title, tag, time }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">
      <div className="flex items-center justify-between text-xs text-slate-400">
        <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-slate-200">{tag}</span>
        <span>{time}</span>
      </div>
      <div className="mt-2 text-sm font-semibold text-white">{title}</div>
    </div>
  );
}

// Removed duplicate metersToKm function definition. A single metersToKm helper is defined at the top of this file.
// function metersToKm(m) { return m / 1000; }
function haversine(a, b) {
  const R = 6371e3;
  const φ1 = (a.latitude * Math.PI) / 180;
  const φ2 = (b.latitude * Math.PI) / 180;
  const Δφ = ((b.latitude - a.latitude) * Math.PI) / 180;
  const Δλ = ((b.longitude - a.longitude) * Math.PI) / 180;
  const s = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
  return R * c;
}
