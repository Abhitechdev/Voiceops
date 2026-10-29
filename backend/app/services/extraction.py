import re
from typing import Dict, Any, List, Optional
from app.config import settings
from app.schemas.ticket import TicketCategory, TicketPriority, IssueExtractionResponse


class IssueExtractionService:
    def __init__(self):
        self.engine = settings.EXTRACTION_ENGINE

    def extract_structured_issue(self, transcript: str, language: str = "te-IN") -> IssueExtractionResponse:
        """
        Extract title, description, category, location, and priority from the reviewed transcript.
        Uses rule-based heuristics with Telugu/English domain support, and optional LLM provider if configured.
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

        # Check in priority of specificity
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
        # English patterns: "in classroom 2", "in computer lab 3", "at seminar hall A", "on 2nd floor"
        patterns = [
            r"(?:in|at|near|on)\s+((?:the\s+)?(?:computer\s+lab|lab|classroom|room|seminar\s+hall|library|cse\s+block|ece\s+block|workbench|floor)\s*[a-zA-Z0-9\-\s]{1,20})",
            # Code-mixed Telugu pattern with "lo" ("classroom two lo", "computer lab 3 lo")
            r"([a-zA-Z0-9\s\-]+(?:lab|classroom|room|hall|block))\s+lo\b",
            # Standalone common rooms
            r"\b(computer\s+lab\s*\d*|classroom\s*(?:two|one|three|\d+)|seminar\s+hall\s*[a-zA-Z0-9]*|cse\s+block|library)\b"
        ]

        for pattern in patterns:
            match = re.search(pattern, lower_text, re.IGNORECASE)
            if match:
                loc = match.group(1).strip()
                # Clean up leading "the" if present
                if loc.lower().startswith("the "):
                    loc = loc[4:].strip()
                return loc.title()

        return None

    def _detect_priority(self, text: str, category: TicketCategory) -> (TicketPriority, str):
        # Critical keywords
        critical_kw = ["spark", "fire", "smoke", "short circuit", "flood", "tripping the breaker", "entire campus", "danger"]
        for kw in critical_kw:
            if kw in text:
                return TicketPriority.CRITICAL, f"Critical safety or infrastructure hazard detected ('{kw}')"

        # High priority keywords
        high_kw = ["not working since morning", "cannot submit", "exam", "entire lab", "whole class", "keeps restarting", "leaking continuously"]
        for kw in high_kw:
            if kw in text:
                return TicketPriority.HIGH, f"High operational impact affecting workflow/classes ('{kw}')"

        # Low priority keywords
        low_kw = ["minor", "loose screw", "dirty", "cosmetic", "flickering occasionally"]
        for kw in low_kw:
            if kw in text:
                return TicketPriority.LOW, f"Minor non-blocking issue ('{kw}')"

        # Default rules per category
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

        # Truncate first sentence as title if specific match not found
        first_clause = original_text.split(",")[0].split(".")[0].strip()
        if len(first_clause) <= 80:
            return first_clause.capitalize()
        return f"{category.value} issue reported{loc_str}"


extraction_service = IssueExtractionService()
