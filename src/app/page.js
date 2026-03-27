import HeroSection from '@/components/home/HeroSection';
import Marquee from '@/components/home/Marquee';
import NewProducts from '@/components/home/NewProducts';
import FeaturedProducts from '@/components/home/FeaturedProducts';
import CategoriesGrid from '@/components/home/CategoriesGrid';
import VideoBanner from '@/components/home/VideoBanner';
import Newsletter from '@/components/home/Newsletter';

export default function Home() {
  return (
    <>
      <HeroSection />
      <Marquee />
      <CategoriesGrid />  
      <NewProducts />
      <FeaturedProducts />
      <VideoBanner />
      <Newsletter />
    </>
  );
}
