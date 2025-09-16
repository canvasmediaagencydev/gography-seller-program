import { CountryFilter } from './CountryFilter'

interface Country {
  id: string
  name: string
  flag_emoji: string
}

interface TripsHeaderProps {
  totalTrips: number
  selectedCountries?: string[]
  onCountriesChange?: (countries: string[]) => void
  availableCountries?: Country[]
}

export function TripsHeader({ 
  totalTrips, 
  selectedCountries = [], 
  onCountriesChange, 
  availableCountries = [] 
}: TripsHeaderProps) {
  return (
    <div className="mb-6 md:mt-0 mt-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center md:gap-5 gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">ข้อมูล Trips</h1>
          </div>
          <div>
            <div className="text-2xl font-bold text-primary-yellow">{totalTrips} ทริป</div>
          </div>
        </div>
        
        {onCountriesChange && availableCountries.length > 0 && (
          <div className="flex items-center md:ml-0 ml-4">
            <CountryFilter
              selectedCountries={selectedCountries}
              onCountriesChange={onCountriesChange}
              availableCountries={availableCountries}
            />
          </div>
        )}
      </div>
    </div>
  )
}
