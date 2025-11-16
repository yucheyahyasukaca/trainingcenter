-- ============================================================================
-- Script untuk menambahkan kolom-kolom extended ke table participants
-- ============================================================================

-- Add extended fields to participants table
ALTER TABLE participants 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS background TEXT,
ADD COLUMN IF NOT EXISTS career_info TEXT,
ADD COLUMN IF NOT EXISTS education TEXT,
ADD COLUMN IF NOT EXISTS education_status TEXT,
ADD COLUMN IF NOT EXISTS employment_status TEXT,
ADD COLUMN IF NOT EXISTS it_background TEXT,
ADD COLUMN IF NOT EXISTS disability TEXT,
ADD COLUMN IF NOT EXISTS program_source TEXT,
ADD COLUMN IF NOT EXISTS provinsi TEXT,
ADD COLUMN IF NOT EXISTS kabupaten TEXT,
ADD COLUMN IF NOT EXISTS emergency_contact_name TEXT,
ADD COLUMN IF NOT EXISTS emergency_contact_phone TEXT;

-- Add comments for documentation
COMMENT ON COLUMN participants.user_id IS 'Reference to auth.users';
COMMENT ON COLUMN participants.background IS 'Latar belakang: student, fresh_graduate, professional, entrepreneur, other';
COMMENT ON COLUMN participants.career_info IS 'Informasi karier peserta';
COMMENT ON COLUMN participants.education IS 'Pendidikan terakhir';
COMMENT ON COLUMN participants.education_status IS 'Status pendidikan: sedang, tidak';
COMMENT ON COLUMN participants.employment_status IS 'Status pekerjaan: bekerja, tidak_bekerja';
COMMENT ON COLUMN participants.it_background IS 'Pemahaman IT: ya, tidak';
COMMENT ON COLUMN participants.disability IS 'Status disabilitas: ya, tidak';
COMMENT ON COLUMN participants.program_source IS 'Sumber informasi program (JSON array)';
COMMENT ON COLUMN participants.provinsi IS 'Provinsi tempat tinggal';
COMMENT ON COLUMN participants.kabupaten IS 'Kabupaten/Kota tempat tinggal';
COMMENT ON COLUMN participants.emergency_contact_name IS 'Nama kontak darurat';
COMMENT ON COLUMN participants.emergency_contact_phone IS 'Nomor telepon kontak darurat';

-- Create index for user_id
CREATE INDEX IF NOT EXISTS idx_participants_user_id ON participants(user_id);

-- Verify columns were added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'participants'
ORDER BY ordinal_position;

