export default function SkeletonCard() {
  return (
    <div className="animate-pulse">
      <div className="aspect-[3/4] bg-[#F0EDE6] rounded-xl" />
      <div className="mt-3.5 space-y-2 px-0.5">
        <div className="h-2 bg-[#F0EDE6] rounded w-14" />
        <div className="h-3.5 bg-[#F0EDE6] rounded w-3/4" />
        <div className="h-3.5 bg-[#F0EDE6] rounded w-20" />
      </div>
    </div>
  );
}
