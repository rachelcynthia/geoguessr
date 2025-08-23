import './TopNav.css';
import { useContext, useState, useEffect } from 'react';
import { useNavigate, useLocation } from "react-router-dom"; // <-- add useLocation
import { AuthContext } from '../../context/AuthContext';
import TutorialModal from "../TutorialModal/TutorialModal"; // <-- import your modal

export default function TopNav() {
  const navigate = useNavigate();
  const location = useLocation(); // <-- to check current path
  const { token, logout } = useContext(AuthContext);

  const [show, setShow] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const isGuest = user?.role === "guest";

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY && currentScrollY > 10) {
        setShow(false); // hide nav
      } else {
        setShow(true); // show nav
      }
      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  const handleNavigation = (path) => {
    navigate(path);
  };

  const handleAuthClick = () => {
    if (token) {
      logout();
      navigate("/");
    } else {
      handleNavigation("/login");
    }
  };


  return (
    <div className="topnav-container">
      <nav className={`nav ${show ? "nav--visible" : "nav--hidden"}`}>
        <div onClick={() => handleNavigation("/")} className="logo">GeoGuessr</div>
        <ul className="nav-links">
          {token && (location.pathname.startsWith("/leaderboard") || location.pathname.startsWith("/profile")) && (
            <li><div onClick={() => handleNavigation("/game")} className="link2">
              Start Playing
            </div></li>
          )}
          {location.pathname.startsWith("/game") && (
            <li><div onClick={() => handleNavigation("/tutorial")} className="link2">
              View Tutorial
            </div></li>
          )}
        </ul>


        <ul className="nav-links">
          <li><div onClick={() => handleNavigation("/leaderboard")} className="link">Leaderboard</div></li>

          {token && !isGuest && (
            <li>
              <div onClick={() => handleNavigation("/profile")} className="link">
                Profile
              </div>
            </li>
          )}

          {/* Show Tutorial only when on ImageViewer route */}

          <li>
            <div onClick={handleAuthClick} className="link">
              {token ? "Logout" : "Login/Register"}
            </div>
          </li>
        </ul>
      </nav>
    </div>
  );
}
