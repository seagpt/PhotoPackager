from pydantic import BaseModel, Field
from typing import List

class QualitySettings(BaseModel):
    """Settings for a specific output quality."""
    directory_name: str
    file_format: str
    quality_level: int

class PhotoPackagerSettings(BaseModel):
    """Internal settings model for a packaging job."""
    quality_settings: List[QualitySettings]
    create_zip: bool = True
