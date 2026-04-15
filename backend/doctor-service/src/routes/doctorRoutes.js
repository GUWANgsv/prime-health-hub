const express = require('express');

const {
  createDoctor,
  getMyDoctorProfile,
  getDoctors,
  searchDoctors,
  getDoctorById,
  updateDoctor,
  deleteDoctor,
  approveDoctor
} = require('../controllers/doctorController');
const { verifyToken, authorizeRoles } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(verifyToken);

router.get('/', getDoctors);
router.get('/search', searchDoctors);
router.get('/me', authorizeRoles('DOCTOR', 'ADMIN'), getMyDoctorProfile);
router.get('/:id', getDoctorById);
router.post('/', authorizeRoles('DOCTOR', 'ADMIN'), createDoctor);
router.put('/:id', authorizeRoles('DOCTOR', 'ADMIN'), updateDoctor);
router.delete('/:id', authorizeRoles('DOCTOR', 'ADMIN'), deleteDoctor);
router.patch('/:id/approve', authorizeRoles('ADMIN'), approveDoctor);

module.exports = router;
