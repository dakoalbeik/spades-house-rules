import "./LoadingScreen.css";

interface LoadingScreenProps {
  message: string;
}

export default function LoadingScreen({ message }: LoadingScreenProps) {
  return (
    <div className="loading-screen">
      <div className="loading-card">
        <div className="loading-suit">♠</div>
        <h1 className="loading-title">Spades</h1>
        <p className="loading-message">{message}</p>
        <div className="loading-dots">
          <span />
          <span />
          <span />
        </div>
      </div>
    </div>
  );
}
