import './LoadError.css';

// Shown when a fetch fails, so a load failure never masquerades as an empty list
// (e.g. Bill seeing "No inquiries yet" when the request actually errored).
export default function LoadError({ message = "Couldn't load this. Check your connection.", onRetry }) {
  return (
    <div className="load-error" role="alert">
      <p className="load-error__text">{message}</p>
      {onRetry && (
        <button type="button" className="load-error__retry" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  );
}
