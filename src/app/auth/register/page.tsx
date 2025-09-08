'use client'

import { useState, Suspense } from 'react'
import * as React from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { AuthLayout, AuthButton } from '@/components/auth'
import { useAuthForm } from '@/hooks/useAuthForm'
import { getRoleFromParams } from '@/lib/auth'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import AuthSkeleton from '@/components/auth/AuthSkeleton'

function RegisterForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  
  const searchParams = useSearchParams()
  const { loading, error, isRedirecting, setError, handleEmailAuth, handleGoogleAuth } = useAuthForm()
  
  const userRole = getRoleFromParams(searchParams)
  
  // Focus management for accessibility
  const emailRef = React.useRef<HTMLInputElement>(null)
  
  React.useEffect(() => {
    // Auto-focus email input when component mounts
    if (emailRef.current) {
      emailRef.current.focus()
    }
  }, [])

  const handleEmailRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Check if passwords match
    if (password !== confirmPassword) {
      setError('รหัสผ่านไม่ตรงกัน')
      return
    }

    await handleEmailAuth(email, password, false, userRole)
  }

  const handleGoogleRegister = async () => {
    await handleGoogleAuth(userRole)
  }

  return (
    <AuthLayout
      title="สมัครสมาชิก"
      subtitle={
        <>
          มีบัญชีแล้ว?{' '}
          <Link href="/auth/login" className="font-medium text-blue-600 hover:text-blue-500">
            เข้าสู่ระบบ
          </Link>
        </>
      }
      error={error}
      errorId="register-error"
    >

      <form className="space-y-6" onSubmit={handleEmailRegister}>
        <div className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium text-gray-700">
              อีเมล
            </Label>
            <Input
              ref={emailRef}
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className="h-12 px-4 text-base md:h-10 md:text-sm"
              placeholder="กรอกอีเมลของคุณ"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-describedby={error ? "register-error" : undefined}
              aria-invalid={!!error}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium text-gray-700">
              รหัสผ่าน
            </Label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
              className="h-12 px-4 text-base md:h-10 md:text-sm"
              placeholder="อย่างน้อย 6 ตัวอักษร"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-describedby={error ? "register-error" : undefined}
              aria-invalid={!!error}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
              ยืนยันรหัสผ่าน
            </Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
              className="h-12 px-4 text-base md:h-10 md:text-sm"
              placeholder="กรอกรหัสผ่านอีกครั้ง"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              aria-describedby={error ? "register-error" : undefined}
              aria-invalid={!!error}
            />
          </div>
        </div>

        <div className="space-y-4">
          <AuthButton
            type="submit"
            loading={loading}
            disabled={isRedirecting}
            loadingText={error ? 'สมัครไม่สำเร็จ' : isRedirecting ? 'กำลังเข้าสู่หน้าหลัก...' : 'กำลังสร้างบัญชี...'}
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            }
          >
            สมัครสมาชิก
          </AuthButton>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-3 bg-white text-gray-500">หรือ</span>
            </div>
          </div>

          <AuthButton
            variant="secondary"
            onClick={handleGoogleRegister}
            loading={loading}
            disabled={loading}
            icon={
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            }
          >
            สมัครด้วย Google
          </AuthButton>
        </div>
      </form>

      <div className="text-xs text-gray-500 text-center pt-4 border-t border-gray-100">
        <div className="flex items-center justify-center mb-2">
          <svg className="h-4 w-4 text-blue-500 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="font-medium">หลังจากสมัครสมาชิก</span>
        </div>
        คุณจะต้องกรอกข้อมูลส่วนตัวเพิ่มเติมและรอการอนุมัติจากแอดมิน
      </div>
    </AuthLayout>
  )
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<AuthSkeleton />}>
      <RegisterForm />
    </Suspense>
  )
}
