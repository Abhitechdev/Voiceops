import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { transcript_reviewed, language = "te-IN" } = await req.json();

    if (!transcript_reviewed || !transcript_reviewed.trim()) {
      return NextResponse.json(
        { detail: "Reviewed transcript cannot be empty." },
        { status: 400 }
      );
    }

    const text = transcript_reviewed.trim();
    const lower = text.toLowerCase();

    // 1. Category Detection
    let category = "Other";
    if (
      /internet|wi-?fi|network|\blan\b|router|cable|switch|dns|slow net|offline|ఇంటర్నెట్|నెట్‌వర్క్|రౌటర్|కనెక్షన్/i.test(
        lower
      )
    ) {
      category = "Network";
    } else if (
      /projector|monitor|screen|hdmi|mouse|keyboard|printer|cpu|desktop|laptop|speaker|mic\b|ప్రొజెక్టర్|స్క్రీన్|కంప్యూటర్|కీబోర్డ్|మౌస్/i.test(
        lower
      )
    ) {
      category = "Hardware";
    } else if (
      /spark|short circuit|power cut|tripping|socket|switch board|wire|breaker|bulb|tube light|\blight\b|కరెంట్|స్పార్క్|షాక్|పవర్/i.test(
        lower
      )
    ) {
      category = "Electrical";
    } else if (
      /leak|water|pipe|tap|flush|drain|overflow|basin|washroom|restroom|cooler|నీరు|లీకేజ్|పైప్|ట్యాప్/i.test(
        lower
      )
    ) {
      category = "Plumbing";
    } else if (
      /bench|desk|chair|door|window|lock|hinge|\bac\b|air condition|fan\b|whiteboard|blackboard|బెంచ్|కుర్చీ|ఫ్యాన్|ఏసీ/i.test(
        lower
      )
    ) {
      category = "Facilities";
    } else if (/crash|software|\bos\b|windows|linux|login failed|compiler/i.test(lower)) {
      category = "Software";
    }

    // 2. Location Detection
    let location: string | null = null;
    const missingFields: string[] = [];

    const labMatch = text.match(/(?:computer\s+lab|lab)\s*([0-9a-zA-Z\-_]+)/i);
    const roomMatch = text.match(/(?:classroom|room)\s*([0-9a-zA-Z\-_]+)/i);
    const hallMatch = text.match(/(?:seminar\s+hall)\s*([0-9a-zA-Z\-_]+)/i);
    const deptMatch = text.match(/(?:cse|ece|eee|mech|civil)\s*(?:department|block|building)/i);
    const floorMatch = text.match(/(?:second|first|third|ground|2nd|1st|3rd)\s+floor/i);
    const benchMatch = text.match(/(?:electronics\s+lab\s+bench|workbench)\s*([0-9a-zA-Z\-_]+)/i);

    if (labMatch) {
      location = `Computer Lab ${labMatch[1].toUpperCase()}`;
    } else if (roomMatch) {
      location = `Classroom ${roomMatch[1]}`;
    } else if (hallMatch) {
      location = `Seminar Hall ${hallMatch[1]}`;
    } else if (benchMatch) {
      location = `Electronics Lab Bench ${benchMatch[1]}`;
    } else if (deptMatch && floorMatch) {
      location = `${deptMatch[0].toUpperCase()} (${floorMatch[0]})`;
    } else if (deptMatch) {
      location = deptMatch[0].toUpperCase();
    } else if (floorMatch) {
      location = floorMatch[0];
    } else if (/classroom two|classroom 2/i.test(lower)) {
      location = "Classroom Two";
    } else {
      missingFields.push("location");
    }

    // 3. Priority Detection
    let priority = "Medium";
    let reasoning = `Classified as ${category} (${priority} priority) based on Indic domain keywords.`;

    if (/spark|fire|danger|electric shock|emergency|urgent|ప్రమాదం|స్పార్క్/i.test(lower)) {
      priority = "Critical";
      reasoning = "Critical safety risk detected (sparks, circuit breaker, or danger).";
    } else if (
      /not working since morning|cannot submit|stopped completely|deadline|entire lab/i.test(
        lower
      )
    ) {
      priority = "High";
      reasoning = "High operational disruption impacting multiple users or deadlines.";
    } else if (/minor|cosmetic|sometime|later|small/i.test(lower)) {
      priority = "Low";
      reasoning = "Low urgency operational maintenance.";
    }

    // 4. Title Extraction
    let title = text.split(/[.,\n]/)[0].trim();
    if (title.length > 70) {
      title = `${category} issue in ${location || "Campus Facility"}`;
    }

    return NextResponse.json({
      title: title || `${category} Service Request`,
      description: text,
      category,
      location: location || undefined,
      priority,
      confidence: 0.92,
      missing_fields: missingFields,
      reasoning,
    });
  } catch (error: any) {
    return NextResponse.json(
      { detail: `Extraction error: ${error.message}` },
      { status: 500 }
    );
  }
}

