import { useState } from "react";
import { Menu, Home, MessageSquare, Users, Bell, User, LogOut } from "lucide-react";
import RihlaimgOrange from "../../assets/RIHLA-orange.svg";
import "./VerticalNav.css";

interface NavItem {
    id: string;
    icon: React.ReactNode;
    label: string;
}

interface VerticalNavProps {
    onNavigate?: (id: string) => void;
    activeItem?: string;
}

function VerticalNav({ onNavigate, activeItem: controlledActive }: VerticalNavProps) {
    const [internalActive, setInternalActive] = useState("home");
    const [isExpanded, setIsExpanded] = useState(false);
    const activeItem = controlledActive ?? internalActive;

    const navItems: NavItem[] = [
        { id: "home", icon: <Home size={28} />, label: "Home" },
        { id: "messages", icon: <MessageSquare size={28} />, label: "Messages" },
        { id: "friends", icon: <Users size={28} />, label: "Friends" },
        { id: "notifications", icon: <Bell size={28} />, label: "Notification" },
    ];

    const handleClick = (id: string) => {
        setInternalActive(id);
        onNavigate?.(id);
    };

    const toggleExpand = () => {
        setIsExpanded(!isExpanded);
    };

    return (
        <nav className={`vertical-nav ${isExpanded ? "expanded" : ""}`}>
            <div className="nav-header">
                {isExpanded && (
                    <button
                        type="button"
                        className="nav-brand-btn"
                        onClick={() => handleClick("home")}
                        aria-label="Go to home"
                    >
                        <img
                            src={RihlaimgOrange}
                            alt="Rihla"
                            className="nav-brand-logo"
                        />
                    </button>
                )}
                <button className="nav-toggle" onClick={toggleExpand} aria-label="Menu">
                    <Menu size={28} />
                </button>
            </div>

            <div className="nav-items">
                {navItems.map((item) => (
                    <button
                        key={item.id}
                        className={`nav-item ${activeItem === item.id ? "active" : ""}`}
                        onClick={() => handleClick(item.id)}
                        aria-label={item.label}
                    >
                        {item.icon}
                        {isExpanded && <span className="nav-label">{item.label}</span>}
                    </button>
                ))}
            </div>

            <div className="nav-bottom">
                <button
                    className={`nav-item profile ${activeItem === "profile" ? "active" : ""}`}
                    onClick={() => handleClick("profile")}
                    aria-label="My Profile"
                >
                    <User size={28} />
                    {isExpanded && <span className="nav-label">My Profile</span>}
                </button>
                <button
                    className="nav-item logout"
                    onClick={() => handleClick("logout")}
                    aria-label="Logout"
                >
                    <LogOut size={28} />
                    {isExpanded && <span className="nav-label">Logout</span>}
                </button>
            </div>
        </nav>
    );
}

export default VerticalNav;