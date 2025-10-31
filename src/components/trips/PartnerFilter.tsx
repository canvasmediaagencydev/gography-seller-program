'use client'

import { useState, useRef, useEffect } from 'react'
import { LuListFilter } from "react-icons/lu"
import { Building2 } from 'lucide-react'
import Image from 'next/image'

interface Partner {
  id: string
  name: string
  logo_url: string | null
}

interface PartnerFilterProps {
  selectedPartners: string[]
  onPartnersChange: (partners: string[]) => void
  availablePartners: Partner[]
}

export function PartnerFilter({
  selectedPartners,
  onPartnersChange,
  availablePartners
}: PartnerFilterProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [tempSelectedPartners, setTempSelectedPartners] = useState<string[]>(selectedPartners)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setTempSelectedPartners(selectedPartners) // Reset temp selection
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [selectedPartners])

  // Update temp selection when props change
  useEffect(() => {
    setTempSelectedPartners(selectedPartners)
  }, [selectedPartners])

  const handlePartnerToggle = (partnerId: string) => {
    if (tempSelectedPartners.includes(partnerId)) {
      setTempSelectedPartners(tempSelectedPartners.filter(id => id !== partnerId))
    } else {
      setTempSelectedPartners([...tempSelectedPartners, partnerId])
    }
  }

  const handleReset = () => {
    setTempSelectedPartners([])
  }

  const handleConfirm = () => {
    onPartnersChange(tempSelectedPartners)
    setIsOpen(false)
  }

  const getDisplayText = () => {
    if (selectedPartners.length === 0) {
      return 'Partner'
    } else if (selectedPartners.length === 1) {
      const partner = availablePartners.find(p => p.id === selectedPartners[0])
      return partner ? partner.name : 'Partner'
    } else {
      return `${selectedPartners.length} Partners`
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors min-w-[100px] ${
          selectedPartners.length > 0
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
              <span className="text-lg font-medium text-gray-900">Partner</span>
              <button
                onClick={handleReset}
                className="text-sm text-gray-500 hover:text-gray-700 font-medium"
              >
                รีเซ็ต
              </button>
            </div>
          </div>

          <div className="max-h-64 overflow-y-auto p-2">
            {availablePartners.map((partner) => (
              <label
                key={partner.id}
                className="flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 cursor-pointer rounded-lg"
              >
                <input
                  type="checkbox"
                  checked={tempSelectedPartners.includes(partner.id)}
                  onChange={() => handlePartnerToggle(partner.id)}
                  className="w-4 h-4 text-primary-yellow border-gray-300 rounded focus:ring-primary-yellow"
                />
                {partner.logo_url ? (
                  <div className="relative w-6 h-6 rounded-full overflow-hidden bg-gray-100 flex-shrink-0">
                    <Image
                      src={partner.logo_url}
                      alt={partner.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                    <Building2 size={12} className="text-gray-500" />
                  </div>
                )}
                <span className="text-sm text-gray-700 flex-1">{partner.name}</span>
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
