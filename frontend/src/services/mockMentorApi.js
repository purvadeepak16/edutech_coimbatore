// Mock API service for Mentor Module
// Simulates backend calls for tickets, meets, and availability

// Helper delay function
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const mockMentorApi = {
  // Fetch dashboard summary stats
  getDashboardStats: async (mentorId) => {
    await delay(300);
    return {
      newTickets: 7,
      activeTickets: 3,
      upcomingMeetsToday: 1,
      upcomingMeetsThisWeek: 4,
      isAvailable: false
    };
  },

  // Fetch priority tickets for dashboard
  getPriorityTickets: async (mentorId) => {
    await delay(400);
    return [
      {
        id: 'T001',
        studentName: 'Priya S.',
        subject: 'Mathematics',
        topic: 'Quadratic Equations',
        timePending: '2h 15m',
        status: 'New',
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000)
      },
      {
        id: 'T002',
        studentName: 'Rahul K.',
        subject: 'Physics',
        topic: 'Thermodynamics',
        timePending: '45m',
        status: 'New',
        createdAt: new Date(Date.now() - 45 * 60 * 1000)
      },
      {
        id: 'T003',
        studentName: 'Ananya M.',
        subject: 'Chemistry',
        topic: 'Organic Reactions',
        timePending: '5h 30m',
        status: 'In Progress',
        createdAt: new Date(Date.now() - 5.5 * 60 * 60 * 1000)
      },
      {
        id: 'T004',
        studentName: 'Vikram R.',
        subject: 'Mathematics',
        topic: 'Calculus Integration',
        timePending: '1h 10m',
        status: 'In Progress',
        createdAt: new Date(Date.now() - 70 * 60 * 1000)
      },
      {
        id: 'T005',
        studentName: 'Shreya P.',
        subject: 'Biology',
        topic: 'Cell Division',
        timePending: '3h 20m',
        status: 'New',
        createdAt: new Date(Date.now() - 3.33 * 60 * 60 * 1000)
      }
    ];
  },

  // Fetch all tickets (for ticket list page)
  getAllTickets: async (mentorId, filters = {}) => {
    await delay(500);
    // Return filtered/paginated tickets
    return {
      tickets: [],
      total: 0,
      page: 1,
      pageSize: 20
    };
  },

  // Fetch single ticket details with thread
  getTicketDetails: async (ticketId) => {
    await delay(400);
    return {
      id: ticketId,
      studentName: 'Priya S.',
      subject: 'Mathematics',
      topic: 'Quadratic Equations',
      doubtText: 'I am confused about the discriminant method for finding roots. When do we use the formula and how do we determine the nature of roots?',
      status: 'New',
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      replies: []
    };
  },

  // Open a ticket (mentor action)
  openTicket: async (ticketId) => {
    await delay(300);
    return { success: true, status: 'In Progress' };
  },

  // Reply to a ticket
  replyToTicket: async (ticketId, replyText) => {
    await delay(400);
    return {
      success: true,
      reply: {
        id: `R${Date.now()}`,
        text: replyText,
        sender: 'mentor',
        timestamp: new Date()
      }
    };
  },

  // Resolve/Close ticket
  updateTicketStatus: async (ticketId, status) => {
    await delay(300);
    return { success: true, status };
  },

  // Toggle mentor availability
  toggleAvailability: async (mentorId, isAvailable) => {
    await delay(300);
    return { success: true, isAvailable };
  },

  // Fetch upcoming meets
  getUpcomingMeets: async (mentorId) => {
    await delay(400);
    return [
      {
        id: 'M001',
        title: 'Math Revision Session',
        date: new Date(Date.now() + 3 * 60 * 60 * 1000),
        duration: 60,
        capacity: 10,
        enrolled: 7,
        status: 'scheduled'
      }
    ];
  },

  // Fetch join requests for a meet
  getJoinRequests: async (meetId) => {
    await delay(300);
    return [
      { id: 'JR001', studentId: 'S004', name: 'Karan P.', status: 'pending', requestedAt: new Date(Date.now() - 2 * 60 * 60 * 1000) },
      { id: 'JR002', studentId: 'S005', name: 'Meera L.', status: 'pending', requestedAt: new Date(Date.now() - 30 * 60 * 1000) }
    ];
  },

  // Accept a join request
  acceptJoinRequest: async (joinRequestId) => {
    await delay(250);
    return { success: true, joinRequestId };
  },

  // Reject a join request
  rejectJoinRequest: async (joinRequestId) => {
    await delay(250);
    return { success: true, joinRequestId };
  },

  // Start a meet
  startMeet: async (meetId) => {
    await delay(300);
    return { success: true, status: 'live' };
  },

  // End a meet
  endMeet: async (meetId) => {
    await delay(300);
    return { success: true, status: 'finished' };
  },

  // Create a meet
  createMeet: async (meetData) => {
    await delay(500);
    return {
      success: true,
      meetId: `M${Date.now()}`,
      ...meetData
    };
  },

  // Fetch mentor's students
  getStudents: async (mentorId) => {
    await delay(400);
    return [
      { id: 'S001', name: 'Priya S.', activeTickets: 1 },
      { id: 'S002', name: 'Rahul K.', activeTickets: 0 },
      { id: 'S003', name: 'Ananya M.', activeTickets: 2 }
    ];
  }
};

// Export individual functions for convenience
export const {
  getDashboardStats,
  getPriorityTickets,
  getAllTickets,
  getTicketDetails,
  openTicket,
  replyToTicket,
  updateTicketStatus,
  toggleAvailability,
  getUpcomingMeets,
  createMeet,
  getStudents
} = mockMentorApi;
export const {
  getJoinRequests,
  acceptJoinRequest,
  rejectJoinRequest,
  startMeet,
  endMeet
} = mockMentorApi;
