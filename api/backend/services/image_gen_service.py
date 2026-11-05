import os
import io
import time
import base64
import logging
from abc import ABC, abstractmethod
from typing import Dict, Any, Optional
from PIL import Image, ImageDraw, ImageFont

logger = logging.getLogger(__name__)

HARD_CASE_PRESETS = {
    "low_light": {
        "title": "Low-Light / Underexposed",
        "prompt": "A dimly lit bedroom at night with a single faint reading lamp in the corner and shadows obscuring furniture",
        "description": "Tests vision robustness under extreme underexposure and low contrast."
    },
    "cluttered": {
        "title": "Cluttered Desktop",
        "prompt": "An extremely cluttered office desk covered with overlapping notebooks, tangled cables, coffee mugs, and loose pens",
        "description": "Tests spatial reasoning and object localization amidst visual distractors."
    },
    "occluded": {
        "title": "Partially Occluded Object",
        "prompt": "A red backpack almost entirely hidden behind a wooden coat rack and thick winter coats",
        "description": "Tests pattern completion and partial visibility reasoning."
    },
    "tiny_objects": {
        "title": "Tiny / Small Objects",
        "prompt": "A wide angle photograph of a vast living room with a small silver key resting on the distant floor rug",
        "description": "Tests spatial resolution limits on sub-pixel or minute objects."
    },
    "glare_reflection": {
        "title": "Glare & Specular Reflection",
        "prompt": "A storefront glass window with intense sunlight glare and reflections masking the items displayed inside",
        "description": "Tests artifact rejection against harsh specular highlights and reflections."
    },
    "many_counting": {
        "title": "Many-Item Counting Challenge",
        "prompt": "A bowl filled with exactly twelve bright yellow lemons lined up on a wooden kitchen counter",
        "description": "Tests high-density enumerative counting capabilities."
    }
}

class ImageGenProvider(ABC):
    @abstractmethod
    def generate(self, prompt: str) -> Image.Image:
        pass

class HFInferenceProvider(ImageGenProvider):
    def __init__(self, token: Optional[str] = None):
        self.token = token or os.environ.get("HF_TOKEN")

    def generate(self, prompt: str) -> Image.Image:
        from huggingface_hub import InferenceClient
        client = InferenceClient(token=self.token)
        # Use sd-turbo for fast free-tier CPU/Inference API text-to-image
        image = client.text_to_image(prompt, model="stabilityai/sd-turbo")
        return image

class GeminiImageProvider(ImageGenProvider):
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.environ.get("GEMINI_API_KEY")

    def generate(self, prompt: str) -> Image.Image:
        from google import genai
        from google.genai import types
        client = genai.Client(api_key=self.api_key)
        # Attempt imagen generation
        try:
            res = client.models.generate_images(
                model="imagen-3.0-generate-001",
                prompt=prompt,
                config=types.GenerateImagesConfig(
                    number_of_images=1,
                    output_mime_type="image/jpeg"
                )
            )
            raw_bytes = res.generated_images[0].image.image_bytes
            return Image.open(io.BytesIO(raw_bytes))
        except Exception:
            # Fallback to nano-banana image generation if available
            interaction = client.interactions.create(
                model="gemini-2.5-flash-image",
                input=prompt
            )
            if hasattr(interaction, "output_image") and interaction.output_image:
                raw_bytes = base64.b64decode(interaction.output_image.data)
                return Image.open(io.BytesIO(raw_bytes))
            raise

class ProceduralFallbackProvider(ImageGenProvider):
    """Graceful fallback if neither HF nor Gemini image keys or quotas are available."""
    def generate(self, prompt: str) -> Image.Image:
        # Create a synthetic 512x512 image representing the prompt
        img = Image.new("RGB", (512, 512), color=(28, 32, 45))
        draw = ImageDraw.Draw(img)
        
        # Draw background geometric patterns
        for i in range(10, 500, 40):
            draw.line([(0, i), (512, i + 20)], fill=(40, 45, 65), width=2)
            draw.line([(i, 0), (i + 20, 512)], fill=(35, 40, 58), width=2)
            
        # Draw simulated focal objects
        draw.ellipse([180, 180, 332, 332], fill=(70, 90, 140), outline=(130, 160, 220), width=4)
        draw.rectangle([210, 210, 302, 302], fill=(220, 130, 70), outline=(255, 180, 120), width=3)
        
        # Text label
        draw.text((20, 440), "Synthetic Hard-Case Preset Image", fill=(200, 220, 255))
        draw.text((20, 470), f"Prompt: {prompt[:48]}...", fill=(160, 180, 210))
        return img

class ImageGenerationService:
    def __init__(self):
        self._provider_name = os.environ.get("IMAGE_PROVIDER", "hf").lower()

    def generate_image(self, prompt: str, requested_provider: Optional[str] = None) -> Dict[str, Any]:
        """Generate test image using configured provider, downscaling to 512px max."""
        provider_key = (requested_provider or self._provider_name).lower()
        t0 = time.perf_counter()
        image = None
        used_provider = provider_key
        error_note = None

        providers_to_try = []
        if provider_key == "gemini":
            providers_to_try = [("gemini", GeminiImageProvider), ("hf", HFInferenceProvider), ("fallback", ProceduralFallbackProvider)]
        else:
            providers_to_try = [("hf", HFInferenceProvider), ("gemini", GeminiImageProvider), ("fallback", ProceduralFallbackProvider)]

        for p_name, p_cls in providers_to_try:
            try:
                provider_instance = p_cls()
                image = provider_instance.generate(prompt)
                used_provider = p_name
                break
            except Exception as e:
                logger.warning(f"Provider {p_name} generation failed: {e}")
                error_note = str(e)
                continue

        if image is None:
            image = ProceduralFallbackProvider().generate(prompt)
            used_provider = "fallback"

        # Downscale to 512px
        if image.mode != "RGB":
            image = image.convert("RGB")
        max_dim = 512
        if max(image.size) > max_dim:
            image.thumbnail((max_dim, max_dim), Image.Resampling.LANCZOS)

        # Convert to base64 for API return
        buffered = io.BytesIO()
        image.save(buffered, format="JPEG", quality=85)
        img_str = base64.b64encode(buffered.getvalue()).decode("utf-8")
        latency_ms = int((time.perf_counter() - t0) * 1000)

        return {
            "image_base64": f"data:image/jpeg;base64,{img_str}",
            "provider": used_provider,
            "width": image.width,
            "height": image.height,
            "latency_ms": latency_ms,
            "error_note": error_note if used_provider == "fallback" else None
        }

image_gen_service = ImageGenerationService()
