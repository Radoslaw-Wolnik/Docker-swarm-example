// routes/adminRoutes.ts
import express, { Router } from 'express';
import { authenticateJWT} from '../middleware/auth.middleware';
import { isAdmin } from '../middleware/role.middleware';
import {
  getAdmins,
  getAllUsers,
  deleteAdmin,
  addAdmin,
  updateEmailTemplate,
  deleteInactiveUsers,
  updateConfiguration
} from '../controllers/admin.controller';


const router: Router = express.Router();

// Ensure all routes are protected and require admin privileges
router.use(authenticateJWT, isAdmin);

router.get('/admins', getAdmins);
router.get('/users', getAllUsers);

router.delete('/:id', deleteAdmin);
router.post('/add', addAdmin);

router.put('/email-template/:id', updateEmailTemplate);

router.delete('/inactive-users', authenticateJWT, deleteInactiveUsers);
router.put('/sensitive-data', authenticateJWT, updateConfiguration);

export default router;