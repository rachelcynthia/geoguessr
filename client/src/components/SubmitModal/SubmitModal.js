import { useEffect, useRef } from 'react';
import './SubmitModal.css';

/* ---------------- Distance + helpers ---------------- */
function calculateDistance(pos1, pos2) {
  const deltaX = pos2.lng - pos1.lng;
  const deltaY = pos2.lat - pos1.lat;
  // rough meters per degree at Manchester latitude
  return Math.round(Math.sqrt(deltaX ** 2 + deltaY ** 2) * 111000);
}

const parseLatLngString = (latLngStr) => {
  const [latStr, lngStr] = (latLngStr || "").split(',').map(s => s.trim());
  return { lat: parseFloat(latStr), lng: parseFloat(lngStr) };
};

/* ---------------- Scoring config ---------------- */
const DIFFICULTY = {
  easy: { scaleMeters: 25, floorPenalty: 15, maxPoints: 30 },
  medium: { scaleMeters: 12, floorPenalty: 25, maxPoints: 60 },
  hard: { scaleMeters: 6, floorPenalty: 40, maxPoints: 100 },
};

function normalizeDifficulty(difficulty) {
  const d = typeof difficulty === 'string' ? difficulty.toLowerCase() : difficulty;
  if (d === 'easy' || d === 1 || d === '1') return 'easy';
  if (d === 'medium' || d === 2 || d === '2') return 'medium';
  return 'hard';
}

const perfectRadius = 3;

/* ---------------- Scoring function ---------------- */
function calculateScore(distanceMeters, guessedFloor, actualFloor, difficulty) {
  const perfectRadius = 3;            // meters for "perfect snap"
  const curveP = 1.3;                 // 1 = gentler, 2 = harsher
  const correctFloorMultiplier = 1.05;
  const minPoints = 0;

  const diffKey = normalizeDifficulty(difficulty);
  const { scaleMeters, floorPenalty, maxPoints } = DIFFICULTY[diffKey];

  const gf = guessedFloor ?? 0;
  const af = actualFloor ?? 0;
  const floorDiff = Math.abs(gf - af);

  // Convert wrong-floor into extra "meters"
  const adjustedDistance = distanceMeters + floorDiff * floorPenalty;

  // Perfect snap: right floor & very close
  if (floorDiff === 0 && adjustedDistance <= perfectRadius) {
    return { score: maxPoints, adjustedDistance, floorPenaltyUsed: floorPenalty };
  }

  // Exponential decay
  const base = Math.exp(-Math.pow(adjustedDistance / scaleMeters, curveP));
  let score = maxPoints * base;

  if (floorDiff === 0) score *= correctFloorMultiplier;

  score = Math.max(minPoints, Math.min(maxPoints, Math.round(score)));
  return { score, adjustedDistance, floorPenaltyUsed: floorPenalty };
}

/* ---------------- Component ---------------- */
const SubmitModal = ({
  currentNodePosition,
  selectedCoords,
  setIsSubmitClicked,
  currentFloor,
  guessedFloor,
  getRandomNode,
  difficulty,
  resetRound,
  updateScore
}) => {
  const currentPosParsed = parseLatLngString(currentNodePosition || "");
  const distance = (currentNodePosition && selectedCoords)
    ? calculateDistance(currentPosParsed, selectedCoords)
    : 0;

  const submittedRef = useRef(false);

  // New scoring
  const { score, adjustedDistance, floorPenaltyUsed } = calculateScore(
    distance,
    guessedFloor,
    currentFloor,
    difficulty
  );

  const floorDiff = Math.abs((currentFloor || 0) - (guessedFloor || 0));

  useEffect(() => {
    if (submittedRef.current) return;
    submittedRef.current = true;

    if (!currentNodePosition || !selectedCoords) return;

    const token = localStorage.getItem("token");
    if (!token) return;

    // Detect guest from stored user (set in AuthContext.login)
    const user = JSON.parse(localStorage.getItem("user") || "null");
    const isGuest = user?.role === "guest";

    // Pick the right route
    const base = process.env.REACT_APP_SERVER_URL;
    const path ="/api/submit";
    const url = `${base}${path}`;

    fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Always send token (guest token carries jti/exp server needs)
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        guessed_lat: selectedCoords.lat,
        guessed_lng: selectedCoords.lng,
        actual_lat: currentPosParsed.lat,
        actual_lng: currentPosParsed.lng,
        guessed_floor: guessedFloor,
        actual_floor: currentFloor,
        distance_meters: adjustedDistance, // includes floor penalty
        score
      })
    })
      .then(async (res) => {
        if (!res.ok) {
          const text = await res.text().catch(() => "");
          console.error("Failed to submit result", res.status, text);
        }
      })
      .catch(err => console.error(err));

  }, [
    currentNodePosition,
    selectedCoords,
    currentPosParsed,
    guessedFloor,
    currentFloor,
    adjustedDistance,
    score
  ]);

  if (!currentNodePosition || !selectedCoords) return null;

  const floorLabels = {
    1: 'Ground Floor',
    2: 'Lower First Floor',
    3: 'First Floor',
    4: 'Second Floor'
  };

  const isCorrectFloor = floorDiff === 0;

  const onClose = () => {
    updateScore();
    resetRound();
    setIsSubmitClicked(false);
    if (getRandomNode) getRandomNode();
  };

  return (
    <div className="results-overlay">
      <div className="results-modal">
        <div className='results'>Results</div>

        {isCorrectFloor && adjustedDistance <= perfectRadius && (
          <div className='success-message'>
            Perfect! Exact floor and within {perfectRadius} meters — max points!
          </div>
        )}

        {!isCorrectFloor || adjustedDistance > perfectRadius ? (
          <div className={adjustedDistance <= 10 ? 'success-message' : 'failure-message'}>
            {adjustedDistance <= 10
              ? 'Great job! You were very close!'
              : 'You were a bit far this time — keep going!'}
          </div>
        ) : null}

        {!isCorrectFloor ? (
          <div className='floor-incorrect-message'>
            You chose the <strong>wrong floor</strong>
            <p></p>
            <div className='guessed-floor'>Guessed: Floor {floorLabels[guessedFloor]}</div>
            <div className='actual-floor'>Actual: Floor {floorLabels[currentFloor]}</div>
          </div>
        ) : (
          <div className='floor-correct-message'>
            You selected the <strong>correct floor</strong>
          </div>
        )}

        <div className='distance-result'>
          Base distance: <strong>{distance}m</strong><br />
          Floor penalty: {floorDiff * floorPenaltyUsed}m (x{floorPenaltyUsed} per floor)<br />
          <strong>Total distance: {adjustedDistance}m</strong><br />
          <div style={{ marginTop: 8 }}>
            Score: <strong>{score}</strong>
          </div>
        </div>

        <div className="close-button" onClick={onClose}>Close</div>
      </div>
    </div>
  );
};

export default SubmitModal;
