"use client";

import Image, { type StaticImageData } from "next/image";
import Reveal from "@/components/Reveal";

// Real ChadWallet app screenshots — one per bento card, replacing the
// previously hand-built mock UIs (per prompts/uifixes.md).
import leaderboardShot from "../assets/app store/kol.png";
import feedShot from "../assets/app store/x.png";
import alertsShot from "../assets/app store/discover.png";
import onboardingShot from "../assets/app store/splash.png";
import multichainShot from "../assets/app store/portfolio.png";
import buyShot from "../assets/app store/deposit.png";

type Card = {
  label: string;
  title: React.ReactNode;
  shot: StaticImageData;
  alt: string;
  delay: number;
};

const cards: Card[] = [
  {
    label: "LEADERBOARD",
    title: (
      <>
        become a chad,
        <br />
        top the leaderboard
      </>
    ),
    shot: leaderboardShot,
    alt: "ChadWallet trader leaderboard with profit and loss stats",
    delay: 0,
  },
  {
    label: "FEED",
    title: "discover and follow top chads",
    shot: feedShot,
    alt: "ChadWallet social feed to discover and follow top traders",
    delay: 80,
  },
  {
    label: "ALERTS",
    title: "real time notifications for what the chads are buying",
    shot: alertsShot,
    alt: "ChadWallet real-time feed of trader buys and sells",
    delay: 160,
  },
  {
    label: "EASY ONBOARDING",
    title: "create an account in an instant",
    shot: onboardingShot,
    alt: "ChadWallet onboarding splash screen",
    delay: 40,
  },
  {
    label: "ZERO COMPLEXITY",
    title: "multichain & gasless",
    shot: multichainShot,
    alt: "ChadWallet portfolio tracking assets in one place",
    delay: 120,
  },
  {
    label: "ONE CLICK TO BUY",
    title: "fund with apple pay",
    shot: buyShot,
    alt: "ChadWallet deposit screen to fund the account",
    delay: 200,
  },
];

export default function Bento() {
  return (
    <section className="bento-section">
      <Reveal>
        <h2>never miss a flip</h2>
        <p className="subhead">the only degen-first trading app</p>
      </Reveal>

      <div className="bento-grid">
        {cards.map((c) => (
          <Reveal className="bento-card" delay={c.delay} key={c.label}>
            <span className="bento-label">{c.label}</span>
            <h3 className="bento-title">{c.title}</h3>
            <div className="bento-shot">
              <Image
                src={c.shot}
                alt={c.alt}
                fill
                sizes="(max-width: 880px) 100vw, 400px"
                className="object-contain"
                style={{ objectFit: "contain", objectPosition: "center" }}
              />
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
