export const mockMeetings = [
  { id: '1', zoomMeetingId: 'z1', title: 'Acme Corp Discovery', startTime: new Date().toISOString(), endTime: new Date().toISOString(), duration: 30, status: 'completed' },
  { id: '2', zoomMeetingId: 'z2', title: 'TechStart Demo', startTime: new Date().toISOString(), endTime: new Date().toISOString(), duration: 45, status: 'completed' },
  { id: '3', zoomMeetingId: 'z3', title: 'GlobalSales Follow-up', startTime: new Date().toISOString(), endTime: new Date().toISOString(), duration: 15, status: 'completed' },
  { id: '4', zoomMeetingId: 'z4', title: 'InnovateInc Pitch', startTime: new Date().toISOString(), endTime: new Date().toISOString(), duration: 60, status: 'completed' },
  { id: '5', zoomMeetingId: 'z5', title: 'CloudSync Sync', startTime: new Date().toISOString(), endTime: new Date().toISOString(), duration: 30, status: 'completed' }
];

export const mockLeads = [
  { id: '1', meetingId: '1', name: 'John Doe', email: 'john@acme.com', company: 'Acme Corp', role: 'CTO', score: 85, stage: 'Discovery', createdAt: new Date().toISOString() },
  { id: '2', meetingId: '2', name: 'Jane Smith', email: 'jane@techstart.com', company: 'TechStart', role: 'CEO', score: 92, stage: 'Demo', createdAt: new Date().toISOString() },
  { id: '3', meetingId: '3', name: 'Bob Johnson', email: 'bob@globalsales.com', company: 'GlobalSales', role: 'VP Sales', score: 45, stage: 'Follow-up', createdAt: new Date().toISOString() },
  { id: '4', meetingId: '4', name: 'Alice Brown', email: 'alice@innovate.com', company: 'InnovateInc', role: 'Founder', score: 78, stage: 'Pitch', createdAt: new Date().toISOString() },
  { id: '5', meetingId: '5', name: 'Charlie Davis', email: 'charlie@cloudsync.com', company: 'CloudSync', role: 'Engineer', score: 60, stage: 'Sync', createdAt: new Date().toISOString() }
];
