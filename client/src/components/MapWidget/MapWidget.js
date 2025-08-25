import { useEffect, useRef, useState, useCallback } from "react";
import { Loader } from "@googlemaps/js-api-loader";
import SubmitModal from "../SubmitModal/SubmitModal";

export default function MapWidget({ currentNodePosition, currentFloor, getRandomNode, difficulty, updateScore }) {
  const zoom = 18;
  const minZoom = 16;
  const maxZoom = 25;
  const lat = 53.4675254;
  const lng = -2.234003;
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markerRef = useRef(null);
  const overlayRef = useRef(null);

  const widgetRef = useRef(null); // <--- track widget DOM
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedCoords, setSelectedCoords] = useState({ lat, lng });
  const [isSubmitClicked, setIsSubmitClicked] = useState(false);
  const [floor, setFloor] = useState(1);
  const [selectedFloor, setSelectedFloor] = useState(null);
  const floorLabels = ["G", "LF", "1", "2"];
  const [infoMessage, setInfoMessage] = useState("");
  const actualMarkerRef = useRef(null);
  const polylineRef = useRef(null);

  const loadOverlay = useCallback((floorNumber) => {
    const imageBounds = {
      north: 53.467935406104154,
      south: 53.46695188222461,
      east: -2.232878657644262,
      west: -2.235417349432684,
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
      apiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
      version: "weekly",
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
        fullscreenControl: false,
      });

      mapInstance.current = map;

      // Marker
      const marker = new window.google.maps.Marker({
        position: center,
        map,
        draggable: true,
        title: "Drag me or click on the map to move me",
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

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (isExpanded && widgetRef.current && !widgetRef.current.contains(e.target)) {
        setIsExpanded(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isExpanded]);

  const containerStyle = isExpanded
    ? {
      position: "fixed",
      bottom: "1rem",
      right: "1rem",
      width: "38vw",
      height: "60vh",
      zIndex: 1001,
      borderRadius: "0.5rem",
      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
      overflow: "hidden",
      backgroundColor: "white",
      display: "flex",
      flexDirection: "column",
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
      cursor: "pointer",
    };
  const parseCoords = (coordsStr) => {
    if (!coordsStr) return null;
    const [latStr, lngStr] = coordsStr.split(",").map(s => s.trim());
    return { lat: parseFloat(latStr), lng: parseFloat(lngStr) };
  };

  const handleSubmit = () => {
    setSelectedFloor(floor);
    const actualCoords = parseCoords(currentNodePosition);

    if (mapInstance.current && actualCoords) {
      // ❌ Always clean up before adding new stuff
      if (actualMarkerRef.current) {
        actualMarkerRef.current.setMap(null);
        actualMarkerRef.current = null;
      }
      if (polylineRef.current) {
        polylineRef.current.setMap(null);
        polylineRef.current = null;
      }

      if (Number(floor) === Number(currentFloor)) {
        // ✅ Same floor
        markerRef.current.setPosition(selectedCoords);

        const actualMarker = new window.google.maps.Marker({
          position: actualCoords,
          map: mapInstance.current,
          icon: { url: "http://maps.google.com/mapfiles/ms/icons/green-dot.png" },
          title: "Actual Location",
        });
        actualMarkerRef.current = actualMarker;

        const polyline = new window.google.maps.Polyline({
          path: [selectedCoords, actualCoords],
          geodesic: true,
          strokeColor: "#000000ff",
          strokeOpacity: 1.0,
          strokeWeight: 5,
        });
        polyline.setMap(mapInstance.current);
        polylineRef.current = polyline;

        setInfoMessage("");
      } else {
        // ❌ Wrong floor
        setInfoMessage(`Actual location is on Floor ${floorLabels[Number(currentFloor) - 1]}`);
        setFloor(currentFloor);

        setTimeout(() => {
          // re-add markers after overlay reload
          if (markerRef.current) {
            markerRef.current.setPosition(selectedCoords);
            markerRef.current.setMap(mapInstance.current);
          }

          const actualMarker = new window.google.maps.Marker({
            position: actualCoords,
            map: mapInstance.current,
            icon: { url: "http://maps.google.com/mapfiles/ms/icons/green-dot.png" },
            title: "Actual Location",
          });
          actualMarkerRef.current = actualMarker;

          // 🔑 Only add polyline after clearing old one
          if (polylineRef.current) {
            polylineRef.current.setMap(null);
          }
          const polyline = new window.google.maps.Polyline({
            path: [selectedCoords, actualCoords],
            geodesic: true,
            strokeColor: "#000000ff",
            strokeOpacity: 1.0,
            strokeWeight: 5,
          });
          polyline.setMap(mapInstance.current);
          polylineRef.current = polyline;
        }, 300);
      }
    }

    setIsExpanded(true);
    setIsSubmitClicked(true);
  };

  // When resetting floor (even to the same value):


  const resetRound = () => {
    setInfoMessage("");

    // Reset floor back to Ground (G)
    setFloor(1);


    // Clear actual marker
    if (actualMarkerRef.current) {
      actualMarkerRef.current.setMap(null);
      actualMarkerRef.current = null;
    }

    // Clear polyline
    if (polylineRef.current) {
      polylineRef.current.setMap(null);
      polylineRef.current = null;
    }
  };



  return (
    <>
      {/* Backdrop when expanded */}
      {isExpanded && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.3)",
            zIndex: 1000,
          }}
        />
      )}

      <div
        ref={widgetRef}
        style={containerStyle}
        onClick={!isExpanded ? () => setIsExpanded(true) : undefined}
      >

        {infoMessage && isExpanded && (
          <div
            style={{
              position: "absolute",
              top: "0.5rem",
              left: "50%",
              transform: "translateX(-50%)",
              background: "rgba(0,0,0,0.7)",
              color: "white",
              padding: "0.3rem 0.6rem",
              borderRadius: "4px",
              fontSize: "0.8rem",
              zIndex: 1003,
            }}
          >
            {infoMessage}
          </div>
        )}

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
            zIndex: 1002,
            display: "flex",
            flexDirection: "column",
            gap: "0.25rem",
          }}
        >
          {isExpanded && (
            <div
              style={{
                marginBottom: "0.25rem",
                fontWeight: "bold",
                fontSize: "0.8rem",
              }}
            >
              Floor Switcher
            </div>
          )}
          {isExpanded &&
            floorLabels.map((label, index) => {
              const floorNumber = index + 1;
              return (
                <button
                  key={label}
                  onClick={() => setFloor(floorNumber)}
                  style={{
                    backgroundColor:
                      Number(floor) === floorNumber ? "#000000ff" : "#f3f4f6",
                    color: Number(floor) === floorNumber ? "white" : "#000000ff",
                    border: "1px solid #000000ff",
                    borderRadius: "4px",
                    padding: "0.25rem 0.5rem",
                    cursor: "pointer",
                    fontSize: "0.7rem",
                  }}
                >
                  Floor {label}
                </button>
              );
            })}
        </div>
        {isExpanded && !isSubmitClicked && (
          <>
            {/* Close button */}
            <button
              onClick={() => setIsExpanded(false)}
              style={{
                position: "absolute",
                top: "0.5rem",
                right: "0.5rem",
                zIndex: 1002,
                backgroundColor: "white",
                border: "1px solid #ccc",
                borderRadius: "4px",
                padding: "0.25rem 0.5rem",
                cursor: "pointer",
              }}
            >
              ✕
            </button>

            {isExpanded && !isSubmitClicked && (
              <button
                onClick={handleSubmit}
                style={{
                  position: "absolute",
                  bottom: "0.5rem",
                  left: "50%",
                  transform: "translateX(-50%)",
                  zIndex: 1002,
                  backgroundColor: "#000000ff",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  padding: "0.5rem 1rem",
                  cursor: "pointer",
                  fontSize: "1rem",
                }}
              >
                Submit
              </button>
            )}

          </>
        )}
        <div ref={mapRef} style={{ flexGrow: 1, width: "100%", height: "100%" }} />
      </div>

      {isSubmitClicked && (
        <SubmitModal
          currentNodePosition={currentNodePosition}
          selectedCoords={selectedCoords}
          setIsSubmitClicked={setIsSubmitClicked}
          currentFloor={selectedFloor}
          guessedFloor={floor}
          getRandomNode={getRandomNode}
          difficulty={difficulty}
          resetRound={resetRound}
          updateScore={updateScore}
        />
      )}
    </>
  );
}