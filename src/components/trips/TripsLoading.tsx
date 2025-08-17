export function TripsLoading() {
    return (
        <div className="p-6">
            <div className="animate-pulse">
                <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="h-96 bg-gray-200 rounded-xl"></div>
                    ))}
                </div>
            </div>
        </div>
    )
}
