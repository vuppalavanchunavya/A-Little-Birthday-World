import { type CSSProperties, type ReactNode, useEffect, useRef, useState } from 'react';
import {
  ArrowLeft, ArrowRight, Check, ChevronLeft, ChevronRight, Gift,
  Heart, Image as ImageIcon, Lock, Mail, Music, Pause, Play, Sparkles, Star, Trophy, Volume2, VolumeX, X,
} from 'lucide-react';
import {
  assetUrl,
  birthdayConfig,
  birthdayGifts,
  reasonsData,
  sisterPromises,
  sisterVouchers,
  triviaQuestions,
  type GiftDayConfig,
} from './config/birthdayConfig';

type Screen = 'welcome' | 'countdown' | 'accept' | 'menu' | 'reasons' | 'letter' | 'trivia' | 'album' | 'promises' | 'final';

function getBirthdayInstant(date: string, timeZone: string) {
  const [year, month, day] = date.split('-').map(Number);
  const utcMidnight = Date.UTC(year, month - 1, day);
  const localParts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date(utcMidnight));
  const parts = Object.fromEntries(localParts.map(({ type, value }) => [type, value]));
  const localTimeAsUtc = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
    Number(parts.second),
  );
  return utcMidnight - (localTimeAsUtc - utcMidnight);
}

const birthdayInstant = getBirthdayInstant(birthdayConfig.birthday, birthdayConfig.timezone);

function getBirthdayState(now: number) {
  const ms = Math.max(0, birthdayInstant - now);
  const celebratory = now >= birthdayInstant;
  return {
    celebratory,
    days: Math.floor(ms / 86_400_000),
    hours: Math.floor((ms % 86_400_000) / 3_600_000),
    minutes: Math.floor((ms % 3_600_000) / 60_000),
    seconds: Math.floor((ms % 60_000) / 1000),
  };
}

function playSynthesizedSound(type: 'sparkle' | 'boing' | 'candle' | 'blow', enabled: boolean) {
  if (!enabled || typeof window === 'undefined') return;
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
    const now = ctx.currentTime;
    if (type === 'blow') {
      const bufferSize = Math.floor(ctx.sampleRate * 0.35);
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(650, now);
      filter.frequency.exponentialRampToValueAtTime(220, now + 0.32);
      filter.Q.value = 2.2;

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.3, now + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      noise.start(now);
      noise.stop(now + 0.35);

      [659.25, 783.99, 1046.5, 1318.5].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + 0.16 + i * 0.07);
        g.gain.setValueAtTime(0.18, now + 0.16 + i * 0.07);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.16 + i * 0.07 + 0.35);
        osc.connect(g);
        g.connect(ctx.destination);
        osc.start(now + 0.16 + i * 0.07);
        osc.stop(now + 0.16 + i * 0.07 + 0.38);
      });
    } else if (type === 'boing') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(170, now);
      osc.frequency.exponentialRampToValueAtTime(540, now + 0.16);
      osc.frequency.exponentialRampToValueAtTime(260, now + 0.36);
      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.42);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.42);
    } else if (type === 'sparkle') {
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.08);
        gain.gain.setValueAtTime(0.2, now + i * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.3);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + i * 0.08);
        osc.stop(now + i * 0.08 + 0.32);
      });
    } else if (type === 'candle') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(440, now + 0.24);
      gain.gain.setValueAtTime(0.22, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.28);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.28);
    }
  } catch {
    // Ignore audio context errors gracefully
  }
}

function App() {
  const [screen, setScreen] = useState<Screen>('welcome');
  const [now, setNow] = useState(Date.now());
  const urlPreviewDate = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('previewDate') : null;
  const effectiveTimestamp = urlPreviewDate ? Date.parse(urlPreviewDate) : now;
  
  const [rejectedFrom, setRejectedFrom] = useState<'welcome' | 'accept' | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [welcomeNote, setWelcomeNote] = useState('');
  const [acceptNote, setAcceptNote] = useState('');
  const [letterOpen, setLetterOpen] = useState(false);
  const [finalOpen, setFinalOpen] = useState(false);
  const [candlesOut, setCandlesOut] = useState(false);
  const [wishNote, setWishNote] = useState('');
  const [photoIndex, setPhotoIndex] = useState<number | null>(null);
  const [albumPage, setAlbumPage] = useState(0);

  const [lockedModalGift, setLockedModalGift] = useState<GiftDayConfig | null>(null);
  const [redeemedVouchers, setRedeemedVouchers] = useState<Record<string, boolean>>({});
  const [triviaStep, setTriviaStep] = useState(0);
  const [triviaAnswers, setTriviaAnswers] = useState<Record<number, number>>({});

  const birthday = getBirthdayState(effectiveTimestamp);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  // Strict anti-cheating guard: prevent access to screens of locked days
  useEffect(() => {
    if (screen !== 'welcome' && screen !== 'countdown' && screen !== 'accept' && screen !== 'menu') {
      const activeGift = birthdayGifts.find((g) => g.screen === screen);
      if (activeGift && !isGiftUnlocked(activeGift)) {
        setScreen('menu');
        setLockedModalGift(activeGift);
      }
    }
  }, [screen, effectiveTimestamp]);

  const playSfx = (type: 'sparkle' | 'boing' | 'candle' | 'blow') => {
    playSynthesizedSound(type, soundEnabled);
  };

  const isGiftUnlocked = (gift: GiftDayConfig) => {
    const unlockInstant = getBirthdayInstant(gift.unlockDate, birthdayConfig.timezone);
    return effectiveTimestamp >= unlockInstant;
  };

  const handleGiftClick = (gift: GiftDayConfig) => {
    if (!isGiftUnlocked(gift)) {
      playSfx('boing');
      setLockedModalGift(gift);
      return;
    }
    playSfx('sparkle');
    if (gift.screen === 'letter') setLetterOpen(false);
    if (gift.screen === 'final') setFinalOpen(false);
    setScreen(gift.screen);
  };

  const showMenu = () => {
    setRejectedFrom(null);
    setScreen('menu');
    playSfx('sparkle');
  };

  const startOver = () => {
    setScreen('welcome');
    setRejectedFrom(null);
    setLetterOpen(false);
    setFinalOpen(false);
    setCandlesOut(false);
    setWishNote('');
    playSfx('sparkle');
  };

  const handleDecline = (source: 'welcome' | 'accept') => {
    setRejectedFrom(source);
    playSfx('boing');
    if (source === 'welcome') {
      setWelcomeNote('HOW DARE YOU!? Shinchan is not letting you say no! 😤');
    } else {
      setAcceptNote('HOW DARE YOU!? Shinchan demands you take your gifts! 😜');
    }
  };

  const handleTryAgain = () => {
    playSfx('sparkle');
    const source = rejectedFrom;
    setRejectedFrom(null);
    if (source === 'welcome') {
      setWelcomeNote('Hehe, good choice! Shinchan knew you would say yes!');
    } else {
      setAcceptNote('Yay! Shinchan is happy now!');
    }
  };

  return (
    <main className="app-shell">
      <header className="topbar">
        <button className="brand" onClick={showMenu} aria-label="Go to gift selection" data-testid="nav-home">
          <span className="brand-mark"><Heart size={17} fill="currentColor" /></span>
          <span>A little birthday world</span>
        </button>
        <div className="top-actions">
          <button 
            className="sound-toggle-btn"
            onClick={() => setSoundEnabled(!soundEnabled)}
            aria-label={soundEnabled ? 'Mute sound effects' : 'Enable sound effects'}
            title={soundEnabled ? 'Sound is ON' : 'Sound is OFF'}
          >
            {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            <span>{soundEnabled ? 'Sound ON' : 'Muted'}</span>
          </button>
          <span className="status-pill" data-testid="status-birthday-mode">
            <Sparkles size={14} /> {birthday.celebratory ? 'Birthday mode' : 'Made with love'}
          </span>
          {screen !== 'welcome' && (
            <button className="top-action" onClick={showMenu} data-testid="nav-your-gifts">
              <Gift size={16} /><span>Your gifts</span>
            </button>
          )}
        </div>
      </header>

      <div className="content">
        {/* HOW DARE YOU SCREEN (Shows on rejection from Welcome or Accept) */}
        {rejectedFrom !== null && (
          <section className="stage" aria-label="Rejection screen">
            <SparkleField />
            <article className="gingham-border">
              <div className="gingham-inner-card">
                <h1 className="dare-title">HOW DARE YOU!?</h1>
                <div className="dare-shinchan-frame">
                  <img
                    src={assetUrl('/images/shinchan/how-dare-you.jpg')}
                    alt="Shinchan doing funny upside-down handstand pose shouting how dare you"
                    className="dare-shinchan-img"
                  />
                </div>
                <p className="subtitle" style={{ color: '#b7094c', fontWeight: 600, margin: '6px auto 16px', fontSize: '1.05rem' }}>
                  {rejectedFrom === 'welcome'
                    ? "You can't say no to this birthday surprise! Shinchan is watching you! 😤"
                    : "Shin-chan says: You HAVE to accept your gifts! No excuses allowed! 😜"}
                </p>
                <div>
                  <button
                    className="btn-try-again"
                    onClick={handleTryAgain}
                    data-testid="button-try-again"
                  >
                    <Sparkles size={18} /> TRY AGAIN
                  </button>
                </div>
                <p className="tiny-note" role="status" data-testid={rejectedFrom === 'welcome' ? 'status-welcome-response' : 'status-accept-response'}>
                  {rejectedFrom === 'welcome' ? welcomeNote : acceptNote}
                </p>
              </div>
            </article>
          </section>
        )}

        {/* SCREEN 1: WELCOME */}
        {screen === 'welcome' && rejectedFrom === null && (
          <section className="stage" aria-labelledby="welcome-title">
            <SparkleField />
            <article className="card hero-card paper-grain">
              <div className="shinchan-tag">
                <Sparkles size={13} /> Shin-chan’s Special Delivery
              </div>
              <div className="eyebrow">a tiny surprise, made just for you</div>
              <h1 id="welcome-title" className="title">Hey, {birthdayConfig.name}!</h1>
              <p className="subtitle">
                Someone very special has a little surprise waiting for her. A few pages, a lot of love, and one very favourite sister.
              </p>
              
              <div className="shinchan-hero-art">
                <img
                  src={assetUrl('/images/shinchan/welcome.jpg')}
                  alt="Shin-chan happily waving both hands welcoming Cherry"
                />
              </div>

              <h2 className="font-hand" style={{ fontSize: '1.85rem', color: '#173b65', margin: '4px 0 0' }}>
                Are you ready to open it?
              </h2>
              
              <div className="button-row">
                <button
                  className="btn"
                  onClick={() => {
                    playSfx('sparkle');
                    setWelcomeNote('');
                    setScreen('countdown');
                  }}
                  data-testid="button-welcome-yes"
                >
                  <Heart size={16} fill="currentColor" /> Yes, show me
                </button>
                <button
                  className="btn secondary"
                  onClick={() => handleDecline('welcome')}
                  data-testid="button-welcome-not-yet"
                >
                  Not yet
                </button>
              </div>
              <p className="tiny-note" role="status" data-testid="status-welcome-response">
                {welcomeNote}
              </p>
            </article>
          </section>
        )}

        {/* SCREEN 2: COUNTDOWN */}
        {screen === 'countdown' && (
          <section className="stage" aria-labelledby="countdown-title">
            <SparkleField />
            {birthday.celebratory && <ConfettiField />}
            <article className="card hero-card paper-grain">
              <div className="shinchan-tag">
                {birthday.celebratory ? (
                  <><Sparkles size={13} /> Birthday Bash with Shin-chan!</>
                ) : (
                  <><Star size={13} /> Shin-chan is counting down!</>
                )}
              </div>
              <div className="eyebrow">
                {birthday.celebratory ? 'the day we have been waiting for' : 'a date circled in blue'}
              </div>
              
              {birthday.celebratory ? (
                <>
                  <span className="status-pill"><Sparkles size={14} /> October 30 · today is yours</span>
                  <h1 id="countdown-title" className="title">It’s your birthday,<br />{birthdayConfig.name}!</h1>
                  <p className="subtitle">
                    The whole little world is ready to celebrate you. Take your time — all the surprises are yours to open.
                  </p>
                  
                  <div className="shinchan-hero-art">
                    <img
                      src={assetUrl('/images/shinchan/celebrate.jpg')}
                      alt="Shinchan celebrating birthday with party hat and horn"
                    />
                  </div>

                  <button
                    className="btn"
                    onClick={() => {
                      playSfx('sparkle');
                      setScreen('accept');
                    }}
                    data-testid="button-celebrate"
                  >
                    Let’s celebrate <ArrowRight size={16} />
                  </button>
                </>
              ) : (
                <>
                  <h1 id="countdown-title" className="title">Something lovely<br />is waiting for you</h1>
                  <p className="subtitle">
                    The birthday is getting closer. Until then, here’s a little peek at the love waiting inside.
                  </p>
                  
                  <div className="shinchan-hero-art">
                    <img
                      src={assetUrl('/images/shinchan/countdown.jpg')}
                      alt="Shinchan eagerly waiting by the calendar and clock dreaming of birthday cake"
                    />
                  </div>

                  <div className="countdown" aria-label="Time until birthday" data-testid="birthday-countdown">
                    {[
                      ['Days', birthday.days],
                      ['Hours', birthday.hours],
                      ['Minutes', birthday.minutes],
                      ['Seconds', birthday.seconds],
                    ].map(([label, value]) => (
                      <div className="time-unit" key={label}>
                        <strong>{String(value).padStart(2, '0')}</strong>
                        <span>{label}</span>
                      </div>
                    ))}
                  </div>
                  <p className="tiny-note">30 October 2026 · India Standard Time</p>
                  <button
                    className="btn"
                    onClick={() => {
                      playSfx('sparkle');
                      setScreen('accept');
                    }}
                    data-testid="button-preview-gifts"
                  >
                    Explore your surprises <ArrowRight size={16} />
                  </button>
                </>
              )}
            </article>

            {birthday.celebratory && (
              <CakeWish
                candlesOut={candlesOut}
                setCandlesOut={setCandlesOut}
                wishNote={wishNote}
                setWishNote={setWishNote}
                soundEnabled={soundEnabled}
                onBlow={() => playSfx('blow')}
                onRelight={() => playSfx('sparkle')}
              />
            )}
          </section>
        )}

        {/* SCREEN 3: ACCEPT GIFTS */}
        {screen === 'accept' && rejectedFrom === null && (
          <section className="stage" aria-labelledby="accept-title">
            <SparkleField />
            <article className="card hero-card paper-grain">
              <div className="shinchan-tag">
                <Heart size={13} fill="currentColor" /> Packed with Shin-chan’s love
              </div>
              <div className="eyebrow">one very important question</div>
              <h1 id="accept-title" className="title">Accept your gifts?</h1>
              
              <div className="shinchan-hero-art">
                <img
                  src={assetUrl('/images/shinchan/accept.jpg')}
                  alt="Shinchan holding a gift box with puppy eyes asking accept your gifts"
                />
              </div>

              <p className="subtitle">Six daily treasures for your birthday countdown, wrapped up with all my love.</p>
              
              <div className="button-row">
                <button
                  className="btn"
                  onClick={() => {
                    playSfx('sparkle');
                    setAcceptNote('');
                    setScreen('menu');
                  }}
                  data-testid="button-accept-yes"
                >
                  <Check size={17} /> Yes, please!
                </button>
                <button
                  className="btn secondary"
                  onClick={() => handleDecline('accept')}
                  data-testid="button-accept-no"
                >
                  Not today
                </button>
              </div>
              <p className="tiny-note" role="status" data-testid="status-accept-response">
                {acceptNote}
              </p>
            </article>
          </section>
        )}

        {/* SCREEN 4: 6-DAY BIRTHDAY CALENDAR & GIFT SELECTION */}
        {screen === 'menu' && (
          <section className="stage" aria-labelledby="menu-title">
            <div className="section-head">
              <div className="shinchan-tag">
                <Gift size={13} /> Shin-chan’s 6-Day Birthday Calendar
              </div>
              <div className="eyebrow">one surprise each day · big reveal on 30 oct</div>
              <h1 id="menu-title" className="title">Yay! Choose your gift</h1>
              <p className="subtitle">
                Each day unlocks a special keepsake leading up to your grand birthday celebration!
              </p>
            </div>

            {/* Progress Indicator */}
            {(() => {
              const unlockedCount = birthdayGifts.filter((g) => isGiftUnlocked(g)).length;
              return (
                <>
                  <div className="gifts-progress-bar">
                    <div
                      className="gifts-progress-fill"
                      style={{ width: `${(unlockedCount / birthdayGifts.length) * 100}%` }}
                    />
                  </div>
                  <p style={{ margin: '-12px 0 22px', fontSize: '0.86rem', color: '#173b65', fontWeight: 700 }}>
                    {unlockedCount} of 6 Surprises Unlocked ✨
                  </p>
                </>
              );
            })()}

            <div className="gift-grid-6">
              {birthdayGifts.map((gift) => {
                const unlocked = isGiftUnlocked(gift);
                return (
                  <div
                    key={gift.id}
                    className={`gift-card-6 ${unlocked ? 'unlocked' : 'locked'}`}
                    onClick={() => handleGiftClick(gift)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleGiftClick(gift);
                      }
                    }}
                    data-testid={`gift-card-${gift.id}`}
                  >
                    <div className={`gift-day-badge ${unlocked ? (gift.dayNumber === 6 ? 'badge-grand' : 'badge-unlocked') : 'badge-locked'}`}>
                      {unlocked ? <Sparkles size={11} /> : <Lock size={11} />}
                      {unlocked ? gift.badge : `🔒 Day ${gift.dayNumber} · ${gift.displayDate}`}
                    </div>

                    <div className="gift-shinchan-thumb" style={{ width: 88, height: 88, margin: '6px auto 12px' }}>
                      {unlocked ? (
                        <img src={gift.image} alt={gift.title} />
                      ) : (
                        <MysteryGiftBox dayNumber={gift.dayNumber} />
                      )}
                    </div>

                    <h3
                      style={{
                        fontFamily: unlocked ? 'Caveat, cursive' : 'Fredoka, cursive, sans-serif',
                        fontSize: unlocked ? '1.75rem' : '1.2rem',
                        color: unlocked ? '#173b65' : '#1e293b',
                        margin: '0 0 6px',
                        lineHeight: 1.25,
                      }}
                    >
                      {unlocked ? gift.title : gift.lockedTitle}
                    </h3>
                    <p
                      style={{
                        fontSize: '0.86rem',
                        color: unlocked ? '#64748b' : '#64748b',
                        fontStyle: unlocked ? 'normal' : 'italic',
                        margin: '0 0 14px',
                        lineHeight: 1.45,
                      }}
                    >
                      {unlocked ? gift.subtitle : gift.lockedSubtitle}
                    </p>

                    <div className={`gift-card-status-pill ${unlocked ? 'status-open' : 'status-locked'}`}>
                      {unlocked ? (
                        <>✨ Unlocked · Tap to open</>
                      ) : (
                        <>🔒 Locked until {gift.displayDate}</>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              className="btn text"
              onClick={() => {
                playSfx('sparkle');
                setScreen('countdown');
              }}
              data-testid="button-back-countdown"
              style={{ marginTop: 28 }}
            >
              <ArrowLeft size={15} /> Back to the birthday page
            </button>
          </section>
        )}

        {/* DAY 1: THE JAR OF REASONS */}
        {screen === 'reasons' && (
          <GiftFrame onBack={showMenu} label="Day 1 · Reasons & Sister Vouchers">
            <article className="card hero-card paper-grain" style={{ width: 'min(860px, 100%)' }}>
              <div className="shinchan-tag">
                <Heart size={13} fill="currentColor" /> Day 1 Surprise · 25 Oct
              </div>
              <h1 className="title" style={{ fontSize: 'clamp(2.4rem, 6vw, 3.6rem)' }}>The Jar of Reasons</h1>
              <p className="subtitle">
                Six little things that make you the most special sister, plus 4 official sister vouchers you can redeem anytime!
              </p>

              <div className="reasons-container">
                {reasonsData.map((r, i) => (
                  <div className="reason-card" key={i}>
                    <div style={{ fontSize: '1.6rem', marginBottom: 6 }}>{r.emoji}</div>
                    <h3 style={{ fontFamily: 'Fredoka, cursive', color: '#173b65', margin: '0 0 6px', fontSize: '1.1rem' }}>
                      {i + 1}. {r.title}
                    </h3>
                    <p style={{ margin: 0, color: '#49647c', fontSize: '0.9rem', lineHeight: 1.5 }}>
                      {r.text}
                    </p>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: 28, textAlign: 'center' }}>
                <div className="shinchan-tag">
                  <Gift size={13} /> Official Sister Vouchers
                </div>
                <h2 style={{ fontFamily: 'Caveat, cursive', color: '#173b65', fontSize: '2.2rem', margin: '6px 0 14px' }}>
                  Tap to Redeem with Love
                </h2>
                <div className="voucher-grid">
                  {sisterVouchers.map((v) => {
                    const redeemed = !!redeemedVouchers[v.id];
                    return (
                      <div className={`voucher-card ${redeemed ? 'redeemed' : ''}`} key={v.id}>
                        <div style={{ fontSize: '1.8rem', marginBottom: 4 }}>{v.icon}</div>
                        <h4 style={{ fontFamily: 'Fredoka, cursive', color: redeemed ? '#15803d' : '#b45309', margin: '0 0 4px', fontSize: '1rem' }}>
                          {v.title}
                        </h4>
                        <p style={{ margin: '0 0 10px', fontSize: '0.82rem', color: '#64748b' }}>
                          {v.desc}
                        </p>
                        <button
                          className="btn secondary"
                          style={{
                            padding: '6px 14px',
                            fontSize: '0.78rem',
                            background: redeemed ? '#dcfce7' : '#ffffff',
                            borderColor: redeemed ? '#86efac' : '#cbd5e1',
                            color: redeemed ? '#166534' : '#173b65',
                          }}
                          onClick={() => {
                            playSfx('sparkle');
                            setRedeemedVouchers((prev) => ({ ...prev, [v.id]: !prev[v.id] }));
                          }}
                        >
                          {redeemed ? '✓ Redeemed with Love!' : 'Redeem Voucher 🎁'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </article>
          </GiftFrame>
        )}

        {/* SCREEN 5: THE LITTLE LETTER (Day 2: 26 Oct) */}
        {screen === 'letter' && (
          <GiftFrame onBack={showMenu} label="Day 2 · A Note Folded Just for You">
            <div className="letter-layout">
              <div className="envelope-scene">
                <button
                  className="envelope"
                  aria-label={letterOpen ? 'Letter opened' : 'Open the letter'}
                  onClick={() => {
                    playSfx('sparkle');
                    setLetterOpen(true);
                  }}
                  data-testid="button-open-letter"
                >
                  <span className="seal">
                    {letterOpen ? <Check size={24} /> : <Heart size={23} fill="currentColor" />}
                  </span>
                </button>
                <div className="letter-shinchan-badge" style={{ marginTop: 18 }}>
                  <img src={assetUrl('/images/shinchan/letter.jpg')} alt="Shinchan reading sweet letter" />
                </div>
                <p className="tiny-note" style={{ margin: '4px 0 0' }}>Shin-chan approved handwritten love</p>
              </div>

              <article className="letter-paper paper-grain" data-testid="letter-content">
                <h2>{letterOpen ? `A little letter for ${birthdayConfig.name}` : 'A sealed note for you'}</h2>
                {letterOpen ? (
                  <>
                    <p className="letter-copy">{birthdayConfig.letter}</p>
                    <div style={{ textAlign: 'right', color: '#173b65', fontFamily: 'Caveat, cursive', fontSize: '1.45rem', marginTop: 20 }}>
                      Love you, always <Heart size={16} fill="#d90429" color="#d90429" style={{ display: 'inline', verticalAlign: '-2px' }} />
                    </div>
                  </>
                ) : (
                  <>
                    <p className="letter-copy">
                      There are a few things I wanted to say, and a little paper seemed like a lovely place to put them.
                    </p>
                    <button
                      className="btn"
                      onClick={() => {
                        playSfx('sparkle');
                        setLetterOpen(true);
                      }}
                      data-testid="button-unfold-letter"
                    >
                      Unfold your letter <ArrowRight size={15} />
                    </button>
                  </>
                )}
              </article>
            </div>
          </GiftFrame>
        )}

        {/* DAY 3: SIBLING SECRETS & FUN TRIVIA (27 Oct) */}
        {screen === 'trivia' && (
          <GiftFrame onBack={showMenu} label="Day 3 · Sibling Secrets & Fun Trivia">
            <article className="card hero-card paper-grain" style={{ width: 'min(640px, 100%)' }}>
              <div className="shinchan-tag">
                <Sparkles size={13} /> Day 3 Surprise · 27 Oct
              </div>
              <h1 className="title" style={{ fontSize: 'clamp(2.4rem, 6vw, 3.6rem)' }}>Sibling Secrets</h1>
              <p className="subtitle">
                A quick sisterhood quiz to celebrate all our funny quirks, habits, and telepathy!
              </p>

              <div className="trivia-container">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <span style={{ fontSize: '0.84rem', fontWeight: 700, color: '#d90429' }}>
                    Question {triviaStep + 1} of {triviaQuestions.length}
                  </span>
                  <span style={{ fontSize: '0.84rem', color: '#64748b' }}>
                    Sister Bond Quiz
                  </span>
                </div>

                <h3 style={{ fontFamily: 'Fredoka, cursive', color: '#173b65', fontSize: '1.25rem', margin: '0 0 16px', textAlign: 'left' }}>
                  {triviaQuestions[triviaStep].question}
                </h3>

                <div>
                  {triviaQuestions[triviaStep].options.map((opt, optIdx) => {
                    const isSelected = triviaAnswers[triviaStep] === optIdx;
                    return (
                      <button
                        key={optIdx}
                        className={`trivia-option-btn ${isSelected ? 'selected' : ''}`}
                        onClick={() => {
                          playSfx('sparkle');
                          setTriviaAnswers((prev) => ({ ...prev, [triviaStep]: optIdx }));
                        }}
                      >
                        <span>{opt}</span>
                        {isSelected && <Check size={18} color="#d90429" />}
                      </button>
                    );
                  })}
                </div>

                {triviaAnswers[triviaStep] !== undefined && (
                  <div style={{ marginTop: 14, background: '#fff0f3', borderRadius: 14, padding: '10px 14px', textAlign: 'left', border: '1px solid #ffccd5' }}>
                    <span style={{ fontFamily: 'Fredoka, cursive', fontSize: '0.78rem', color: '#d90429', fontWeight: 700, textTransform: 'uppercase' }}>
                      Shin-chan says:
                    </span>
                    <p style={{ margin: '2px 0 0', color: '#173b65', fontSize: '0.9rem', fontWeight: 600 }}>
                      {triviaQuestions[triviaStep].reaction}
                    </p>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 18 }}>
                  <button
                    className="btn secondary"
                    disabled={triviaStep === 0}
                    onClick={() => setTriviaStep((s) => Math.max(0, s - 1))}
                    style={{ opacity: triviaStep === 0 ? 0.4 : 1 }}
                  >
                    <ChevronLeft size={16} /> Prev
                  </button>

                  {triviaStep < triviaQuestions.length - 1 ? (
                    <button
                      className="btn"
                      onClick={() => setTriviaStep((s) => s + 1)}
                    >
                      Next Question <ChevronRight size={16} />
                    </button>
                  ) : (
                    <div className="status-pill" style={{ background: '#dcfce7', color: '#15803d' }}>
                      <Trophy size={14} /> 100/100 Sister Score! 💖
                    </div>
                  )}
                </div>
              </div>
            </article>
          </GiftFrame>
        )}

        {/* SCREEN 6: OUR LITTLE WORLD (SCRAPBOOK - Day 4: 28 Oct) */}
        {screen === 'album' && (
          <GiftFrame onBack={showMenu} label="Day 4 · The Memories We Keep">
            <div className="scrapbook-decal">
              <div className="scrapbook-shinchan-mini">
                <img src={assetUrl('/images/shinchan/camera.jpg')} alt="Shinchan & Shiro camera" />
              </div>
              <span className="shinchan-tag" style={{ margin: 0 }}>
                Captured with love for Cherry 📸
              </span>
            </div>

            <div className="album" data-testid="scrapbook-album">
              <article className="album-page">
                <div className="eyebrow">{albumPage === 0 ? 'page 1 · sweetest smiles' : 'page 2 · more adventures'}</div>
                <h2>Our little world <Heart size={20} fill="#d90429" color="#d90429" style={{ display: 'inline' }} /></h2>
                <div className="photo-grid">
                  {birthdayConfig.photos.slice(albumPage * 4, albumPage * 4 + 2).map((photo, i) => (
                    <PhotoTile key={`left-${albumPage}-${i}`} photo={photo} index={albumPage * 4 + i} onOpen={setPhotoIndex} />
                  ))}
                </div>
                <div className="album-note">
                  {albumPage === 0
                    ? 'Every picture tells a story of your warmth, grace, and lovely smile.'
                    : 'From everyday laughter to big dreams, you make every moment so special.'}
                </div>
              </article>

              <article className="album-page right-page">
                <div className="eyebrow">little things, big love</div>
                <h2>Always in my corner</h2>
                <p className="letter-copy" style={{ fontSize: '.91rem' }}>
                  Life is made up of tiny moments that become the stories we tell forever. This book is ready for our favourite ones — the silly, the sweet, and everything in between.
                </p>
                <div className="photo-grid">
                  {birthdayConfig.photos.slice(albumPage * 4 + 2, albumPage * 4 + 4).map((photo, i) => (
                    <PhotoTile key={`right-${albumPage}-${i}`} photo={photo} index={albumPage * 4 + 2 + i} onOpen={setPhotoIndex} />
                  ))}
                </div>
                <p className="tiny-note">Cherry’s story, forever cherished.</p>
              </article>
            </div>

            <div className="button-row" style={{ marginTop: 20 }}>
              {birthdayConfig.photos.length > 4 && (
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <button
                    className="btn secondary"
                    onClick={() => {
                      playSfx('sparkle');
                      setAlbumPage((p) => Math.max(0, p - 1));
                    }}
                    disabled={albumPage === 0}
                    style={{ opacity: albumPage === 0 ? 0.45 : 1, cursor: albumPage === 0 ? 'default' : 'pointer' }}
                  >
                    <ChevronLeft size={16} /> Previous
                  </button>
                  <span style={{ fontSize: '0.86rem', color: '#173b65', fontWeight: 600 }}>
                    Page {albumPage + 1} of {Math.ceil(birthdayConfig.photos.length / 4)}
                  </span>
                  <button
                    className="btn secondary"
                    onClick={() => {
                      playSfx('sparkle');
                      setAlbumPage((p) => Math.min(Math.ceil(birthdayConfig.photos.length / 4) - 1, p + 1));
                    }}
                    disabled={albumPage >= Math.ceil(birthdayConfig.photos.length / 4) - 1}
                    style={{ opacity: albumPage >= Math.ceil(birthdayConfig.photos.length / 4) - 1 ? 0.45 : 1, cursor: albumPage >= Math.ceil(birthdayConfig.photos.length / 4) - 1 ? 'default' : 'pointer' }}
                  >
                    Next <ChevronRight size={16} />
                  </button>
                </div>
              )}
              <button
                className="btn"
                onClick={() => {
                  playSfx('sparkle');
                  setPhotoIndex(0);
                }}
                data-testid="button-open-photo-gallery"
              >
                <ImageIcon size={16} /> Open all photos ({birthdayConfig.photos.length})
              </button>
            </div>
            {photoIndex !== null && (
              <PhotoModal index={photoIndex} onClose={() => setPhotoIndex(null)} onChange={setPhotoIndex} />
            )}
          </GiftFrame>
        )}

        {/* DAY 5: BIRTHDAY EVE GOLDEN PROMISES (29 Oct) */}
        {screen === 'promises' && (
          <GiftFrame onBack={showMenu} label="Day 5 · Birthday Eve Golden Promises">
            <article className="card hero-card paper-grain" style={{ width: 'min(720px, 100%)' }}>
              <div className="shinchan-tag">
                <Star size={13} /> Day 5 Surprise · 29 Oct (Birthday Eve!)
              </div>
              <h1 className="title" style={{ fontSize: 'clamp(2.4rem, 6vw, 3.6rem)' }}>Birthday Eve Whispers</h1>
              <p className="subtitle">
                Tonight is the night before your birthday! Five golden promises from my heart to yours as we count down to midnight.
              </p>

              <div style={{ width: 140, height: 140, margin: '14px auto', borderRadius: 20, overflow: 'hidden', border: '3px solid #fde047', boxShadow: '0 8px 24px rgba(234, 179, 8, 0.15)' }}>
                <img
                  src={assetUrl('/images/shinchan/countdown.jpg')}
                  alt="Shinchan waiting eagerly for midnight birthday countdown"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>

              <div className="promise-list">
                {sisterPromises.map((p, i) => (
                  <div className="promise-card" key={i}>
                    <div className="promise-num">{p.number}</div>
                    <div>
                      <h4 style={{ fontFamily: 'Fredoka, cursive', color: '#173b65', margin: '0 0 4px', fontSize: '1.05rem' }}>
                        {p.title}
                      </h4>
                      <p style={{ margin: 0, color: '#49647c', fontSize: '0.92rem', lineHeight: 1.5 }}>
                        {p.promise}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: 24, background: '#fefce8', border: '2px solid #fde047', borderRadius: 18, padding: '14px 20px' }}>
                <span style={{ fontFamily: 'Fredoka, cursive', color: '#ca8a04', fontWeight: 700, fontSize: '0.9rem' }}>
                  ⏳ MIDNIGHT COUNTDOWN
                </span>
                <p style={{ margin: '4px 0 0', color: '#173b65', fontWeight: 600, fontSize: '0.94rem' }}>
                  At 00:00 midnight IST on 30 October, <b>The Big Reveal</b> will automatically unlock! Get ready! 🎂✨
                </p>
              </div>
            </article>
          </GiftFrame>
        )}

        {/* SCREEN 7: THE FINAL SURPRISE */}
        {screen === 'final' && (
          <GiftFrame onBack={showMenu} label="the last little surprise">
            <article className="card final-card paper-grain" data-testid="final-surprise">
              <div className="shinchan-tag">
                <Sparkles size={13} /> The Grand Finale
              </div>
              <div className="eyebrow">one last thing, from my heart</div>
              
              {!finalOpen ? (
                <>
                  <h1 className="title">Ready for your<br />final surprise?</h1>
                  <div className="shinchan-hero-art">
                    <img
                      src={assetUrl('/images/shinchan/big-gift.jpg')}
                      alt="Shinchan jumping with excitement beside a giant birthday gift box"
                    />
                  </div>
                  <p className="subtitle">Take a breath, untie the ribbon, and open your last little gift.</p>
                  <button
                    className="btn"
                    onClick={() => {
                      playSfx('sparkle');
                      setFinalOpen(true);
                    }}
                    data-testid="button-open-final"
                  >
                    <Gift size={16} /> Open my surprise <ArrowRight size={15} />
                  </button>
                </>
              ) : (
                <>
                  <ConfettiField />
                  <span className="status-pill"><Sparkles size={14} /> Just for you, {birthdayConfig.name}</span>
                  <h1 className="title">All my love, in one place</h1>
                  
                  <div className="shinchan-hero-art" style={{ width: 220, height: 220 }}>
                    <img
                      src={assetUrl('/images/shinchan/celebrate.jpg')}
                      alt="Shinchan celebrating birthday with confetti"
                    />
                  </div>

                  <PhotoCollage onOpen={setPhotoIndex} />
                  <p className="final-copy" data-testid="text-final-message">
                    {birthdayConfig.finalMessage}
                  </p>
                  
                  <CakeWish
                    candlesOut={candlesOut}
                    setCandlesOut={setCandlesOut}
                    wishNote={wishNote}
                    setWishNote={setWishNote}
                    soundEnabled={soundEnabled}
                    compact
                    onBlow={() => playSfx('blow')}
                    onRelight={() => playSfx('sparkle')}
                  />
                  
                  <div className="button-row">
                    <button
                      className="btn"
                      onClick={startOver}
                      data-testid="button-replay-surprise"
                    >
                      <Sparkles size={16} /> Replay my surprise
                    </button>
                    <button
                      className="btn secondary"
                      onClick={showMenu}
                      data-testid="button-final-back-gifts"
                    >
                      <ArrowLeft size={15} /> Back to your gifts
                    </button>
                  </div>
                  <button
                    className="btn text"
                    onClick={() => {
                      playSfx('sparkle');
                      setPhotoIndex(0);
                    }}
                    data-testid="button-final-gallery"
                  >
                    View the photo gallery <ImageIcon size={15} />
                  </button>
                </>
              )}
            </article>
            {photoIndex !== null && (
              <PhotoModal index={photoIndex} onClose={() => setPhotoIndex(null)} onChange={setPhotoIndex} />
            )}
          </GiftFrame>
        )}
      </div>

      <footer style={{ textAlign: 'center', padding: '0 16px 24px', color: '#7a8d9d', fontSize: '.75rem' }} data-testid="footer-signoff">
        A small paper world, made with a very big love &amp; Shin-chan smiles. <Heart size={12} fill="#d90429" color="#d90429" style={{ display: 'inline', verticalAlign: '-2px' }} />
      </footer>

      {/* Locked Gift Modal Dialog (Zero Spoilers) */}
      {lockedModalGift && (
        <div
          className="lock-modal-backdrop"
          onClick={() => setLockedModalGift(null)}
          data-testid="locked-gift-modal"
          role="dialog"
          aria-modal="true"
        >
          <div className="lock-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="gift-day-badge badge-locked">
              <Lock size={12} /> Day {lockedModalGift.dayNumber} · {lockedModalGift.displayDate}
            </div>
            <h2 style={{ fontFamily: 'Fredoka, cursive, sans-serif', color: '#d90429', fontSize: '1.8rem', margin: '4px 0 10px' }}>
              No Peeking Early! 🙈
            </h2>
            <div style={{ width: 140, height: 140, margin: '8px auto', borderRadius: 20, overflow: 'hidden', border: '3px solid #ffccd5' }}>
              <img
                src={assetUrl('/images/shinchan/how-dare-you.jpg')}
                alt="Shinchan saying no peeking"
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              />
            </div>
            <p style={{ color: '#173b65', fontWeight: 600, fontSize: '1.05rem', margin: '14px auto 6px' }}>
              Shin-chan is guarding Day {lockedModalGift.dayNumber}&rsquo;s secret surprise! 🛡️
            </p>
            <p style={{ color: '#64748b', fontSize: '0.88rem', margin: '0 auto 18px', lineHeight: 1.45 }}>
              No hints, no peeking, and no guessing! This mystery keepsake unlocks automatically on <b>{lockedModalGift.displayDate}</b> at midnight (00:00 IST). Come back then!
            </p>
            <button
              className="btn"
              onClick={() => setLockedModalGift(null)}
              data-testid="button-close-lock-modal"
            >
              I will be patient! 😇
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

function MysteryGiftBox({ dayNumber }: { dayNumber: number }) {
  return (
    <div className="mystery-gift-box" aria-label={`Locked surprise for day ${dayNumber}`}>
      <svg viewBox="0 0 88 88" width="88" height="88" className="mystery-box-svg">
        <defs>
          <linearGradient id={`boxBg-${dayNumber}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fff5f5" />
            <stop offset="100%" stopColor="#ffe4e6" />
          </linearGradient>
          <linearGradient id={`goldGrad-${dayNumber}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fef08a" />
            <stop offset="50%" stopColor="#eab308" />
            <stop offset="100%" stopColor="#b45309" />
          </linearGradient>
          <filter id={`lockGlow-${dayNumber}`} x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#f43f5e" floodOpacity="0.15" />
          </filter>
        </defs>
        
        {/* Soft Circular Backdrop */}
        <circle cx="44" cy="44" r="41" fill={`url(#boxBg-${dayNumber})`} stroke="#fecdd3" strokeWidth="2" strokeDasharray="4 3" />
        
        {/* Gift Box Base */}
        <rect x="22" y="37" width="44" height="33" rx="6" fill="#f43f5e" />
        {/* Gift Box Lid */}
        <rect x="18" y="30" width="52" height="10" rx="3" fill="#e11d48" />
        
        {/* Gold Ribbon Vertical */}
        <rect x="40" y="30" width="8" height="40" fill={`url(#goldGrad-${dayNumber})`} />
        {/* Gold Ribbon Horizontal */}
        <rect x="22" y="48" width="44" height="6" fill={`url(#goldGrad-${dayNumber})`} />
        
        {/* Ribbon Bow */}
        <path d="M 37 28 C 30 18 27 28 41 29 Z" fill={`url(#goldGrad-${dayNumber})`} />
        <path d="M 51 28 C 58 18 61 28 47 29 Z" fill={`url(#goldGrad-${dayNumber})`} />
        <circle cx="44" cy="28.5" r="3.2" fill="#ca8a04" />

        {/* Shiny Golden Padlock with Keyhole */}
        <g className="mystery-lock-icon" transform="translate(36, 44)" filter={`url(#lockGlow-${dayNumber})`}>
          <rect x="1" y="6" width="14" height="12" rx="2.5" fill={`url(#goldGrad-${dayNumber})`} stroke="#854d0e" strokeWidth="1" />
          <path d="M 4 6 V 3 C 4 1 12 1 12 3 V 6" fill="none" stroke="#854d0e" strokeWidth="2.2" strokeLinecap="round" />
          <circle cx="8" cy="11" r="1.3" fill="#713f12" />
          <line x1="8" y1="11" x2="8" y2="14" stroke="#713f12" strokeWidth="1" strokeLinecap="round" />
        </g>
        
        {/* Sparkles & Floating ? */}
        <text x="63" y="27" fontSize="13" fontWeight="900" fill="#e11d48" fontFamily="Fredoka, cursive">?</text>
        <circle cx="21" cy="24" r="1.5" fill="#eab308" />
        <circle cx="70" cy="54" r="1.5" fill="#eab308" />
      </svg>
    </div>
  );
}

function GiftFrame({ children, onBack, label }: { children: ReactNode; onBack: () => void; label: string }) {
  return (
    <section className="stage" aria-label={label}>
      <div className="journey-nav">
        <button className="back-link" onClick={onBack} data-testid="button-back-your-gifts">
          <ArrowLeft size={16} /> Your gifts
        </button>
        <span className="crumb">A little birthday world&nbsp; / &nbsp;<b>{label}</b></span>
      </div>
      {children}
    </section>
  );
}

function SparkleField() {
  return (
    <div className="sparkle-field" aria-hidden="true">
      {[0, 1, 2, 3].map((i) => (
        <Sparkles className="sparkle" key={i} size={i % 2 ? 16 : 21} />
      ))}
    </div>
  );
}

function ConfettiField() {
  const colors = ['#d90429', '#ef233c', '#ffb703', '#3a86ff', '#8338ec', '#ff006e'];
  return (
    <div className="confetti-field" aria-hidden="true">
      {Array.from({ length: 28 }, (_, index) => (
        <i
          className="confetti-piece"
          key={index}
          style={{
            left: `${(index * 37) % 100}%`,
            backgroundColor: colors[index % colors.length],
            animationDelay: `${(index % 8) * -0.45}s`,
            animationDuration: `${3.6 + (index % 5) * 0.35}s`,
            transform: `rotate(${(index * 29) % 180}deg)`,
          }}
        />
      ))}
    </div>
  );
}

const CANDLE_DEFS = [
  { x: 114, y: 38, h: 48, stripe: 'stripePink' },
  { x: 142, y: 30, h: 56, stripe: 'stripeBlue' },
  { x: 170, y: 22, h: 64, stripe: 'stripeYellow' },
  { x: 198, y: 30, h: 56, stripe: 'stripeMint' },
  { x: 226, y: 38, h: 48, stripe: 'stripePurple' },
];

function CakeWish({
  candlesOut,
  setCandlesOut,
  wishNote,
  setWishNote,
  soundEnabled = true,
  compact = false,
  onBlow,
  onRelight,
}: {
  candlesOut: boolean;
  setCandlesOut: (out: boolean) => void;
  wishNote: string;
  setWishNote: (note: string) => void;
  soundEnabled?: boolean;
  compact?: boolean;
  onBlow?: () => void;
  onRelight?: () => void;
}) {
  const [candleStates, setCandleStates] = useState<boolean[]>([false, false, false, false, false]);
  const [isBlowing, setIsBlowing] = useState(false);
  const [isPlayingSong, setIsPlayingSong] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (candlesOut) {
      setCandleStates([true, true, true, true, true]);
    } else {
      setCandleStates([false, false, false, false, false]);
    }
  }, [candlesOut]);

  useEffect(() => {
    if (!soundEnabled && audioRef.current && isPlayingSong) {
      audioRef.current.pause();
      setIsPlayingSong(false);
    }
  }, [soundEnabled, isPlayingSong]);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  const triggerSongPlayback = () => {
    if (audioRef.current && soundEnabled) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().then(() => {
        setIsPlayingSong(true);
      }).catch((err) => {
        console.log('Birthday song playback notice:', err);
      });
    }
  };

  const toggleSingleCandle = (index: number) => {
    setCandleStates((prev) => {
      const next = [...prev];
      next[index] = !next[index];
      const allOut = next.every(Boolean);
      if (allOut && !candlesOut) {
        setCandlesOut(true);
        setWishNote('✨ Wish sent to the universe! May every dream come true for you, Cherry! 💖');
        onBlow?.();
        triggerSongPlayback();
      } else if (!allOut && candlesOut) {
        setCandlesOut(false);
        setWishNote('Tap the remaining candles or blow them all out! 🕯️');
      } else if (next[index]) {
        onBlow?.();
      }
      return next;
    });
  };

  const handleBlowAll = () => {
    setIsBlowing(true);
    onBlow?.();
    setTimeout(() => {
      setCandleStates([true, true, true, true, true]);
      setCandlesOut(true);
      setWishNote('✨ Wish sent out to the stars! May all your dreams come true, Cherry! 💖');
      setIsBlowing(false);
      triggerSongPlayback();
    }, 380);
  };

  const handleRelightAll = () => {
    setCandleStates([false, false, false, false, false]);
    setCandlesOut(false);
    setWishNote('The candles are glowing again — close your eyes & make another wish! 🎂');
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlayingSong(false);
    }
    onRelight?.();
  };

  const toggleSong = () => {
    if (!audioRef.current) return;
    if (isPlayingSong) {
      audioRef.current.pause();
      setIsPlayingSong(false);
    } else {
      audioRef.current.play().then(() => setIsPlayingSong(true)).catch(() => {});
    }
  };

  const allCandlesOut = candleStates.every(Boolean);

  return (
    <div className="cake-stage" style={{ margin: compact ? '18px auto' : '24px auto 0' }} data-testid="birthday-cake">
      <div className="shinchan-tag">
        <Sparkles size={13} /> Birthday Cake Tradition
      </div>
      <div className="eyebrow">make a birthday wish</div>
      <p className="subtitle" style={{ fontSize: '.96rem', marginTop: 4, marginBottom: 8 }}>
        Make a wish in your heart, then blow out the candles with Shin-chan!
      </p>

      {/* Shin-chan speech companion */}
      <div className="cake-stage-companion">
        <div className="cake-shinchan-avatar">
          <img
            src={assetUrl(allCandlesOut ? '/images/shinchan/celebrate.jpg' : '/images/shinchan/cake-wish.jpg')}
            alt={allCandlesOut ? 'Shin-chan party celebration' : 'Shin-chan cake wish'}
          />
        </div>
        <div className="cake-speech-bubble">
          <span className="cake-speech-speaker">Shin-chan says:</span>
          <p>
            {allCandlesOut
              ? 'WOOHOO! 🎉 Wish sent to the stars! Happy Birthday Cherry! 💖'
              : 'Close your eyes, make a secret wish, and blow the candles! 🎂'}
          </p>
        </div>
      </div>

      {/* Interactive SVG Cake Card */}
      <div className="cake-card">
        <div className="cake-svg-wrapper">
          <svg
            className="cake-svg"
            viewBox="0 0 340 275"
            role="img"
            aria-label="Interactive birthday cake for Cherry"
          >
            <defs>
              <radialGradient id="flameGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#ffb703" stopOpacity="0.85" />
                <stop offset="45%" stopColor="#fb8500" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#ffb703" stopOpacity="0" />
              </radialGradient>

              <linearGradient id="outerFlameGrad" x1="0" y1="1" x2="0" y2="0">
                <stop offset="0%" stopColor="#d90429" />
                <stop offset="35%" stopColor="#f77f00" />
                <stop offset="75%" stopColor="#fcbf49" />
                <stop offset="100%" stopColor="#ffffff" />
              </linearGradient>

              <linearGradient id="innerFlameGrad" x1="0" y1="1" x2="0" y2="0">
                <stop offset="0%" stopColor="#ffea75" />
                <stop offset="100%" stopColor="#ffffff" />
              </linearGradient>

              <pattern id="stripePink" width="8" height="8" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
                <rect width="4" height="8" fill="#ff758f" />
                <rect x="4" width="4" height="8" fill="#ffffff" />
              </pattern>
              <pattern id="stripeBlue" width="8" height="8" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
                <rect width="4" height="8" fill="#64b5f6" />
                <rect x="4" width="4" height="8" fill="#ffffff" />
              </pattern>
              <pattern id="stripeYellow" width="8" height="8" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
                <rect width="4" height="8" fill="#ffd166" />
                <rect x="4" width="4" height="8" fill="#ffffff" />
              </pattern>
              <pattern id="stripeMint" width="8" height="8" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
                <rect width="4" height="8" fill="#06d6a0" />
                <rect x="4" width="4" height="8" fill="#ffffff" />
              </pattern>
              <pattern id="stripePurple" width="8" height="8" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
                <rect width="4" height="8" fill="#b388eb" />
                <rect x="4" width="4" height="8" fill="#ffffff" />
              </pattern>
            </defs>

            {/* Stand Base */}
            <ellipse cx="170" cy="265" rx="66" ry="8" fill="#d9e2ec" />
            <path d="M150 244 C150 258 143 264 138 265 L202 265 C197 264 190 258 190 244 Z" fill="#ffffff" stroke="#c5d3df" strokeWidth="2" />
            {/* Plate Shadow */}
            <ellipse cx="170" cy="246" rx="146" ry="12" fill="rgba(23, 59, 101, 0.08)" />
            {/* Porcelain Plate */}
            <ellipse cx="170" cy="240" rx="152" ry="16" fill="#ffffff" stroke="#b0c4de" strokeWidth="2.5" />
            <ellipse cx="170" cy="240" rx="138" ry="12" fill="#fffaf2" stroke="#ffccd5" strokeWidth="1.5" strokeDasharray="3 3" />

            {/* Bottom Tier Sponge */}
            <path d="M50 170 C50 160 55 156 65 156 L275 156 C285 156 290 160 290 170 L290 226 C290 238 275 244 170 244 C65 244 50 238 50 226 Z" fill="#faedcd" stroke="#c5a880" strokeWidth="1.5" />
            {/* Sponge Cream Layer */}
            <path d="M52 198 Q170 210 288 198" stroke="#ffffff" strokeWidth="7" strokeLinecap="round" />
            
            {/* Strawberry Slices on Bottom Tier */}
            <path d="M78 206 L86 220 L94 206 Z" fill="#e63946" />
            <path d="M125 210 L133 224 L141 210 Z" fill="#e63946" />
            <path d="M198 210 L206 224 L214 210 Z" fill="#e63946" />
            <path d="M245 206 L253 220 L261 206 Z" fill="#e63946" />

            {/* Scalloped Vanilla Frosting on Bottom Tier */}
            <path d="M50 156 C65 178 78 178 92 156 C106 182 120 182 134 156 C148 184 162 184 176 156 C190 184 204 184 218 156 C232 182 246 182 260 156 C274 178 285 178 290 156 L290 152 L50 152 Z" fill="#ffffff" stroke="#ffccd5" strokeWidth="1.2" />

            {/* Top Tier Sponge */}
            <path d="M85 96 C85 88 90 85 98 85 L242 85 C250 85 255 88 255 96 L255 152 C255 162 240 168 170 168 C100 168 85 162 85 152 Z" fill="#faedcd" stroke="#c5a880" strokeWidth="1.5" />
            {/* Strawberry Pink Glaze with Drips on Top Tier */}
            <path d="M85 88 C98 114 108 114 118 88 C128 120 140 120 152 88 C164 124 176 124 188 88 C200 120 212 120 224 88 C234 114 245 114 255 88 L255 85 L85 85 Z" fill="#ffccd5" />

            {/* Sprinkles on Top Tier */}
            <circle cx="106" cy="100" r="2.2" fill="#3a86ff" />
            <circle cx="135" cy="108" r="2.2" fill="#ffb703" />
            <circle cx="165" cy="102" r="2.2" fill="#06d6a0" />
            <circle cx="202" cy="106" r="2.2" fill="#8338ec" />
            <circle cx="232" cy="98" r="2.2" fill="#ff006e" />
            <circle cx="120" cy="144" r="2.2" fill="#3a86ff" />
            <circle cx="220" cy="144" r="2.2" fill="#ffd166" />

            {/* Birthday Girl Name Plaque */}
            <rect x="115" y="116" width="110" height="26" rx="13" fill="#ffffff" stroke="#d90429" strokeWidth="2" />
            <text x="170" y="133" textAnchor="middle" fill="#d90429" fontSize="11.5" fontWeight="800" fontFamily="Fredoka, cursive, sans-serif" letterSpacing="0.08em">
              ★ {birthdayConfig.name.toUpperCase()} ★
            </text>

            {/* Top Whipped Cream Swirls & Cherries */}
            {[96, 120, 145, 170, 195, 220, 244].map((cx, i) => (
              <g key={`rosette-${i}`}>
                <path d={`M${cx - 9} 86 C${cx - 10} 78 ${cx - 4} 75 ${cx} 78 C${cx + 4} 75 ${cx + 10} 78 ${cx + 9} 86 Z`} fill="#ffffff" stroke="#ffe5ec" strokeWidth="1" />
                <circle cx={cx} cy={76} r="4.8" fill="#d90429" />
                <circle cx={cx - 1.5} cy={74} r="1.2" fill="#ffffff" opacity="0.8" />
                <path d={`M${cx} 73 Q${cx + 3} 66 ${cx + 6} 67`} stroke="#386641" strokeWidth="1.2" fill="none" />
              </g>
            ))}

            {/* 5 Striped Birthday Candles */}
            {CANDLE_DEFS.map((candle, i) => {
              const isOut = candleStates[i];
              return (
                <g
                  key={`candle-${i}`}
                  className="candle-interactive"
                  onClick={() => toggleSingleCandle(i)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      toggleSingleCandle(i);
                    }
                  }}
                  aria-label={`Candle ${i + 1}, ${isOut ? 'extinguished, click to relight' : 'lit, click to blow out'}`}
                >
                  {/* Wax Body */}
                  <rect
                    x={candle.x - 5}
                    y={candle.y}
                    width={10}
                    height={candle.h}
                    rx="3"
                    fill={`url(#${candle.stripe})`}
                    stroke="#173b65"
                    strokeWidth="1"
                  />
                  {/* Wax drip base */}
                  <ellipse cx={candle.x} cy={candle.y + candle.h} rx="6" ry="2" fill="#ffffff" />
                  {/* Wick */}
                  <line
                    x1={candle.x}
                    y1={candle.y - 7}
                    x2={candle.x}
                    y2={candle.y}
                    stroke="#2b2d42"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />

                  {/* Flame or Smoke */}
                  {!isOut ? (
                    <g>
                      {/* Ambient Warm Halo */}
                      <circle cx={candle.x} cy={candle.y - 18} r="20" fill="url(#flameGlow)" className="flame-halo" />
                      {/* Outer Flame */}
                      <path
                        d={`M ${candle.x} ${candle.y - 32} Q ${candle.x + 9} ${candle.y - 17} ${candle.x} ${candle.y - 7} Q ${candle.x - 9} ${candle.y - 17} ${candle.x} ${candle.y - 32} Z`}
                        fill="url(#outerFlameGrad)"
                        className="candle-flame"
                      />
                      {/* Inner Flame Core */}
                      <path
                        d={`M ${candle.x} ${candle.y - 26} Q ${candle.x + 4.5} ${candle.y - 15} ${candle.x} ${candle.y - 8} Q ${candle.x - 4.5} ${candle.y - 15} ${candle.x} ${candle.y - 26} Z`}
                        fill="url(#innerFlameGrad)"
                        className="inner-flame"
                      />
                    </g>
                  ) : (
                    <g>
                      {/* Glowing Ember */}
                      <circle cx={candle.x} cy={candle.y - 7} r="1.6" fill="#ef233c" className="candle-ember" />
                      {/* Rising Smoke Trail */}
                      <path
                        d={`M ${candle.x} ${candle.y - 8} Q ${candle.x - 5} ${candle.y - 20} ${candle.x + 4} ${candle.y - 32} T ${candle.x - 2} ${candle.y - 48}`}
                        stroke="#94a3b8"
                        strokeWidth="2.2"
                        strokeLinecap="round"
                        fill="none"
                        className="candle-smoke"
                      />
                    </g>
                  )}
                </g>
              );
            })}

            {/* Wind Puff Visual Animation */}
            {isBlowing && (
              <g className="wind-puff-overlay">
                <path d="M 40 40 Q 170 28 300 45" stroke="#ffffff" strokeWidth="3.5" strokeLinecap="round" strokeDasharray="18 10" />
                <path d="M 60 55 Q 180 48 280 62" stroke="#bde0fe" strokeWidth="3" strokeLinecap="round" strokeDasharray="14 8" />
                <path d="M 30 25 Q 160 18 290 35" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="12 12" />
              </g>
            )}
          </svg>
        </div>

        {/* Action Controls */}
        <div className="cake-actions-row">
          {!allCandlesOut ? (
            <button
              className="btn-cake-action btn-blow"
              onClick={handleBlowAll}
              data-testid="button-blow-candles"
              title="Click to blow out all candles"
            >
              <Sparkles size={18} /> Make a Wish &amp; Blow! 💨
            </button>
          ) : (
            <button
              className="btn-cake-action btn-relight"
              onClick={handleRelightAll}
              data-testid="button-relight-candles"
              title="Click to relight the candles"
            >
              <Heart size={18} fill="currentColor" /> Relight the Candles ✨
            </button>
          )}
          <p className="cake-hint-text">
            {!allCandlesOut ? '💡 Tip: You can also tap individual candles to blow them out!' : '🎉 All candles are blown out! You can relight them anytime.'}
          </p>
        </div>

        {/* Celebratory Wish Note Card */}
        {allCandlesOut && (
          <div className="wish-sent-card">
            <h4 className="wish-sent-title">
              <Sparkles size={16} /> Wish Sent to the Universe! <Sparkles size={16} />
            </h4>
            <p className="wish-sent-copy">
              May every smile and dream in your heart blossom into reality, {birthdayConfig.name}! 🌸💖
            </p>
          </div>
        )}

        {/* Funzoa "Happy Birthday To You Ji" Song Player */}
        <audio
          ref={audioRef}
          preload="auto"
          onPlay={() => setIsPlayingSong(true)}
          onPause={() => setIsPlayingSong(false)}
          onEnded={() => setIsPlayingSong(false)}
        >
          <source src={assetUrl('/audio/happy-birthday-to-you-ji.m4a')} type="audio/mp4" />
          <source src={assetUrl('/audio/happy-birthday-to-you-ji.webm')} type="audio/webm" />
        </audio>

        {allCandlesOut && (
          <div className="birthday-song-card" data-testid="song-player-card">
            <div className="song-badge-left">
              <div className={`song-disc ${isPlayingSong ? 'spinning' : ''}`}>
                <Music size={18} />
              </div>
              <div className="song-info">
                <div className="song-title-row">
                  <span className="song-name">Happy Birthday to You Ji 🎵</span>
                  {isPlayingSong && <span className="song-live-pill">PLAYING</span>}
                </div>
                <span className="song-artist">Funzoa · Mimi Teddy &amp; Krsna Solo</span>
              </div>
            </div>
            <button
              className="song-control-btn"
              onClick={toggleSong}
              aria-label={isPlayingSong ? 'Pause birthday song' : 'Play birthday song'}
              data-testid="button-toggle-song"
            >
              {isPlayingSong ? <Pause size={16} /> : <Play size={16} />}
              <span>{isPlayingSong ? 'Pause' : 'Play'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

type Photo = { src: string; caption?: string; date?: string; memory?: string };

function PhotoTile({ photo, index, onOpen }: { photo: Photo; index: number; onOpen: (index: number) => void }) {
  return (
    <button
      className="photo-tile"
      onClick={() => onOpen(index)}
      data-testid={`photo-tile-${index}`}
      aria-label={`Open photo ${index + 1}: ${photo.caption || 'memory'}`}
    >
      <PhotoVisual photo={photo} index={index} mode="tile" />
      <span className="photo-caption">{photo.caption || `Memory ${index + 1}`}</span>
      {photo.date && <span className="photo-date">{photo.date}</span>}
      {photo.memory && <span className="photo-memory">{photo.memory}</span>}
    </button>
  );
}

function PhotoCollage({ onOpen }: { onOpen: (index: number) => void }) {
  return (
    <div className="collage" data-testid="final-photo-collage">
      {birthdayConfig.photos.map((photo, index) => (
        <button
          key={index}
          className="photo-tile"
          onClick={() => onOpen(index)}
          data-testid={`collage-photo-${index}`}
        >
          <PhotoVisual photo={photo} index={index} mode="collage" />
        </button>
      ))}
    </div>
  );
}

function PhotoVisual({ photo, index, mode }: { photo: Photo; index: number; mode: 'tile' | 'collage' | 'modal' }) {
  const [failed, setFailed] = useState(false);
  const styles: Record<typeof mode, CSSProperties> = {
    tile: { width: '100%', height: 165, objectFit: 'cover', borderRadius: 6 },
    collage: { width: '100%', height: 125, objectFit: 'cover', borderRadius: 6 },
    modal: { maxWidth: '100%', maxHeight: '72vh', objectFit: 'contain', borderRadius: 8 },
  };

  if (photo.src && !failed) {
    return (
      <img
        src={photo.src}
        alt={photo.caption || 'A birthday memory'}
        style={styles[mode]}
        loading="lazy"
        onError={() => setFailed(true)}
      />
    );
  }

  const placeholderCopy = mode === 'modal' ? (
    <>This page is ready for your photo.<br />Add image paths in the birthday configuration.</>
  ) : (
    <>Photo {index + 1}<br />{mode === 'tile' ? 'add your own image' : 'your memory goes here'}</>
  );

  return (
    <span className="photo-placeholder">
      <ImageIcon size={mode === 'modal' ? 42 : 25} />
      <span>{placeholderCopy}</span>
    </span>
  );
}

function PhotoModal({
  index,
  onClose,
  onChange,
}: {
  index: number;
  onClose: () => void;
  onChange: (index: number) => void;
}) {
  const photo = birthdayConfig.photos[index];
  const move = (step: number) =>
    onChange((index + step + birthdayConfig.photos.length) % birthdayConfig.photos.length);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
      if (event.key === 'ArrowLeft') move(-1);
      if (event.key === 'ArrowRight') move(1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [index]);

  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      data-testid="photo-gallery-modal"
    >
      <section className="photo-modal" role="dialog" aria-modal="true" aria-label="Photo gallery">
        <button
          className="icon-btn"
          onClick={onClose}
          aria-label="Close photo gallery"
          style={{ position: 'absolute', top: 10, right: 10, zIndex: 1 }}
          data-testid="button-close-gallery"
        >
          <X size={19} />
        </button>
        <PhotoVisual photo={photo} index={index} mode="modal" />
        <div className="modal-controls">
          <button
            className="icon-btn"
            onClick={() => move(-1)}
            aria-label="Previous photo"
            data-testid="button-previous-photo"
          >
            <ChevronLeft />
          </button>
          <div className="photo-meta">
            <span data-testid="text-photo-caption">
              {photo.caption || `Memory ${index + 1}`} · {index + 1} of {birthdayConfig.photos.length}
            </span>
            {photo.date && <span className="photo-date">{photo.date}</span>}
            {photo.memory && <span className="photo-memory">{photo.memory}</span>}
          </div>
          <button
            className="icon-btn"
            onClick={() => move(1)}
            aria-label="Next photo"
            data-testid="button-next-photo"
          >
            <ChevronRight />
          </button>
        </div>
      </section>
    </div>
  );
}

export default App;
