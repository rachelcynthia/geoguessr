import './TopNav.css';
import { useContext, useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import { AuthContext } from '../../context/AuthContext';
import UserContext from '../../context/UserContext';

export default function TopNav() {
  const navigate = useNavigate();
  const { token, logout } = useContext(AuthContext);
  const [setUser] = useContext(UserContext);

  const [show, setShow] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY > lastScrollY && currentScrollY > 10) {
        // Scrolling down & passed 50px, hide nav
        setShow(false);
      } else {
        // Scrolling up, show nav
        setShow(true);
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
      setUser(null); // Clear user context
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
          <li><div onClick={() => handleNavigation("/leaderboard")} className="link">Leaderboard</div></li>
          {token && (
            <li>
              <div onClick={() => handleNavigation("/profile")} className="link">
                Profile
              </div>
            </li>
          )}
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
