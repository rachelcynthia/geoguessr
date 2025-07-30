import { useEffect, useRef } from 'react';

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
  getRandomNode
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
        distance_meters: adjustedDistance
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
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <h2>Distance Result</h2>

        {!isCorrectFloor ? (
          <p style={{ color: "red" }}>
            You chose the <strong>wrong floor</strong> (guessed: Floor {floorLabels[guessedFloor]}, actual: Floor {floorLabels[currentFloor]})!
          </p>
        ) : (
          <p style={{ color: "green" }}>
            You selected the <strong>correct floor</strong>!
          </p>
        )}

        <p>
          Base distance: <strong>{distance}m</strong><br />
          Floor penalty: {floorDiff * penaltyPerFloor}m<br />
          <strong>Total distance: {adjustedDistance}m</strong>
        </p>

        <button onClick={onClose}>Close</button>
      </div>
    </div>
  );
};

const styles = {
  overlay: {
    position: 'fixed',
    top: 0, left: 0,
    width: '100%', height: '100%',
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex', justifyContent: 'center', alignItems: 'center'
  },
  modal: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '10px',
    textAlign: 'center'
  }
};

export default SubmitModal;
