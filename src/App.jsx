import Navbar from './components/Navbar';
import Hero from './components/Hero';
import EventIntro from './components/EventIntro';
import Categories from './components/Categories';
import Schedule from './components/Schedule';
import Gallery from './components/Gallery';
import Location from './components/Location';
import Contact from './components/Contact';
import Footer from './components/Footer';
import WhatsAppFloat from './components/WhatsAppFloat';

export default function App() {
  return (
    <div className="min-h-screen bg-racing-asphalt text-white">
      <Navbar />
      <main>
        <Hero />
        <EventIntro />
        <Categories />
        <Schedule />
        <Gallery />
        <Location />
        <Contact />
      </main>
      <Footer />
      <WhatsAppFloat />
    </div>
  );
}
