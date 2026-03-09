import "./CardBack.css";

interface CardBackProps {
  size?: "small" | "medium" | "large";
  layered?: {
    stackIndex: number;
    spread: "vertical" | "horizontal";
  };
}

export default function CardBack({ size = "medium", layered }: CardBackProps) {
  const { spread, stackIndex = 0 } = layered || {};
  const style: React.CSSProperties =
    spread === "vertical"
      ? { transform: `rotate(90deg) translateX(${stackIndex * -25.25}px)` }
      : { transform: `translateX(${stackIndex * -15}px)` };

  return (
    <div className={`card-back card-back-${size}`} style={style} aria-hidden />
  );
}
