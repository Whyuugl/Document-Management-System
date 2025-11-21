import { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import fs from 'fs';
import path from 'path';
import pool from '../../lib/database';
import { requireAuth, AuthenticatedRequest } from '../../lib/middleware';

// Disable default body parser for file uploads
export const config = {
  api: {
    bodyParser: false,
  },
};

async function handler(req: AuthenticatedRequest, res: NextApiResponse): Promise<void> {
  // Ensure JSON response for all errors
  if (req.method === 'POST') {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      // Ensure uploads directory exists
      const uploadsDir = path.join(process.cwd(), 'uploads', 'arsip');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      // Parse the form data
      const form = formidable({
        uploadDir: uploadsDir,
        keepExtensions: true,
        maxFileSize: 10 * 1024 * 1024, // 10MB
        filter: function ({ mimetype }) {
          // Allow common document and image files
          if (!mimetype) return false;
          return (
            mimetype.includes('image') || 
            mimetype.includes('pdf') || 
            mimetype.includes('document')
          );
        }
      });

      let fields, files;
      try {
        [fields, files] = await form.parse(req);
      } catch (parseError: any) {
        console.error('Formidable parse error:', parseError);
        return res.status(400).json({
          success: false,
          error: parseError.message || 'Gagal memproses file upload'
        });
      }
      
      // Extract form fields
      const jenisArsip = Array.isArray(fields.jenis_arsip) ? fields.jenis_arsip[0] : fields.jenis_arsip;
      const noKK = Array.isArray(fields.no_kk) ? fields.no_kk[0] : fields.no_kk;
      const nik = Array.isArray(fields.nik) ? fields.nik[0] : fields.nik;
      const namaLengkap = Array.isArray(fields.nama_lengkap) ? fields.nama_lengkap[0] : fields.nama_lengkap;
      const tempatLahir = Array.isArray(fields.tempat_lahir) ? fields.tempat_lahir[0] : fields.tempat_lahir;
      const tanggalLahir = Array.isArray(fields.tanggal_lahir) ? fields.tanggal_lahir[0] : fields.tanggal_lahir;
      const jenisKelamin = Array.isArray(fields.jenis_kelamin) ? fields.jenis_kelamin[0] : fields.jenis_kelamin;
      const alamat = Array.isArray(fields.alamat) ? fields.alamat[0] : fields.alamat;

      // Validate required fields
      if (!jenisArsip || !noKK || !nik || !namaLengkap || !tempatLahir || !tanggalLahir || !jenisKelamin || !alamat) {
        return res.status(400).json({
          success: false,
          error: 'Semua field wajib harus diisi'
        });
      }

      // Handle file upload
      let filePath = null;
      if (files.file) {
        const file = Array.isArray(files.file) ? files.file[0] : files.file;
        
        // Generate unique filename
        const fileExtension = path.extname(file.originalFilename || '');
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}${fileExtension}`;
        const newFilePath = path.join(uploadsDir, fileName);

        // Move file to permanent location
        fs.renameSync(file.filepath, newFilePath);
        filePath = `/uploads/arsip/${fileName}`;
      }

      // Insert into database
      const result = await pool.query(
        `INSERT INTO arsip (
          jenis_arsip, no_kk, nik, nama_lengkap, tempat_lahir, 
          tanggal_lahir, jenis_kelamin, alamat, file_path, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
        RETURNING id, jenis_arsip, no_kk, nik, nama_lengkap, created_at`,
        [
          jenisArsip, noKK, nik, namaLengkap, tempatLahir,
          tanggalLahir, jenisKelamin, alamat, filePath, req.user.id
        ]
      );

      res.status(201).json({
        success: true,
        message: 'Arsip berhasil ditambahkan',
        data: result.rows[0]
      });
      return;

    } catch (error: any) {
      console.error('Error creating arsip:', error);
      
      // Handle unique constraint violation
      if (error.code === '23505') {
        return res.status(400).json({
          success: false,
          error: 'Nomor akta sudah ada dalam database'
        });
      }

      // Handle database errors
      if (error.code && error.code.startsWith('23')) {
        return res.status(400).json({
          success: false,
          error: 'Data tidak valid: ' + (error.message || 'Constraint violation')
        });
      }

      return res.status(500).json({
        success: false,
        error: error.message || 'Internal server error'
      });
    }
  } else if (req.method === 'GET') {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      // Get query parameters
      const { page = 1, limit = 10, jenis_arsip } = req.query;
      const offset = (Number(page) - 1) * Number(limit);

      // Build query
      let query = `
        SELECT a.*, u.username as created_by_username 
        FROM arsip a 
        LEFT JOIN users u ON a.created_by = u.id
      `;
      const queryParams = [];
      const conditions = [];

      if (jenis_arsip) {
        conditions.push(`a.jenis_arsip = $${queryParams.length + 1}`);
        queryParams.push(jenis_arsip);
      }

      if (conditions.length > 0) {
        query += ` WHERE ${conditions.join(' AND ')}`;
      }

      query += ` ORDER BY a.created_at DESC LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`;
      queryParams.push(Number(limit), offset);

      const result = await pool.query(query, queryParams);

      // Get total count
      let countQuery = 'SELECT COUNT(*) FROM arsip a';
      if (conditions.length > 0) {
        countQuery += ` WHERE ${conditions.join(' AND ')}`;
      }
      const countResult = await pool.query(countQuery, queryParams.slice(0, -2));

      res.status(200).json({
        success: true,
        data: result.rows,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: Number(countResult.rows[0].count),
          totalPages: Math.ceil(Number(countResult.rows[0].count) / Number(limit))
        }
      });
      return;

    } catch (error: any) {
      console.error('Error fetching arsip:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Internal server error'
      });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
    return;
  }
}

export default requireAuth(handler);
