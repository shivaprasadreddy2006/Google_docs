const express = require('express');
const { inviteUser, getPendingInvitations, respondToInvitation } = require('../controllers/invitationController');
const { protect } = require('../middleware/authMiddleware');
const router = express.Router();

router.post('/invite', protect, inviteUser);
router.get('/pending', protect, getPendingInvitations);
router.post('/:id/respond', protect, respondToInvitation);

module.exports = router;
