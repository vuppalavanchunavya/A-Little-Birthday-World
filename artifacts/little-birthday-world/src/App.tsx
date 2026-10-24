import { type CSSProperties, type ReactNode, useEffect, useState } from 'react';
import {
  ArrowLeft, ArrowRight, Check, ChevronLeft, ChevronRight, Gift,
  Heart, Image as ImageIcon, Mail, Sparkles, Star, X,
} from 'lucide-react';
import { birthdayConfig } from './config/birthdayConfig';

type Screen = 'welcome' | 'countdown' | 'accept' | 'menu' | 'letter' | 'album' | 'final';

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

function App() {
  const [screen, setScreen] = useState<Screen>('welcome');
  const [now, setNow] = useState(Date.now());
  const previewDate = import.meta.env.DEV ? new URLSearchParams(window.location.search).get('previewDate') : null;
  const previewTimestamp = previewDate ? Date.parse(previewDate) : Number.NaN;
  const previewActive = Number.isFinite(previewTimestamp);
  const [welcomeNote, setWelcomeNote] = useState('');
  const [acceptNote, setAcceptNote] = useState('');
  const [letterOpen, setLetterOpen] = useState(false);
  const [finalOpen, setFinalOpen] = useState(false);
  const [candlesOut, setCandlesOut] = useState(false);
  const [wishNote, setWishNote] = useState('');
  const [photoIndex, setPhotoIndex] = useState<number | null>(null);
  const birthday = getBirthdayState(previewActive ? previewTimestamp : now);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const showMenu = () => setScreen('menu');
  const startOver = () => {
    setScreen('welcome');
    setLetterOpen(false);
    setFinalOpen(false);
    setCandlesOut(false);
    setWishNote('');
  };

  return (
    <main className="app-shell">
      <header className="topbar">
        <button className="brand" onClick={showMenu} aria-label="Go to gift selection" data-testid="nav-home">
          <span className="brand-mark"><Heart size={17} fill="currentColor" /></span>
          <span>A little birthday world</span>
        </button>
        <div className="top-actions">
          <span className="status-pill" data-testid="status-birthday-mode">
            <Sparkles size={14} /> {birthday.celebratory ? 'Birthday mode' : 'Made with love'}
          </span>
          {screen !== 'welcome' && <button className="top-action" onClick={showMenu} data-testid="nav-your-gifts"><Gift size={16} /><span>Your gifts</span></button>}
        </div>
      </header>

      <div className="content">
        {screen === 'welcome' && <section className="stage" aria-labelledby="welcome-title">
          <SparkleField />
          <article className="card hero-card paper-grain">
            <div className="eyebrow">a tiny surprise, made just for you</div>
            <h1 id="welcome-title" className="title">Hey, {birthdayConfig.name}!</h1>
            <p className="subtitle">Someone very special has a little surprise waiting for her. A few pages, a lot of love, and one very favourite sister.</p>
            <GiftIllustration />
            <h2 className="font-hand" style={{ fontSize: '1.8rem', color: '#173b65', margin: '0' }}>Are you ready to open it?</h2>
            <div className="button-row">
              <button className="btn" onClick={() => { setWelcomeNote(''); setScreen('countdown'); }} data-testid="button-welcome-yes"><Heart size={16} /> Yes, show me</button>
              <button className="btn secondary" onClick={() => setWelcomeNote('That’s okay. The surprise will be right here whenever you’re ready.')} data-testid="button-welcome-not-yet">Not yet</button>
            </div>
            <p className="tiny-note" role="status" data-testid="status-welcome-response">{welcomeNote}</p>
          </article>
        </section>}

        {screen === 'countdown' && <section className="stage" aria-labelledby="countdown-title">
          <SparkleField />
          {birthday.celebratory && <ConfettiField />}
          <article className="card hero-card paper-grain">
            <div className="eyebrow">{birthday.celebratory ? 'the day we have been waiting for' : 'a date circled in blue'}</div>
            {birthday.celebratory ? <>
              <span className="status-pill"><Sparkles size={14} /> October 30 · today is yours</span>
              <h1 id="countdown-title" className="title">It’s your birthday,<br />{birthdayConfig.name}!</h1>
              <p className="subtitle">The whole little world is ready to celebrate you. Take your time — all the surprises are yours to open.</p>
              <CakeIllustration />
              <button className="btn" onClick={() => setScreen('accept')} data-testid="button-celebrate">Let’s celebrate <ArrowRight size={16} /></button>
            </> : <>
              <h1 id="countdown-title" className="title">Something lovely<br />is waiting for you</h1>
              <p className="subtitle">The birthday is getting closer. Until then, here’s a little peek at the love waiting inside.</p>
              <GiftIllustration />
              <div className="countdown" aria-label="Time until birthday" data-testid="birthday-countdown">
                {[['Days', birthday.days], ['Hours', birthday.hours], ['Minutes', birthday.minutes], ['Seconds', birthday.seconds]].map(([label, value]) =>
                  <div className="time-unit" key={label}><strong>{String(value).padStart(2, '0')}</strong><span>{label}</span></div>)}
              </div>
              <p className="tiny-note">30 October 2026 · India Standard Time</p>
              <button className="btn" onClick={() => setScreen('accept')} data-testid="button-preview-gifts">Explore your surprises <ArrowRight size={16} /></button>
            </>}
          </article>
          {birthday.celebratory && <CakeWish candlesOut={candlesOut} setCandlesOut={setCandlesOut} wishNote={wishNote} setWishNote={setWishNote} />}
        </section>}

        {screen === 'accept' && <section className="stage" aria-labelledby="accept-title">
          <SparkleField />
          <article className="card hero-card paper-grain">
            <div className="eyebrow">one very important question</div>
            <h1 id="accept-title" className="title">Accept your gifts?</h1>
            <GiftIllustration />
            <p className="subtitle">Three little treasures, wrapped up with all my love.</p>
            <div className="button-row">
              <button className="btn" onClick={() => { setAcceptNote(''); setScreen('menu'); }} data-testid="button-accept-yes"><Check size={17} /> Yes, please!</button>
              <button className="btn secondary" onClick={() => setAcceptNote('Hehe, your surprises are right here whenever you change your mind.')} data-testid="button-accept-no">Not today</button>
            </div>
            <p className="tiny-note" role="status" data-testid="status-accept-response">{acceptNote}</p>
          </article>
        </section>}

        {screen === 'menu' && <section className="stage" aria-labelledby="menu-title">
          <div className="section-head">
            <div className="eyebrow">three keepsakes, one big hug</div>
            <h1 id="menu-title" className="title">Yay! Choose your gift</h1>
            <p className="subtitle">Open them in any order. You can always come back for another.</p>
          </div>
          <div className="gift-grid">
            <button className="gift-choice" onClick={() => { setLetterOpen(false); setScreen('letter'); }} data-testid="gift-letter">
              <span className="gift-art"><Mail size={39} strokeWidth={1.5} /></span><span><h3>The little letter</h3><p>A few words from your favourite sister.</p></span>
            </button>
            <button className="gift-choice" onClick={() => setScreen('album')} data-testid="gift-scrapbook">
              <span className="gift-art"><ImageIcon size={39} strokeWidth={1.5} /></span><span><h3>Our little world</h3><p>A scrapbook waiting for our photos.</p></span>
            </button>
            <button className="gift-choice" onClick={() => { setFinalOpen(false); setScreen('final'); }} data-testid="gift-final-surprise">
              <span className="gift-art"><Gift size={39} strokeWidth={1.5} /></span><span><h3>The big reveal</h3><p>Your final surprise, tied with a bow.</p></span>
            </button>
          </div>
          <button className="btn text" onClick={() => setScreen('countdown')} data-testid="button-back-countdown"><ArrowLeft size={15} /> Back to the birthday page</button>
        </section>}

        {screen === 'letter' && <GiftFrame onBack={showMenu} label="a note, folded just for you">
          <div className="letter-layout">
            <div className="envelope-scene">
              <button className="envelope" aria-label={letterOpen ? 'Letter opened' : 'Open the letter'} onClick={() => setLetterOpen(true)} data-testid="button-open-letter">
                <span className="seal">{letterOpen ? <Check size={24} /> : <Heart size={23} fill="currentColor" />}</span>
              </button>
            </div>
            <article className="letter-paper paper-grain" data-testid="letter-content">
              <h2>{letterOpen ? `A little letter for ${birthdayConfig.name}` : 'A sealed note for you'}</h2>
              {letterOpen ? <p className="letter-copy">{birthdayConfig.letter}</p> :
                <><p className="letter-copy">There are a few things I wanted to say, and a little paper seemed like a lovely place to put them.</p><button className="btn" onClick={() => setLetterOpen(true)} data-testid="button-unfold-letter">Unfold your letter <ArrowRight size={15} /></button></>}
              {letterOpen && <div style={{ textAlign: 'right', color: '#173b65', fontFamily: 'Caveat, cursive', fontSize: '1.35rem', marginTop: 20 }}>Love you, always <Heart size={15} style={{ display: 'inline' }} /></div>}
            </article>
          </div>
        </GiftFrame>}

        {screen === 'album' && <GiftFrame onBack={showMenu} label="the memories we keep">
          <div className="album" data-testid="scrapbook-album">
            <article className="album-page">
              <div className="eyebrow">a few blank pages for us</div><h2>Our little world <Heart size={20} style={{ display: 'inline' }} /></h2>
              <div className="photo-grid">
                {birthdayConfig.photos.slice(0, 2).map((photo, i) => <PhotoTile key={`left-${i}`} photo={photo} index={i} onOpen={setPhotoIndex} />)}
              </div>
              <div className="album-note">These spaces are waiting for the real, wonderfully ordinary moments that are ours. Add your photos in <strong>src/config/birthdayConfig.ts</strong>.</div>
            </article>
            <article className="album-page right-page">
              <div className="eyebrow">little things, big love</div><h2>Always in my corner</h2>
              <p className="letter-copy" style={{ fontSize: '.91rem' }}>Life is made up of tiny moments that become the stories we tell forever. This book is ready for our favourite ones — the silly, the sweet, and everything in between.</p>
              <div className="photo-grid">
                {birthdayConfig.photos.slice(2, 4).map((photo, i) => <PhotoTile key={`right-${i + 2}`} photo={photo} index={i + 2} onOpen={setPhotoIndex} />)}
              </div>
              <p className="tiny-note">No memories invented. Just space for yours.</p>
            </article>
          </div>
          <div className="button-row"><button className="btn secondary" onClick={() => setPhotoIndex(0)} data-testid="button-open-photo-gallery"><ImageIcon size={16} /> Open photo gallery</button></div>
          {photoIndex !== null && <PhotoModal index={photoIndex} onClose={() => setPhotoIndex(null)} onChange={setPhotoIndex} />}
        </GiftFrame>}

        {screen === 'final' && <GiftFrame onBack={showMenu} label="the last little surprise">
          <article className="card final-card paper-grain" data-testid="final-surprise">
            <div className="eyebrow">one last thing, from my heart</div>
            {!finalOpen ? <>
              <h1 className="title">Ready for your<br />final surprise?</h1>
              <GiftIllustration />
              <p className="subtitle">Take a breath, untie the ribbon, and open your last little gift.</p>
              <button className="btn" onClick={() => setFinalOpen(true)} data-testid="button-open-final"><Gift size={16} /> Open my surprise <ArrowRight size={15} /></button>
            </> : <>
              <ConfettiField />
              <span className="status-pill"><Sparkles size={14} /> Just for you, {birthdayConfig.name}</span>
              <h1 className="title">All my love, in one place</h1>
              <PhotoCollage onOpen={setPhotoIndex} />
              <p className="final-copy" data-testid="text-final-message">{birthdayConfig.finalMessage}</p>
              <CakeWish candlesOut={candlesOut} setCandlesOut={setCandlesOut} wishNote={wishNote} setWishNote={setWishNote} compact />
              <div className="button-row">
                <button className="btn" onClick={startOver} data-testid="button-replay-surprise"><Sparkles size={16} /> Replay my surprise</button>
                <button className="btn secondary" onClick={showMenu} data-testid="button-final-back-gifts"><ArrowLeft size={15} /> Back to your gifts</button>
              </div>
              <button className="btn text" onClick={() => setPhotoIndex(0)} data-testid="button-final-gallery">View the photo gallery <ImageIcon size={15} /></button>
            </>}
          </article>
          {photoIndex !== null && <PhotoModal index={photoIndex} onClose={() => setPhotoIndex(null)} onChange={setPhotoIndex} />}
        </GiftFrame>}
      </div>
      <footer style={{ textAlign: 'center', padding: '0 16px 24px', color: '#7a8d9d', fontSize: '.75rem' }} data-testid="footer-signoff">
        A small paper world, made with a very big love. <Heart size={12} style={{ display: 'inline', verticalAlign: '-2px' }} />
        {previewActive && <span className="preview-date" data-testid="text-preview-date">Development date preview: {new Intl.DateTimeFormat('en-GB', { timeZone: birthdayConfig.timezone, dateStyle: 'medium', timeStyle: 'short' }).format(previewTimestamp)}</span>}
      </footer>
    </main>
  );
}

function GiftFrame({ children, onBack, label }: { children: ReactNode; onBack: () => void; label: string }) {
  return <section className="stage" aria-label={label}>
    <div className="journey-nav"><button className="back-link" onClick={onBack} data-testid="button-back-your-gifts"><ArrowLeft size={16} /> Your gifts</button><span className="crumb">A little birthday world&nbsp; / &nbsp;<b>{label}</b></span></div>
    {children}
  </section>;
}

function GiftIllustration() {
  return <div className="illustration" aria-hidden="true">
    <Star className="star star-a" size={20} /><Star className="star star-b" size={17} fill="currentColor" /><Heart className="star star-c" size={19} />
    <div className="gift-bow" /><div className="gift-lid" /><div className="gift-box" />
  </div>;
}

function CakeIllustration() {
  return <div className="illustration" aria-hidden="true">
    <Star className="star star-a" size={20} /><Star className="star star-b" size={17} fill="currentColor" />
    <div className="cake"><div className="candle"><i className="flame" /></div><div className="candle"><i className="flame" /></div><div className="candle"><i className="flame" /></div><div className="cake-body" /></div>
  </div>;
}

function SparkleField() {
  return <div className="sparkle-field" aria-hidden="true">{[0, 1, 2, 3].map(i => <Sparkles className="sparkle" key={i} size={i % 2 ? 16 : 21} />)}</div>;
}

function ConfettiField() {
  const colors = ['#173b65', '#6ca6d9', '#e9c779', '#a8c9df', '#d996a6'];
  return <div className="confetti-field" aria-hidden="true">
    {Array.from({ length: 24 }, (_, index) => <i
      className="confetti-piece"
      key={index}
      style={{
        left: `${(index * 37) % 100}%`,
        backgroundColor: colors[index % colors.length],
        animationDelay: `${(index % 8) * -0.45}s`,
        animationDuration: `${3.8 + (index % 5) * 0.35}s`,
        transform: `rotate(${(index * 29) % 180}deg)`,
      }}
    />)}
  </div>;
}

function CakeWish({ candlesOut, setCandlesOut, wishNote, setWishNote, compact = false }: {
  candlesOut: boolean; setCandlesOut: (out: boolean) => void; wishNote: string; setWishNote: (note: string) => void; compact?: boolean;
}) {
  return <div style={{ margin: compact ? '22px auto' : '24px auto 0', textAlign: 'center', width: '100%' }} data-testid="birthday-cake">
    <div className="eyebrow">a tiny birthday tradition</div>
    <p className="subtitle" style={{ fontSize: '.96rem', marginTop: 5 }}>Make a wish, then tap the candles.</p>
    <button className="cake" onClick={() => { if (!candlesOut) { setCandlesOut(true); setWishNote('Wish sent out into the world. May it find its way to you.'); } else { setCandlesOut(false); setWishNote('The candles are glowing again — make another wish.'); } }} aria-label={candlesOut ? 'Relight the candles' : 'Blow out the candles'} data-testid="button-blow-candles">
      {[0, 1, 2].map(i => <span className={`candle ${candlesOut ? 'out' : ''}`} key={i}><i className="flame" /></span>)}<span className="cake-body" />
    </button>
    <p className="tiny-note" role="status" data-testid="status-birthday-wish">{wishNote || 'Tap the cake when your wish is ready.'}</p>
  </div>;
}

type Photo = { src: string; caption?: string; date?: string; memory?: string };
function PhotoTile({ photo, index, onOpen }: { photo: Photo; index: number; onOpen: (index: number) => void }) {
  return <button className="photo-tile" onClick={() => onOpen(index)} data-testid={`photo-tile-${index}`} aria-label={`Open photo placeholder ${index + 1}: ${photo.caption || 'add a memory'}`}>
    <PhotoVisual photo={photo} index={index} mode="tile" />
    <span className="photo-caption">{photo.caption || `Memory ${index + 1}`}</span>
    {photo.date && <span className="photo-date">{photo.date}</span>}
    {photo.memory && <span className="photo-memory">{photo.memory}</span>}
  </button>;
}

function PhotoCollage({ onOpen }: { onOpen: (index: number) => void }) {
  return <div className="collage" data-testid="final-photo-collage">{birthdayConfig.photos.slice(0, 4).map((photo, index) =>
    <button key={index} className="photo-tile" onClick={() => onOpen(index)} data-testid={`collage-photo-${index}`}>
      <PhotoVisual photo={photo} index={index} mode="collage" />
    </button>)}</div>;
}

function PhotoVisual({ photo, index, mode }: { photo: Photo; index: number; mode: 'tile' | 'collage' | 'modal' }) {
  const [failed, setFailed] = useState(false);
  const styles: Record<typeof mode, CSSProperties> = {
    tile: { width: '100%', height: 128, objectFit: 'cover' },
    collage: { width: '100%', height: '100%', objectFit: 'cover', minHeight: index === 0 ? 240 : 115 },
    modal: { maxWidth: '100%', maxHeight: '60vh', objectFit: 'contain' },
  };
  if (photo.src && !failed) {
    return <img
      src={photo.src}
      alt={photo.caption || 'A family memory'}
      style={styles[mode]}
      loading="lazy"
      onError={() => setFailed(true)}
    />;
  }
  const placeholderCopy = mode === 'modal'
    ? <>This page is ready for your photo.<br />Add image paths in the birthday configuration.</>
    : <>Photo {index + 1}<br />{mode === 'tile' ? 'add your own image' : 'your memory goes here'}</>;
  return <span className="photo-placeholder"><ImageIcon size={mode === 'modal' ? 42 : 25} /><span>{placeholderCopy}</span></span>;
}

function PhotoModal({ index, onClose, onChange }: { index: number; onClose: () => void; onChange: (index: number) => void }) {
  const photo = birthdayConfig.photos[index];
  const move = (step: number) => onChange((index + step + birthdayConfig.photos.length) % birthdayConfig.photos.length);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
      if (event.key === 'ArrowLeft') move(-1);
      if (event.key === 'ArrowRight') move(1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [index]);
  return <div className="modal-backdrop" role="presentation" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }} data-testid="photo-gallery-modal">
    <section className="photo-modal" role="dialog" aria-modal="true" aria-label="Photo gallery">
      <button className="icon-btn" onClick={onClose} aria-label="Close photo gallery" style={{ position: 'absolute', top: 10, right: 10, zIndex: 1 }} data-testid="button-close-gallery"><X size={19} /></button>
      <PhotoVisual photo={photo} index={index} mode="modal" />
      <div className="modal-controls">
        <button className="icon-btn" onClick={() => move(-1)} aria-label="Previous photo" data-testid="button-previous-photo"><ChevronLeft /></button>
        <div className="photo-meta">
          <span data-testid="text-photo-caption">{photo.caption || `Memory ${index + 1}`} · {index + 1} of {birthdayConfig.photos.length}</span>
          {photo.date && <span className="photo-date">{photo.date}</span>}
          {photo.memory && <span className="photo-memory">{photo.memory}</span>}
        </div>
        <button className="icon-btn" onClick={() => move(1)} aria-label="Next photo" data-testid="button-next-photo"><ChevronRight /></button>
      </div>
    </section>
  </div>;
}

export default App;
