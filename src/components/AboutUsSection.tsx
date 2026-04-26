import "./AboutUsSection.css";

function AboutUsSection({aboutRef}: {aboutRef: React.RefObject<HTMLElement | null>}) {
  return (
    <section className="about-section" id="about" ref={aboutRef}>
      <div className="about-content">
        <h1 className="about-title">Rihla</h1>
        <p className="about-text">
          By combining live data, smart technology, and clean design, we help
          you discover, understand, and explore information effortlessly. Our
          focus is on speed, simplicity, and meaningful experiences—so you spend
          less time figuring things out and more time discovering what matters.
        </p>
      </div>
    </section>
  );
}
export default AboutUsSection;