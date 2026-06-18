const Document = require('../models/Document');

module.exports = (io, socket) => {
  socket.on('get-document', async (documentId) => {
    const document = await Document.findById(documentId);
    if (!document) return;
    
    socket.join(documentId);
    socket.emit('load-document', document.data);

    // Text Editor
    socket.on('send-changes', (delta) => {
      socket.broadcast.to(documentId).emit('receive-changes', delta);
    });

    // Tabular Editor
    socket.on('send-cell-change', (data) => {
      socket.broadcast.to(documentId).emit('receive-cell-change', data);
    });

    socket.on('save-document', async (data) => {
      await Document.findByIdAndUpdate(documentId, { data });
    });
  });
};
