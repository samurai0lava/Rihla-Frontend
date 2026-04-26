import "./glassCard.css";

interface GlassCardProps {
  imageOverlay: string;
}

function GlassCard({ imageOverlay }: GlassCardProps) {
  return (
    <div className="passport-side">
      <img
        src={imageOverlay}
        alt="Passport overlay"
        className="passport-overlay"
      />
    </div>
  );
}

export default GlassCard;
