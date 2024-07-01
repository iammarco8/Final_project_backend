// look up nodemailer and read to see if you can impliment angular code into it
// impliment a req.body in the angualr template compontent that pulls in the values for the constructor of this class
// the req.body can also pull in the time request for the email to the admin
// the router file must impliment the email sending
// changing password and other things may require email confirmation too
import nodemailer from'nodemailer';
import { htmlToText } from 'html-to-text';
import path from 'path';

import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname =dirname(fileURLToPath(import.meta.url));

export class patientEmail {
    //angular template to create template

    // [[[[[[[[[[[[[[[[pulled from the 'createMailer function']]]]]]]]]]]]]]]]
    #templateURL = this.angularTemplate;
    // [[[[[[[[[[[[[[[[[[[[[[[[[[[[[[[[[[[]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]

    // #templateURL = path.join(__dirname, '*angularTemplate*');

    constructor(patient, bodyText){
        this.to = patient.email;

        //this will pull in the patients name 
        //possibly passed in through the use of the res.data from the route retrieval. try utalising the id
        this.first_name = patient.first_name;
        this.last_name = patient.last_name;
        // the req.body time request || here ||
        //                           vv      vv
        this.time_request = patient.time_request;

        // [[[[[[[this is attempting to pull in the angular template]]]]]
        this.angularTemplate = bodyText
        // [[[[[[[[[[[[[[[[[[[[[[[[[[[[[[[]]]]]]]
        //from the config file
        this.from = `[Hospital admin/application*] < ${ process.env.EMAIL_FROM } >`
    }
    createMailerTransport(){
]]]]]]]]]]]]]]]]]]]]]]]]

        if(process.env.NODE_ENV != 'production'){
            return nodemailer.createTransport({
                host: 'sandbox.smtp.mailtrap.io',
                port:25,
                auth:{
                    user: process.env.MAILTRAP_USER,
                    pass: process.env.MAILTRAP_PASS
                }
            });
        }else{
            //production settings
            return nodemailer.createMailerTransport({
                host: 'google info',
                port:465,
                secure:true,
                auth:{
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS
                }
            });
        }
    }
    async sendmail(template, subject, appointmentInfo){
        const transport = this.createMailerTransport();

        // const html = await *angularfile render*(this.#templateURL + template +'.html',{ 
        const html = await this.angularTemplate(this.#templateURL + template +'.html',{ 
            // the import for the rendering of angular
            subject: subject,
            logo: `${process.env.PORT}/assets/logo.png`,
            patient_f_name: this.first_name,
            patient_l_name: this.last_name,
            time_request: this.time_request,

            ...appointmentInfo,
        });

        return await transport.sendmail({
            to:`${this.to}, ${process.env.COPY_EMAIL}`,
            from:this.from,
            subject: subject,
            html: html,
            text:htmlToText(html),
        })
    }
}