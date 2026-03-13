

export default function LoadingSkeleton({ count = 3, height = '5rem' }) {
  return (
    <div className="row g-3" data-testid="loading-skeleton">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="col-12">
          <div className="placeholder-glow card border-0 shadow-sm">
            <div className="card-body">
              <span className="placeholder col-8 mb-3" style={{ height: '1.25rem' }} />
              <span className="placeholder col-12" style={{ height }} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}