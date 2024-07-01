import express from 'express';
import { getAllAdmins, getSingleAdmin, createAdmin, updateAdmin, deleteAdmin, protectAdmin, loginAdmin, adminUser } from '../controllers/adminController.js' 
import { protectDoc } from '../controllers/doctorsController.js';

export const adminRouter = express.Router();

// these routs can be accessed without logging in 
adminRouter
        .route('/')
        .get(getAllAdmins)
        .post(createAdmin)
// this engages the login feature
adminRouter 
        .route('/login') 
        .post(loginAdmin)
// these are specific route that should not be accessed without logging in first
adminRouter
        .use(protectAdmin)
adminRouter
        .route('/ActiveAdmin')
        .get(adminUser)       
adminRouter
        .route('/:id')
        .get(getSingleAdmin)
        .patch(updateAdmin)
        .delete(deleteAdmin)

        
