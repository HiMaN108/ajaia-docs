export function PageSkeleton() {
  return (
    <div className="flex flex-1 animate-pulse lg:pl-64">
      <div className="mx-auto w-full max-w-6xl px-6 py-20">
        <div className="mb-6 h-32 rounded-xl bg-surface-container" />
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-16 rounded-xl bg-surface-container-low" />
          ))}
        </div>
      </div>
    </div>
  );
}
