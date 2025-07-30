import React, { useEffect, useRef, useState, useCallback } from "react";
import { Loader } from "@googlemaps/js-api-loader";
import SubmitModal from "../SubmitModal/SubmitModal";

export default function MapWidget({ currentNodePosition, currentFloor, getRandomNode }) {

  const zoom = 18;
  const minZoom = 15;
  const maxZoom = 20;
  const lat = 53.4675254;
  const lng = -2.234003;
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markerRef = useRef(null);
  const overlayRef = useRef(null);

  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedCoords, setSelectedCoords] = useState({ lat, lng });
  const [isSubmitClicked, setIsSubmitClicked] = useState(false);
  const [floor, setFloor] = useState(1);
  const floorLabels = ["G", "0.5", "1", "2"];



  const loadOverlay = useCallback((floorNumber) => {
    const imageBounds = {
      north: 53.467935406104154,
      south: 53.46695188222461,
      east: -2.232878657644262,
      west: -2.235417349432684
    };

    if (!mapInstance.current) return;

    if (overlayRef.current) {
      overlayRef.current.setMap(null);
    }

    const newOverlay = new window.google.maps.GroundOverlay(
      `/floorplans/floor${floorNumber}.png`,
      imageBounds
    );

    newOverlay.setMap(mapInstance.current);
    overlayRef.current = newOverlay;
  }, []);


  useEffect(() => {
    const loader = new Loader({
      apiKey: "AIzaSyA-rYDanrx7MAH-cPZLJff5CKhLn5L-Bm4",
      version: "weekly"
    });


    loader.load().then(() => {
      const center = { lat, lng };

      const map = new window.google.maps.Map(mapRef.current, {
        center,
        zoom,
        minZoom,
        maxZoom,
        disableDefaultUI: false,
        zoomControl: true,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false
      });

      mapInstance.current = map;

      // Marker
      const marker = new window.google.maps.Marker({
        position: center,
        map,
        draggable: true,
        title: "Drag me or click on the map to move me"
      });

      markerRef.current = marker;

      marker.addListener("dragend", (e) => {
        const lat = e.latLng.lat();
        const lng = e.latLng.lng();
        setSelectedCoords({ lat, lng });
      });

      map.addListener("click", (e) => {
        const lat = e.latLng.lat();
        const lng = e.latLng.lng();
        marker.setPosition({ lat, lng });
        setSelectedCoords({ lat, lng });
      });

      // Initial overlay
      loadOverlay(floor);
    });
  }, [floor, lng, loadOverlay]);

  // Reload overlay when floor changes
  useEffect(() => {
    if (window.google && mapInstance.current) {
      loadOverlay(floor);
    }
  }, [floor, loadOverlay]);

  const containerStyle = isExpanded
    ? {
      position: "fixed",
      bottom: "1rem",
      right: "1rem",
      width: "90vw",
      height: "60vh",
      zIndex: 1000,
      borderRadius: "0.5rem",
      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
      overflow: "hidden",
      backgroundColor: "white",
      display: "flex",
      flexDirection: "column"
    }
    : {
      position: "fixed",
      bottom: "1rem",
      right: "1rem",
      width: "160px",
      height: "120px",
      zIndex: 1000,
      borderRadius: "0.5rem",
      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
      overflow: "hidden",
      backgroundColor: "transparent",
      cursor: "pointer"
    };

  const handleSubmit = () => {
    console.log("Submitted Coordinates:", selectedCoords);
    setIsExpanded(false);
    setIsSubmitClicked(true);
  };

  return (
    <>
      {isExpanded && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            backdropFilter: "blur(5px)",
            WebkitBackdropFilter: "blur(5px)",
            zIndex: 999
          }}
        />
      )}
      <div
        style={containerStyle}
        onClick={!isExpanded ? () => setIsExpanded(true) : undefined}
      >
        {isExpanded && (
          <>
            {/* Close button */}
            <button
              onClick={() => setIsExpanded(false)}
              style={{
                position: "absolute",
                top: "0.5rem",
                right: "0.5rem",
                zIndex: 1001,
                backgroundColor: "white",
                border: "1px solid #ccc",
                borderRadius: "4px",
                padding: "0.25rem 0.5rem",
                cursor: "pointer"
              }}
            >
              ✕
            </button>

            {/* Submit button */}
            <button
              onClick={handleSubmit}
              style={{
                position: "absolute",
                bottom: "0.5rem",
                left: "50%",
                transform: "translateX(-50%)",
                zIndex: 1001,
                backgroundColor: "#1d4ed8",
                color: "white",
                border: "none",
                borderRadius: "4px",
                padding: "0.5rem 1rem",
                cursor: "pointer"
              }}
            >
              Submit
            </button>

            {/* Floor Switcher */}
            <div
              style={{
                position: "absolute",
                top: "1rem",
                left: "1rem",
                background: "white",
                borderRadius: "0.5rem",
                padding: "0.5rem",
                boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
                zIndex: 1001,
                display: "flex",
                flexDirection: "column",
                gap: "0.25rem"
              }}
            >
              {floorLabels.map((label, index) => {
                const floorNumber = index + 1;
                return (
                  <button
                    key={label}
                    onClick={() => setFloor(floorNumber)}
                    style={{
                      backgroundColor: floor === floorNumber ? "#1d4ed8" : "#f3f4f6",
                      color: floor === floorNumber ? "white" : "#1d4ed8",
                      border: "1px solid #1d4ed8",
                      borderRadius: "4px",
                      padding: "0.25rem 0.5rem",
                      cursor: "pointer"
                    }}
                  >
                    Floor {label}
                  </button>
                );
              })}
            </div>

          </>
        )}
        <div ref={mapRef} style={{ flexGrow: 1, width: "100%", height: "100%" }} />
      </div>

      {isSubmitClicked && (
        <SubmitModal
          currentNodePosition={currentNodePosition}
          selectedCoords={selectedCoords}
          setIsSubmitClicked={setIsSubmitClicked}
          currentFloor={currentFloor}
          guessedFloor={floor}
          getRandomNode={getRandomNode}
        />

      )}
    </>
  );
}
