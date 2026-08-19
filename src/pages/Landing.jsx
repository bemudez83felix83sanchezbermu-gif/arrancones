import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import EventIntro from '../components/EventIntro';
import Categories from '../components/Categories';
import Schedule from '../components/Schedule';
import Competitors from '../components/Competitors';
import Gallery from '../components/Gallery';
import Location from '../components/Location';
import Contact from '../components/Contact';
import Footer from '../components/Footer';
import WhatsAppFloat from '../components/WhatsAppFloat';

export default function Landing() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <EventIntro />
        <Categories />
        <Schedule />
        <Competitors />
        <Gallery />
        <Location />
        <Contact />
      </main>
      <Footer />
      <WhatsAppFloat />
    </>
  );
}
