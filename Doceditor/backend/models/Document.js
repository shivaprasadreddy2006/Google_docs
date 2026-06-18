const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  title: { type: String, required: true },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  collaborators: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  type: { type: String, enum: ['text', 'tabular'], required: true },
  data: { type: Object, default: {} }, // Will store Quill Delta or JSON grid data
}, { timestamps: true });

module.exports = mongoose.model('Document', documentSchema);
