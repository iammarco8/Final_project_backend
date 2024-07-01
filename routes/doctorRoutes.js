import express from 'express';
import { getAllDoctors,getSingleDoctor,createDoctor,updateDoctor,deleteDoctor, getAllDoctorsPag, loginDoc, protectDoc, docUser, docAppointments } from '../controllers/doctorsController.js';

export  const doctorRouter = express.Router();
// basic doctor routes
doctorRouter
        .route('/')
        // .get(getAllDoctors)
        .get(getAllDoctorsPag)
        .post(createDoctor)
// login feature routes
doctorRouter
        .route('/login')
        .post(loginDoc)

// this route is for the current active doctor user 
// this does not work, for some strange reason it kept referring to the single item retrieval
// doctorRouter
//         .route('/ActiveDoctor')
//         .get(docUser)
doctorRouter
        .use(protectDoc)
        .route('/appointments')
        .get(docAppointments)


// protected routs through the implementing of rout controll function. (protectDoctor)
doctorRouter
        .use(protectDoc)
        .route('/:id')
        .get(getSingleDoctor)
        .patch(updateDoctor)
        .delete(deleteDoctor)
