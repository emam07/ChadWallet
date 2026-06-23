import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import TokenTicker from "@/components/TokenTicker";
import Features from "@/components/Features";
import MarketPreview from "@/components/MarketPreview";
import Stats from "@/components/Stats";
import HowItWorks from "@/components/HowItWorks";
import MobileApp from "@/components/MobileApp";
import CTA from "@/components/CTA";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <main className="relative min-h-screen bg-bg-primary">
      <Navbar />
      <Hero />
      <TokenTicker />
      <Features />
      <MarketPreview />
      <Stats />
      <HowItWorks />
      <MobileApp />
      <TokenTicker reverse />
      <CTA />
      <Footer />
    </main>
  );
}
