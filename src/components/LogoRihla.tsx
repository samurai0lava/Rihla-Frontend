import "./LogoRihla.css";
import { Link } from "react-router-dom";
import RihlaimgOrange from "../assets/white-logo-rihla.svg";

function LogoRihla() {
    return (
        <div className="logo">
            <Link to="/" aria-label="Go to home">
                <img
                    src={RihlaimgOrange}
                    alt="Rihla"
                    className="logo-img"
                />
            </Link>
        </div>
    );
}
export default LogoRihla;