import express from 'express';
import { adminUser, protectAdmin } from '../controllers/adminController.js';

export const activeAdminRouter = express.Router();
activeAdminRouter
        .use(protectAdmin)
        .route('/')
        .get(adminUser)