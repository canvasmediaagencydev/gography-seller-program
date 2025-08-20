export default function ReportsLoading() {
    return (
        <div className="space-y-6 animate-pulse">
            {/* Header */}
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            
            {/* Stats */}
            <div className="grid grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-20 bg-gray-200 rounded"></div>
                ))}
            </div>

            {/* Table */}
            <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-12 bg-gray-200 rounded"></div>
                ))}
            </div>
        </div>
    )
}
