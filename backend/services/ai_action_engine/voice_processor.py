"""
Voice processing module. Uses OpenAI's Whisper API to transcribe speech
to text, supporting clean fallback behaviors if offline or keys are missing.
"""
import os
import logging
import openai

logger = logging.getLogger(__name__)


def transcribe_voice_file(file_path: str) -> str:
    """
    Transcribes an audio file (wav, mp3, m4a, etc.) to text using OpenAI Whisper.
    Returns the raw transcript string.
    """
    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        logger.warning("No OPENAI_API_KEY set. Whisper transcription unavailable.")
        raise ValueError("AI Voice transcription requires an active OpenAI API key.")

    if not os.path.exists(file_path):
        raise FileNotFoundError(f"Audio file not found: {file_path}")

    try:
        base_url = os.environ.get("OPENAI_BASE_URL")
        # Ensure we use standard OpenAI client for Whisper
        client_kwargs = {'api_key': api_key}
        if base_url and 'openai.com' in base_url:
            client_kwargs['base_url'] = base_url

        client = openai.OpenAI(**client_kwargs)

        with open(file_path, "rb") as audio_file:
            transcript_obj = client.audio.transcriptions.create(
                model="whisper-1",
                file=audio_file
            )
            return transcript_obj.text.strip()
    except Exception as e:
        logger.error(f"Whisper transcription failed: {e}")
        raise RuntimeError(f"Speech-to-text processing failed: {str(e)}")
