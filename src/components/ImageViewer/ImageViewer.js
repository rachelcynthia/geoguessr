import { useState, useEffect, useCallback } from "react";
import "./ImageViewer.css";
import MapWidget from "../MapWidget/MapWidget";

export default function ImageViewer() {
  const [nodes, setNodes] = useState([]);
  const [currentNode, setCurrentNode] = useState(null);
  const [currentNodePosition, setCurrentNodePosition] = useState(null);

  useEffect(() => {
    fetch("/data/nodes.json")
      .then((res) => res.json())
      .then((data) => {
        setNodes(data);
        const randomIndex = Math.floor(Math.random() * data.length);
        setCurrentNode(data[randomIndex]);
        setCurrentNodePosition(data[randomIndex].coords)
      });
  }, []);


  const handleMove = useCallback(
    (direction) => {
      if (!currentNode) return;
      const nextNodeId = currentNode.links[direction];
      if (!nextNodeId) return;
      const nextNode = nodes.find((n) => n.node === nextNodeId);
      if (nextNode) setCurrentNode(nextNode);
    },
    [currentNode, nodes]
  );

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

  return (
    <div className="container">
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
        <MapWidget currentNodePosition={currentNodePosition} />
      </div>
    </div>
  );
}