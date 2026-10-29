import Hero from "@/components/home/Hero";
import Categories from "@/components/home/Categories";
import Featured from "@/components/home/Featured";
import DenimLab from "@/components/home/DenimLab";
import Banners from "@/components/home/Banners";
import Benefits from "@/components/home/Benefits";

export default function Home() {
  return (
    <>
      <Hero />
      <Categories />
      <Featured />
      <DenimLab />
      <Banners />
      <Benefits />
    </>
  );
}
