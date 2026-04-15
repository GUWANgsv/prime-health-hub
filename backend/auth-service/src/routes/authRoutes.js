const express = require('express');

const { register, login, getProfile, getUserById, updateProfile, listUsers, updateUserById, deleteUserById } = require('../controllers/authController');
const { verifyToken, authorizeRoles } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/profile', verifyToken, getProfile);
router.put('/profile', verifyToken, updateProfile);
router.get('/users/:id', verifyToken, getUserById);
router.get('/admin/users', verifyToken, authorizeRoles('ADMIN'), listUsers);
router.put('/admin/users/:id', verifyToken, authorizeRoles('ADMIN'), updateUserById);
router.delete('/admin/users/:id', verifyToken, authorizeRoles('ADMIN'), deleteUserById);

module.exports = router;
