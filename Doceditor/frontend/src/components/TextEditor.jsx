import React, { useEffect, useState, useRef, useCallback } from 'react';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';
import { Undo, Redo } from 'lucide-react';

// Register custom fonts
const Font = Quill.import('formats/font');
Font.whitelist = ['sans-serif', 'serif', 'monospace', 'arial', 'times-new-roman', 'courier-new', 'verdana', 'trebuchet', 'comic-sans'];
Quill.register(Font, true);

const TOOLBAR_OPTIONS = [
  [{ font: ['', 'serif', 'monospace', 'arial', 'times-new-roman', 'courier-new', 'verdana', 'trebuchet', 'comic-sans'] }, { size: ['small', false, 'large', 'huge'] }],
  [{ header: [1, 2, 3, 4, 5, 6, false] }],
  ['bold', 'italic', 'underline', 'strike'],
  [{ color: [] }, { background: [] }],
  [{ script: 'sub' }, { script: 'super' }],
  [{ list: 'ordered' }, { list: 'bullet' }, { indent: '-1' }, { indent: '+1' }],
  [{ direction: 'rtl' }, { align: [] }],
  ['link', 'image', 'video', 'blockquote', 'code-block'],
  ['clean'],
];

export default function TextEditor({ socket, documentId, title }) {
  const [quill, setQuill] = useState(null);

  // Initialize Quill
  const wrapperRef = useCallback(wrapper => {
    if (wrapper == null) return;
    wrapper.innerHTML = '';
    const editor = document.createElement('div');
    wrapper.append(editor);
    const q = new Quill(editor, { 
      theme: 'snow', 
      modules: { 
        toolbar: TOOLBAR_OPTIONS,
        history: { delay: 1000, maxStack: 500, userOnly: true }
      } 
    });
    q.disable();
    q.setText('Loading...');
    setQuill(q);
  }, []);

  // Handle document loading
  useEffect(() => {
    if (socket == null || quill == null) return;

    socket.once('load-document', document => {
      quill.setContents(document);
      quill.enable();
    });

    socket.emit('get-document', documentId);
  }, [socket, quill, documentId]);

  // Handle incoming changes
  useEffect(() => {
    if (socket == null || quill == null) return;

    const handler = (delta) => {
      quill.updateContents(delta);
    };
    socket.on('receive-changes', handler);

    return () => {
      socket.off('receive-changes', handler);
    };
  }, [socket, quill]);

  // Emit local changes
  useEffect(() => {
    if (socket == null || quill == null) return;

    const handler = (delta, oldDelta, source) => {
      if (source !== 'user') return;
      socket.emit('send-changes', delta);
    };
    quill.on('text-change', handler);

    return () => {
      quill.off('text-change', handler);
    };
  }, [socket, quill]);

  // Auto-save every 2 seconds
  useEffect(() => {
    if (socket == null || quill == null) return;

    const interval = setInterval(() => {
      socket.emit('save-document', quill.getContents());
    }, 2000);

    return () => {
      clearInterval(interval);
    };
  }, [socket, quill]);

  const handleUndo = () => {
    if (quill) quill.history.undo();
  };

  const handleRedo = () => {
    if (quill) quill.history.redo();
  };

  return (
    <div className="editor-wrapper">
      <div className="editor-header">
        <h2>{title}</h2>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '0.25rem' }}>
             <button className="btn" onClick={handleUndo} style={{ padding: '0.25rem 0.5rem', background: '#475569' }} title="Undo (Ctrl+Z)">
               <Undo size={16} />
             </button>
             <button className="btn" onClick={handleRedo} style={{ padding: '0.25rem 0.5rem', background: '#475569' }} title="Redo (Ctrl+Y)">
               <Redo size={16} />
             </button>
          </div>
          <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Auto-saving...</span>
        </div>
      </div>
      <div ref={wrapperRef}></div>
    </div>
  );
}
