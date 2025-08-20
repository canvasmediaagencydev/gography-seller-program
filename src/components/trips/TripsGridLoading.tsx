export function TripsGridLoading() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={index}
          className="bg-white rounded-2xl shadow-lg overflow-hidden animate-pulse"
        >
          {/* Cover Image Skeleton */}
          <div className="h-48 bg-gray-200"></div>
          
          {/* Content Skeleton */}
          <div className="p-4 space-y-3">
            {/* Title Skeleton */}
            <div className="h-6 bg-gray-200 rounded"></div>
            <div className="h-6 bg-gray-200 rounded w-3/4"></div>
            
            {/* Date Skeleton */}
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            
            {/* Dropdown Skeleton */}
            <div className="h-10 bg-gray-200 rounded"></div>
            
            {/* Price Skeleton */}
            <div className="h-6 bg-gray-200 rounded w-1/3"></div>
            
            {/* Button Skeleton */}
            <div className="h-12 bg-gray-200 rounded"></div>
          </div>
        </div>
      ))}
    </div>
  )
}
