'use client'

import { useState, useEffect } from 'react'
import Modal from '@/components/ui/Modal'

interface EditGoalModalProps {
  isOpen: boolean
  onClose: () => void
  currentGoal: number
  onSave: (goal: number) => void
  isLoading: boolean
}

const PRESET_GOALS = [10000, 30000, 50000, 100000, 200000]

export default function EditGoalModal({
  isOpen,
  onClose,
  currentGoal,
  onSave,
  isLoading
}: EditGoalModalProps) {
  const [goal, setGoal] = useState(currentGoal)

  useEffect(() => {
    setGoal(currentGoal)
  }, [currentGoal])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (goal > 0) {
      onSave(goal)
      onClose()
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="ตั้งเป้าหมายคอมมิชชั่น" size="sm">
      <form onSubmit={handleSubmit}>
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            เป้าหมายรายเดือน (บาท)
          </label>
          <input
            type="number"
            value={goal}
            onChange={(e) => setGoal(parseInt(e.target.value) || 0)}
            className="w-full px-4 py-3 text-lg font-semibold border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-transparent"
            min="1000"
            step="1000"
            placeholder="กรอกจำนวนเงิน"
          />
        </div>

        <div className="mb-6">
          <p className="text-sm text-gray-500 mb-3">หรือเลือกจากตัวเลือก</p>
          <div className="flex flex-wrap gap-2">
            {PRESET_GOALS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setGoal(preset)}
                className={`px-4 py-2 text-sm rounded-lg border transition-colors ${
                  goal === preset
                    ? 'bg-primary-blue text-white border-primary-blue'
                    : 'bg-white text-gray-700 border-gray-200 hover:border-primary-blue'
                }`}
              >
                {preset.toLocaleString()} บาท
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2.5 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            ยกเลิก
          </button>
          <button
            type="submit"
            disabled={isLoading || goal < 1000}
            className="flex-1 px-4 py-2.5 text-white bg-primary-blue rounded-lg hover:bg-secondary-blue transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'กำลังบันทึก...' : 'บันทึก'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
