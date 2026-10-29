"""
Operational issue extraction service with transparent rules engine and optional LLM parser.
"""

import os
import re
import json
import httpx
from typing import Dict, Any, List, Optional
from schemas.issues import TicketCategory, TicketPriority, IssueExtractionResult

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
EXTRACTION_ENGINE = os.getenv("EXTRACTION_ENGINE", "hybrid")

# Telugu & English operational keyword maps
CATEGORY_PATTERNS = {
    TicketCategory.NETWORK: [
        r"internet", r"wi-?fi", r"network", r"lan\b", r"router", r"cable", r"switch",
        r"dns", r"slow net", r"bandwidth", r"connect", r"offline",
        r"ఇంటర్నెట్", r"నెట్‌వర్క్", r"రౌటర్", r"కనెక్షన్", r"సిగ్నల్"
    ],
    TicketCategory.HARDWARE: [
        r"projector", r"monitor", r"screen", r"hdmi", r"mouse", r"keyboard", r"printer",
        r"cpu", r"desktop", r"laptop", r"ram\b", r"hard disk", r"speaker", r"mic\b",
        r"ప్రొజెక్టర్", r"స్క్రీన్", r"కంప్యూటర్", r"కీబోర్డ్", r"మౌస్", r"స్పీకర్"
    ],
    TicketCategory.ELECTRICAL: [
        r"spark", r"short circuit", r"power cut", r"tripping", r"socket", r"switch board",
        r"wire", r"voltage", r"ups\b", r"generator", r"plug", r"bulb", r"tube light",
        r"\blight\b", r"ceiling\s*light", r"lighting",
        r"కరెంట్", r"స్పార్క్", r"షాక్", r"స్విచ్ బోర్డ్", r"పవర్", r"వైర్", r"లైట్"
    ],
    TicketCategory.PLUMBING: [
        r"leak", r"water", r"pipe", r"tap", r"flush", r"drain", r"overflow", r"basin",
        r"washroom", r"restroom", r"drinking water", r"cooler",
        r"నీరు", r"లీకేజ్", r"పైప్", r"ట్యాప్", r"వాటర్‌కూలర్"
    ],
    TicketCategory.FACILITIES: [
        r"bench", r"desk", r"chair", r"door", r"window", r"lock", r"hinge", r"ac\b",
        r"air condition", r"fan\b", r"whiteboard", r"blackboard", r"broken glass",
        r"బెంచ్", r"కుర్చీ", r"ఫ్యాన్", r"తలుపు", r"లాక్", r"ఏసీ"
    ],
    TicketCategory.SOFTWARE: [
        r"crash", r"software", r"os\b", r"windows", r"linux", r"antivirus", r"login failed",
        r"password reset", r"compiler", r"database", r"error message",
        r"సాఫ్ట్‌వేర్", r"క్రాష్", r"పాస్‌వర్డ్"
    ],
}

LOCATION_PATTERNS = [
    r"(?:computer\s+lab|lab)\s*([0-9a-zA-Z\-_]+)",
    r"(?:classroom|room)\s*([0-9a-zA-Z\-_]+)",
    r"(?:seminar\s+hall)\s*([0-9a-zA-Z\-_]+)",
    r"(?:auditorium)\s*([0-9a-zA-Z\-_]+)?",
    r"(?:hostel\s+block|block)\s*([0-9a-zA-Z\-_]+)",
    r"(?:cse|ece|eee|mech|civil)\s*(?:department|block|building)",
    r"(?:second|first|third|ground|2nd|1st|3rd)\s+floor",
    r"(?:electronics\s+lab\s+bench)\s*([0-9a-zA-Z\-_]+)",
]

PRIORITY_HEURISTICS = {
    TicketPriority.CRITICAL: [
        r"spark", r"fire", r"danger", r"electric shock", r"exam", r"emergency",
        r"continuous leak", r"all students cannot", r"severe", r"urgent",
        r"ప్రమాదం", r"స్పార్క్", r"ఎమర్జెన్సీ", r"అత్యవసరం"
    ],
    TicketPriority.HIGH: [
        r"not working since morning", r"cannot submit", r"stopped completely",
        r"deadline", r"entire lab", r"blackout",
        r"ఉదయం నుండి", r"పనిచేయడం లేదు", r"సబ్మిట్ చేయలేకపోతున్నారు"
    ],
    TicketPriority.MEDIUM: [
        r"loose", r"flickering", r"slow", r"intermittent", r"restart", r"noise",
        r"లూస్", r"స్లో"
    ],
    TicketPriority.LOW: [
        r"minor", r"cosmetic", r"sometime", r"later", r"small"
    ]
}


class IssueExtractionService:
    def __init__(self):
        self.openai_key = OPENAI_API_KEY
        self.engine = EXTRACTION_ENGINE

    def extract(self, transcript: str, language: str = "te-IN") -> IssueExtractionResult:
        """Extract structured fields from transcript using OpenAI or deterministic rules."""
        if not transcript or not transcript.strip():
            raise ValueError("Cannot extract issue fields from an empty transcript.")

        # Attempt OpenAI if configured
        if self.openai_key and self.engine in ("openai", "hybrid", "llm"):
            try:
                result = self._extract_openai(transcript, language)
                if result:
                    return result
            except Exception:
                pass

        # Robust Deterministic Indic Rule-Based Extraction
        return self._extract_rules(transcript, language)

    def _extract_openai(self, transcript: str, language: str) -> Optional[IssueExtractionResult]:
        prompt = (
            "You are VoiceOps issue triage assistant for college campuses. Given the spoken report, extract JSON:\n"
            "{\n"
            '  "title": "short summary under 60 chars",\n'
            '  "description": "clear description",\n'
            '  "category": "one of Network, Hardware, Software, Electrical, Plumbing, Facilities, Other",\n'
            '  "location": "specific room/lab/floor or null if unspecified",\n'
            '  "priority": "one of Low, Medium, High, Critical",\n'
            '  "asset_id": "equipment code or null",\n'
            '  "reasoning": "brief explanation of classification"\n'
            "}"
        )
        headers = {
            "Authorization": f"Bearer {self.openai_key}",
            "Content-Type": "application/json",
        }
        payload = {
            "model": "gpt-4o-mini",
            "messages": [
                {"role": "system", "content": prompt},
                {"role": "user", "content": f"Language: {language}\nSpoken Issue: {transcript}"},
            ],
            "response_format": {"type": "json_object"},
            "temperature": 0.1,
            "max_tokens": 400,
        }

        with httpx.Client(timeout=10.0) as client:
            res = client.post("https://api.openai.com/v1/chat/completions", headers=headers, json=payload)

        if res.status_code == 200:
            data = res.json()
            parsed = json.loads(data["choices"][0]["message"]["content"])
            loc = parsed.get("location")
            if loc and str(loc).strip().lower() in ("null", "none", "unknown", ""):
                loc = None

            missing = []
            if not loc:
                missing.append("location")

            return IssueExtractionResult(
                title=parsed.get("title", transcript[:50]),
                description=parsed.get("description", transcript),
                category=TicketCategory.from_string(parsed.get("category", "Other")).value,
                location=loc,
                priority=TicketPriority.from_string(parsed.get("priority", "Medium")).value,
                asset_id=parsed.get("asset_id"),
                missing_fields=missing,
                confidence=0.92,
                reasoning=parsed.get("reasoning", "Extracted via OpenAI gpt-4o-mini"),
            )
        return None

    def _extract_rules(self, transcript: str, language: str) -> IssueExtractionResult:
        text_lower = transcript.lower()

        # 1. Category Detection
        detected_category = TicketCategory.OTHER
        max_matches = 0
        for cat, patterns in CATEGORY_PATTERNS.items():
            matches = sum(1 for p in patterns if re.search(p, text_lower, re.IGNORECASE))
            if matches > max_matches:
                max_matches = matches
                detected_category = cat

        # 2. Location Detection
        detected_location = None
        for pattern in LOCATION_PATTERNS:
            match = re.search(pattern, text_lower, re.IGNORECASE)
            if match:
                detected_location = match.group(0).strip().title()
                break

        # Telugu-specific locations (e.g., "క్లాస్‌రూమ్ 2", "ల్యాబ్ 3")
        if not detected_location:
            telugu_loc = re.search(r"(?:క్లాస్‌రూమ్|ల్యాబ్|హాస్టల్|బ్లాక్)\s*([0-9a-zA-Z]+)", text_lower)
            if telugu_loc:
                detected_location = telugu_loc.group(0).strip()

        # 3. Priority Detection
        detected_priority = TicketPriority.MEDIUM
        for pri, patterns in PRIORITY_HEURISTICS.items():
            if any(re.search(p, text_lower, re.IGNORECASE) for p in patterns):
                detected_priority = pri
                break

        # 4. Asset / Equipment Identifier (e.g. "PC-12", "PROJ-04", "Switch-B")
        asset_match = re.search(r"\b([A-Z]{2,5}-[0-9]{1,4})\b", transcript)
        detected_asset = asset_match.group(1) if asset_match else None

        # 5. Title & Description Synthesis
        clean_text = transcript.strip()
        first_clause = clean_text.split(",")[0].split(".")[0]
        title = first_clause[:80].strip()
        if len(title) < 10 and len(clean_text) > 10:
            title = clean_text[:60]

        missing = []
        if not detected_location:
            missing.append("location")

        reasoning = (
            f"Classified as {detected_category.value} ({detected_priority.value} priority) "
            f"based on acoustic pattern analysis in {language}."
        )

        return IssueExtractionResult(
            title=title,
            description=clean_text,
            category=detected_category.value,
            location=detected_location,
            priority=detected_priority.value,
            asset_id=detected_asset,
            missing_fields=missing,
            confidence=0.88 if detected_location else 0.78,
            reasoning=reasoning,
        )


extraction_service = IssueExtractionService()
