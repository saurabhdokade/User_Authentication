const nodeMailer = require("nodemailer")



const sendEmail = async(options) =>{

const transporter = nodeMailer.createTransport({
    service:process.env.SMPT_SERVICE || "email",
    auth:{
        user: process.env.SMPT_MAIL || "saurabhdokade77@gmail.com",
        pass: process.env.SMPT_PASSWORD || "dvvi wdtc gulm kocy",
    }
})

const mailOptions ={
    from: process.env.SMPT_MAIL,
    to:options.email,
    subject: options.subject,
    text: options.message
}

 await transporter.sendMail(mailOptions)

}

module.exports = sendEmail;