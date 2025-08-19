interface ErrorDisplayProps {
    error?: string | null
}

export default function ErrorDisplay({ error }: ErrorDisplayProps) {
    return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
                <div className="text-6xl mb-4">😔</div>
                <h1 className="text-2xl font-bold text-gray-800 mb-2">เกิดข้อผิดพลาด</h1>
                <p className="text-gray-600">{error || 'ไม่พบข้อมูลทริป'}</p>
            </div>
        </div>
    )
}
