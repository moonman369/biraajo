import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import About from "@/components/About";
import Experiences from "@/components/Experiences";
import MenuSection from "@/components/MenuSection";
import Gallery from "@/components/Gallery";
import InstagramFeed from "@/components/InstagramFeed";
import Events from "@/components/Events";
import Newsletter from "@/components/Newsletter";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";

export default function LandingPage() {
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setLoaded(true), 50);
    return () => clearTimeout(t);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: loaded ? 1 : 0 }}
      transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
      data-testid="landing-page"
    >
      <Navbar />
      <Hero />
      <About />
      <Experiences />
      <Events />
      <MenuSection />
      <Gallery />
      <InstagramFeed />
      <Newsletter />
      <Contact />
      <Footer />
    </motion.div>
  );
}
