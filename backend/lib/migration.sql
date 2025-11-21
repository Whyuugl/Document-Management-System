-- Migration script to update existing arsip table
-- Run this if you already have the arsip table
-- This only updates the arsip table, users table is not modified

-- Add new columns if they don't exist
DO $$ 
BEGIN
    -- Add no_kk column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'arsip' AND column_name = 'no_kk') THEN
        ALTER TABLE arsip ADD COLUMN no_kk VARCHAR(20);
        RAISE NOTICE 'Column no_kk added to arsip table';
    ELSE
        RAISE NOTICE 'Column no_kk already exists';
    END IF;

    -- Add nik column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'arsip' AND column_name = 'nik') THEN
        ALTER TABLE arsip ADD COLUMN nik VARCHAR(16);
        RAISE NOTICE 'Column nik added to arsip table';
    ELSE
        RAISE NOTICE 'Column nik already exists';
    END IF;

    -- Make no_kk NOT NULL if it's nullable
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'arsip' AND column_name = 'no_kk' AND is_nullable = 'YES') THEN
        ALTER TABLE arsip ALTER COLUMN no_kk SET NOT NULL;
        RAISE NOTICE 'Column no_kk set to NOT NULL';
    END IF;

    -- Make nik NOT NULL if it's nullable
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'arsip' AND column_name = 'nik' AND is_nullable = 'YES') THEN
        ALTER TABLE arsip ALTER COLUMN nik SET NOT NULL;
        RAISE NOTICE 'Column nik set to NOT NULL';
    END IF;
    
    -- Update jenis_arsip constraint
    ALTER TABLE arsip DROP CONSTRAINT IF EXISTS arsip_jenis_arsip_check;
    ALTER TABLE arsip ADD CONSTRAINT arsip_jenis_arsip_check 
        CHECK (jenis_arsip IN ('kelahiran', 'pernikahan', 'perceraian', 'kematian'));
    RAISE NOTICE 'Updated jenis_arsip constraint';
END $$;

-- Create new indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_arsip_no_kk ON arsip(no_kk);
CREATE INDEX IF NOT EXISTS idx_arsip_jenis_arsip ON arsip(jenis_arsip);
CREATE INDEX IF NOT EXISTS idx_arsip_nik ON arsip(nik);

