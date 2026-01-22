import { auth } from '../config/firebase';

// Use relative path to leverage Vite's proxy configuration
const API_BASE_URL = '/api';

// Helper to get auth token
async function getAuthToken() {
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error('Not authenticated');
  return await currentUser.getIdToken();
}

// Helper for API requests with auth
async function apiRequest(endpoint, options = {}) {
  const token = await getAuthToken();
  
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    },
  });

  // Check content type before parsing
  const contentType = response.headers.get('content-type');
  let data;
  
  if (contentType && contentType.includes('application/json')) {
    try {
      data = await response.json();
    } catch (e) {
      throw new Error(`Failed to parse JSON response: ${e.message}`);
    }
  } else {
    // If not JSON, read as text for error message
    const text = await response.text();
    if (!response.ok) {
      throw new Error(`API error ${response.status}: Server returned ${contentType || 'non-JSON'} response`);
    }
    // For successful non-JSON responses, return text
    return { success: true, data: text };
  }
  
  if (!response.ok) {
    throw new Error(data.message || `API error: ${response.status}`);
  }

  return data;
}

// ==================== DASHBOARD ====================

export async function getDashboardStats() {
  return await apiRequest('/mentor/dashboard/stats');
}

export async function getPriorityTickets() {
  return await apiRequest('/mentor/tickets/priority');
}

export async function getUpcomingMeets() {
  return await apiRequest('/mentor/meets/upcoming');
}

// ==================== TICKETS ====================

export async function listTickets(filters = {}) {
  const params = new URLSearchParams();
  
  if (filters.role) params.append('role', filters.role);
  if (filters.mentorId) params.append('mentorId', filters.mentorId);
  if (filters.status) params.append('status', filters.status);

  const query = params.toString() ? `?${params.toString()}` : '';
  return await apiRequest(`/mentor/tickets${query}`);
}

export async function createTicket(ticketData) {
  return await apiRequest('/mentor/tickets', {
    method: 'POST',
    body: JSON.stringify(ticketData),
  });
}

export async function getTicket(ticketId) {
  return await apiRequest(`/mentor/tickets/${ticketId}`);
}

export async function updateTicketStatus(ticketId, status) {
  return await apiRequest(`/mentor/tickets/${ticketId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

export async function addReply(ticketId, message) {
  return await apiRequest(`/mentor/tickets/${ticketId}/replies`, {
    method: 'POST',
    body: JSON.stringify({ message }),
  });
}

// ==================== MEETS ====================

export async function listMeets(filters = {}) {
  const params = new URLSearchParams();
  
  if (filters.role) params.append('role', filters.role);
  if (filters.status) params.append('status', filters.status);

  const query = params.toString() ? `?${params.toString()}` : '';
  return await apiRequest(`/mentor/meets${query}`);
}

export async function createMeet(meetData) {
  return await apiRequest('/mentor/meets', {
    method: 'POST',
    body: JSON.stringify(meetData),
  });
}

export async function getMeet(meetId) {
  return await apiRequest(`/mentor/meets/${meetId}`);
}

export async function requestJoinMeet(meetId) {
  return await apiRequest(`/mentor/meets/${meetId}/join`, {
    method: 'POST',
  });
}

export async function getJoinRequests(meetId) {
  return await apiRequest(`/mentor/meets/${meetId}/join-requests`);
}

export async function acceptJoinRequest(meetId, studentId) {
  return await apiRequest(`/mentor/meets/${meetId}/join-requests/${studentId}/accept`, {
    method: 'POST',
  });
}

export async function rejectJoinRequest(meetId, studentId) {
  return await apiRequest(`/mentor/meets/${meetId}/join-requests/${studentId}/reject`, {
    method: 'POST',
  });
}

export async function startMeet(meetId, meetingUrl) {
  return await apiRequest(`/mentor/meets/${meetId}/start`, {
    method: 'POST',
    body: JSON.stringify({ meetingUrl }),
  });
}

export async function endMeet(meetId) {
  return await apiRequest(`/mentor/meets/${meetId}/end`, {
    method: 'POST',
  });
}

// ==================== MENTOR CONNECTIONS (Student side) ====================

export async function listMentors() {
  try {
    return await apiRequest('/mentors');
  } catch (err) {
    // If not authenticated (dev/local), fall back to unauthenticated fetch
    if (err.message && err.message.toLowerCase().includes('not authenticated')) {
      const res = await fetch(`${API_BASE_URL}/mentors`, { headers: { 'Content-Type': 'application/json' } });
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      return await res.json();
    }
    throw err;
  }
}

export async function createMentorRequest(mentorId) {
  return await apiRequest('/mentor-requests', {
    method: 'POST',
    body: JSON.stringify({ mentorId }),
  });
}

export async function getMentorRequestStatuses(mentorIds = null) {
  const query = mentorIds ? `?mentorIds=${mentorIds.join(',')}` : '';
  return await apiRequest(`/mentor-requests/status${query}`);
}

export async function getIncomingMentorRequests() {
  return await apiRequest('/mentor-requests');
}

export async function acceptMentorRequest(requestId) {
  return await apiRequest(`/mentor-requests/${requestId}/accept`, {
    method: 'POST',
  });
}

export async function rejectMentorRequest(requestId) {
  return await apiRequest(`/mentor-requests/${requestId}/reject`, {
    method: 'POST',
  });
}

export async function getConnectedStudents() {
  return await apiRequest('/mentor-connections');
}
