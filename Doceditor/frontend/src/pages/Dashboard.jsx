import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { PlusCircle, LogOut, FileText, Table, Bell, Users, Zap, Shield } from 'lucide-react';
import { apiUrl } from '../config';

const Dashboard = () => {
  const [documents, setDocuments] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [showInvites, setShowInvites] = useState(false);
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const fetchDocuments = async () => {
    try {
      const { data } = await axios.get(apiUrl('/api/documents'), {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setDocuments(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchInvitations = async () => {
    try {
      const { data } = await axios.get(apiUrl('/api/invitations/pending'), {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setInvitations(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchDocuments();
    fetchInvitations();
    // Setup interval to poll for invites periodically
    const interval = setInterval(fetchInvitations, 10000);
    return () => clearInterval(interval);
  }, [user]);

  const createDocument = async (type) => {
    const title = prompt(`Enter title for your new ${type} document:`, `Untitled ${type}`);
    if (!title) return;

    try {
      const { data } = await axios.post(apiUrl('/api/documents'), 
        { title, type }, 
        { headers: { Authorization: `Bearer ${user.token}` }}
      );
      navigate(`/document/${data._id}`);
    } catch (err) {
      alert(err.response?.data?.message || 'Error creating document');
    }
  };

  const respondToInvite = async (id, accept) => {
    try {
      await axios.post(apiUrl(`/api/invitations/${id}/respond`), { accept }, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      fetchInvitations();
      if (accept) fetchDocuments();
    } catch (err) {
      alert(err.response?.data?.message || 'Error responding to invite');
    }
  };

  return (
    <div className="dashboard">
      <div className="header">
        <h1>Welcome, {user.name}</h1>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className="btn" onClick={() => setShowInvites(!showInvites)} style={{ backgroundColor: invitations.length > 0 ? '#ef4444' : '#3b82f6', position: 'relative' }}>
            <Bell size={18} /> Invites
            {invitations.length > 0 && (
              <span style={{ position: 'absolute', top: '-5px', right: '-5px', background: 'white', color: '#ef4444', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 'bold' }}>
                {invitations.length}
              </span>
            )}
          </button>
          <button className="btn" onClick={() => createDocument('text')}>
            <FileText size={18} /> New Text Doc
          </button>
          <button className="btn" onClick={() => createDocument('tabular')} style={{ backgroundColor: '#10b981' }}>
            <Table size={18} /> New Spreadsheet
          </button>
          <button className="btn" onClick={logout} style={{ backgroundColor: '#ef4444' }}>
            <LogOut size={18} /> Logout
          </button>
        </div>
      </div>

      {/* Hero / Info Section */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(99,102,241,0.1) 0%, rgba(192,132,252,0.1) 100%)',
        border: '1px solid rgba(99,102,241,0.2)',
        borderRadius: '1rem',
        padding: '2rem',
        marginBottom: '2rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem'
      }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', marginBottom: '0.5rem', background: 'linear-gradient(to right, #818cf8, #c084fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Next-Gen Collaborative Editor
          </h2>
          <p style={{ color: 'var(--text-muted)', lineHeight: '1.6', maxWidth: '800px' }}>
            Welcome to your unified workspace. Create rich text documents or advanced spreadsheets and work on them simultaneously with your team. Every keystroke is synced in real-time, backed by enterprise-grade security and invite-only access control.
          </p>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
          <div style={{ background: 'rgba(30, 41, 59, 0.5)', padding: '1rem', borderRadius: '0.75rem', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
            <div style={{ padding: '0.5rem', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', borderRadius: '0.5rem' }}>
              <Zap size={24} />
            </div>
            <div>
              <h4 style={{ marginBottom: '0.25rem' }}>Real-time Sync</h4>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Powered by Socket.IO, see your teammates' edits appear instantly as they type.</p>
            </div>
          </div>
          <div style={{ background: 'rgba(30, 41, 59, 0.5)', padding: '1rem', borderRadius: '0.75rem', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
            <div style={{ padding: '0.5rem', background: 'rgba(99, 102, 241, 0.1)', color: '#6366f1', borderRadius: '0.5rem' }}>
              <Users size={24} />
            </div>
            <div>
              <h4 style={{ marginBottom: '0.25rem' }}>Team Collaboration</h4>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Invite peers via email. Build text reports and tabular data grids together seamlessly.</p>
            </div>
          </div>
          <div style={{ background: 'rgba(30, 41, 59, 0.5)', padding: '1rem', borderRadius: '0.75rem', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
            <div style={{ padding: '0.5rem', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: '0.5rem' }}>
              <Shield size={24} />
            </div>
            <div>
              <h4 style={{ marginBottom: '0.25rem' }}>Secure Access</h4>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Documents are strictly locked to the owner and explicitly accepted collaborators.</p>
            </div>
          </div>
        </div>
      </div>

      {showInvites && (
        <div style={{ background: 'var(--surface-color)', padding: '1rem', borderRadius: '0.5rem', marginBottom: '2rem', border: '1px solid var(--border-color)' }}>
          <h3>Pending Invitations</h3>
          {invitations.length === 0 ? (
            <p style={{ color: 'var(--text-muted)' }}>No pending invitations.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem' }}>
              {invitations.map(invite => (
                <div key={invite._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.05)', padding: '0.75rem', borderRadius: '0.25rem' }}>
                  <div>
                    <strong>{invite.sender?.name}</strong> invited you to edit <strong>{invite.document?.title}</strong>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="btn" onClick={() => respondToInvite(invite._id, true)} style={{ padding: '0.25rem 0.75rem', backgroundColor: '#10b981' }}>Accept</button>
                    <button className="btn" onClick={() => respondToInvite(invite._id, false)} style={{ padding: '0.25rem 0.75rem', backgroundColor: '#ef4444' }}>Reject</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      
      <div className="doc-grid">
        {documents.map(doc => (
          <div key={doc._id} className="doc-card" onClick={() => navigate(`/document/${doc._id}`)}>
            <div className="title">{doc.title}</div>
            <div className="type" style={{ color: doc.type === 'text' ? '#6366f1' : '#10b981' }}>
              {doc.type === 'text' ? <FileText size={16} style={{display:'inline', verticalAlign:'middle'}}/> : <Table size={16} style={{display:'inline', verticalAlign:'middle'}}/>} {doc.type} Document
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
              {doc.owner === user._id ? 'Owner' : 'Collaborator'} • Last updated: {new Date(doc.updatedAt).toLocaleDateString()}
            </div>
          </div>
        ))}
        {documents.length === 0 && (
          <p style={{ color: 'var(--text-muted)' }}>No documents found. Create one to get started!</p>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
