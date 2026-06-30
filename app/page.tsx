import "./landing.css";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import TokenTicker from "@/components/TokenTicker";
import Bento from "@/components/Bento";
import Showcase from "@/components/Showcase";
import Stats from "@/components/Stats";
import CTA from "@/components/CTA";
import Footer from "@/components/Footer";

// Dark "space" landing page — full rip-and-replace per prompts/landinguichange.md.
// All styling is scoped under `.landing-root` (see app/landing.css) so the
// light-themed trading dashboard at /trade is left completely untouched.
export default function Home() {
  return (
    <main className="landing-root">
      <Navbar />
      <Hero />
      <TokenTicker />
      <Bento />
      <Showcase />
      <Stats />
      <CTA />
      <Footer />
    </main>
  );
}
