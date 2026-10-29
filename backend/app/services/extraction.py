import re
import json
import logging
import httpx
from typing import Dict, Any, List, Optional
from app.config import settings
from app.schemas.ticket import TicketCategory, TicketPriority, IssueExtractionResponse

logger = logging.getLogger(__name__)


class IssueExtractionService:
    def __init__(self):
        self.engine = settings.EXTRACTION_ENGINE
        self.openai_key = settings.OPENAI_API_KEY

    def extract_structured_issue(self, transcript: str, language: str = "te-IN") -> IssueExtractionResponse:
        """
        Extract title, description, category, location, and priority from the reviewed transcript.
        Tries OpenAI LLM (gpt-4o-mini) if configured, and falls back seamlessly to the deterministic
        rules engine if OpenAI quota is exhausted or unavailable.
        """
        # Try OpenAI if API key is provided
        if self.openai_key and self.engine in ["openai", "hybrid", "llm"]:
            try:
                llm_result = self._extract_with_openai(transcript, language)
                if llm_result:
                    return llm_result
            except Exception as exc:
                logger.warning(f"OpenAI extraction failed, falling back to rule engine: {exc}")

        # Fallback / Default: Deterministic Rule-Based Extraction Engine
        return self._extract_with_rules(transcript, language)

    def _extract_with_openai(self, transcript: str, language: str) -> Optional[IssueExtractionResponse]:
        """
        Extract structured fields using OpenAI gpt-4o-mini with JSON schema constraints.
        """
        system_prompt = (
            "You are an expert AI operational assistant for VoiceOps, an issue management system "
            "for college campuses and facilities. Given a user's spoken complaint (which may be in English, "
            "Telugu, or Telugu-English code-mixed speech), extract structured JSON data:\n"
            "1. title: Short summary of the problem (max 60 chars)\n"
            "2. description: Full clear description of the problem\n"
            "3. category: Exactly one of ['Network', 'Hardware', 'Electrical', 'Plumbing', 'Facility', 'Other']\n"
            "4. location: Campus room/hall/lab/floor if mentioned, or null if missing\n"
            "5. priority: Exactly one of ['Low', 'Medium', 'High', 'Critical'] based on severity and urgency\n"
            "6. missing_fields: List of missing critical fields, e.g. ['location'] if not mentioned\n"
            "7. confidence: Floating point number from 0.0 to 1.0\n"
            "8. reasoning: Short explanation of why the category and priority were selected.\n"
            "Return ONLY valid JSON matching this schema."
        )

        headers = {
            "Authorization": f"Bearer {self.openai_key}",
            "Content-Type": "application/json"
        }
        payload = {
            "model": "gpt-4o-mini",
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Language: {language}\nComplaint: {transcript}"}
            ],
            "response_format": {"type": "json_object"},
            "temperature": 0.1,
            "max_tokens": 400
        }

        with httpx.Client(timeout=10.0) as client:
            res = client.post("https://api.openai.com/v1/chat/completions", headers=headers, json=payload)

        if res.status_code != 200:
            error_data = res.json().get("error", {})
            error_code = error_data.get("code") or error_data.get("type", "unknown")
            logger.warning(f"OpenAI API error {res.status_code}: {error_code} - {error_data.get('message')}")
            return None

        data = res.json()
        content = data["choices"][0]["message"]["content"]
        parsed = json.loads(content)

        # Validate category enum
        raw_cat = str(parsed.get("category", "Other")).capitalize()
        category = TicketCategory.OTHER
        for cat in TicketCategory:
            if cat.value.lower() == raw_cat.lower():
                category = cat
                break

        # Validate priority enum
        raw_pri = str(parsed.get("priority", "Medium")).capitalize()
        priority = TicketPriority.MEDIUM
        for pri in TicketPriority:
            if pri.value.lower() == raw_pri.lower():
                priority = pri
                break

        location = parsed.get("location")
        if location and str(location).strip().lower() in ["null", "none", "unknown", ""]:
            location = None

        missing_fields = parsed.get("missing_fields", [])
        if not location and "location" not in missing_fields:
            missing_fields.append("location")

        return IssueExtractionResponse(
            title=str(parsed.get("title", f"{category.value} issue reported")),
            description=str(parsed.get("description", transcript)),
            category=category,
            location=location,
            priority=priority,
            confidence=round(float(parsed.get("confidence", 0.95)), 2),
            missing_fields=missing_fields,
            reasoning=f"[OpenAI gpt-4o-mini] {parsed.get('reasoning', 'Extracted via OpenAI LLM')}"
        )

    def _extract_with_rules(self, transcript: str, language: str) -> IssueExtractionResponse:
        """
        Deterministic rule-based heuristics with Telugu and English support.
        """
        text = transcript.strip()
        lower_text = text.lower()

        # 1. Determine Category
        category = self._detect_category(lower_text)

        # 2. Extract Location
        location = self._detect_location(text, lower_text)

        # 3. Determine Priority based on operational rules
        priority, reasoning = self._detect_priority(lower_text, category)

        # 4. Generate Clean Title & Description
        title = self._generate_title(text, lower_text, category, location)
        description = text

        # 5. Identify Missing Fields
        missing_fields: List[str] = []
        if not location:
            missing_fields.append("location")

        # Confidence calculation
        confidence = 0.90 if location else 0.75
        if category == TicketCategory.OTHER:
            confidence -= 0.15

        if self.openai_key:
            reasoning = f"{reasoning} (OpenAI key configured; fallback to Rule Engine due to credit balance)"

        return IssueExtractionResponse(
            title=title,
            description=description,
            category=category,
            location=location,
            priority=priority,
            confidence=round(confidence, 2),
            missing_fields=missing_fields,
            reasoning=reasoning
        )

    def _detect_category(self, text: str) -> TicketCategory:
        network_keywords = [
            "wifi", "wi-fi", "internet", "router", "lan", "network", "ethernet",
            "connection", "disconnect", "proxy", "dns", "ఇంటర్నెట్", "నెట్‌వర్క్"
        ]
        hardware_keywords = [
            "projector", "screen", "monitor", "pc", "computer", "keyboard", "mouse",
            "printer", "scanner", "cpu", "speaker", "hdmi", "vga", "display", "ప్రొజెక్టర్",
            "కంప్యూటర్", "మానిటర్"
        ]
        electrical_keywords = [
            "spark", "power", "socket", "switchboard", "wire", "electricity", "fuse",
            "breaker", "tripping", "blackout", "light", "bulb", "fan", "ac", "air conditioner",
            "ups", "battery", "voltage", "కరెంట్", "విద్యుత్", "స్పార్క్"
        ]
        plumbing_keywords = [
            "leak", "water", "pipe", "tap", "faucet", "toilet", "washroom", "basin",
            "sink", "drain", "dispenser", "overflow", "నీరు", "పైపు", "లీక్"
        ]
        facility_keywords = [
            "door", "bench", "desk", "window", "chair", "glass", "lock", "key",
            "roof", "wall", "paint", "whiteboard", "classroom", "corridor", "తలుపు", "కిటికీ"
        ]

        if any(kw in text for kw in network_keywords):
            return TicketCategory.NETWORK
        if any(kw in text for kw in electrical_keywords):
            return TicketCategory.ELECTRICAL
        if any(kw in text for kw in hardware_keywords):
            return TicketCategory.HARDWARE
        if any(kw in text for kw in plumbing_keywords):
            return TicketCategory.PLUMBING
        if any(kw in text for kw in facility_keywords):
            return TicketCategory.FACILITY

        return TicketCategory.OTHER

    def _detect_location(self, original_text: str, lower_text: str) -> Optional[str]:
        patterns = [
            r"(?:in|at|near|on)\s+((?:the\s+)?(?:computer\s+lab|lab|classroom|room|seminar\s+hall|library|cse\s+block|ece\s+block|workbench|floor)\s*[a-zA-Z0-9\-\s]{1,20})",
            r"([a-zA-Z0-9\s\-]+(?:lab|classroom|room|hall|block))\s+lo\b",
            r"\b(computer\s+lab\s*\d*|classroom\s*(?:two|one|three|\d+)|seminar\s+hall\s*[a-zA-Z0-9]*|cse\s+block|library)\b"
        ]

        for pattern in patterns:
            match = re.search(pattern, lower_text, re.IGNORECASE)
            if match:
                loc = match.group(1).strip()
                if loc.lower().startswith("the "):
                    loc = loc[4:].strip()
                return loc.title()

        return None

    def _detect_priority(self, text: str, category: TicketCategory) -> (TicketPriority, str):
        critical_kw = ["spark", "fire", "smoke", "short circuit", "flood", "tripping the breaker", "entire campus", "danger"]
        for kw in critical_kw:
            if kw in text:
                return TicketPriority.CRITICAL, f"Critical safety or infrastructure hazard detected ('{kw}')"

        high_kw = ["not working since morning", "cannot submit", "exam", "entire lab", "whole class", "keeps restarting", "leaking continuously"]
        for kw in high_kw:
            if kw in text:
                return TicketPriority.HIGH, f"High operational impact affecting workflow/classes ('{kw}')"

        low_kw = ["minor", "loose screw", "dirty", "cosmetic", "flickering occasionally"]
        for kw in low_kw:
            if kw in text:
                return TicketPriority.LOW, f"Minor non-blocking issue ('{kw}')"

        if category in [TicketCategory.NETWORK, TicketCategory.ELECTRICAL]:
            return TicketPriority.HIGH, "Network and electrical issues default to High priority"

        return TicketPriority.MEDIUM, "Standard operational issue priority"

    def _generate_title(self, original_text: str, lower_text: str, category: TicketCategory, location: Optional[str]) -> str:
        loc_str = f" in {location}" if location else ""

        if "internet" in lower_text or "wifi" in lower_text:
            return f"Internet connectivity failure{loc_str}"
        if "projector" in lower_text:
            return f"Projector display failure{loc_str}"
        if "spark" in lower_text or "breaker" in lower_text:
            return f"Electrical spark / power fault{loc_str}"
        if "leak" in lower_text or "water" in lower_text:
            return f"Water leakage / plumbing defect{loc_str}"
        if "switch on" in lower_text or "not turning on" in lower_text:
            return f"Equipment failing to power on{loc_str}"

        first_clause = original_text.split(",")[0].split(".")[0].strip()
        if len(first_clause) <= 80:
            return first_clause.capitalize()
        return f"{category.value} issue reported{loc_str}"

    def test_openai_connection(self) -> Dict[str, Any]:
        """
        Check OpenAI API key connectivity and account quota status.
        """
        if not self.openai_key:
            return {
                "configured": False,
                "message": "OPENAI_API_KEY is not configured in .env."
            }

        headers = {
            "Authorization": f"Bearer {self.openai_key}",
            "Content-Type": "application/json"
        }
        payload = {
            "model": "gpt-4o-mini",
            "messages": [{"role": "user", "content": "Ping"}],
            "max_tokens": 5
        }

        try:
            with httpx.Client(timeout=10.0) as client:
                res = client.post("https://api.openai.com/v1/chat/completions", headers=headers, json=payload)

            if res.status_code == 200:
                return {
                    "configured": True,
                    "connected": True,
                    "status_code": 200,
                    "model": "gpt-4o-mini",
                    "message": "OpenAI API connection active and credits available."
                }
            else:
                err_body = res.json().get("error", {})
                code = err_body.get("code") or err_body.get("type", "unknown")
                msg = err_body.get("message", res.text)
                return {
                    "configured": True,
                    "connected": False,
                    "status_code": res.status_code,
                    "error_code": code,
                    "message": msg,
                    "action_required": "Add credits at https://platform.openai.com/settings/organization/billing/ to enable GPT-4o-mini extraction."
                }
        except Exception as exc:
            return {
                "configured": True,
                "connected": False,
                "error": str(exc),
                "message": f"Failed to reach OpenAI: {str(exc)}"
            }


extraction_service = IssueExtractionService()
