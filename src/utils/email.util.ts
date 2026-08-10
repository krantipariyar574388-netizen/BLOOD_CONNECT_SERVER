import nodemailer from "nodemailer";
import ENV_CONFIG from "../config/env.config";

const transporter = nodemailer.createTransport({
    host : ENV_CONFIG.SMTP_HOST,
    port : Number(ENV_CONFIG.SMTP_PORT),
    secure : false,
    auth : {
        user : ENV_CONFIG.SMTP_USER,
        pass : ENV_CONFIG.SMTP_PASS,
    },
});

export const sendResetPasswordEmail = async (to : string, resetUrl : string) => {
    try {
        await transporter.sendMail({
            from : `"Blood Connect" <${ENV_CONFIG.SMTP_USER}>`,
            to,
            subject : "Reset your password",
            html: `
            <p>You requested a password reset.</p>
            <p>Click the link below to reset your password. This link expires in 15 minutes.</p>
            <a href="${resetUrl}">${resetUrl}</a>
            <p>If you didn't request this, ignore this email.</p>`, 
        });
    } catch (error) {
        console.log(error);
        throw new Error("Failed to send reset email");
    }
};

export const sendUrgentRequestEmail = async(
    to : string,
    data : {
        patientName : string;
        bloodGroup : string;
        hospital : string;
        district : string;
        phone : string;
        unitsNeeded : number;
    }
) => {
    try {
        await transporter.sendMail({
            from : `"Blood Connect" <${ENV_CONFIG.SMTP_USER}>`,
            to,
            subject : `URGENT : ${data.bloodGroup} Blood Needed Immediately`,
            html : `
            <h2 style="color : #d32f2f;">Critical Blood Request</h2>
            <p>A patient urgently needs <strong>${data.bloodGroup}</strong> blood.</p>
            <table style="border-collapse : collapse; width : 100%;">
            <tr><td><strong>Patient : </strong></td><td>${data.patientName}</td></tr>
            <tr><td><strong>Blood Group : </strong></td><td>${data.bloodGroup}</td></tr>
            <tr><td><strong>Unites Needed : </strong></td><td>${data.unitsNeeded}</td></tr>
            <tr><td><strong>Hospital : </strong></td><td>${data.hospital}</td></tr>
            <tr><td><strong>District : </strong></td><td>${data.district}</td></tr>
            <tr><td><strong>Contact : </strong></td><td>${data.phone}</td></tr>
            </table>
            <p>If you are available to donate, please open the Blood Conect app to respond.</P>
            <p style="color : #888; font-size: 12px;">If you're not currently available, you can update your availability status in the app.`,
        });
    } catch (error) {
        console.log("Failed to send urgent request email : ", error);
    }
};