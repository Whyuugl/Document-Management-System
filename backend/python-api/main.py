from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
import ocrmypdf
import tempfile
import os
import shutil
from pathlib import Path
from typing import Optional
import uvicorn
import subprocess
import platform

app = FastAPI(title="OCRmyPDF API", version="1.0.0")

# Setup Ghostscript PATH untuk Windows
def setup_ghostscript_path():
    """Setup Ghostscript di PATH untuk Windows"""
    if platform.system() == "Windows":
        # Common Ghostscript installation paths
        gs_paths = [
            r"C:\Program Files\gs\gs10.06.0\bin",
            r"C:\Program Files\gs\gs10.05.0\bin",
            r"C:\Program Files\gs\gs10.04.0\bin",
            r"C:\Program Files (x86)\gs\gs10.06.0\bin",
            r"C:\Program Files (x86)\gs\gs10.05.0\bin",
        ]
        
        current_path = os.environ.get("PATH", "")
        
        for gs_path in gs_paths:
            if os.path.exists(gs_path) and gs_path not in current_path:
                os.environ["PATH"] = f"{gs_path};{os.environ.get('PATH', '')}"
                print(f"✅ Added Ghostscript to PATH: {gs_path}")
                break

# Setup Ghostscript saat startup
setup_ghostscript_path()

# Test Ghostscript availability
def check_ghostscript():
    """Cek apakah Ghostscript tersedia"""
    try:
        if platform.system() == "Windows":
            result = subprocess.run(
                ["gswin64c", "--version"],
                capture_output=True,
                text=True,
                timeout=5
            )
            if result.returncode == 0:
                return True, result.stdout.strip()
        else:
            result = subprocess.run(
                ["gs", "--version"],
                capture_output=True,
                text=True,
                timeout=5
            )
            if result.returncode == 0:
                return True, result.stdout.strip()
    except Exception as e:
        pass
    return False, None

# Cek Ghostscript saat startup
gs_available, gs_version = check_ghostscript()
if gs_available:
    print(f"✅ Ghostscript available: {gs_version}")
else:
    print("⚠️  Ghostscript not found in PATH. OCRmyPDF may not work properly.")
    print("   Please ensure Ghostscript is installed and in PATH.")

# CORS middleware untuk allow request dari frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Di production, ganti dengan domain spesifik
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Buat folder untuk output
OUTPUT_DIR = Path("output")
OUTPUT_DIR.mkdir(exist_ok=True)


@app.get("/")
async def root():
    return {
        "message": "OCRmyPDF API Server",
        "version": "1.0.0",
        "endpoints": {
            "health": "/health",
            "ocr": "/ocr",
            "ocr-extract": "/ocr-extract"
        }
    }


@app.get("/health")
async def health():
    """Health check endpoint dengan info dependencies"""
    gs_available, gs_version = check_ghostscript()
    
    # Test OCRmyPDF
    ocrmypdf_available = True
    try:
        import ocrmypdf
        ocrmypdf_version = ocrmypdf.__version__ if hasattr(ocrmypdf, '__version__') else "installed"
    except:
        ocrmypdf_available = False
        ocrmypdf_version = None
    
    return {
        "status": "OK",
        "service": "OCRmyPDF API",
        "dependencies": {
            "ocrmypdf": {
                "available": ocrmypdf_available,
                "version": ocrmypdf_version
            },
            "ghostscript": {
                "available": gs_available,
                "version": gs_version
            }
        }
    }


@app.post("/ocr")
async def do_ocr(
    file: UploadFile = File(...),
    language: str = "eng+ind",
    deskew: bool = True,
    rotate_pages: bool = True
):
    """
    OCR file PDF dan return file PDF yang sudah di-OCR
    
    Parameters:
    - file: File PDF yang akan di-OCR
    - language: Bahasa untuk OCR (default: eng+ind)
    - deskew: Perbaiki halaman miring (default: True)
    - rotate_pages: Auto-rotate halaman (default: True)
    """
    try:
        # Validasi file
        if not file.filename.endswith('.pdf'):
            raise HTTPException(status_code=400, detail="File must be PDF")
        
        # Buat temporary files
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as temp_in:
            # Simpan file upload ke temp
            shutil.copyfileobj(file.file, temp_in)
            temp_in_path = temp_in.name
        
        # Buat output file
        output_filename = f"ocr_{os.path.basename(file.filename)}"
        output_path = OUTPUT_DIR / output_filename
        
        try:
            # Jalankan OCR
            ocrmypdf_options = {
                "language": language,
                "deskew": deskew,
                "rotate_pages": rotate_pages,
                "output_type": "pdfa"
            }
            
            ocrmypdf.ocr(temp_in_path, str(output_path), **ocrmypdf_options)
            
            # Return file response
            return FileResponse(
                path=str(output_path),
                filename=output_filename,
                media_type="application/pdf"
            )
            
        except Exception as e:
            error_msg = str(e)
            # Check if it's a Ghostscript error
            if "ghostscript" in error_msg.lower() or "gs" in error_msg.lower():
                raise HTTPException(
                    status_code=500,
                    detail=f"Ghostscript error: {error_msg}. Please ensure Ghostscript is installed and in PATH."
                )
            raise HTTPException(status_code=500, detail=f"OCR failed: {error_msg}")
        finally:
            # Cleanup temp input file
            if os.path.exists(temp_in_path):
                os.unlink(temp_in_path)
                
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")


@app.post("/ocr-extract")
async def do_ocr_extract(
    file: UploadFile = File(...),
    language: str = "eng+ind",
    extract_text: bool = True
):
    """
    OCR file PDF dan extract text-nya
    
    Parameters:
    - file: File PDF yang akan di-OCR
    - language: Bahasa untuk OCR (default: eng+ind)
    - extract_text: Extract text dari PDF (default: True)
    """
    try:
        # Validasi file
        if not file.filename.endswith('.pdf'):
            raise HTTPException(status_code=400, detail="File must be PDF")
        
        # Buat temporary files
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as temp_in:
            shutil.copyfileobj(file.file, temp_in)
            temp_in_path = temp_in.name
        
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as temp_out:
            temp_out_path = temp_out.name
        
        try:
            # Jalankan OCR
            ocrmypdf_options = {
                "language": language,
                "deskew": True,
                "rotate_pages": True,
                "output_type": "pdfa"
            }
            
            ocrmypdf.ocr(temp_in_path, temp_out_path, **ocrmypdf_options)
            
            result = {
                "success": True,
                "message": "OCR completed successfully",
                "output_path": temp_out_path
            }
            
            # Extract text jika diminta
            if extract_text:
                try:
                    import pdfplumber
                    extracted_text = ""
                    with pdfplumber.open(temp_out_path) as pdf:
                        for page in pdf.pages:
                            text = page.extract_text()
                            if text:
                                extracted_text += text + "\n"
                    
                    result["extracted_text"] = extracted_text.strip()
                except ImportError:
                    result["extracted_text"] = "Text extraction requires pdfplumber. Install with: pip install pdfplumber"
                except Exception as e:
                    result["extracted_text"] = f"Text extraction failed: {str(e)}"
            
            return JSONResponse(content=result)
            
        except Exception as e:
            error_msg = str(e)
            # Check if it's a Ghostscript error
            if "ghostscript" in error_msg.lower() or "gs" in error_msg.lower():
                raise HTTPException(
                    status_code=500,
                    detail=f"Ghostscript error: {error_msg}. Please ensure Ghostscript is installed and in PATH."
                )
            raise HTTPException(status_code=500, detail=f"OCR failed: {error_msg}")
        finally:
            # Cleanup temp files
            if os.path.exists(temp_in_path):
                os.unlink(temp_in_path)
            if os.path.exists(temp_out_path):
                os.unlink(temp_out_path)
                
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")


if __name__ == "__main__":
    # Jalankan server di port 8000
    uvicorn.run(app, host="0.0.0.0", port=8000)

