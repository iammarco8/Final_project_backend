import express from 'express';
import morgan from 'morgan';
// import {loginRouter} from './routes/loginRouter.js';
import {adminRouter}from './routes/adminRouter.js';
import {appointmentsRouter}from './routes/appointmentsRouter.js';
import { doctorRouter } from './routes/doctorRoutes.js';
import { roomRouter } from './routes/roomRouter.js';
import { patientsRouter } from './routes/patientsRouter.js';
import cors from 'cors';
import { activeDoctorRouter } from './routes/doctorActiveRouter.js';
import { activeAdminRouter } from './routes/adminActiveRouter.js';



const app = express();

app.options('*',cors(['http://localhost:4200']))
app.use(cors(['http://localhost:4200']))

app.use(express.json({limit:'5kb'}));
app.use(express.urlencoded({
    extended:true, limit:'5kb'
}));


if(process.env.NODE_ENV !== 'production') app.use(morgan('dev'));

// this router will cross reference infromation needed to be able access backend
// app.use('/api/v1/login', loginRouter);

//router for the admin access and privileges  
app.use('/api/v1/admin', adminRouter);
// returning the single self referenced admin
app.use('/api/v1/ActiveAdmin', activeAdminRouter);


// router needed to send data to the appointment views on the front end
app.use('/api/v1/appointments', appointmentsRouter);

// router for doctors data
app.use('/api/v1/doctors', doctorRouter);
// to achieve a single doctor user
app.use('/api/v1/ActiveDoctor', activeDoctorRouter);

// router for room data
app.use('/api/v1/rooms', roomRouter);

// router for patients
app.use('/api/v1/patients', patientsRouter);

const port = process.env.PORT;
const server = app.listen(port, ()=>
    // console.log(`listening on http://localhost:${port}`);
    console.log(`listening on http://localhost:${port}/api/v1/admin`));

    //  http://localhost:6767/api/v1/appointments