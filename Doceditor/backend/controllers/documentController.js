const Document = require('../models/Document');

exports.createDocument = async (req, res) => {
  try {
    const { title, type } = req.body;
    const document = await Document.create({
      title,
      type,
      owner: req.user._id,
      collaborators: [],
      data: type === 'text' ? { ops: [{ insert: '\n' }] } : { '0,0': '' }
    });
    res.status(201).json(document);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getDocuments = async (req, res) => {
  try {
    // Fetch documents where user is owner OR a collaborator
    const documents = await Document.find({ 
      $or: [
        { owner: req.user._id },
        { collaborators: req.user._id }
      ]
    }).sort({ updatedAt: -1 });
    res.json(documents);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getDocumentById = async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);
    if (!document) return res.status(404).json({ message: 'Document not found' });
    
    // Check permission
    const isOwner = document.owner.toString() === req.user._id.toString();
    const isCollaborator = document.collaborators.some(id => id.toString() === req.user._id.toString());
    
    if (!isOwner && !isCollaborator) {
      return res.status(403).json({ message: 'Access denied. You are not a collaborator on this document.' });
    }

    res.json(document);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
