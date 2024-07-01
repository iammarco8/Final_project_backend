import express from 'express';
import { createPatient,getAllPatients,getSinglePatient,updatePatient,deletePatient } from "../controllers/patientsControllers.js";

export const patientsRouter = express.Router()

patientsRouter
            .route('/')
            .get(getAllPatients)
            .post(createPatient)
patientsRouter
            .route('/:id')
            .get(getSinglePatient)
            .patch(updatePatient)
            .delete(deletePatient)

