import { useState, useEffect, useCallback, useRef } from "react";
import "./ImageViewer.css";
import MapWidget from "../MapWidget/MapWidget";
import Profile from "../Profile/Profile";
import Leaderboard from "../Leaderboard/Leaderboard";

export default function ImageViewer({ setDifficulty, difficulty }) {
  const restoredRef = useRef(false); // ensure we only restore/pick once

  const [nodes, setNodes] = useState([]);
  const [currentNode, setCurrentNode] = useState(null);
  const [currentNodePosition, setCurrentNodePosition] = useState(null);
  const [initialFloor, setInitialFloor] = useState(null);
  const [startNode, setStartNode] = useState(null);
  const [showProfile, setShowProfile] = useState(false);
  const [showLeaderBoard, setShowLeaderBoard] = useState(false);
  const [score, setScore] = useState(0);

  const [showDifficultyModal, setShowDifficultyModal] = useState(true);

  // --- NEW: difficulty config used for the explainer tabs
  const DIFFICULTY = {
    easy: { scaleMeters: 25, floorPenalty: 15, maxPoints: 30 },
    medium: { scaleMeters: 12, floorPenalty: 25, maxPoints: 60 },
    hard: { scaleMeters: 6, floorPenalty: 40, maxPoints: 100 },
  };

  // --- NEW: explainer collapse + tabs state
  const [explainerOpen, setExplainerOpen] = useState(false);
  const [explainerTab, setExplainerTab] = useState("easy");

  const difficultyObject = {
    1: "Easy",
    2: "Medium",
    3: "Hard"
  };



  const updateScore = () => {
    const user = JSON.parse(localStorage.getItem("user") || "null");
    const isGuest = user?.role === "guest";
    const token = localStorage.getItem("token");
    if (isGuest) {
      fetch(`${process.env.REACT_APP_SERVER_URL}/api/guest-scores`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => {
          setScore(data.totalScore || 0);
        })
        .catch(err => console.error(err));
    }
    else {

      if (token) {
        fetch(`${process.env.REACT_APP_SERVER_URL}/api/score`, {
          headers: { Authorization: `Bearer ${token}` }
        })
          .then(res => res.json())
          .then(data => setScore(data.totalScore || 0))
          .catch(err => console.error(err));
      }
    }
  };

  // FIX: only run on mount
  useEffect(() => {
    updateScore();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectDifficulty = (level) => {
    setDifficulty(level);
    setShowDifficultyModal(false);
  };

  useEffect(() => {
    if (difficulty) {
      selectDifficulty(difficulty);
    }
  }, [difficulty]);

  useEffect(() => {
    fetch("/data/nodes.json")
      .then((res) => res.json())
      .then((data) => setNodes(data));
  }, []);

  const getRandomNode = useCallback(() => {
    if (nodes.length === 0) return;
    const randomIndex = Math.floor(Math.random() * nodes.length);
    const randomNode = nodes[randomIndex];
    setCurrentNode(randomNode);
    setStartNode(randomNode);
    setCurrentNodePosition(randomNode.coords);
    setInitialFloor(randomNode.floor);
  }, [nodes]);

  // --- NEW: restore node if exists ---
  useEffect(() => {
    if (!nodes.length || restoredRef.current) return;

    const saved = sessionStorage.getItem("gv_currentNode");
    if (saved) {
      try {
        const { node, floor } = JSON.parse(saved);
        const match = nodes.find(n => n.node === node && n.floor === floor);
        if (match) {
          setCurrentNode(match);
          setStartNode(match);
          setCurrentNodePosition(match.coords);
          setInitialFloor(match.floor);
          restoredRef.current = true;
          return;
        }
      } catch { }
    }
    if (difficulty) {
      getRandomNode();
      restoredRef.current = true;
    }
  }, [nodes, difficulty, getRandomNode]);

  // --- NEW: save node whenever it changes ---
  useEffect(() => {
    if (currentNode) {
      sessionStorage.setItem(
        "gv_currentNode",
        JSON.stringify({ node: currentNode.node, floor: currentNode.floor })
      );
    }
  }, [currentNode]);

  const handleMove = useCallback(
    (direction) => {
      if (!currentNode) return;

      if (difficulty === 3) return; // Hard = no nav
      if (difficulty === 2 && currentNode.node !== startNode.node) return; // Medium restriction

      const nextNodeId = currentNode.links[direction];
      if (!nextNodeId) return;

      const matches = nodes.filter((n) => n.node === nextNodeId);
      const nextNode = matches.find((n) => n.floor === initialFloor);

      if (nextNode) {
        setCurrentNode(nextNode);
        setCurrentNodePosition(nextNode.coords);
      }
    },
    [currentNode, nodes, initialFloor, difficulty, startNode]
  );

  const handleReset = () => {
    if (startNode) {
      setCurrentNode(startNode);
      setCurrentNodePosition(startNode.coords);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "ArrowLeft") handleMove("left");
      if (e.key === "ArrowRight") handleMove("right");
      if (e.key === "ArrowUp") handleMove("front");
      if (e.key === "ArrowDown") handleMove("back");
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleMove]);

  if (showDifficultyModal) {
    return (
      <div className="modal-overlay">
        <div className="modal">
          <h2>Select Difficulty</h2>

          <div className="sub-button" onClick={() => { selectDifficulty(1); getRandomNode(); }}>
            <div>Easy</div>
            <div>Move anywhere and look around</div>
          </div>

          <div className="sub-button" onClick={() => { selectDifficulty(2); getRandomNode(); }}>
            <div>Medium</div>
            <div>Move only one step</div>
          </div>

          <div className="sub-button" onClick={() => { selectDifficulty(3); getRandomNode(); }}>
            <div>Hard</div>
            <div>Cannot move anywhere</div>
          </div>
        </div>
      </div>
    );
  }

  if (!currentNode) return <p>Loading...</p>;
  if (showProfile) return <Profile onClose={() => setShowProfile(false)} />;
  if (showLeaderBoard) return <Leaderboard onClose={() => setShowLeaderBoard(false)} />;

  const imagePath = `/assets/floor/floor${currentNode.floor}_node${currentNode.node}.jpg`;

  // helper for active tab values
  const activeCfg =
    DIFFICULTY[explainerTab] || DIFFICULTY.easy;

  return (
    <div className="image-viewer-wrapper">
      <div className="image-viewer-container">
        <div className="top-bar">
          <div className="difficulty">Current Difficulty: {difficultyObject[difficulty]}</div>
          <div onClick={() => setShowDifficultyModal(true)} className="start-button">Change Difficulty</div>
          <div className="difficulty">Score: {score}</div>
          <div onClick={handleReset} className="start-button">Reset Viewpoint</div>
        </div>

        <div className="sub-container">
          <div className="image-container">
            <img
              src={imagePath}
              alt={`Floor${currentNode.floor}_Node${currentNode.node}`}
              className="image-viewer"
            />

            <div className="controls">
              {difficulty !== 3 && (
                <>
                  {currentNode.links.left && (difficulty !== 2 || currentNode.node === startNode.node) && (
                    <div className="left" onClick={() => handleMove("left")}></div>
                  )}
                  {currentNode.links.front && (difficulty !== 2 || currentNode.node === startNode.node) && (
                    <div className="front" onClick={() => handleMove("front")}></div>
                  )}
                  {currentNode.links.right && (difficulty !== 2 || currentNode.node === startNode.node) && (
                    <div className="right" onClick={() => handleMove("right")}></div>
                  )}
                  {currentNode.links.back && (difficulty !== 2 || currentNode.node === startNode.node) && (
                    <div className="back" onClick={() => handleMove("back")}></div>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="description-game">When you are ready to make your guess, click on the map and submit!</div>
          <div className="map-widget">
            <MapWidget
              currentNodePosition={currentNodePosition}
              currentFloor={currentNode.floor}
              getRandomNode={getRandomNode}
              difficulty={difficulty}
              updateScore={updateScore}
            />
          </div>
        </div>
      </div>

      {/* --- Collapsible Scoring Explainer with Tabs --- */}
      <div className={`scoring-explainer ${explainerOpen ? "open" : ""}`}>
        <button
          className="scoring-header"
          onClick={() => setExplainerOpen(v => !v)}
          aria-expanded={explainerOpen}
          aria-controls="scoring-panel"
        >
          <span>📊 Scoring Model</span>
          <span className={`chev ${explainerOpen ? "rot" : ""}`} aria-hidden>▸</span>
        </button>

        {explainerOpen && (
          <div id="scoring-panel" className="scoring-body">
            <p className="muted">
              Your score depends on how close your guess is to the real location <em>and</em> floor:
            </p>
            <ul className="bullets">
              <li><b>Perfect Snap:</b> Exact floor & within 3m → full points.</li>
              <li><b>Difficulty:</b> Changes max points and harshness.</li>
            </ul>

            <div className="tabs" role="tablist" aria-label="Difficulty">
              {["easy", "medium", "hard"].map(key => (
                <button
                  key={key}
                  role="tab"
                  aria-selected={explainerTab === key}
                  className={`tab ${explainerTab === key ? "active" : ""}`}
                  onClick={() => setExplainerTab(key)}
                >
                  {key[0].toUpperCase() + key.slice(1)}
                </button>
              ))}
            </div>

            <div className="tab-panel" role="tabpanel">
              <div className="grid">
                <div>
                  <div className="label">Tolerance Scale</div>
                  <div className="value">{activeCfg.scaleMeters} m</div>
                  <div className="hint">Bigger = gentler decay</div>
                </div>
                <div>
                  <div className="label">Floor Penalty</div>
                  <div className="value">{activeCfg.floorPenalty} m</div>
                  <div className="hint">Added per wrong floor</div>
                </div>
                <div>
                  <div className="label">Max Points</div>
                  <div className="value">{activeCfg.maxPoints}</div>
                  <div className="hint">Perfect snap on correct floor</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      {/* --- /explainer --- */}
    </div>
  );
}
