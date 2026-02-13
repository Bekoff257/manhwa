const SkeletonGrid = () => (
  <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
    {Array.from({ length: 8 }).map((_, i) => (
      <div key={i} className="animate-pulse overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
        <div className="h-56 bg-slate-800" />
        <div className="space-y-2 p-4">
          <div className="h-3 w-2/3 rounded bg-slate-800" />
          <div className="h-3 w-full rounded bg-slate-800" />
        </div>
      </div>
    ))}
  </div>
);

export default SkeletonGrid;
