import "./Footer.css";
import RIhlaBrand from './RIhlaBrand';
import FooterLinks from './FooterLInks';
import FooterBottom from './FooterBottom';
function Footer({ footerRef }: { footerRef: React.RefObject<HTMLElement | null> }) {
  return (
    <footer className="footer-section" ref={footerRef}>
      <div className="footer-content">
        <RIhlaBrand />
        <FooterLinks />
      </div>
      <FooterBottom />
    </footer>
  );
}

export default Footer;
