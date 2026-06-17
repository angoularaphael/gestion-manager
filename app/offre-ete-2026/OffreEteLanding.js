'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { BOXING_CENTER_CONTACT_EMAIL, BOXING_CENTER_SITE } from '../../lib/site';
import { BOXING_CENTER_SALLES } from '../../lib/boxingCenterSalles';

const SALLE_DETAILS = {
  minimes: {
    tag: 'Centre-ville',
    desc: 'Ambiance club, coachs diplômés, cours tous niveaux.',
    href: `${BOXING_CENTER_SITE}salles/`,
  },
  ramonville: {
    tag: 'Sud Toulouse',
    desc: 'Boxe, pieds-poings et cross training au cœur de la métropole.',
    href: `${BOXING_CENTER_SITE}salles/`,
  },
  'saint-cyprien': {
    tag: 'Toulouse centre',
    desc: 'Cours collectifs et libre pratique à deux pas du centre-ville.',
    href: `${BOXING_CENTER_SITE}salles/`,
  },
  portet: {
    tag: 'Salle phare',
    desc: '800 m², ring olympique, cage MMA — la plus grande du groupe.',
    href: 'https://boxingcenterportet.fr/',
  },
  'etats-unis': {
    tag: 'Quartier États-Unis',
    desc: 'Boxe, MMA et préparation physique dans le nord-est toulousain.',
    href: `${BOXING_CENTER_SITE}salles/`,
  },
};

const SALLES = BOXING_CENTER_SALLES.map((s) => ({
  name: s.label,
  ...SALLE_DETAILS[s.id],
}));

const BENEFITS = [
  'Accès illimité à toutes les salles Boxing Center',
  'Toutes les disciplines : boxe, MMA, muay thaï, kick, cross training…',
  'Cours collectifs et libre pratique 7j/7',
  'Encadrement par des coachs diplômés d\'État',
  'Sans engagement au-delà de l\'offre — idéal pour l\'été',
];

function useReveal() {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return { ref, visible };
}

function Reveal({ children, className = '', delay = 0 }) {
  const { ref, visible } = useReveal();
  return (
    <div
      ref={ref}
      className={`oe-reveal ${visible ? 'oe-reveal--in' : ''} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

export default function OffreEteLanding() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    fetch('/api/offre-ete/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event: 'view', source: 'landing' }),
    }).catch(() => {});

    const onScroll = () => setScrolled(window.scrollY > 48);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="oe-page">
      <div className="oe-grain" aria-hidden="true" />
      <div className="oe-glow oe-glow--tl" aria-hidden="true" />
      <div className="oe-glow oe-glow--br" aria-hidden="true" />

      <header className={`oe-nav ${scrolled ? 'oe-nav--scrolled' : ''}`}>
        <a href={BOXING_CENTER_SITE} className="oe-nav-brand" target="_blank" rel="noopener noreferrer">
          <Image src="/logo.png" alt="Boxing Center" width={130} height={34} priority />
        </a>
        <a href="#contact" className="oe-nav-cta">
          Je profite de l&apos;offre
        </a>
      </header>

      <section className="oe-hero">
        <div className="oe-hero-inner">
          <div className="oe-hero-copy">
            <p className="oe-eyebrow oe-anim-fade-up">Offre limitée — Été 2026</p>
            <h1 className="oe-hero-title oe-anim-fade-up oe-delay-1">
              <span className="oe-hero-line">3 mois</span>
              <span className="oe-hero-line oe-hero-line--gold">illimités</span>
            </h1>
            <p className="oe-hero-lead oe-anim-fade-up oe-delay-2">
              Entraînez-vous sans limite dans toutes nos salles. Boxe, MMA, muay thaï, kick, cross training — tout
              l&apos;été, à prix cassé.
            </p>
            <div className="oe-price-block oe-anim-fade-up oe-delay-3">
              <span className="oe-price-old">150€</span>
              <span className="oe-price-new">89€</span>
              <span className="oe-price-note">pour 3 mois</span>
            </div>
            <a href="#contact" className="oe-btn oe-btn--primary oe-anim-fade-up oe-delay-4">
              Réserver mon offre
            </a>
          </div>

          <div className="oe-hero-visual oe-anim-scale">
            <div className="oe-vignette-frame">
              <Image
                src="/offre-ete-2026/vignette.png"
                alt="Offre Été 2026 — 3 mois illimités à 89€"
                width={640}
                height={640}
                className="oe-vignette-img"
                priority
              />
              <div className="oe-vignette-shine" aria-hidden="true" />
            </div>
          </div>
        </div>

        <div className="oe-hero-scroll" aria-hidden="true">
          <span />
        </div>
      </section>

      <section className="oe-section oe-section--offer">
        <div className="oe-wrap">
          <Reveal>
            <p className="oe-eyebrow">L&apos;offre en détail</p>
            <h2 className="oe-section-title">
              Tout le Boxing Center, <span className="oe-tint">sans limite</span>
            </h2>
          </Reveal>

          <div className="oe-offer-grid">
            <Reveal className="oe-offer-card" delay={80}>
              <div className="oe-offer-badge">Économie</div>
              <p className="oe-offer-big">−41%</p>
              <p className="oe-offer-text">61€ d&apos;économie par rapport au tarif habituel sur 3 mois.</p>
            </Reveal>
            <Reveal className="oe-offer-card" delay={160}>
              <div className="oe-offer-badge">Durée</div>
              <p className="oe-offer-big">3 mois</p>
              <p className="oe-offer-text">Accès illimité pendant toute la période estivale 2026.</p>
            </Reveal>
            <Reveal className="oe-offer-card" delay={240}>
              <div className="oe-offer-badge">Liberté</div>
              <p className="oe-offer-big">∞</p>
              <p className="oe-offer-text">Toutes salles, tous cours, libre pratique incluse.</p>
            </Reveal>
          </div>

          <Reveal delay={120}>
            <ul className="oe-benefits">
              {BENEFITS.map((b) => (
                <li key={b}>
                  <span className="oe-check" aria-hidden="true" />
                  {b}
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </section>

      <section className="oe-section oe-section--salles">
        <div className="oe-wrap">
          <Reveal>
            <p className="oe-eyebrow">Nos salles</p>
            <h2 className="oe-section-title">
              5 clubs, <span className="oe-tint">un seul abonnement</span>
            </h2>
            <p className="oe-section-lead">
              L&apos;offre Été vous donne accès à l&apos;ensemble du réseau Boxing Center en Occitanie.
            </p>
          </Reveal>

          <div className="oe-salles-grid">
            {SALLES.map((s, i) => (
              <Reveal key={s.name} className="oe-salle-card" delay={i * 100}>
                <span className="oe-salle-tag">{s.tag}</span>
                <h3>{s.name}</h3>
                <p>{s.desc}</p>
                <a href={s.href} target="_blank" rel="noopener noreferrer" className="oe-salle-link">
                  Découvrir la salle →
                </a>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="oe-section oe-section--cta" id="contact">
        <div className="oe-wrap oe-cta-box">
          <Reveal>
            <p className="oe-eyebrow oe-eyebrow--light">Prêt à boxer cet été ?</p>
            <h2 className="oe-section-title oe-section-title--light">
              Réservez votre place <span className="oe-tint">maintenant</span>
            </h2>
            <p className="oe-section-lead oe-section-lead--light">
              Contactez-nous pour activer l&apos;offre Été 2026. Places limitées — ne laissez pas passer l&apos;été.
            </p>
          </Reveal>

          <Reveal delay={100}>
            <div className="oe-cta-actions">
              <a href={`mailto:${BOXING_CENTER_CONTACT_EMAIL}?subject=Offre%20%C3%89t%C3%A9%202026`} className="oe-btn oe-btn--primary oe-btn--lg">
                Écrire à la réception
              </a>
              <a href="tel:+33562244682" className="oe-btn oe-btn--ghost oe-btn--lg">
                05 62 24 46 82
              </a>
            </div>
          </Reveal>

          <Reveal delay={180}>
            <p className="oe-cta-foot">
              Ou rendez-vous sur{' '}
              <a href={BOXING_CENTER_SITE} target="_blank" rel="noopener noreferrer">
                boxingcenter.fr
              </a>{' '}
              pour plus d&apos;informations.
            </p>
          </Reveal>
        </div>
      </section>

      <footer className="oe-footer">
        <p>© {new Date().getFullYear()} Boxing Center — Sports de combat · Toulouse &amp; Occitanie</p>
      </footer>
    </div>
  );
}
