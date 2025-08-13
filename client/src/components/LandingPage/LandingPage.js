import { useState, useContext } from 'react';
import './LandingPage.css';
import { useNavigate } from "react-router-dom";
import { AuthContext } from '../../context/AuthContext';

const LandingPage = () => {
    const navigate = useNavigate();
    const [showDifficulty, setShowDifficulty] = useState(false);
    const { token } = useContext(AuthContext);

    const handleGameNavigation = () => {
        if (token) {
            setShowDifficulty(true);
        }
        else {
            navigate("/game");
        }
    }

    const handleDifficultySelection = (difficulty) => {
        navigate(`/game?difficulty=${difficulty}`);
        setShowDifficulty(false);
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
                {showDifficulty && (
                    <div className="difficulty-selection">
                        <div>Choose which mode you want to play:</div>
                        <div className="buttons-container">
                            <div className="sub-buttton" onClick={() => handleDifficultySelection("1")}><div>Easy</div><div>Navigate anywhere from the start</div></div>
                            <div className="sub-buttton" onClick={() => handleDifficultySelection("2")}><div>Medium</div><div>Navigate only to nearest neighbours</div></div>
                            <div className="sub-buttton" onClick={() => handleDifficultySelection("3")}><div>Hard</div><div>Cannot navigate anywhere</div></div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default LandingPage;