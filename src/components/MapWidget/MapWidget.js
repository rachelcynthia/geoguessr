import React, { useEffect, useRef, useState } from "react";
import { Loader } from "@googlemaps/js-api-loader";
import SubmitModal from "../SubmitModal/SubmitModal";

export default function MapWidget({currentNodePosition}) {
  const lat = 53.4678
  const lng = -2.2339
  const zoom = 17
  const minZoom = 14
  const maxZoom = 20
  const mapRef = useRef(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedCoords, setSelectedCoords] = useState({ lat, lng });
  const [isSubmitClicked, setIsSubmitClicked] = useState(false);
  

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

      const marker = new window.google.maps.Marker({
        position: center,
        map,
        draggable: true,
        title: "Drag me or click on the map to move me"
      });

      marker.addListener("dragend", (e) => {
        const lat = e.latLng.lat();
        const lng = e.latLng.lng();
        console.log("Marker dragged to:", { lat, lng });
        setSelectedCoords({ lat, lng });
      });

      map.addListener("click", (e) => {
        const lat = e.latLng.lat();
        const lng = e.latLng.lng();
        marker.setPosition({ lat, lng });
        console.log("Map clicked at:", { lat, lng });
        setSelectedCoords({ lat, lng });
      });
    });
  }, [lat, lng, zoom, minZoom, maxZoom]);

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
        ></div>
      )}
      <div style={containerStyle} onClick={!isExpanded ? () => setIsExpanded(true) : undefined}>
        {isExpanded && (
          <>
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
          </>
        )}
        <div ref={mapRef} style={{ flexGrow: 1, width: "100%", height: "100%" }} />
      </div>
        {isSubmitClicked && (
          <SubmitModal currentNodePosition={currentNodePosition} selectedCoords= {selectedCoords} setIsSubmitClicked={setIsSubmitClicked}/>
        )}
    </>
  );
}
