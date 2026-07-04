import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

/* ---------------------------------- data ---------------------------------- */

const STATS = [
  { value: '2.4M', label: 'active wallets' },
  { value: 'PKR 18B', label: 'moved every month' },
  { value: '180+', label: 'cities across Pakistan' },
  { value: '24/7', label: 'support in your language' },
]

// Bento layout: 6-col grid on lg — featured tiles span 4, small span 2,
// bottom pair span 3 each (4+2 / 2+4 / 3+3).
const FEATURES = [
  {
    title: 'Instant transfers on Raast',
    body: 'Send money to any bank account or wallet in Pakistan in seconds, free of charge. IBAN, Raast ID, ya sirf phone number, jo aap ke paas hai.',
    stat: 'Zero fees',
    featured: true,
    span: 'lg:col-span-4',
    icon: (
      <path d="M4 12h13m0 0-4.5-4.5M17 12l-4.5 4.5M20 5v14" strokeLinecap="round" strokeLinejoin="round" />
    ),
  },
  {
    title: 'Bills, done in one tap',
    body: 'Electricity, gas, internet, school fees. Fetch the bill, check the amount, pay it. No queue, no photocopy of the challan.',
    stat: 'One tap',
    span: 'lg:col-span-2',
    icon: (
      <path d="M6 3h12v18l-2-1.5L14 21l-2-1.5L10 21l-2-1.5L6 21V3Zm3 6h6M9 13h6" strokeLinecap="round" strokeLinejoin="round" />
    ),
  },
  {
    title: 'Mobile top-ups that stick',
    body: 'Jazz, Zong, Telenor, Ufone, load balance for yourself or anyone in your contacts. Failed top-ups auto-reverse within 48 hours.',
    stat: '48h auto-reverse',
    span: 'lg:col-span-2',
    icon: (
      <path d="M8 3h8a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Zm4 15h.01" strokeLinecap="round" strokeLinejoin="round" />
    ),
  },
  {
    title: 'Fraud cover that responds',
    body: 'Report a suspicious transaction from inside the app and the amount is held while we investigate. Helpline 0800-NOOR, around the clock.',
    stat: '24/7 helpline',
    featured: true,
    span: 'lg:col-span-4',
    icon: (
      <path d="M12 3 5 6v5c0 4.5 3 8.2 7 10 4-1.8 7-5.5 7-10V6l-7-3Zm-2.5 9 2 2 3.5-4" strokeLinecap="round" strokeLinejoin="round" />
    ),
  },
  {
    title: 'Open an account in minutes',
    body: 'CNIC, a selfie, and a few minutes. NADRA-verified onboarding without visiting a branch. NICOP holders overseas can register too.',
    stat: 'Under 5 min',
    span: 'lg:col-span-3',
    icon: (
      <path d="M4 5h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Zm4 8a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm-3 3c.5-1.5 1.7-2 3-2s2.5.5 3 2m3-6h4m-4 3h4" strokeLinecap="round" strokeLinejoin="round" />
    ),
  },
  {
    title: 'A card for the internet',
    body: 'A virtual debit card for online payments and subscriptions, with per-merchant limits and a freeze switch when something looks off.',
    stat: 'Freeze anytime',
    span: 'lg:col-span-3',
    icon: (
      <path d="M3 8h18M3 6a1 1 0 0 1 1-1h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6Zm3 9h4" strokeLinecap="round" strokeLinejoin="round" />
    ),
  },
]

const SUITE = [
  {
    name: 'RedPen',
    tagline: 'CV review, line by line',
    body: 'Started as our hiring team’s internal screener. RedPen reads a CV the way a reviewer does. Flags vague claims, weak phrasing, and missing evidence, and marks it up like a red pen would.',
    href: 'https://github.com/hnprivv/RedPen',
    demo: 'https://redpen-by-hn.streamlit.app',
    icon: '/tools/redpen.png',
    context: 'Hiring/Self-Assessment',
    hoverAccent: 'hover:border-red-500/50',
  },
  {
    name: 'Lumen',
    tagline: 'Answers from your documents',
    body: 'Our internal knowledge base outgrew search. Lumen lets a team drop in their documents and ask questions in plain language, with answers grounded in the actual source pages.',
    href: 'https://github.com/hnprivv/Lumen',
    demo: 'https://lumen-by-hn.streamlit.app',
    icon: '/tools/lumen.png',
    context: 'Knowledge base',
    hoverAccent: 'hover:border-amber-500/50',
  },
  {
    name: 'Prism',
    tagline: 'Analytics without the SQL',
    body: 'Built so product managers could stop filing tickets for every chart. Prism takes a question in plain English, runs it against the data, and returns the table or chart that answers it.',
    href: 'https://github.com/hnprivv/Prism',
    demo: 'https://prism-by-hn.streamlit.app',
    icon: '/tools/prism.png',
    context: 'Analytics',
    hoverAccent: 'hover:border-orange-600/50',
  },
]

const KAFI_DEMO = [
  { role: 'user', text: 'yaar mera JazzCash top-up fail ho gaya lekin paise kat gaye' },
  {
    role: 'assistant',
    text: 'Fikar na karein! Failed top-up ki raqam 24 se 48 ghantay mein automatically reverse ho jati hai. Agar 48 ghantay ke baad bhi wapas na aaye, to app se transaction report kar dein, hum foran check karenge.',
  },
  { role: 'user', text: 'ok aur agar dobara try karun abhi?' },
  {
    role: 'assistant',
    text: 'Ji bilkul, dobara try kar sakte hain. Pehli wali amount alag se wapas aa jayegi, dono mix nahi hongi.',
  },
]

/* -------------------------------- sections -------------------------------- */

function Nav() {
  return (
    <nav className="sticky top-0 z-20 border-b border-emerald-800/60 bg-emerald-950/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-8 px-5 py-3.5">
        <a href="#top" className="flex items-center gap-2.5">
          <img src="/noor.svg" alt="" className="h-9 w-9" />
          <span className="text-lg font-semibold tracking-tight text-white">Noor</span>
        </a>
        <div className="hidden items-center gap-6 text-sm text-emerald-100/70 sm:flex">
          <a href="#features" className="transition hover:text-gold-300">Features</a>
          <a href="#kafi" className="transition hover:text-gold-300">Kafi</a>
          <a href="#suite" className="transition hover:text-gold-300">Open source</a>
        </div>
        <Link
          to="/chat" viewTransition
          className="ml-auto rounded-full bg-gold-400 px-4 py-2 text-sm font-medium text-emerald-950 transition hover:bg-gold-300"
        >
          Talk to Kafi
        </Link>
      </div>
    </nav>
  )
}

function Hero() {
  return (
    <section id="top" className="relative overflow-hidden">
      <div className="pointer-events-none absolute -top-40 right-[-10%] h-[480px] w-[480px] rounded-full bg-emerald-700/30 blur-3xl" />
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 pt-16 pb-20 lg:grid-cols-[1.1fr_0.9fr] lg:pt-24">
        <div>
          <p className="mb-4 inline-flex items-center gap-2 rounded-full bg-emerald-900 px-3 py-1 text-xs text-emerald-100/70 ring-1 ring-emerald-700">
            <span className="h-1.5 w-1.5 rounded-full bg-gold-400" />
            Licensed EMI &middot; Regulated by the State Bank of Pakistan
          </p>
          <h1 className="text-4xl leading-tight font-semibold tracking-tight text-white sm:text-5xl">
            Your money,
            <br />
            <span className="text-gold-300">in your own words.</span>
          </h1>
          <p className="mt-5 max-w-lg text-justify text-base leading-relaxed text-emerald-100/70">
            Noor is a mobile wallet for Pakistan. Transfers, bills, and top-ups in one
            app, with support that understands you whether you write in English, Urdu,
            or the mix you actually speak.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              to="/chat" viewTransition
              className="rounded-full bg-gold-400 px-6 py-3 text-sm font-medium text-emerald-950 transition hover:bg-gold-300"
            >
              Chat with Kafi
            </Link>
            <a
              href="#features"
              className="rounded-full px-6 py-3 text-sm font-medium text-emerald-100 ring-1 ring-emerald-700 transition hover:bg-emerald-900 hover:text-gold-300"
            >
              See what&apos;s inside
            </a>
          </div>
        </div>
        <PhoneMockup />
      </div>
    </section>
  )
}

function PhoneMockup() {
  const ref = useRef(null)
  const [inView, setInView] = useState(false)

  // The shared view-transition name is only attached while the mockup is
  // on screen: clicking "chat" then morphs the mockup into the real chat
  // screen. Off screen, the name is absent and navigation falls back to
  // the default cross-fade.
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), {
      threshold: 0.4,
    })
    observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      style={{ viewTransitionName: inView ? 'kafi-chat' : 'none' }}
      className="mx-auto w-full max-w-[340px]"
    >
      <div className="rounded-[2rem] border border-emerald-700/60 bg-emerald-900 p-2 shadow-2xl shadow-black/50">
        <div className="overflow-hidden rounded-[1.6rem] bg-emerald-950">
          <div className="flex items-center gap-2.5 border-b border-emerald-800/60 px-4 py-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-800 ring-1 ring-gold-400/40">
              <span className="font-naskh text-sm text-gold-300" dir="rtl">کافی</span>
            </span>
            <div className="leading-tight">
              <p className="text-sm font-medium text-white">Kafi</p>
              <p className="text-[11px] text-emerald-200/60">AI Assistant</p>
            </div>
          </div>
          <div className="space-y-2.5 px-3.5 py-4">
            {KAFI_DEMO.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <p
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-[13px] leading-relaxed ${
                    m.role === 'user'
                      ? 'rounded-br-sm bg-emerald-600 text-white'
                      : 'rounded-bl-sm bg-emerald-800/70 text-emerald-50 ring-1 ring-gold-400/20'
                  }`}
                >
                  {m.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function Stats() {
  return (
    <section className="border-y border-emerald-800/60 bg-emerald-900/40">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-y-8 px-5 py-10 sm:grid-cols-4">
        {STATS.map((s) => (
          <div key={s.label} className="text-center">
            <p className="text-2xl font-semibold text-gold-300 sm:text-3xl">{s.value}</p>
            <p className="mt-1 text-xs text-emerald-100/60 sm:text-sm">{s.label}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

function NoorCard() {
  const anchorRef = useRef(null)
  const cardRef = useRef(null)

  // Scroll-linked: the card grows in as it rises from the Kafi section's edge,
  // rests at full size mid-viewport, then slides up behind the feature tiles
  // (they sit at z-10, this wrapper at z-0) as the user scrolls on.
  // The target is derived from the untransformed anchor, and the applied
  // values ease toward it each frame so wheel steps don't snap.
  useEffect(() => {
    const anchor = anchorRef.current
    const card = cardRef.current
    let raf = 0
    let running = false
    const current = { y: 90, scale: 0.55, opacity: 0 }

    const computeTarget = () => {
      const rect = anchor.getBoundingClientRect()
      const progress = Math.min(1, Math.max(0, (window.innerHeight - rect.top) / (window.innerHeight + rect.height)))

      if (progress < 0.35) {
        const t = progress / 0.35
        return { y: 90 * (1 - t), scale: 0.55 + 0.45 * t, opacity: Math.min(1, t * 1.6) }
      }
      if (progress > 0.6) {
        const t = (progress - 0.6) / 0.4
        return { y: -170 * t, scale: 1, opacity: 1 - t }
      }
      return { y: 0, scale: 1, opacity: 1 }
    }

    const step = () => {
      const target = computeTarget()
      let settled = true
      for (const key of ['y', 'scale', 'opacity']) {
        const delta = target[key] - current[key]
        if (Math.abs(delta) > 0.002) settled = false
        current[key] += delta * 0.12
      }
      card.style.transform = `translateY(${current.y}px) scale(${current.scale})`
      card.style.opacity = current.opacity

      if (settled) {
        running = false
      } else {
        raf = requestAnimationFrame(step)
      }
    }

    const kick = () => {
      if (!running) {
        running = true
        raf = requestAnimationFrame(step)
      }
    }
    kick()
    window.addEventListener('scroll', kick, { passive: true })
    window.addEventListener('resize', kick)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('scroll', kick)
      window.removeEventListener('resize', kick)
    }
  }, [])

  // Tilt toward the cursor, as if that corner of the card is pressed down.
  // Inline transform overrides the CSS hover lift while tracking; clearing
  // it on leave hands the reset back to the stylesheet transition.
  const handleTiltMove = (e) => {
    const el = e.currentTarget
    const rect = el.getBoundingClientRect()
    const px = (e.clientX - rect.left) / rect.width - 0.5
    const py = (e.clientY - rect.top) / rect.height - 0.5
    el.style.transition = 'transform 100ms ease-out, box-shadow 300ms ease'
    el.style.transform = `perspective(700px) rotateX(${(-py * 10).toFixed(2)}deg) rotateY(${(px * 12).toFixed(2)}deg)`
  }

  const handleTiltLeave = (e) => {
    const el = e.currentTarget
    el.style.transition = ''
    el.style.transform = ''
  }

  return (
    <div ref={anchorRef} className="relative z-0 mx-auto mt-14 w-full max-w-3xl">
      <div ref={cardRef}>
        <div className="flex items-center justify-center gap-8">
        {/* Spec annotations — desktop only, mobile keeps just the card */}
        <div className="hidden flex-1 flex-col gap-16 lg:flex">
          <div className="flex items-center justify-end gap-3">
            <p className="max-w-[200px] text-right text-xs leading-relaxed text-stone-500">
              Freeze and unfreeze it from the app, instantly
            </p>
            <span className="h-px w-12 bg-stone-300" />
          </div>
          <div className="flex items-center justify-end gap-3">
            <p className="max-w-[200px] text-right text-xs leading-relaxed text-stone-500">
              No printed number &mdash; nothing to skim, nothing to lose
            </p>
            <span className="h-px w-12 bg-stone-300" />
          </div>
        </div>
        <div
          onMouseMove={handleTiltMove}
          onMouseLeave={handleTiltLeave}
          className="noor-card relative flex aspect-[7/10] w-[220px] shrink-0 flex-col overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-800 via-emerald-900 to-emerald-950 p-5 shadow-xl shadow-emerald-950/30 ring-1 ring-gold-400/30 hover:shadow-2xl hover:shadow-emerald-950/50"
        >
        <div className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(115deg,transparent_0px,transparent_11px,rgba(246,218,158,0.025)_11px,rgba(246,218,158,0.025)_12px)]" />
        <div className="pointer-events-none absolute -top-16 -right-16 h-40 w-40 rounded-full bg-gold-400/10 blur-2xl" />
        <div className="flex items-start justify-between">
          <img src="/noor.svg" alt="" className="h-8 w-8" />
          <span className="text-[10px] font-semibold tracking-widest text-emerald-100/60 uppercase">
            Virtual
          </span>
        </div>
        <p className="mt-auto text-sm font-semibold tracking-widest text-white uppercase">
          Huzaifa Najam
        </p>
        <div className="mt-10 flex items-end justify-between">
          <span className="font-mono text-sm tracking-[0.15em] text-emerald-100/80">4291</span>
          <span className="text-sm font-bold tracking-tight text-white italic">PayPak</span>
        </div>
        </div>
        <div className="hidden flex-1 flex-col gap-16 lg:flex">
          <div className="flex items-center gap-3">
            <span className="h-px w-12 bg-stone-300" />
            <p className="max-w-[200px] text-xs leading-relaxed text-stone-500">
              Issued the moment your account opens
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="h-px w-12 bg-stone-300" />
            <p className="max-w-[200px] text-xs leading-relaxed text-stone-500">
              Accepted at every PayPak merchant online
            </p>
          </div>
        </div>
        </div>
      </div>
    </div>
  )
}

function Features() {
  return (
    <section id="features" className="scroll-mt-16 bg-white">
      <div className="mx-auto max-w-6xl px-5 py-20">
        <p className="text-sm font-medium text-emerald-600">Everyday money</p>
        <h2 className="mt-2 max-w-xl text-3xl font-semibold tracking-tight text-emerald-950">
          Everything a wallet should do, without the fine print games.
        </h2>
        <div className="relative z-10 mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className={`group rounded-2xl p-7 transition ${f.span} ${
                f.featured
                  ? 'bg-emerald-950 hover:shadow-xl hover:shadow-emerald-950/20'
                  : 'border border-stone-200 bg-stone-50 hover:border-emerald-600/40 hover:shadow-lg hover:shadow-stone-200'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <span
                  className={`flex h-12 w-12 items-center justify-center rounded-xl ${
                    f.featured
                      ? 'bg-emerald-800/60 text-gold-300 ring-1 ring-gold-400/40'
                      : 'bg-emerald-950 text-gold-300'
                  }`}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-6 w-6">
                    {f.icon}
                  </svg>
                </span>
                <span
                  className={`rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-wide uppercase ${
                    f.featured
                      ? 'text-gold-300 ring-1 ring-gold-400/40'
                      : 'text-emerald-700 ring-1 ring-emerald-700/30'
                  }`}
                >
                  {f.stat}
                </span>
              </div>
              <h3 className={`mt-5 text-base font-semibold ${f.featured ? 'text-white' : 'text-emerald-950'}`}>
                {f.title}
              </h3>
              <p
                className={`mt-2 text-justify text-sm leading-relaxed ${
                  f.featured ? 'max-w-md text-emerald-100/70' : 'text-stone-600'
                }`}
              >
                {f.body}
              </p>
            </div>
          ))}
        </div>
        <NoorCard />
      </div>
    </section>
  )
}

function KafiSection() {
  return (
    <section id="kafi" className="relative z-10 scroll-mt-16 bg-emerald-950">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 py-20 lg:grid-cols-2">
        <div>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white">
            Meet Kafi, support that speaks like you do.
          </h2>
          <p className="mt-4 max-w-lg text-justify text-base leading-relaxed text-emerald-100/70">
            Most support bots force you to pick a language. Kafi doesn&apos;t. Write
            &ldquo;mera top-up fail ho gaya, refund kab milega?&rdquo; and it answers in
            the same mix of Urdu and English, grounded in Noor&apos;s actual policies,
            not guesswork.
          </p>
          <ul className="mt-6 space-y-3 text-sm text-emerald-100/80">
            {[
              'Understands Roman Urdu, English, and everything in between (typos included).',
              'Answers come from Noor’s real help articles, so amounts and timeframes are accurate.',
              'Hands you to a human agent when a question needs one, instead of going in circles.',
            ].map((item) => (
              <li key={item} className="flex gap-3">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mt-0.5 h-4 w-4 shrink-0 text-gold-400">
                  <path d="m5 13 4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {item}
              </li>
            ))}
          </ul>
          <Link
            to="/chat" viewTransition
            className="mt-8 inline-block rounded-full bg-gold-400 px-6 py-3 text-sm font-medium text-emerald-950 transition hover:bg-gold-300"
          >
            Ask Kafi something
          </Link>
        </div>
        <div className="rounded-2xl border border-emerald-800 bg-emerald-900/50 p-6">
          <p className="text-xs font-medium tracking-wide text-emerald-200/50 uppercase">
            How it works
          </p>
          <ol className="mt-4 space-y-5">
            {[
              ['You write naturally', '“refund kaise milega bhai” works just as well as a formal sentence.'],
              ['Kafi finds the right policy', 'Your question is matched against Noor’s help centre, not answered from thin air.'],
              ['You get a straight answer', 'In your own style, with the exact steps, amounts, and timeframes that apply.'],
            ].map(([title, body], i) => (
              <li key={title} className="flex gap-4">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-800 text-xs font-semibold text-gold-300 ring-1 ring-gold-400/30">
                  {i + 1}
                </span>
                <div>
                  <p className="text-sm font-medium text-white">{title}</p>
                  <p className="mt-1 text-justify text-sm leading-relaxed text-emerald-100/60">{body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  )
}

function Suite() {
  return (
    <section id="suite" className="scroll-mt-16 border-t border-stone-200 bg-stone-50">
      <div className="mx-auto max-w-6xl px-5 py-20">
        <p className="text-sm font-medium text-emerald-600">From the Noor engineering team</p>
        <h2 className="mt-2 max-w-xl text-3xl font-semibold tracking-tight text-emerald-950">
          Tools we built for ourselves, released as open source.
        </h2>
        <p className="mt-4 max-w-2xl text-justify text-base leading-relaxed text-stone-600">
          Kafi wasn&apos;t our first internal tool, it&apos;s the fourth. The first three
          started as fixes for our own hiring, documentation, and analytics headaches,
          and are now public on GitHub.
        </p>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {SUITE.map((tool) => (
            <div
              key={tool.name}
              className={`flex flex-col rounded-2xl border border-stone-200 bg-white p-6 transition hover:shadow-lg hover:shadow-stone-200 ${tool.hoverAccent}`}
            >
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-stone-200 bg-stone-50">
                  <img src={tool.icon} alt="" className="h-6 w-6 object-contain" />
                </span>
                <h3 className="text-lg font-semibold text-emerald-950">{tool.name}</h3>
                <span className="ml-auto rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-wide uppercase text-stone-500 ring-1 ring-stone-300">
                  {tool.context}
                </span>
              </div>
              <p className="mt-1 text-sm font-medium text-emerald-700">{tool.tagline}</p>
              <p className="mt-3 flex-1 text-justify text-sm leading-relaxed text-stone-600">{tool.body}</p>
              <div className="mt-5 flex items-center justify-between">
                <a
                  href={tool.href}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-700 transition hover:text-emerald-600"
                >
                  View on GitHub
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5">
                    <path d="M7 17 17 7m0 0H9m8 0v8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </a>
                <a
                  href={tool.demo}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full bg-emerald-950 px-4 py-1.5 text-sm font-medium text-white transition hover:bg-emerald-800"
                >
                  Try it
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5">
                    <path d="M7 17 17 7m0 0H9m8 0v8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer className="bg-emerald-950">
      <div className="mx-auto max-w-6xl px-5 py-12">
        <div className="flex flex-col justify-between gap-8 sm:flex-row">
          <div>
            <div className="flex items-center gap-2.5">
              <img src="/noor.svg" alt="" className="h-8 w-8" />
              <span className="font-semibold text-white">Noor</span>
            </div>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-emerald-100/50">
              Noor Digital (Pvt.) Ltd. &middot; Karachi, Pakistan
              <br />
              Helpline 0800-NOOR &middot; support@noor.pk
            </p>
          </div>
          <div className="flex gap-16 text-sm">
            <div className="space-y-2.5">
              <p className="font-medium text-emerald-100/80">Product</p>
              <a href="#features" className="block text-emerald-100/50 transition hover:text-gold-300">Features</a>
              <a href="#kafi" className="block text-emerald-100/50 transition hover:text-gold-300">Kafi assistant</a>
              <a href="#suite" className="block text-emerald-100/50 transition hover:text-gold-300">Open source</a>
            </div>
            <div className="space-y-2.5">
              <p className="font-medium text-emerald-100/80">Support</p>
              <Link to="/chat" viewTransition className="block text-emerald-100/50 transition hover:text-gold-300">Chat with Kafi</Link>
              <a href="#kafi" className="block text-emerald-100/50 transition hover:text-gold-300">Help centre</a>
              <a href="#top" className="block text-emerald-100/50 transition hover:text-gold-300">Report fraud</a>
            </div>
          </div>
        </div>
        <div className="mt-10 border-t border-emerald-800/60 pt-6 text-xs leading-relaxed text-emerald-100/40">
          <p className="max-w-2xl text-justify">
            Noor is a fictional fintech company created for a portfolio project. It is not
            a real financial service, and nothing on this page is a real product, licence,
            or offer.
          </p>
          <div className="mt-2 flex items-center gap-4">
            <p>&copy; 2026 Noor Digital (Pvt.) Ltd.</p>
            <Link to="/privacy" viewTransition className="transition hover:text-gold-300">
              Privacy
            </Link>
            <Link to="/privacy#terms" viewTransition className="transition hover:text-gold-300">
              Terms
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

/* ---------------------------------- page ---------------------------------- */

export default function Landing() {
  return (
    <div className="min-h-screen bg-emerald-950 font-sans">
      <Nav />
      <Hero />
      <Stats />
      <Features />
      <KafiSection />
      <Suite />
      <Footer />
    </div>
  )
}
