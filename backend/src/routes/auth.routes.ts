// src/routes/authRoutes.ts
import express, { Router } from 'express';
import { authenticateJWT, handlePostRegistrationAuth } from '../middleware/auth.middleware.js';
import { isAdmin } from '../middleware/role.middleware';
import { 
    register, 
    login, 
    postRegistrationLogin,
    logout, 
    refreshToken, 
    
    sendVerificationEmail, 
    verifyEmail, 
    
    changePassword,
    requestPasswordReset,
    resetPassword,
    createOwner
} from '../controllers/auth.controller.js';


const router: Router = express.Router();

router.post('/register', register);

router.post('/login', login);
// Post-registration login route
router.post('/reg-login', handlePostRegistrationAuth, postRegistrationLogin);

router.post('/logout', authenticateJWT, logout);

router.post('/refresh-token', authenticateJWT, refreshToken);

router.post('/send-verification', authenticateJWT, sendVerificationEmail);
router.get('/verify-email/:token', verifyEmail);

router.put('/change-password', authenticateJWT, changePassword);
router.post('/request-password-reset', requestPasswordReset);
router.post('/reset-password/:token', resetPassword);

// Route to create owner account (admin only)
router.post('/create-owner', authenticateJWT, isAdmin, createOwner);

export default router;