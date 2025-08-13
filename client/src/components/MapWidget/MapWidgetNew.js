import React, { useState } from "react";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";

// Convert lat/lng to pixel coordinates based on floorplan bounds & size
function latLngToPixels(lat, lng, bounds, imageWidth, imageHeight) {
  const { north, south, east, west } = bounds;

  const fracX = (lng - west) / (east - west);
  const fracY = (north - lat) / (north - south);

  const x = fracX * imageWidth;
  const y = fracY * imageHeight;

  return { x, y };
}

export default function MapWidgetNew({ nodes, currentNode, currentFloor, onSubmit }) {
  const floorLabels = ["G", "0.5", "1", "2"];
  const [floor, setFloor] = useState(currentFloor);
  const [selectedCoords, setSelectedCoords] = useState(null);

  // Bounds for each floor (from your GroundOverlay settings)
  const floorBounds = {
    1: { // floor 1 example
      north: 53.467935406104154,
      south: 53.46695188222461,
      east: -2.232878657644262,
      west: -2.235417349432684
    },
    // Add bounds for other floors here...
  };

  // Floorplan image dimensions (pixels)
  const imageDimensions = {
    1: { width: 2000, height: 1500 }, // change to match your actual image
    // Add dimensions for other floors...
  };

  const handleImageClick = (e) => {
    const rect = e.target.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setSelectedCoords({ x, y });
  };

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      
      {/* Floor switcher */}
      <div style={{
        position: "absolute", top: "1rem", left: "1rem", zIndex: 10,
        background: "white", padding: "0.5rem", borderRadius: "0.5rem"
      }}>
        {floorLabels.map((label, idx) => (
          <button
            key={label}
            onClick={() => setFloor(idx + 1)}
            style={{
              background: floor === idx + 1 ? "#1d4ed8" : "#f3f4f6",
              color: floor === idx + 1 ? "white" : "#1d4ed8",
              margin: "0.25rem",
              border: "1px solid #1d4ed8",
              padding: "0.25rem 0.5rem",
              borderRadius: "4px"
            }}
          >
            Floor {label}
          </button>
        ))}
      </div>

      {/* Zoom & Pan wrapper */}
      <TransformWrapper minScale={0.5} maxScale={3}>
        <TransformComponent>
          <div style={{ position: "relative" }}>
            {/* Floorplan image */}
            <img
              src={`/floorplans/floor${floor}.png`}
              alt={`Floor ${floor}`}
              style={{ width: "100%", height: "auto", display: "block" }}
              onClick={handleImageClick}
            />

            {/* Nodes as markers */}
            {nodes
              .filter(node => Number(node.floor) === floor)
              .map(node => {
                const { width, height } = imageDimensions[floor];
                const bounds = floorBounds[floor];
                const { x, y } = latLngToPixels(
                  parseFloat(node.latitude),
                  parseFloat(node.longitude),
                  bounds,
                  width,
                  height
                );

                return (
                  <div
                    key={node.node}
                    style={{
                      position: "absolute",
                      left: `${x}px`,
                      top: `${y}px`,
                      width: "10px",
                      height: "10px",
                      background: node.node === currentNode ? "red" : "blue",
                      borderRadius: "50%",
                      transform: "translate(-50%, -50%)"
                    }}
                  />
                );
              })}
            
            {/* Selected guess marker */}
            {selectedCoords && (
              <div
                style={{
                  position: "absolute",
                  left: `${selectedCoords.x}px`,
                  top: `${selectedCoords.y}px`,
                  width: "12px",
                  height: "12px",
                  background: "yellow",
                  border: "2px solid black",
                  borderRadius: "50%",
                  transform: "translate(-50%, -50%)"
                }}
              />
            )}
          </div>
        </TransformComponent>
      </TransformWrapper>

      {/* Submit button */}
      <button
        onClick={() => onSubmit(selectedCoords, floor)}
        style={{
          position: "absolute", bottom: "1rem", left: "50%",
          transform: "translateX(-50%)",
          background: "#1d4ed8", color: "white",
          padding: "0.5rem 1rem", borderRadius: "4px"
        }}
      >
        Submit Guess
      </button>
    </div>
  );
}
