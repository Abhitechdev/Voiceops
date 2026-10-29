const API_BASE = process.env.NEXT_PUBLIC_API_URL || "/api";

export interface User {
  id: number;
  name: string;
  email: string;
  role: "reporter" | "admin";
  created_at: string;
}

export interface TicketNote {
  id: number;
  ticket_id: number;
  author_id?: number;
  author_name?: string;
  note: string;
  created_at: string;
}

export interface TicketHistory {
  id: number;
  ticket_id: number;
  actor_id?: number;
  actor_name?: string;
  action: string;
  previous_value?: string;
  new_value?: string;
  created_at: string;
}

export interface Ticket {
  id: number;
  ticket_number: string;
  reporter_id?: number;
  reporter_name?: string;
  title: string;
  description: string;
  transcript_original?: string;
  transcript_reviewed: string;
  category: string;
  location?: string;
  priority: string;
  status: string;
  assigned_to?: number;
  assignee_name?: string;
  resolution_notes?: string;
  created_at: string;
  updated_at: string;
  resolved_at?: string;
  history: TicketHistory[];
  notes: TicketNote[];
}

export interface IssueExtractionResult {
  title: string;
  description: string;
  category: string;
  location?: string;
  priority: string;
  confidence: number;
  missing_fields: string[];
  reasoning?: string;
}

export interface AnalyticsSummary {
  total_tickets: number;
  open_tickets: number;
  in_progress_tickets: number;
  resolved_tickets: number;
  closed_tickets: number;
  overdue_tickets: number;
  avg_resolution_hours: number;
  by_category: { category: string; count: number }[];
  by_priority: { priority: string; count: number }[];
  by_location: { location: string; count: number }[];
  trend_over_time: { date: string; count: number }[];
  sla_target_hours: number;
}

function getAuthHeader(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const token = localStorage.getItem("voiceops_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export const api = {
  // Health
  async checkHealth() {
    const res = await fetch(`${API_BASE}/health`);
    if (!res.ok) throw new Error("Backend service unreachable");
    return res.json();
  },

  // Auth
  async login(email: string, password: string) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || "Authentication failed");
    }
    const data = await res.json();
    if (typeof window !== "undefined") {
      localStorage.setItem("voiceops_token", data.access_token);
      localStorage.setItem("voiceops_user", JSON.stringify(data.user));
    }
    return data;
  },

  async register(userData: { name: string; email: string; password: string; role?: string }) {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userData),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || "Registration failed");
    }
    const data = await res.json();
    if (typeof window !== "undefined") {
      localStorage.setItem("voiceops_token", data.access_token);
      localStorage.setItem("voiceops_user", JSON.stringify(data.user));
    }
    return data;
  },

  getCurrentUser(): User | null {
    if (typeof window === "undefined") return null;
    const raw = localStorage.getItem("voiceops_user");
    return raw ? JSON.parse(raw) : null;
  },

  logout() {
    if (typeof window !== "undefined") {
      localStorage.removeItem("voiceops_token");
      localStorage.removeItem("voiceops_user");
    }
  },

  async testGnaniConnection() {
    const res = await fetch(`${API_BASE}/transcriptions/test-connection`);
    if (!res.ok) throw new Error("Connection test failed");
    return res.json() as Promise<{
      connected: boolean;
      status_code?: number;
      latency_ms?: number;
      model?: string;
      request_id?: string;
      provider?: string;
      message: string;
    }>;
  },

  // Speech-to-Text Transcription (FR-02)
  async transcribeAudio(audioBlob: Blob, language: string = "te-IN") {
    const formData = new FormData();
    formData.append("file", audioBlob, "recording.webm");
    formData.append("language", language);

    const res = await fetch(`${API_BASE}/transcriptions`, {
      method: "POST",
      headers: { ...getAuthHeader() },
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || "Transcription failed");
    }
    return res.json() as Promise<{
      transcript: string;
      language: string;
      confidence: number;
      duration_seconds: number;
      provider: string;
      message?: string;
    }>;
  },

  // Issue Extraction (FR-04)
  async extractIssue(transcriptReviewed: string, language: string = "te-IN") {
    const res = await fetch(`${API_BASE}/issues/extract`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeader(),
      },
      body: JSON.stringify({
        transcript_reviewed: transcriptReviewed,
        language,
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || "Extraction failed");
    }
    return res.json() as Promise<IssueExtractionResult>;
  },

  // Ticket Management (FR-05, FR-06)
  async createTicket(ticketData: {
    title: string;
    description: string;
    transcript_original?: string;
    transcript_reviewed: string;
    category: string;
    location?: string;
    priority: string;
  }) {
    const res = await fetch(`${API_BASE}/tickets`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeader(),
      },
      body: JSON.stringify(ticketData),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || "Ticket creation failed");
    }
    return res.json() as Promise<Ticket>;
  },

  async listTickets(params: {
    status?: string;
    category?: string;
    priority?: string;
    search?: string;
    limit?: number;
  } = {}) {
    const url = new URL(`${API_BASE}/tickets`);
    if (params.status && params.status !== "All") url.searchParams.append("status", params.status);
    if (params.category && params.category !== "All") url.searchParams.append("category", params.category);
    if (params.priority && params.priority !== "All") url.searchParams.append("priority", params.priority);
    if (params.search) url.searchParams.append("search", params.search);
    if (params.limit) url.searchParams.append("limit", params.limit.toString());

    const res = await fetch(url.toString(), {
      headers: { ...getAuthHeader() },
    });
    if (!res.ok) throw new Error("Failed to load tickets");
    return res.json() as Promise<Ticket[]>;
  },

  async getTicket(idOrNumber: string) {
    const res = await fetch(`${API_BASE}/tickets/${idOrNumber}`, {
      headers: { ...getAuthHeader() },
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || "Ticket not found");
    }
    return res.json() as Promise<Ticket>;
  },

  async updateTicket(
    idOrNumber: string,
    updates: {
      status?: string;
      priority?: string;
      assigned_to?: number | null;
      resolution_notes?: string;
      title?: string;
      description?: string;
      category?: string;
      location?: string;
    }
  ) {
    const res = await fetch(`${API_BASE}/tickets/${idOrNumber}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeader(),
      },
      body: JSON.stringify(updates),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || "Failed to update ticket");
    }
    return res.json() as Promise<Ticket>;
  },

  async addNote(idOrNumber: string, noteText: string) {
    const res = await fetch(`${API_BASE}/tickets/${idOrNumber}/notes`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeader(),
      },
      body: JSON.stringify({ note: noteText }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || "Failed to add note");
    }
    return res.json() as Promise<TicketNote>;
  },

  // Analytics (FR-07)
  async getAnalytics(slaHours: number = 48) {
    const res = await fetch(`${API_BASE}/analytics/summary?sla_hours=${slaHours}`, {
      headers: { ...getAuthHeader() },
    });
    if (!res.ok) throw new Error("Failed to load analytics");
    return res.json() as Promise<AnalyticsSummary>;
  },
};
