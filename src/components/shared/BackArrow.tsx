import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import "./BackArrow.css";

function BackArrow() {
  return (
    <Link to="/" className="back-arrow">
      <ArrowLeft size={28} />
    </Link>
  );
}

export default BackArrow;
