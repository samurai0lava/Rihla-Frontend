import { Link } from 'react-router-dom';
import "./DiscoverBtn.css";
function DiscoverBtn() {
  return (
    <Link to="/register" className="hero-button">
      Discover Now
    </Link>
  );
}

export default DiscoverBtn;
