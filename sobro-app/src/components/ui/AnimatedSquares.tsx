import Squares from "./Squares";

export default function AnimatedSquaresBackground() {
  return (
    <Squares
      speed={0.5}
      squareSize={40}
      direction="diagonal"
      borderColor="rgba(255, 255, 255, 0.1)"
      hoverFillColor="#222"
    />
  );
}