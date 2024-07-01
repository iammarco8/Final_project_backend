import express from 'express';
import { docAppointments, docUser, protectDoc } from '../controllers/doctorsController.js';

export const activeDoctorRouter = express.Router();
activeDoctorRouter
        .use(protectDoc)
        .route('/')
        .get(docUser)
activeDoctorRouter
        .route('/dashboard')
        .get(docAppointments)