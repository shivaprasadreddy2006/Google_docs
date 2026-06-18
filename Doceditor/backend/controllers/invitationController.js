const Invitation = require('../models/Invitation');
const Document = require('../models/Document');
const User = require('../models/User');

exports.inviteUser = async (req, res) => {
  try {
    const { documentId, recipientEmail } = req.body;
    
    // Check if document exists and user is owner
    const document = await Document.findById(documentId);
    if (!document) return res.status(404).json({ message: 'Document not found' });
    if (document.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the owner can invite users' });
    }

    // Check if trying to invite themselves
    if (recipientEmail === req.user.email) {
      return res.status(400).json({ message: 'You cannot invite yourself' });
    }

    // Check if recipient is already a collaborator
    const recipientUser = await User.findOne({ email: recipientEmail });
    if (recipientUser && document.collaborators.includes(recipientUser._id)) {
      return res.status(400).json({ message: 'User is already a collaborator' });
    }

    // Check if an invitation already exists
    const existingInvite = await Invitation.findOne({
      document: documentId,
      recipientEmail,
      status: 'pending'
    });
    if (existingInvite) {
      return res.status(400).json({ message: 'An invitation is already pending for this email' });
    }

    const invitation = await Invitation.create({
      document: documentId,
      sender: req.user._id,
      recipientEmail
    });

    res.status(201).json({ message: 'Invitation sent successfully', invitation });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getPendingInvitations = async (req, res) => {
  try {
    const invitations = await Invitation.find({
      recipientEmail: req.user.email,
      status: 'pending'
    }).populate('document', 'title type').populate('sender', 'name email');
    
    res.json(invitations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.respondToInvitation = async (req, res) => {
  try {
    const { id } = req.params;
    const { accept } = req.body;

    const invitation = await Invitation.findById(id);
    if (!invitation) return res.status(404).json({ message: 'Invitation not found' });

    if (invitation.recipientEmail !== req.user.email) {
      return res.status(403).json({ message: 'Not authorized to respond to this invitation' });
    }

    if (accept) {
      invitation.status = 'accepted';
      await Document.findByIdAndUpdate(invitation.document, {
        $addToSet: { collaborators: req.user._id }
      });
    } else {
      invitation.status = 'rejected';
    }

    await invitation.save();
    res.json({ message: `Invitation ${accept ? 'accepted' : 'rejected'}` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
