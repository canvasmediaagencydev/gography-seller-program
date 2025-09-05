import { TabType } from '../../hooks/useTripFilters'
import { ViewToggle, ViewMode } from "../ui/ViewToggle"

interface TabProps {
    id: TabType
    label: string
    mobileLabel: string
    isActive: boolean
    onClick: (tabId: TabType) => void
}

export function Tab({ id, label, mobileLabel, isActive, onClick }: TabProps) {
    return (
        <button
            onClick={() => onClick(id)}
            className={`whitespace-nowrap py-2 px-2 md:px-4 font-medium text-sm md:text-md transition-colors rounded-full flex-1 md:flex-initial ${
                isActive
                    ? 'text-white bg-orange-600'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
            }`}
        >
            <span className="md:hidden">{mobileLabel}</span>
            <span className="hidden md:inline">{label}</span>
        </button>
    )
}

interface TripTabsProps {
    activeTab: TabType
    onTabChange: (tabId: TabType) => void
    showTabs: boolean
    viewMode: ViewMode
    onViewModeChange: (mode: ViewMode) => void
}

export function TripTabs({ activeTab, onTabChange, showTabs, viewMode, onViewModeChange }: TripTabsProps) {
    if (!showTabs) return null

    const tabs = [
        { id: 'all' as TabType, label: 'ทั้งหมด', mobileLabel: 'ทั้งหมด' },
        { id: 'sold' as TabType, label: 'ทริปที่คุณขายได้', mobileLabel: 'ขายได้' },
        { id: 'not_sold' as TabType, label: 'ทริปที่คุณยังไม่ขาย', mobileLabel: 'ยังไม่ขาย' },
        { id: 'full' as TabType, label: 'ทริปที่เต็มแล้ว', mobileLabel: 'เต็มแล้ว' }
    ]

    return (
        <div className="mb-6">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                <nav className="flex space-x-1 md:space-x-2">
                    {tabs.map((tab) => (
                        <Tab
                            key={tab.id}
                            id={tab.id}
                            label={tab.label}
                            mobileLabel={tab.mobileLabel}
                            isActive={activeTab === tab.id}
                            onClick={onTabChange}
                        />
                    ))}
                </nav>

                {/* //* Note ปิดไว้ยังไม่เปิดใช้ ปรับปรุง list view ยังไม่สมบูรณ์ */}
                
                {/* <ViewToggle viewMode={viewMode} onViewModeChange={onViewModeChange} /> */}
            </div>
        </div>
    )
}
