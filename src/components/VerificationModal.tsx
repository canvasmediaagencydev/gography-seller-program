'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ShieldCheckIcon, UserCircleIcon, DocumentTextIcon } from '@heroicons/react/24/outline'
import { useRouter } from 'next/navigation'

interface VerificationModalProps {
  isOpen: boolean
  onClose: () => void
  userProfile: {
    id: string
    full_name: string | null
    status: string | null
  } | null
}

export default function VerificationModal({ isOpen, onClose, userProfile }: VerificationModalProps) {
  const router = useRouter()

  const handleVerifyNow = () => {
    router.push('/dashboard/profile/seller-verification')
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md w-[90vw] bg-white rounded-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] fixed left-[50%] top-[50%] z-50 grid translate-x-[-50%] translate-y-[-50%] border shadow-lg duration-200">
        <DialogHeader>
          <DialogTitle className="text-center text-xl font-semibold text-gray-900">
            ยืนยันตัวตนเพื่อเริ่มการขาย
          </DialogTitle>
        </DialogHeader>

        <div className="py-4 sm:py-6">
          {/* Icon */}
          <div className="flex justify-center mb-4 sm:mb-6">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-primary-blue-light rounded-full flex items-center justify-center">
              <ShieldCheckIcon className="w-6 h-6 sm:w-8 sm:h-8 text-primary-blue" />
            </div>
          </div>

          {/* Content */}
          <div className="text-center space-y-3 sm:space-y-4">

            <p className="text-sm sm:text-base text-gray-600 leading-relaxed px-2">
              เพื่อความปลอดภัยและเพื่อเริ่มขายได้เต็มรูปแบบ กรุณายืนยันตัวตนของคุณก่อนใช้งานระบบ
            </p>

            {/* Features */}
            <div className="bg-gray-50 rounded-lg p-3 sm:p-4 mt-4 sm:mt-6 space-y-2 sm:space-y-3">
              <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm text-gray-700">
                <UserCircleIcon className="w-4 h-4 sm:w-5 sm:h-5 text-primary-blue flex-shrink-0" />
                <span>ยืนยันข้อมูลส่วนตัวและเอกสาร</span>
              </div>
              <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm text-gray-700">
                <DocumentTextIcon className="w-4 h-4 sm:w-5 sm:h-5 text-primary-blue flex-shrink-0" />
                <span>เพิ่มข้อมูลบัญชีธนาคารสำหรับรับเงิน</span>
              </div>
              <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm text-gray-700">
                <ShieldCheckIcon className="w-4 h-4 sm:w-5 sm:h-5 text-primary-blue flex-shrink-0" />
                <span>ใช้งานได้เต็มระบบหลังการอนุมัติ</span>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2 sm:gap-3 px-2 sm:px-0">
          <Button
            onClick={handleVerifyNow}
            className="w-full bg-primary-blue hover:bg-primary-blue/90 text-white text-sm sm:text-base py-2 sm:py-3"
          >
            ยืนยันตัวตนตอนนี้
          </Button>
        </div>

        {/* Note */}
        <p className="text-xs text-gray-500 text-center mt-3 sm:mt-4 px-2">
          การยืนยันตัวตนใช้เวลาประมาณ 1-2 วันทำการ
        </p>
      </DialogContent>
    </Dialog>
  )
}