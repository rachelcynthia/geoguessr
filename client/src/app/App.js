import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useEffect, useState, useMemo, useRef } from "react";
import { initParticlesEngine } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";
import Particles from "@tsparticles/react";

import { AuthProvider } from "../context/AuthContext";
import { UserProvider } from "../context/UserContext";
import LandingPage from "../components/LandingPage/LandingPage";
import PrivateRoute from "../components/PrivateRoute/PrivateRoute";
import Login from "../components/Login/Login";
import Register from "../components/Register/Register";
import Game from "../components/ImageViewer/ImageViewer";
import ProfilePage from "../components/Profile/Profile";
import Leaderboard from "../components/Leaderboard/Leaderboard";
import TopNav from "../components/TopNav/TopNav";
import "./App.css";

const App = () => {
  const [init, setInit] = useState(false);
  const navRef = useRef(null);

  const [contentHeight, setContentHeight] = useState("100vh");

  useEffect(() => {
    const updateHeight = () => {
      if (navRef.current) {
        const navHeight = navRef.current.offsetHeight;
        setContentHeight(`${window.innerHeight - navHeight}px`);
      }
    };

    updateHeight(); // run on mount
    window.addEventListener("resize", updateHeight); // run on resize

    return () => window.removeEventListener("resize", updateHeight);
  }, []);


  // this should be run only once per application lifetime
  useEffect(() => {
    initParticlesEngine(async (engine) => {
      await loadSlim(engine);
    }).then(() => {
      setInit(true);
    });
  }, []);

  const options = useMemo(
    () => ({
      background: {
        color: {
          value: "#1ecbe1",
        },
        image: "url('/assets/background/kilburn.jpg')", // your image path
        position: "50% 50%",  // center the image
        repeat: "no-repeat",  // no tiling
        size: "cover",         // fill the screen
        opacity: 0.5, // optional, adjust as needed
      },
      fpsLimit: 120,
      interactivity: {
        events: {
          onClick: {
            enable: false,
            mode: "push",
          },
          onHover: {
            enable: true,
            mode: "repulse",
          },
        },
        modes: {
          push: {
            quantity: 20,
          },
          repulse: {
            distance: 100,
            duration: 0.4,
          },
        },
      },
      particles: {
        color: {
          value: "#fff",
        },
        links: {
          color: "#fff",
          distance: 150,
          enable: true,
          opacity: 0.5,
          width: 1,
        },
        move: {
          direction: "none",
          enable: true,
          outModes: {
            default: "bounce",
          },
          random: false,
          speed: 3,
          straight: false,
        },
        number: {
          density: {
            enable: true,
          },
          value: 500,
        },
        opacity: {
          value: 0.5,
        },
        shape: {
          type: "circle",
        },
        size: {
          value: { min: 1, max: 1 },
        },
      },
      detectRetina: true,
    }),
    [],
  );


  return (
    <AuthProvider>
      <UserProvider>
      <Router>
        <div className="app-container">
          <div ref={navRef}>
          <TopNav />

          </div>
          {init && (
            <div id="tsparticles">
              <Particles
                options={options}
              />
            </div>)}
          <div className="route-container">
            <Routes>
              <Route path="/" element={<LandingPage init={init} />} />
              <Route path="/login" element={<Login init={init} />} />
              <Route path="/register" element={<Register init={init} />} />
              <Route
                path="/game"
                element={
                  <PrivateRoute>
                    <Game />
                  </PrivateRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <PrivateRoute>
                    <ProfilePage contentHeight={contentHeight}/>
                  </PrivateRoute>
                }
              />
              <Route
                path="/leaderboard"
                element={
                  <PrivateRoute>
                    <Leaderboard />
                  </PrivateRoute>
                }
              />
            </Routes>
          </div>
        </div>
      </Router>
      </UserProvider>
    </AuthProvider>
    
  );

}
export default App;