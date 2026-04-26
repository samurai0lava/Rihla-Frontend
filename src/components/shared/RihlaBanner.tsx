import RihlaimgWhite from '../../assets/RIHLA-white.png';
import RihlaimgBlack from '../../assets/RIHLA-black.png';
import DiscoverBtn from "./DiscoverBtn";
import { useTheme } from '@/context/ThemeContext';

function RIhlaBanner( {rihlaRef} : {rihlaRef: React.RefObject<HTMLElement | null>}) {
  const { isDark } = useTheme();
  return (
    <section className="min-h-screen bg-[#F5F5F7] dark:bg-[#1C1C1E] flex flex-col items-center justify-center py-16 px-8 transition-colors duration-300" ref={rihlaRef}>
      <img src={isDark ? RihlaimgWhite : RihlaimgBlack} alt="Rihla" className="w-full max-w-250 block px-16 h-auto object-contain rounded-lg" />
      <DiscoverBtn />
    </section>
  );
}

export default RIhlaBanner;
