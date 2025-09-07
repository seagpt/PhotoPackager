from pydantic import BaseModel, Field


class JobSettings(BaseModel):
    """Pydantic model for the settings of a packaging job."""
    shoot_name: str = Field(..., description="The name of the photo shoot or project.")
    base_name: str = Field(..., description="The base name for renaming files.")

    # Image Processing Options
    quality_optimized: int = Field(95, ge=1, le=100)
    quality_compressed: int = Field(80, ge=1, le=100)
    generate_optimized_jpg: bool = True
    generate_optimized_webp: bool = True
    generate_compressed_jpg: bool = True
    generate_compressed_webp: bool = True

    # EXIF/Metadata Options
    exif_option: str = "keep"  # 'keep', 'strip_all', 'date', 'camera', 'both'

    # File Handling Options
    include_raw_files: bool = False
    rename_files: bool = True

    # Packaging Options
    create_zip_packages: bool = True
    zip_compression_level: int = Field(6, ge=0, le=9)

    # Branding/Delivery Options
    delivery_company_name: str = ""
    delivery_website: str = ""
    delivery_support_email: str = ""


class JobResponse(BaseModel):
    """Response model after a job is submitted."""
    job_id: str
    status: str
    message: str
