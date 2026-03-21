import Navbar from "@/components/Navbar";
import Hero from "@/sections/Hero";
import NewsBanner from "@/sections/NewsBanner";
import ProductCategories from "@/sections/ProductCategories";
import AwardsRecognition from "@/sections/AwardsRecognition";
import Testimonials from "@/sections/Testimonials";
import Educators from "@/sections/Educators";
import Careers from "@/sections/Careers";
import Footer from "@/sections/Footer";

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <div className="relative">
          <Hero />
          <NewsBanner />
        </div>
        <ProductCategories />
        <AwardsRecognition />
        <Testimonials />
        <Educators />
        <Careers />
      </main>
      <Footer />
    </>
  );
}
