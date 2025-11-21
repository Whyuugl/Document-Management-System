-- Create database schema for Arsip Kependudukan

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Arsip table
CREATE TABLE IF NOT EXISTS arsip (
    id SERIAL PRIMARY KEY,
    no_kk VARCHAR(20) NOT NULL,
    jenis_arsip VARCHAR(50) NOT NULL CHECK (jenis_arsip IN ('kelahiran', 'pernikahan', 'perceraian', 'kematian')),
    nik VARCHAR(16) NOT NULL,
    nama_lengkap VARCHAR(100) NOT NULL,
    tempat_lahir VARCHAR(100) NOT NULL,
    tanggal_lahir DATE NOT NULL,
    jenis_kelamin VARCHAR(20) NOT NULL CHECK (jenis_kelamin IN ('laki-laki', 'perempuan')),
    alamat TEXT NOT NULL,
    file_path VARCHAR(255),
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_arsip_no_kk ON arsip(no_kk);
CREATE INDEX IF NOT EXISTS idx_arsip_jenis_arsip ON arsip(jenis_arsip);
CREATE INDEX IF NOT EXISTS idx_arsip_nik ON arsip(nik);
CREATE INDEX IF NOT EXISTS idx_arsip_nama_lengkap ON arsip(nama_lengkap);

-- Insert default admin user (password: admin123)
-- bcrypt hash for 'admin123': $2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi
INSERT INTO users (username, password_hash)
VALUES ('admin', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi')
ON CONFLICT (username) DO NOTHING;
