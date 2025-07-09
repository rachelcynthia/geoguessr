function calculateDistance(pos1, pos2) {
  const toRad = (value) => (value * Math.PI) / 180;

  // Haversine formula
  const R = 6371; // Earth's radius in km
  const dLat = toRad(pos2.lat - pos1.lat);
  const dLng = toRad(pos2.lng - pos1.lng);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(pos1.lat)) *
      Math.cos(toRad(pos2.lat)) *
      Math.sin(dLng / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const haversineDistance = Math.round(R * c * 1000); // in metres

  // Euclidean formula (very rough approximation on lat/lng grid)
  const deltaX = pos2.lng - pos1.lng;
  const deltaY = pos2.lat - pos1.lat;
  const euclideanDistance = Math.round(
    Math.sqrt(deltaX ** 2 + deltaY ** 2) * 111000 // rough conversion: ~111 km per degree
  );

  return {
    haversine: haversineDistance,
    euclidean: euclideanDistance,
  };
}


const parseLatLngString = (latLngStr) => {
  const [latStr, lngStr] = latLngStr.split(',').map(s => s.trim());
  return {
    lat: parseFloat(latStr),
    lng: parseFloat(lngStr),
  };
};

const SubmitModal = ({ currentNodePosition, selectedCoords, setIsSubmitClicked }) => {
  if (!currentNodePosition || !selectedCoords) return null;
  const onClose = () => {
    setIsSubmitClicked(false);
  }

  const currentPosParsed = parseLatLngString(currentNodePosition);
  const distance = calculateDistance(currentPosParsed, selectedCoords);

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <h2>Distance Result</h2>
        <p>
          Euclidean Distance between current node and selected location is <strong>{distance.euclidean}m</strong>.
        </p>
        <p>
          Haversine Distance between current node and selected location is <strong>{distance.haversine}m</strong>.
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