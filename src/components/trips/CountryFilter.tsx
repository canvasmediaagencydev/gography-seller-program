'use client'

import { useState, useRef, useEffect } from 'react'
import { LuListFilter } from "react-icons/lu"

interface Country {
  id: string
  name: string
  flag_emoji: string
}

interface CountryFilterProps {
  selectedCountries: string[]
  onCountriesChange: (countries: string[]) => void
  availableCountries: Country[]
}

export function CountryFilter({ 
  selectedCountries, 
  onCountriesChange, 
  availableCountries 
}: CountryFilterProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [tempSelectedCountries, setTempSelectedCountries] = useState<string[]>(selectedCountries)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setTempSelectedCountries(selectedCountries) // Reset temp selection
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [selectedCountries])

  // Update temp selection when props change
  useEffect(() => {
    setTempSelectedCountries(selectedCountries)
  }, [selectedCountries])

  const handleCountryToggle = (countryId: string) => {
    if (tempSelectedCountries.includes(countryId)) {
      setTempSelectedCountries(tempSelectedCountries.filter(id => id !== countryId))
    } else {
      setTempSelectedCountries([...tempSelectedCountries, countryId])
    }
  }

  const handleReset = () => {
    setTempSelectedCountries([])
  }

  const handleConfirm = () => {
    onCountriesChange(tempSelectedCountries)
    setIsOpen(false)
  }

  const getDisplayText = () => {
    if (selectedCountries.length === 0) {
      return 'ประเทศ'
    } else if (selectedCountries.length === 1) {
      const country = availableCountries.find(c => c.id === selectedCountries[0])
      return country ? country.name : 'ประเทศ'
    } else {
      return `${selectedCountries.length} ประเทศ`
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors min-w-[100px] ${
          selectedCountries.length > 0 
            ? 'bg-primary-yellow-light text-primary-yellow border border-secondary-yellow' 
            : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
        }`}
      >
        <LuListFilter className="w-4 h-4" />
        <span className="flex-1 text-left">{getDisplayText()}</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-[320px] bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <span className="text-lg font-medium text-gray-900">ประเทศ</span>
              <button
                onClick={handleReset}
                className="text-sm text-gray-500 hover:text-gray-700 font-medium"
              >
                รีเซ็ต
              </button>
            </div>
          </div>
          
          <div className="max-h-64 overflow-y-auto p-2">
            {availableCountries.map((country) => (
              <label
                key={country.id}
                className="flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 cursor-pointer rounded-lg"
              >
                <input
                  type="checkbox"
                  checked={tempSelectedCountries.includes(country.id)}
                  onChange={() => handleCountryToggle(country.id)}
                  className="w-4 h-4 text-primary-yellow border-gray-300 rounded focus:ring-primary-yellow"
                />
                <span className="text-lg">{country.flag_emoji}</span>
                <span className="text-sm text-gray-700 flex-1">{country.name}</span>
              </label>
            ))}
          </div>

          <div className="p-4 border-t border-gray-100 bg-gray-50">
            <button
              onClick={handleConfirm}
              className="w-full px-4 py-2 bg-primary-blue text-white text-sm font-medium rounded-lg hover:bg-primary-blue transition-colors"
            >
              ยืนยัน
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
