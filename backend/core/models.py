"""
Modelos de dados para o sistema VCUT Pro
"""

from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from enum import Enum

class ProcessingStatus(str, Enum):
    UPLOADED = "uploaded"
    ANALYZING = "analyzing"
    TRANSCRIBING = "transcribing"
    PROCESSING = "processing"
    COMPLETED = "completed"
    ERROR = "error"

class VideoFormat(str, Enum):
    MP4 = "mp4"
    MOV = "mov"
    AVI = "avi"
    WEBM = "webm"
    MKV = "mkv"

class ProcessingRequest(BaseModel):
    job_id: str
    filename: str
    file_size: int
    format: VideoFormat

class TranscriptionSegment(BaseModel):
    text: str
    start: float
    end: float
    confidence: Optional[float] = None

class ImpactPhrase(BaseModel):
    text: str
    start: float
    end: float
    impact_score: int
    sentiment: Dict[str, Any]

class SceneChange(BaseModel):
    timestamp: float
    frame: int
    change_intensity: float

class AudioPattern(BaseModel):
    silences: List[Dict[str, float]]
    total_duration: float
    avg_volume: float

class ClipResult(BaseModel):
    id: str
    filename: str
    file_path: str
    start_time: float
    end_time: float
    duration: float
    impact_score: int
    description: str
    viral_potential: int

class ProcessingProgress(BaseModel):
    job_id: str
    status: ProcessingStatus
    progress: int  # 0-100
    stage: str
    clips: List[ClipResult] = []
    error: Optional[str] = None
    created_at: Optional[str] = None
    completed_at: Optional[str] = None

class VideoAnalysis(BaseModel):
    duration: float
    fps: float
    width: int
    height: int
    format: str
    size: int

class ContentAnalysis(BaseModel):
    transcription: Dict[str, Any]
    impact_phrases: List[ImpactPhrase]
    scenes: List[SceneChange]
    audio_patterns: AudioPattern
    total_segments: int
    avg_impact_score: float
