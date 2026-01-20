import axios from "axios";

// Use same-origin proxy in dev (Vite proxy /api → backend)
// For production, set VITE_API_BASE_URL to backend base URL
const RAW_API_BASE = import.meta.env.VITE_API_BASE_URL ?? "";

const buildLiveSessionsBase = (raw: string) => {
  const trimmed = raw.replace(/\/+$/, "");

  // Dev mode → use proxy
  if (!trimmed) return "/api/live-sessions";

  // If base is exactly /api
  if (trimmed === "/api") return "/api/live-sessions";

  // If base already ends with /api
  if (trimmed.endsWith("/api")) return `${trimmed}/live-sessions`;

  // Otherwise append /api/live-sessions
  return `${trimmed}/api/live-sessions`;
};

const api = axios.create({
  baseURL: buildLiveSessionsBase(String(RAW_API_BASE)),
  headers: {
    "Content-Type": "application/json",
  },
});

export interface LiveSession {
  id: string;
  sessionName: string;
  sessionUrl: string;
  teacherId: string;
  teacherName?: string;
  teacherEmail?: string;
  createdAt: string;
}

// ===============================
// Teacher creates a live session
// ===============================
export const createLiveSession = async (payload: {
  sessionName: string;
  sessionUrl: string;
  teacherId: string;
  teacherName?: string;
  teacherEmail?: string;
}): Promise<LiveSession> => {
  const { data } = await api.post("/", payload);
  return data.session;
};

// ===============================
// Teacher fetches own sessions
// ===============================
export const getTeacherSessions = async (
  teacherId: string
): Promise<LiveSession[]> => {
  const { data } = await api.get("/teacher", {
    params: { teacherId },
  });
  return data.sessions || [];
};

// ===============================
// Student fetches live sessions
// ===============================
export const getStudentSessions = async (
  studentId: string
): Promise<LiveSession[]> => {
  const { data } = await api.get("/student", {
    params: { studentId },
  });
  return data.sessions || [];
};
