import express from 'express'
import { getAllAppointments, getSingleAppointments, createAppointment, updateAppointment, deleteAppointment } from '../controllers/appointmentController.js'

export const appointmentsRouter = express.Router();

appointmentsRouter
        .route('/')
        .get(getAllAppointments)
        .post(createAppointment)
appointmentsRouter
        .route('/:id')
        .get(getSingleAppointments)
        .patch(updateAppointment)
        .delete(deleteAppointment)