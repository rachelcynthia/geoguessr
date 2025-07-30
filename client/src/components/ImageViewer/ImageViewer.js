import { useState, useEffect, useCallback } from "react";
import "./ImageViewer.css";
import { useNavigate } from "react-router-dom";
import MapWidget from "../MapWidget/MapWidget";
import Profile from "../Profile/Profile";
import Leaderboard from "../Leaderboard/Leaderboard";

export default function ImageViewer() {
  const [nodes, setNodes] = useState([]);
  const [currentNode, setCurrentNode] = useState(null);
  const [currentNodePosition, setCurrentNodePosition] = useState(null);
  const [initialFloor, setInitialFloor] = useState(null);
  const [startNode, setStartNode] = useState(null);
  const [showProfile, setShowProfile] = useState(false);
  const [showLeaderBoard, setShowLeaderBoard] = useState(false);

  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
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
  }, [nodes, getRandomNode]);

  const handleMove = useCallback(
    (direction) => {
      if (!currentNode) return;

      const nextNodeId = currentNode.links[direction];
      if (!nextNodeId) return;

      const matches = nodes.filter((n) => n.node === nextNodeId);
      const nextNode = matches.find((n) => n.floor === initialFloor);

      if (nextNode) {
        setCurrentNode(nextNode);
        setCurrentNodePosition(nextNode.coords);
      }
    },
    [currentNode, nodes, initialFloor]
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

  const imagePath = `/assets/floor${currentNode.floor}_node${currentNode.node}.jpg`;

  if (!currentNode) return <p>Loading...</p>;

  if (showProfile) return <Profile onClose={() => setShowProfile(false)} />;
  if (showLeaderBoard) return <Leaderboard onClose={() => setShowLeaderBoard(false)} />;

  return (
    <div className="container">
      <div className="top-bar">
        <button onClick={() => setShowProfile(true)} className="reset-button">
          Profile
        </button>
        <button onClick={() => setShowLeaderBoard(true)} className="reset-button">
          Leaderboard
        </button>
        <button onClick={handleReset} className="reset-button">
          Go Back to Start
        </button>
        <button onClick={handleLogout} className="reset-button">
          Logout
        </button>

      </div>

      <img
        src={imagePath}
        alt={`Floor${currentNode.floor}_Node${currentNode.node}`}
        className="image-viewer"
      />
      <div className="controls">
        {currentNode.links.left && (
          <div className="left" onClick={() => handleMove("left")}>Left</div>
        )}
        {currentNode.links.front && (
          <div className="front" onClick={() => handleMove("front")}>Front</div>
        )}
        {currentNode.links.right && (
          <div className="right" onClick={() => handleMove("right")}>Right</div>
        )}
        {currentNode.links.back && (
          <div className="back" onClick={() => handleMove("back")}>Back</div>
        )}
        <p className="text-gray-500">
          Floor {currentNode?.floor} - Node {currentNode?.node}
        </p>
      </div>
      <div className="w-full md:w-96 h-96">
        <MapWidget currentNodePosition={currentNodePosition} currentFloor={currentNode.floor} getRandomNode={getRandomNode} />
      </div>
    </div>
  )
}
