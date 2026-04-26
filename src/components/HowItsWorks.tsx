import userIcon from '../assets/icons/utilisateur 1.png';
import userIconWhite from '../assets/icons/utilisateur-white.png';
import compassIcon from '../assets/icons/boussole 1.png';
import compassIconWhite from '../assets/icons/boussole-white.png';
import mapIcon from '../assets/icons/espace-reserve 1.png';
import mapIconWhite from '../assets/icons/espace-white.png';
import "./HowItsWorks.css";
import { useTheme } from '../context/ThemeContext';

function HowitsWorks({ howItWorksRef }: { howItWorksRef: React.RefObject<HTMLElement | null> }) {
  const { isDark } = useTheme();
  return (
    <section
      className="how-it-works-section"
      id="how-it-works"
      ref={howItWorksRef}
    >
      <div className="how-it-works-container">
        <div className="how-it-works-item">
          <div className="how-it-works-icon">
            <img src={isDark ? userIconWhite : userIcon} alt="Sign Up" />
          </div>
          <div className="how-it-works-divider"></div>
          <div className="how-it-works-content">
            <h2 className="how-it-works-title">Sign Up</h2>
            <p className="how-it-works-text">
              Create your account in seconds and access the platform instantly.
            </p>
          </div>
        </div>

        <div className="how-it-works-item">
          <div className="how-it-works-icon">
            <img src={isDark ? compassIconWhite : compassIcon} alt="Explore Live Data" />
          </div>
          <div className="how-it-works-divider"></div>
          <div className="how-it-works-content">
            <h2 className="how-it-works-title">Explore Live Data</h2>
            <p className="how-it-works-text">
              Track real-time information powered by trusted data sources and
              smart integrations.
            </p>
          </div>
        </div>

        <div className="how-it-works-item">
          <div className="how-it-works-icon">
            <img src={isDark ? mapIconWhite : mapIcon} alt="Discover Insights" />
          </div>
          <div className="how-it-works-divider"></div>
          <div className="how-it-works-content">
            <h2 className="how-it-works-title">Discover Insights</h2>
            <p className="how-it-works-text">
              Get meaningful context and insights that help you understand
              what's happening—clearly and effortlessly.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default HowitsWorks;
