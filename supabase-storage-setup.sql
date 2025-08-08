-- Storage policies for seller-assets bucket
-- ต้องรันใน Supabase SQL Editor

-- 1. เช็กว่ามี columns อะไรแล้วบ้างใน user_profiles table
-- จาก database.types.ts เห็นว่ามีแล้ว: id_card_url, document_url, avatar_url

-- เพิ่มเฉพาะ columns ที่ยังไม่มี
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS documents_urls TEXT[], -- Array สำหรับเก็บ multiple PDFs (เพิ่มจาก document_url เดียว)
ADD COLUMN IF NOT EXISTS id_card_uploaded_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS document_uploaded_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS avatar_uploaded_at TIMESTAMP WITH TIME ZONE;

-- 2. Storage Policies สำหรับ seller-assets bucket
-- Policy สำหรับให้ seller upload ไฟล์ของตัวเอง
CREATE POLICY "Sellers can upload their own files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'seller-assets' 
  AND auth.uid()::text = split_part(name, '/', 1)
);

-- Policy สำหรับให้ seller ดูไฟล์ของตัวเอง
CREATE POLICY "Sellers can view their own files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'seller-assets' 
  AND auth.uid()::text = split_part(name, '/', 1)
);

-- Policy สำหรับให้ seller update ไฟล์ของตัวเอง
CREATE POLICY "Sellers can update their own files"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'seller-assets' 
  AND auth.uid()::text = split_part(name, '/', 1)
);

-- Policy สำหรับให้ seller ลบไฟล์ของตัวเอง
CREATE POLICY "Sellers can delete their own files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'seller-assets' 
  AND auth.uid()::text = split_part(name, '/', 1)
);

-- Policy สำหรับให้ admin ดูไฟล์ทุกคน
CREATE POLICY "Admins can view all seller files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'seller-assets' 
  AND EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- หมายเหตุ: RLS บน storage.objects เปิดอยู่แล้วโดย default ใน Supabase
