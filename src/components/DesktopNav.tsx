import "./DesktopNav.css";

function DesktopNav({ activeSection } : { activeSection: string }) {
  return (
    <div className="desktop-nav">
      <a
        href="/#about"
        className={`nav-link ${activeSection === "about" ? "active" : ""}`}
      >
        About Us
      </a>
      <a
        href="/#how-it-works"
        className={`nav-link ${activeSection === "how-it-works" ? "active" : ""}`}
      >
        How it Works
      </a>
      <a
        href="/#features"
        className={`nav-link ${activeSection === "features" ? "active" : ""}`}
      >
        Features
      </a>
    </div>
  );
}

export default DesktopNav;
