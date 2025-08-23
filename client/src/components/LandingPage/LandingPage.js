import './LandingPage.css';
import { useNavigate } from "react-router-dom";

const LandingPage = () => {
    const navigate = useNavigate();

    const handleGameNavigation = () => {
        navigate("/game");
    }

    return (
        <div className="landing-page-container">
            <div className="landing-page">
                <div className="title">Welcome to the Kilburn GeoGuessr Game</div>
                <div className="description">
                    Explore the Kilburn building through a fun and interactive game. Navigate through different floors and test your knowledge of the building's layout.
                </div>
                <div className="start-button-container" onClick={handleGameNavigation}>
                    Start Game
                </div>
            </div>
        </div>
    );
}

export default LandingPage;