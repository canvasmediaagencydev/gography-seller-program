export default function BookingHeader() {
    return (
        <header className="bg-white p-2 sticky top-0 z-40">
            <div className="max-w-6xl mx-auto px-4 py-3">
                <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                            <span className="text-white font-bold">G</span>
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-gray-900">Geography Travel</h1>
                            <p className="text-xs text-gray-500">จองทริปในฝัน</p>
                        </div>
                    </div>
                    {/* <div className="hidden md:flex items-center space-x-4 text-sm text-gray-600">
                        <span>📞 02-123-4567</span>
                        <div className="flex items-center space-x-1">
                            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                            <span>ปลอดภัย</span>
                        </div>
                    </div> */}
                </div>
            </div>
        </header>
    )
}
