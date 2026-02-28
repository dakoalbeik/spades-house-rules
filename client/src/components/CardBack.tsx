import "./CardBack.css";

interface CardBackProps {
  size?: "small" | "medium" | "large";
  /** Optional stack offset (e.g. index) for layered effect */
  stackIndex?: number;
}

export default function CardBack({ size = "medium", stackIndex = 0 }: CardBackProps) {
  return (
    <div
      className={`card-back card-back-${size}`}
      style={
        stackIndex
          ? { transform: `translate(${stackIndex * 2}px, ${stackIndex * 2}px)` }
          : undefined
      }
      aria-hidden
    />
  );
}
