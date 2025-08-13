import { useState, useEffect, useCallback } from "react";
import "./ImageViewer.css";
import { useLocation } from "react-router-dom";
import MapWidget from "../MapWidget/MapWidget";
import Profile from "../Profile/Profile";
import Leaderboard from "../Leaderboard/Leaderboard";
import { useNavigate } from "react-router-dom";

export default function ImageViewer() {
  const [nodes, setNodes] = useState([]);
  const [currentNode, setCurrentNode] = useState(null);
  const [currentNodePosition, setCurrentNodePosition] = useState(null);
  const [initialFloor, setInitialFloor] = useState(null);
  const [startNode, setStartNode] = useState(null);
  const [showProfile, setShowProfile] = useState(false);
  const [showLeaderBoard, setShowLeaderBoard] = useState(false);
  const [difficultyClicked, setDifficultyClicked] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();


  // Parse query parameters
  const queryParams = new URLSearchParams(location.search);
  const difficulty = queryParams.get("difficulty");


  const changeDifficulty = (newDifficulty) => {
    setDifficultyClicked(false);
    const params = new URLSearchParams(location.search);
    params.set("difficulty", newDifficulty);

    navigate(`/game?${params.toString()}`, { replace: true });
  };


  useEffect(() => {
    fetch("/data/nodes.json")
      .then((res) => res.json())
      .then((data) => {
        setNodes(data);
      });
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

  useEffect(() => {
    if (nodes.length > 0) {
      getRandomNode();
    }
  }, [nodes, getRandomNode, difficulty]);


  const handleMove = useCallback(
    (direction) => {
      if (!currentNode) return;

      if (difficulty === "3") {
        // Hard - no navigation allowed
        return;
      }

      if (difficulty === "2") {
        // Medium - allow navigation only if currentNode is the startNode
        if (currentNode.node !== startNode.node) {
          return; // block navigation after first move
        }
      }

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

  if (!currentNode) return <p>Loading...</p>;

  const imagePath = `/assets/floor/floor${currentNode.floor}_node${currentNode.node}.jpg`;

  if (!currentNode) return <p>Loading...</p>;

  if (showProfile) return <Profile onClose={() => setShowProfile(false)} />;
  if (showLeaderBoard) return <Leaderboard onClose={() => setShowLeaderBoard(false)} />;

  const difficultyObject = {
    1: "Easy",
    2: "Medium",
    3: "Hard"
  }

  return (
    <div className="image-viewer-container">
      <div className="top-bar">
        <div className="difficulty">Difficulty: {difficultyObject[difficulty] || "Easy"}</div>
        {!difficultyClicked && (
          <div onClick={() => setDifficultyClicked(true)} className="start-button">Change Difficulty</div>
        )}
        {difficultyClicked && (
          <div onClick={() => { changeDifficulty(1) }} className="start-button">Easy</div>
        )}
        {difficultyClicked && (
          <div onClick={() => { changeDifficulty(2) }} className="start-button">Medium</div>
        )}
        {difficultyClicked && (
          <div onClick={() => { changeDifficulty(3) }} className="start-button">Hard</div>
        )}
        <div onClick={handleReset} className="start-button">Go Back to Start</div>
      </div>
      <div className="sub-container">
        <div className="image-container">
          <img
            src={imagePath}
            alt={`Floor${currentNode.floor}_Node${currentNode.node}`}
            className="image-viewer"
          />

          <div className="controls">
            {difficulty !== "3" && ( // no arrows at all in Hard mode
              <>
                {currentNode.links.left && (difficulty !== "2" || currentNode.node === startNode.node) && (
                  <div className="left" onClick={() => handleMove("left")}></div>
                )}
                {currentNode.links.front && (difficulty !== "2" || currentNode.node === startNode.node) && (
                  <div className="front" onClick={() => handleMove("front")}></div>
                )}
                {currentNode.links.right && (difficulty !== "2" || currentNode.node === startNode.node) && (
                  <div className="right" onClick={() => handleMove("right")}></div>
                )}
                {currentNode.links.back && (difficulty !== "2" || currentNode.node === startNode.node) && (
                  <div className="back" onClick={() => handleMove("back")}></div>
                )}
              </>
            )}
          </div>

        </div>

        <div className="description-game">When you are ready to make your guess, click on the map and submit!</div>
        <div className="map-widget">
          <MapWidget currentNodePosition={currentNodePosition} currentFloor={currentNode.floor} getRandomNode={getRandomNode} difficulty={difficulty} />

          {/* <MapWidgetNew nodes={nodes} currentNodePosition={currentNodePosition} currentFloor={currentNode.floor} getRandomNode={getRandomNode} /> */}

        </div>
      </div>
    </div>
  )
}
