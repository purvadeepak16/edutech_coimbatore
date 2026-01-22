import React, { useEffect, useState } from 'react';
import {
  listTickets,
  getTicket,
  updateTicketStatus,
  addReply
} from '../services/mentorApi';
import './DoubtTickets.css';

const TABS = ['New', 'In Progress', 'Resolved', 'Closed'];

export default function DoubtTickets() {
  const [tickets, setTickets] = useState([]);
  const [activeTab, setActiveTab] = useState('New');
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [replyText, setReplyText] = useState('');

  useEffect(() => {
    loadTickets();
  }, []);

  const loadTickets = async () => {
    setLoading(true);
    try {
      const res = await listTickets({ role: 'mentor' });
      setTickets(res.tickets || []);
    } catch (e) {
      console.error('loadTickets', e);
    } finally {
      setLoading(false);
    }
  };

  const loadDetail = async (ticket) => {
    setSelected(ticket.id);
    setDetail(null);
    try {
      const res = await getTicket(ticket.id);
      setDetail({ ticket: res.ticket, replies: res.replies || [] });
      setReplyText('');
    } catch (e) {
      console.error('loadDetail', e);
    }
  };

  const anyInProgress = () => tickets.some(t => t.status === 'In Progress');

  const handleOpen = async (ticketId) => {
    if (anyInProgress()) {
      alert('You already have an active ticket. Please resolve it before opening another.');
      return;
    }
    try {
      await updateTicketStatus(ticketId, 'In Progress');
      setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, status: 'In Progress' } : t));
      if (selected === ticketId) await loadDetail({ id: ticketId });
    } catch (e) {
      console.error('handleOpen', e);
      alert(e.message || 'Failed to open ticket');
    }
  };

  const handleReply = async () => {
    if (!detail || detail.ticket.status !== 'In Progress') {
      alert('Ticket must be opened before replying');
      return;
    }
    if (!replyText.trim()) return;
    try {
      const res = await addReply(detail.ticket.id, replyText.trim());
      setDetail(prev => ({ ...prev, replies: [...(prev.replies || []), res.reply] }));
      setReplyText('');
    } catch (e) {
      console.error('handleReply', e);
      alert(e.message || 'Failed to send reply');
    }
  };

  const handleStatusUpdate = async (ticketId, status) => {
    try {
      await updateTicketStatus(ticketId, status);
      setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, status: status } : t));
      if (selected === ticketId) {
        setDetail(prev => ({ ...prev, ticket: { ...prev.ticket, status } }));
      }
    } catch (e) {
      console.error('handleStatusUpdate', e);
      alert(e.message || 'Failed to update status');
    }
  };

  const filtered = tickets.filter(t => (t.status || 'New') === activeTab);

  return (
    <div className="doubt-page">
      <div className="doubt-header">
        <h2>Doubt Tickets</h2>
        <div className="tabs">
          {TABS.map(tab => (
            <button
              key={tab}
              className={"tab-btn" + (tab === activeTab ? ' active' : '')}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="doubt-body">
        <div className="ticket-list">
          {loading && <div className="muted">Loading tickets…</div>}
          {!loading && filtered.length === 0 && <div className="muted">No tickets in this tab.</div>}
          {!loading && filtered.map(ticket => (
            <div
              key={ticket.id}
              className={"ticket-row" + (selected === ticket.id ? ' selected' : '')}
              onClick={() => loadDetail(ticket)}
            >
              <div className="ticket-left">
                <div className="student-name">{ticket.studentName}</div>
                <div className="subject-topic">{ticket.subject} · {ticket.topic}</div>
              </div>
              <div className="ticket-right">
                <div className="submitted">{ticket.timePending}</div>
                <div className={"priority " + (ticket.status === 'New' ? 'high' : ticket.status === 'In Progress' ? 'medium' : 'low')}></div>
              </div>
              <div className="ticket-actions">
                {ticket.status === 'New' && (
                  <button
                    className="btn small"
                    onClick={(e) => { e.stopPropagation(); handleOpen(ticket.id); }}
                    disabled={anyInProgress()}
                  >Open</button>
                )}
                {ticket.status === 'In Progress' && (
                  <>
                    <button className="btn small" onClick={(e) => { e.stopPropagation(); handleStatusUpdate(ticket.id, 'Resolved'); }}>Mark Resolved</button>
                    <button className="btn small ghost" onClick={(e) => { e.stopPropagation(); handleStatusUpdate(ticket.id, 'Closed'); }}>Close</button>
                  </>
                )}
                {(ticket.status === 'Resolved' || ticket.status === 'Closed') && (
                  <div className="muted small">{ticket.status}</div>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="ticket-detail">
          {!detail && <div className="muted">Select a ticket to view details</div>}
          {detail && (
            <>
              <div className="pinned">
                <div className="pinned-header">Pinned Doubt</div>
                <div className="pinned-body">{detail.ticket.doubt}</div>
                <div className="meta">Submitted: {new Date(detail.ticket.createdAt).toLocaleString()}</div>
              </div>

              <div className="replies">
                <div className="replies-header">Thread</div>
                {(detail.replies && detail.replies.length) ? detail.replies.map(r => (
                  <div className="reply" key={r.id}>
                    <div className="reply-meta">{r.userId} • {new Date(r.createdAt).toLocaleString()}</div>
                    <div className="reply-text">{r.message}</div>
                  </div>
                )) : <div className="muted">No replies yet.</div>}
              </div>

              <div className="detail-actions">
                {detail.ticket.status === 'New' && (
                  <button className="btn" onClick={() => handleOpen(detail.ticket.id)} disabled={anyInProgress()}>Open Ticket</button>
                )}

                {detail.ticket.status === 'In Progress' && (
                  <>
                    <textarea className="reply-input" value={replyText} onChange={e => setReplyText(e.target.value)} placeholder="Write a reply..." />
                    <div className="reply-controls">
                      <button className="btn" onClick={handleReply} disabled={!replyText.trim()}>Reply</button>
                      <button className="btn ghost" onClick={() => handleStatusUpdate(detail.ticket.id, 'Resolved')}>Mark Resolved</button>
                      <button className="btn ghost" onClick={() => handleStatusUpdate(detail.ticket.id, 'Closed')}>Close</button>
                    </div>
                  </>
                )}

                {detail.ticket.status === 'Resolved' && (
                  <div className="muted">Ticket resolved. You can close it.</div>
                )}

                {detail.status === 'Closed' && (
                  <div className="muted">Ticket closed.</div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
