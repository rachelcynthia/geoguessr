import { useEffect, useRef } from 'react';
import './SubmitModal.css';

function calculateDistance(pos1, pos2) {
  const deltaX = pos2.lng - pos1.lng;
  const deltaY = pos2.lat - pos1.lat;
  return Math.round(Math.sqrt(deltaX ** 2 + deltaY ** 2) * 111000);
}

const parseLatLngString = (latLngStr) => {
  const [latStr, lngStr] = latLngStr.split(',').map(s => s.trim());
  return { lat: parseFloat(latStr), lng: parseFloat(lngStr) };
};

const SubmitModal = ({
  currentNodePosition,
  selectedCoords,
  setIsSubmitClicked,
  currentFloor,
  guessedFloor,
  getRandomNode,
  difficulty
}) => {
  const currentPosParsed = parseLatLngString(currentNodePosition || "");
  const distance = currentNodePosition && selectedCoords
    ? calculateDistance(currentPosParsed, selectedCoords)
    : 0;

  const submittedRef = useRef(false);

  const floorDiff = Math.abs((currentFloor || 0) - (guessedFloor || 0));
  const penaltyPerFloor = 25;
  const adjustedDistance = distance + floorDiff * penaltyPerFloor;

  useEffect(() => {
    if (submittedRef.current) return;
    submittedRef.current = true;

    if (!currentNodePosition || !selectedCoords) return;

    const token = localStorage.getItem("token");
    if (!token) return;

    fetch("http://localhost:3001/api/submit", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        guessed_lat: selectedCoords.lat,
        guessed_lng: selectedCoords.lng,
        actual_lat: currentPosParsed.lat,
        actual_lng: currentPosParsed.lng,
        guessed_floor: guessedFloor,
        actual_floor: currentFloor,
        distance_meters: adjustedDistance,
        score: adjustedDistance <= 10 ? 10 * Number(difficulty) : 0
      })
    }).then(res => {
      if (!res.ok) {
        console.error("Failed to submit result");
      }
    }).catch(err => console.error(err));
  }, [currentNodePosition, selectedCoords, currentPosParsed, guessedFloor, currentFloor, adjustedDistance]);

  if (!currentNodePosition || !selectedCoords) return null;

  const floorLabels = {
    1: 'G',
    2: 0.5,
    3: 1,
    4: 2
  };

  const isCorrectFloor = floorDiff === 0;

  const onClose = () => {
    setIsSubmitClicked(false);
    if (getRandomNode) {
      getRandomNode();
    }
  };

  return (
    <div className="results-overlay">
      <div className="results-modal">
        <div className='results'>Results</div>
        {adjustedDistance <= 10 && (
          <div className='success-message'>
            Congratulations! You guessed the location within 10 meters!
          </div>
        )}

        {adjustedDistance > 10 && (
          <div className='failure-message'>
            You did not guess the correct location. Better luck next time!
          </div>
        )}
        {!isCorrectFloor ? (
          <div className='floor-incorrect-message'>
            You chose the <strong>wrong floor</strong> (guessed: Floor {floorLabels[guessedFloor]}, actual: Floor {floorLabels[currentFloor]})!
          </div>
        ) : (
          <div className='floor-correct-message'>
            You selected the <strong>correct floor</strong>
          </div>
        )}
        <div className='distance-result'>
          Base distance: <strong>{distance}m</strong><br />
          Floor penalty: {floorDiff * penaltyPerFloor}m<br />
          <strong>Total distance: {adjustedDistance}m</strong>
        </div>
        <div className="close-button" onClick={onClose}>Close</div>
      </div>
    </div>
  );
};

export default SubmitModal;
