import React, { useEffect, useState, useRef } from 'react';
import { Calculator, Bold, Italic, Undo, Redo } from 'lucide-react';

const INITIAL_ROWS = 50;
const INITIAL_COLS = 26;

const getColumnLabel = (index) => {
  let label = '';
  let temp = index;
  while (temp >= 0) {
    label = String.fromCharCode(65 + (temp % 26)) + label;
    temp = Math.floor(temp / 26) - 1;
  }
  return label;
};

const evaluateFormula = (val, data) => {
  if (!val || typeof val !== 'string' || !val.startsWith('=')) return val;
  try {
    let expr = val.substring(1).toUpperCase();
    expr = expr.replace(/[A-Z]+[0-9]+/g, (match) => {
      const colStr = match.match(/[A-Z]+/)[0];
      const rowStr = match.match(/[0-9]+/)[0];
      let colIdx = 0;
      for (let i = 0; i < colStr.length; i++) {
        colIdx = colIdx * 26 + (colStr.charCodeAt(i) - 64);
      }
      colIdx -= 1;
      const rowIdx = parseInt(rowStr) - 1;
      const refVal = data[`${rowIdx},${colIdx}`] || '0';
      return isNaN(refVal) ? `0` : refVal;
    });
    return Function(`"use strict"; return (${expr})`)();
  } catch (err) {
    return '#ERROR!';
  }
};

export default function TabularEditor({ socket, documentId, title }) {
  const [data, setData] = useState({});
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [selectedCell, setSelectedCell] = useState(null);
  
  const hasLoaded = useRef(false);
  const isUndoRedoAction = useRef(false);

  useEffect(() => {
    if (socket == null) return;
    socket.once('load-document', docData => {
      const initialData = docData || {};
      setData(initialData);
      setHistory([initialData]);
      setHistoryIndex(0);
      hasLoaded.current = true;
    });
    socket.emit('get-document', documentId);
  }, [socket, documentId]);

  useEffect(() => {
    if (socket == null) return;
    const handler = (change) => {
      if (change.type === 'full') {
         setData(change.data);
         // Do not update history on remote full updates to avoid weird jumps
      } else {
         setData(prev => ({ ...prev, [`${change.r},${change.c}`]: change.val }));
      }
    };
    socket.on('receive-cell-change', handler);
    return () => socket.off('receive-cell-change', handler);
  }, [socket]);

  useEffect(() => {
    if (socket == null) return;
    const interval = setInterval(() => {
      if (hasLoaded.current) socket.emit('save-document', data);
    }, 2000);
    return () => clearInterval(interval);
  }, [socket, data]);

  // Push to history when local data changes (except during undo/redo)
  const pushHistory = (newData) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newData);
    // limit history size
    if (newHistory.length > 50) newHistory.shift();
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const handleCellChange = (r, c, val) => {
    const newData = { ...data, [`${r},${c}`]: val };
    setData(newData);
    pushHistory(newData);
    socket.emit('send-cell-change', { r, c, val });
  };

  const handleFormatChange = (formatType) => {
    if (!selectedCell) return;
    const key = `style_${selectedCell.r},${selectedCell.c}`;
    const currentStyle = data[key] || {};
    const newStyle = { ...currentStyle, [formatType]: !currentStyle[formatType] };
    
    const newData = { ...data, [key]: newStyle };
    setData(newData);
    pushHistory(newData);
    socket.emit('send-cell-change', { type: 'full', data: newData });
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const prevData = history[historyIndex - 1];
      setHistoryIndex(historyIndex - 1);
      setData(prevData);
      socket.emit('send-cell-change', { type: 'full', data: prevData });
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const nextData = history[historyIndex + 1];
      setHistoryIndex(historyIndex + 1);
      setData(nextData);
      socket.emit('send-cell-change', { type: 'full', data: nextData });
    }
  };

  const selectedValue = selectedCell ? (data[`${selectedCell.r},${selectedCell.c}`] || '') : '';
  const currentStyle = selectedCell ? (data[`style_${selectedCell.r},${selectedCell.c}`] || {}) : {};

  return (
    <div className="editor-wrapper">
      <div className="editor-header">
        <h2>{title}</h2>
        <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Auto-saving...</span>
      </div>
      
      {/* Toolbar */}
      <div style={{ padding: '0.5rem 1rem', background: '#334155', borderBottom: '1px solid var(--border-color)', display: 'flex', gap: '1rem', alignItems: 'center' }}>
        
        {/* Undo/Redo */}
        <div style={{ display: 'flex', gap: '0.25rem' }}>
          <button className="btn" onClick={handleUndo} disabled={historyIndex <= 0} style={{ padding: '0.25rem 0.5rem', background: historyIndex > 0 ? '#475569' : '#1e293b', opacity: historyIndex > 0 ? 1 : 0.5 }}>
            <Undo size={16} />
          </button>
          <button className="btn" onClick={handleRedo} disabled={historyIndex >= history.length - 1} style={{ padding: '0.25rem 0.5rem', background: historyIndex < history.length - 1 ? '#475569' : '#1e293b', opacity: historyIndex < history.length - 1 ? 1 : 0.5 }}>
            <Redo size={16} />
          </button>
        </div>

        {/* Formatting */}
        <div style={{ display: 'flex', gap: '0.25rem', borderLeft: '1px solid #475569', paddingLeft: '1rem' }}>
          <button className="btn" onClick={() => handleFormatChange('bold')} style={{ padding: '0.25rem 0.5rem', background: currentStyle.bold ? '#6366f1' : '#475569' }}>
            <Bold size={16} />
          </button>
          <button className="btn" onClick={() => handleFormatChange('italic')} style={{ padding: '0.25rem 0.5rem', background: currentStyle.italic ? '#6366f1' : '#475569' }}>
            <Italic size={16} />
          </button>
        </div>

        {/* Formula Bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#1e293b', padding: '0.25rem 0.75rem', borderRadius: '0.25rem', marginLeft: '1rem' }}>
          <Calculator size={16} color="#94a3b8" />
          <span style={{ fontWeight: '600', color: '#f8fafc', minWidth: '40px' }}>
            {selectedCell ? `${getColumnLabel(selectedCell.c)}${selectedCell.r + 1}` : ''}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', flex: 1, gap: '0.5rem', background: 'white', padding: '0.25rem 0.5rem', borderRadius: '0.25rem' }}>
          <span style={{ color: '#64748b', fontWeight: 'bold' }}>fx</span>
          <input 
            type="text" 
            style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', color: 'black' }}
            value={selectedValue}
            placeholder="Select a cell to view/edit formula..."
            onChange={(e) => {
              if (selectedCell) {
                handleCellChange(selectedCell.r, selectedCell.c, e.target.value);
              }
            }}
          />
        </div>
      </div>

      <div className="tabular-grid">
        <table className="spreadsheet-table">
          <thead>
            <tr>
              <th style={{ width: '40px' }}></th>
              {Array.from({ length: INITIAL_COLS }).map((_, c) => (
                <th key={c}>{getColumnLabel(c)}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: INITIAL_ROWS }).map((_, r) => (
              <tr key={r}>
                <th>{r + 1}</th>
                {Array.from({ length: INITIAL_COLS }).map((_, c) => {
                  const rawVal = data[`${r},${c}`] || '';
                  const displayVal = evaluateFormula(rawVal, data);
                  const isSelected = selectedCell?.r === r && selectedCell?.c === c;
                  const style = data[`style_${r},${c}`] || {};

                  return (
                    <td key={c} style={{ border: isSelected ? '2px solid var(--primary-color)' : '1px solid #cbd5e1' }}>
                      <input
                        className="cell-input"
                        type="text"
                        value={isSelected ? rawVal : displayVal}
                        onFocus={() => setSelectedCell({ r, c })}
                        onChange={(e) => handleCellChange(r, c, e.target.value)}
                        style={{
                          fontWeight: style.bold ? 'bold' : 'normal',
                          fontStyle: style.italic ? 'italic' : 'normal',
                        }}
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
