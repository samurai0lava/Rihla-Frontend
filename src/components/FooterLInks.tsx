import { Link } from "react-router-dom";

function FooterLinks() {
    const linkClasses = "font-sans text-base font-semibold text-white no-underline transition-colors duration-300 hover:text-[#FF8C00]";

    return (
        <div className="flex gap-16 flex-wrap">
            <div className="min-w-30">
                <h3 className="font-mono text-[0.9rem] font-normal text-[#888888] mb-4 capitalize">Contacts</h3>
                <ul className="list-none p-0 m-0">
                    <li className="mb-3">
                        <a href="mailto:rihlaHELP@gmail.com" className={linkClasses}>rihlaHELP@gmail.com</a>
                    </li>
                    <li className="mb-3">
                        <a href="tel:+212000000000" className={linkClasses}>+212 000 000 000</a>
                    </li>
                    <li className="mb-3">
                        <Link to="/healthcheck" className={linkClasses}>Service status</Link>
                    </li>
                </ul>
            </div>
        </div>
    );
}

export default FooterLinks;