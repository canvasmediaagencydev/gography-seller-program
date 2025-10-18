'use client'

import { useSearchParams } from 'next/navigation'
import { CoinsIcon } from 'lucide-react'
import Link from 'next/link'

export default function BookingSuccessPage() {
    const searchParams = useSearchParams()
    const coinReward = searchParams.get('coins')
    const hasReferral = searchParams.get('referral') === 'true'

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
            <div className="max-w-md w-full">
                <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
                    {/* Success Icon */}
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>

                    {/* Success Message */}
                    <h1 className="text-2xl font-bold text-gray-800 mb-4">
                        ส่งคำขอจองสำเร็จ!
                    </h1>

                    <p className="text-gray-600 mb-6 leading-relaxed">
                        เราได้รับคำขอจองทริปของคุณแล้ว<br />
                        เจ้าหน้าที่จะตรวจสอบและติดต่อกลับภายใน 24 ชั่วโมง
                    </p>

                    {/* Coin Reward Notice - Only show if coins parameter exists */}
                    {coinReward && (
                        <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4 mb-6">
                            <div className="flex items-center justify-center gap-2 mb-2">
                                <CoinsIcon className="h-6 w-6 text-yellow-600" />
                                <h3 className="font-bold text-yellow-800 text-lg">Coin Reward!</h3>
                            </div>
                            <p className="text-yellow-700 text-sm mb-2">
                                {hasReferral ? (
                                    <>
                                        คุณและผู้แนะนำจะได้รับ <span className="font-bold text-lg">{coinReward}</span> coins เมื่อการจองได้รับการอนุมัติ!
                                    </>
                                ) : (
                                    <>
                                        ผู้ขายจะได้รับ <span className="font-bold text-lg">{coinReward}</span> coins เมื่อการจองได้รับการอนุมัติ!
                                    </>
                                )}
                            </p>
                            <p className="text-xs text-yellow-600">
                                * Coins สามารถใช้แลกรับของรางวัลหรือส่วนลดได้
                            </p>
                        </div>
                    )}

                    {/* Info Box */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-left">
                        <h3 className="font-semibold text-blue-800 mb-2">ขั้นตอนต่อไป:</h3>
                        <ul className="text-sm text-blue-700 space-y-1">
                            <li>• เจ้าหน้าที่จะตรวจสอบข้อมูลของคุณ</li>
                            <li>• หากผ่านการอนุมัติ จะมีการติดต่อเพื่อชำระเงิน</li>
                            <li>• คุณจะได้รับอีเมลยืนยันการจองเมื่อชำระเงินแล้ว</li>
                        </ul>
                    </div>

                    {/* Contact Info */}
                    <div className="bg-gray-50 rounded-lg p-4 mb-6">
                        <p className="text-sm text-gray-600">
                            หากมีคำถาม สามารถติดต่อเราได้ที่<br />
                            <span className="font-semibold">โทร: 02-xxx-xxxx</span><br />
                            <span className="font-semibold">Line: @geography</span>
                        </p>
                    </div>

                    {/* Action Button */}
                    {/* <Link 
                        href="/"
                        className="inline-block w-full bg-primary-blue hover:bg-primary-blue text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                    >
                        กลับสู่หน้าแรก
                    </Link> */}
                </div>
            </div>
        </div>
    )
}
