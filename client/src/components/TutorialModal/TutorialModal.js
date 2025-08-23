import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./TutorialModal.css";

export default function TutorialModal({ onClose }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const navigate = useNavigate();

  const images = [
    "assets/tutorial/1.png",
    "assets/tutorial/2.png",
    "assets/tutorial/3.png",
    "assets/tutorial/4.png",
    "assets/tutorial/5.png",
    "assets/tutorial/6.png"
  ];

  const handleNext = () => {
    if (currentIndex < images.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      navigate("/game");
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  return (
    <div className="tutorial-backdrop">
      <div className="tutorial-modal">
        {/* Close button */}
        <button className="tutorial-close" onClick={() => navigate("/game")}>
          ✕
        </button>

        <img
          src={images[currentIndex]}
          alt={`Tutorial step ${currentIndex + 1}`}
          className="tutorial-image"
        />

        <div className="tutorial-controls">
          <div
            className="tutorial-btn"
            onClick={handlePrev}
            style={{ opacity: currentIndex === 0 ? 0.5 : 1, pointerEvents: currentIndex === 0 ? "none" : "auto" }}
          >
            Previous
          </div>
          <span>
            {currentIndex + 1} / {images.length}
          </span>
          <div className="tutorial-btn" onClick={handleNext}>
            {currentIndex === images.length - 1 ? "Go To Game" : "Next"}
          </div>
        </div>
      </div>
    </div>
  );
}
