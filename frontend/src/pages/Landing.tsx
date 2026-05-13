import Navbar from "@/components/site/Navbar";
import Hero from "@/components/site/Hero";
import Marquee from "@/components/site/Marquee";
import FeatureLedger from "@/components/site/FeatureLedger";
import DashboardPreview from "@/components/site/DashboardPreview";
import MandiSection from "@/components/site/MandiSection";
import FestivalCalendar from "@/components/site/FestivalCalendar";
import Voices from "@/components/site/Voices";
import StackSection from "@/components/site/StackSection";
import CTASection from "@/components/site/CTASection";
import Footer from "@/components/site/Footer";

const Landing = () => {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-clip">
      <Navbar />
      <main>
        <Hero />
        <Marquee />
        <FeatureLedger />
        <DashboardPreview />
        <MandiSection />
        <FestivalCalendar />
        <Voices />
        <StackSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
};

export default Landing;
