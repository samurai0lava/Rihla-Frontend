import { Link } from "react-router-dom";
import "./FooterBottom.css";

function FooterBottom() {
    return (

        <div className="footer-bottom">
            <p>COPYRIGHT © 2026 RIHLA</p>
            <Link to="/privacy">Privacy Policy</Link>
        </div>
    );
}

export default FooterBottom;
