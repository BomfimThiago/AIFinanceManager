import io
import logging

from PIL import Image

from src.shared.exceptions import ProcessingError

logger = logging.getLogger(__name__)


class OCRService:
    def preprocess_image(self, image_data: bytes) -> Image.Image:
        """Preprocess image for better OCR results."""
        try:
            image = Image.open(io.BytesIO(image_data))

            # Convert to RGB if necessary
            if image.mode in ("RGBA", "P"):
                image = image.convert("RGB")

            # Convert to grayscale for better OCR
            image = image.convert("L")

            return image
        except Exception as e:
            logger.error(f"Image preprocessing error: {e}")
            raise ProcessingError(f"Failed to process image: {e}")

    def extract_images_from_pdf(self, pdf_data: bytes) -> list[Image.Image]:
        """Extract images from PDF pages."""
        try:
            import fitz  # PyMuPDF

            images = []
            pdf_document = fitz.open(stream=pdf_data, filetype="pdf")

            for page_num in range(len(pdf_document)):
                page = pdf_document[page_num]
                # Render page to image at 300 DPI for better OCR
                mat = fitz.Matrix(300 / 72, 300 / 72)
                pix = page.get_pixmap(matrix=mat)

                # Convert to PIL Image
                img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
                # Convert to grayscale for OCR
                img = img.convert("L")
                images.append(img)

            pdf_document.close()
            return images

        except ImportError:
            logger.error("PyMuPDF not available")
            raise ProcessingError("PDF processing not available. Please install pymupdf.")
        except Exception as e:
            logger.error(f"PDF extraction error: {e}")
            raise ProcessingError(f"Failed to extract images from PDF: {e}")

    async def extract_text(self, image_data: bytes) -> str:
        """Extract text from image using OCR."""
        try:
            import pytesseract

            processed_image = self.preprocess_image(image_data)
            text = pytesseract.image_to_string(processed_image)

            if not text.strip():
                raise ProcessingError("No text could be extracted from the image")

            return text

        except ImportError:
            logger.warning("pytesseract not available, using placeholder")
            raise ProcessingError("OCR service not configured. Please install tesseract-ocr.")
        except Exception as e:
            logger.error(f"OCR extraction error: {e}")
            raise ProcessingError(f"Failed to extract text: {e}")

    async def extract_text_from_pdf(self, pdf_data: bytes) -> str:
        """Extract text from PDF using OCR on each page."""
        try:
            import pytesseract

            images = self.extract_images_from_pdf(pdf_data)

            if not images:
                raise ProcessingError("No pages found in PDF")

            all_text = []
            for i, image in enumerate(images):
                page_text = pytesseract.image_to_string(image)
                if page_text.strip():
                    all_text.append(f"--- Page {i + 1} ---\n{page_text}")

            combined_text = "\n\n".join(all_text)

            if not combined_text.strip():
                raise ProcessingError("No text could be extracted from the PDF")

            return combined_text

        except ImportError:
            logger.warning("pytesseract not available")
            raise ProcessingError("OCR service not configured. Please install tesseract-ocr.")
        except ProcessingError:
            raise
        except Exception as e:
            logger.error(f"PDF OCR extraction error: {e}")
            raise ProcessingError(f"Failed to extract text from PDF: {e}")


def get_ocr_service() -> OCRService:
    return OCRService()
