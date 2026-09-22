import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import EventIntro from '../components/EventIntro';
import Categories from '../components/Categories';
import Schedule from '../components/Schedule';
import Competitors from '../components/Competitors';
import Gallery from '../components/Gallery';
import Location from '../components/Location';
import Sponsors from '../components/Sponsors';
import SponsorPitch from '../components/SponsorPitch';
import Contact from '../components/Contact';
import Footer from '../components/Footer';
import WhatsAppFloat from '../components/WhatsAppFloat';
import WelcomeModal from '../components/WelcomeModal';
import { useEventPhase } from '../lib/eventPhase';

export default function Landing() {
  const { phase } = useEventPhase();

  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <EventIntro />
        <Schedule />
        <Categories />
        <Competitors />
        <Gallery />
        <Location />
        <Sponsors />
        {/* Durante y después del fest ya no se venden patrocinios. */}
        {phase === 'before' && <SponsorPitch />}
        <Contact />
      </main>
      <Footer />
      <WhatsAppFloat />
      <WelcomeModal />
    </>
  );
}
