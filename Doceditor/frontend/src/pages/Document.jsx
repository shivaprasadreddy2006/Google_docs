import React, { useEffect, useState, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { io } from 'socket.io-client';
import TextEditor from '../components/TextEditor';
import TabularEditor from '../components/TabularEditor';
import { AuthContext } from '../context/AuthContext';
import { ArrowLeft, Share2 } from 'lucide-react';

const Document = () => {
  const { id } = useParams();
  const [document, setDocument] = useState(null);
  const [socket, setSocket] = useState(null);
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDocument = async () => {
      try {
        const { data } = await axios.get(`http://localhost:5000/api/documents/${id}`, {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        setDocument(data);
      } catch (error) {
        alert('Error loading document');
        navigate('/');
      }
    };
    fetchDocument();
  }, [id, user.token, navigate]);

  useEffect(() => {
    const s = io('http://localhost:5000');
    setSocket(s);
    return () => s.disconnect();
  }, []);

  const handleInvite = async () => {
    const email = window.prompt("Enter the email address of the person you want to invite:");
    if (!email) return;

    try {
      await axios.post('http://localhost:5000/api/invitations/invite', 
        { documentId: id, recipientEmail: email },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      alert('Invitation sent successfully!');
    } catch (err) {
      alert(err.response?.data?.message || 'Error sending invitation');
    }
  };

  if (!document) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <div style={{ padding: '0.5rem 1rem', background: 'var(--surface-color)', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button className="btn" style={{ background: 'transparent', padding: '0.25rem' }} onClick={() => navigate('/')}>
          <ArrowLeft size={20} /> Back
        </button>
        <button className="btn" onClick={handleInvite} style={{ backgroundColor: '#10b981' }}>
          <Share2 size={18} /> Invite Collaborator
        </button>
      </div>
      <div style={{ flex: 1 }}>
        {document.type === 'text' ? (
          <TextEditor socket={socket} documentId={id} title={document.title} />
        ) : (
          <TabularEditor socket={socket} documentId={id} title={document.title} />
        )}
      </div>
    </div>
  );
};

export default Document;
