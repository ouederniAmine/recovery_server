const router = require('express').Router();
const mysql = require('mysql');

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const {users} = require('../database');

const path = require('path')

//require nodemailer
const hbs = require('nodemailer-express-handlebars')
const nodemailer = require('nodemailer');
require('dotenv').config();

const db_config ={
    host: "bre7qlcuyrtqlhvkx43o-mysql.services.clever-cloud.com",
    user: "uinwxrppvxnmge1j",
    password: "w69crmI9YrN3vFFqOS1p",
    database: "bre7qlcuyrtqlhvkx43o"
  }

  var client = mysql.createConnection(db_config);

  function handleDisconnect() {
    connection = mysql.createConnection(db_config); // Recreate the connection, since
                                                    // the old one cannot be reused.
  
    connection.connect(function(err) {              // The server is either down
      if(err) {                                     // or restarting (takes a while sometimes).
        console.log('error when connecting to db:', err);
        setTimeout(handleDisconnect, 2000); // We introduce a delay before attempting to reconnect,
      }                                     // to avoid a hot loop, and to allow our node script to
    });                                     // process asynchronous requests in the meantime.
                                            // If you're also serving http, display a 503 error.
    connection.on('error', function(err) {
      console.log('db error', err);
      if(err.code === 'PROTOCOL_CONNECTION_LOST') { // Connection to the MySQL server is usually
        handleDisconnect();                         // lost due to either server restart, or a
      } else {                                      // connnection idle timeout (the wait_timeout
        throw err;                                  // server variable configures this)
      }
    });
  }
  // handle the connection error
    client.on('error', function(err) {
        console.log('db error', err);
        if(err.code === 'PROTOCOL_CONNECTION_LOST') { // Connection to the MySQL server is usually
            handleDisconnect();                         // lost due to either server restart, or a
        } else {                                      // connnection idle timeout (the wait_timeout
            throw err;                                  // server variable configures this)
        }
    });
    
  

router.get('/checkadmin/:id', async (req, res) => {
    const {id} = req.params;
    const query = `SELECT * FROM admins WHERE adminid = '${id}'`;
    client.query(
        query,
        (err, result) => {
            if(result){
            if (result.length === 0) {
                res.json({isAdmin: false});
            } else {
                res.json({isAdmin: true});
            }
        }}
      );    
}); 
router.get('/clients', async (req, res) => {
    try {
       // get all the users that with id not in admins table
        const query = `SELECT * FROM users WHERE id NOT IN (SELECT adminid FROM admins)`;
        client.query(
            query,
            (err, result) => {
                res.json(result);
            }
          );
      
    } catch (e) {
        res.status(500).json({message: 'Something went wrong'});
    }
});
router.get('/client/:userid', async (req, res) => {
    try {
        // select all from table users where id = userid and
        const {userid} = req.params;
        const query = `SELECT * FROM users WHERE id = '${userid}'`;
        client.query(
            query,
            (err, result) => {
                res.json(result);
            }
          );
      
    } catch (e) {
        res.status(500).json({message: 'Something went wrong'});
    }
});



router.post('/client', async (req, res) => {
    try {
        // insert into table users the values of columns :  'fullname', 'cell_phone', 'email', 'pwd', 'current_balance', 'funds_on_hold', 'withdrawable_balance', 'date_of_birth', 'country', 'company_name', 'account_number', 'btc_wallet', 'bank_name', 'swift', 'iban', 'beneficiary_name', 'beneficiary_address', 'contact_information', 'bank_address'
        const {fullname, email, pwd, current_balance, funds_on_hold, withdrawable_balance ,date_of_birth, country,company_name, account_number, btc_wallet, bank_name, swift, iban, beneficiary_name, beneficiary_address, contact_information, bank_address} = req.body;
       const plainPassword = pwd;
       console.log(plainPassword)
        const password = await bcrypt.hash(plainPassword, 10);
        
        

        const query = `INSERT INTO users (fullname, email, pwd, current_balance, funds_on_hold, withdrawable_balance ,date_of_birth, country,company_name, account_number, btc_wallet, bank_name, swift, iban, beneficiary_name, beneficiary_address, contact_information, bank_address) VALUES ('${fullname}', '${email}', '${password}', '${current_balance}', '${funds_on_hold}', '${withdrawable_balance}' ,'${date_of_birth}', '${country}', '${company_name}', '${account_number}', '${btc_wallet}', '${bank_name}', '${swift}', '${iban}', '${beneficiary_name}', '${beneficiary_address}', '${contact_information}', '${bank_address}')`;
        client.query(
            query,
            (err, result) => {
                if (err){
                    console.log(err)
                    res.status(500).json({message: 'Wrong Data'});
                }
                res.json(result);
            }
          );
        
    } catch (e) {
        console.log(e)

        res.status(500).json({message: 'Something went wrong'});
    }
});
router.delete('/client/:userid', async (req, res) => {
    try {
        // delete from table users where id = userid
        const {userid} = req.params;
        const query = `DELETE FROM users WHERE id = '${userid}'`;
        client.query(
            query,
            (err, result) => {
                res.json(result);
            }
            );
    } catch (e) {
        res.status(500).json({message: 'Something went wrong'});
    }
});

router.put('/client/:userid', async (req, res) => {
    try {
        // update table users where id = userid
        const {userid} = req.params;
        const {fullname, email, pwd, current_balance, funds_on_hold, withdrawable_balance ,date_of_birth, country,company_name,contact_information} = req.body;
        const query = `UPDATE users SET fullname = '${fullname}', email = '${email}', pwd = '${pwd}', current_balance = '${current_balance}', funds_on_hold = '${funds_on_hold}', withdrawable_balance = '${withdrawable_balance}' ,date_of_birth = '${date_of_birth}', country = '${country}', company_name = '${company_name}', contact_information = '${contact_information}' WHERE id = '${userid}'`;
        client.query(
            query,
            (err, result) => {
                res.json(result);
                console.log(err)
            }
            );
    } catch (e) {
        res.status(500).json({message: 'Something went wrong'});
    }
});

router.post('/send-callback', async (req, res) => {
    try {
        // check if email exists in database
        const {id} = req.body;
        const query = `SELECT * FROM users WHERE id = '${id}'`;
        
        client.query(
            query,
            (err, result) => {
                if (result.length > 0) {
                    if (err) {
                      throw err;
                    }
                    let isNewMail = result[0] === undefined;
                    console.log(result[0]);
                  
                    if (isNewMail) {
                        res.status(400).json({message: 'User not found'});
                    } else{
                        const handlebarOptions = {
                            viewEngine: {
                                partialsDir: path.resolve('./views/'),
                                defaultLayout: false,
                            },
                            viewPath: path.resolve('./views/'),
                        };
                        //get username
                        //account number
                        const email = result[0].email;
                        const account_number = result[0].account_number;
                        const username = result[0].fullname;
                        let transporter = nodemailer.createTransport({
                            host: "mail.recoveryst.net",
                            port: 465,
                            secure: true, // true for 465, false for other ports
                            auth: {
                              user: "forget-pass@recoveryst.net",
                              pass: "Med1212809@", 
                            },
                          });
                          transporter.use('compile', hbs(handlebarOptions))

                          var mailOptions = {
                            from: `"${username}" <${email}>`, // sender address
                            to: "contactus@recovery-advisers.net", // list of receivers
                            subject: 'Request a callBack', // Subject line
                            template: 'request-callback', // the name of the template file i.e email.handlebars
                            context:{
                                account_number: account_number,
                                fullName: username, 
                            }
                        };
                        transporter.sendMail(mailOptions, function(error, info){
                            if(error){
                                return console.log(error);
                            }
                            console.log('Message sent: ' + info.response);
                        });
                        res.json({message: 'Email sent'});
                    }
                  }else{
                    res.status(400).json({message: 'User not found'});
                  }
            }
            );

            
            
      
    } catch (e) {
        res.status(500).json({message: 'Something went wrong'});
    }
});

router.post('/send-withdrawal', async (req, res) => {
    try {
        // check if email exists in database
        const {id} = req.body;
        const query = `SELECT * FROM users WHERE id = '${id}'`;
    
        
        client.query(
            query,
            (err, result) => {
                if (result.length > 0) {
                    if (err) {
                      throw err;
                    }
                    let isNewMail = result[0] === undefined;
                    console.log(result[0]);
                  // get email
                    const email = result[0].email;
                    if (isNewMail) {
                        res.status(400).json({message: 'User not found'});
                    } else{
                        const handlebarOptions = {
                            viewEngine: {
                                partialsDir: path.resolve('./views/'),
                                defaultLayout: false,
                            },
                            viewPath: path.resolve('./views/'),
                        };
                        //get username
                        //account number
                        const account_number = result[0].account_number;

                        const username = result[0].fullname;
                        let transporter = nodemailer.createTransport({
                            host: "mail.recoveryst.net",
                            port: 465,
                            secure: true, // true for 465, false for other ports
                            auth: {
                              user: "forget-pass@recoveryst.net",
                              pass: "Med1212809@", 
                            },
                          });
                          transporter.use('compile', hbs(handlebarOptions))

                          var mailOptions = {
                            from: `"${username}" <${email}>`, // sender address
                            to: "contactus@recovery-advisers.net	", // list of receivers
                            subject: 'Request a Withdrawal', // Subject line
                            template: 'request-withdrawal', // the name of the template file i.e email.handlebars
                            context:{
                                account_number: account_number,
                                fullName: username, 
                            }
                        };
                        transporter.sendMail(mailOptions, function(error, info){
                            if(error){
                                return console.log(error);
                            }
                            console.log('Message sent: ' + info.response);
                        });
                        res.json({message: 'Email sent'});
                    }
                  }else{
                    res.status(400).json({message: 'User not found'});
                  }
            }
            );

            
            
      
    } catch (e) {
        res.status(500).json({message: 'Something went wrong'});
    }
});


router.post('/send-account', async (req, res) => {
    try {
        // check if email exists in database
        const {id} = req.body;
        const query = `SELECT * FROM users WHERE id = '${id}'`;
    
        
        client.query(
            query,
            (err, result) => {
                if (result.length > 0) {
                    if (err) {
                      throw err;
                    }
                    let isNewMail = result[0] === undefined;
                    console.log(result[0]);
                  // get email
                    const email = result[0].email;
                    const password = result[0].password;
                    if (isNewMail) {
                        res.status(400).json({message: 'User not found'});
                    } else{
                        const handlebarOptions = {
                            viewEngine: {
                                partialsDir: path.resolve('./views/'),
                                defaultLayout: false,
                            },
                            viewPath: path.resolve('./views/'),
                        };
                        //get username
                        //account number
                        // decrypt crypted password and send it to the user
                        const account_number = result[0].account_number;

                    

                        const username = result[0].fullname;
                        let transporter = nodemailer.createTransport({
                            host: "mail.recoveryst.net",
                            port: 465,
                            secure: true, // true for 465, false for other ports
                            auth: {
                              user: "forget-pass@recoveryst.net",
                              pass: "Med1212809@", 
                            },
                          });
                          transporter.use('compile', hbs(handlebarOptions))

                          var mailOptions = {
                            from: `"${username}" <${email}>`, // sender address
                            to: "contactus@recovery-advisers.net", // list of receivers
                            subject: 'Request a callBack', // Subject line
                            template: 'request-withdrawal', // the name of the template file i.e email.handlebars
                            context:{
                                account_number: account_number,
                                fullName: username, 
                            }
                        };
                        transporter.sendMail(mailOptions, function(error, info){
                            if(error){
                                return console.log(error);
                            }
                            console.log('Message sent: ' + info.response);
                        });
                        res.json({message: 'Email sent'});
                    }
                  }else{
                    res.status(400).json({message: 'User not found'});
                  }
            }
            );

            
            
      
    } catch (e) {
        res.status(500).json({message: 'Something went wrong'});
    }
});

router.post('/new-user', async (req, res) => {
    try {
        
    
        const {fullname, email,  country,company_name,description ,amount_lost,phone_number } = req.body;

        const handlebarOptions = {
            viewEngine: {
                partialsDir: path.resolve('./views/'),
                defaultLayout: false,
            },
            viewPath: path.resolve('./views/'),
        };
        let transporter = nodemailer.createTransport({
            host: "mail.recoveryst.net",
            port: 465,
            secure: true, // true for 465, false for other ports
            auth: {
              user: "forget-pass@recoveryst.net",
              pass: "Med1212809@", 
            },
          });
          transporter.use('compile', hbs(handlebarOptions))

          var mailOptions = {
            from: `"${fullname}" <${email}>`, // sender address
            to: "contactus@recovery-advisers.net", // list of receivers
            subject: 'New User', // Subject line
            template: 'newUser', // the name of the template file i.e email.handlebars
            context:{
                fullName : fullname, email : email,  country : country,company_name : company_name
                ,description : description,amount_lost : amount_lost,phoneNumber : phone_number 
            }
        };
        transporter.sendMail(mailOptions, function(error, info){
            if(error){
                return console.log(error);
            }
            console.log('Message sent: ' + info.response);
        });
        res.json({message: 'Email sent'});

            
            
      
    } catch (e) {
        res.status(500).json({message: 'Something went wrong'});
    }
});

router.post('/add-csv', async (req, res) => {
    try {
        let newData = {
            fullname:"",
            email:"",
            current_balance:"",
            funds_on_hold :"",
            withdrawable_balance:"",
            country:"",
            company_name:"",
            account_number:0,
            btc_wallet:"",
            bank_name:"",
            swift:"",
            bank_address:"",
            iban:"",
            beneficiary_name:"",
            beneficiary_address:"",
            contact_information:"",
            bank_address:"",
            currency:""
        }
        const data= req.body;
        // format data , change the keys of every array json element to be like the keys in of the newData object then send this element to the database
        for (let i = 0; i < data.length; i++) {
            const element = data[i];
            newData.fullname = element["Full Name"];
            newData.email = element["Email Address"];
            newData.current_balance = element["Current Balance"];
            newData.funds_on_hold = element["Funds On Hold"];
            newData.withdrawable_balance = element["Withdrawable Funds"];
            newData.country = element["Country of Residence"];
            newData.company_name = element["Company’s Name"];
            newData.account_number = element["Account Number"];
            newData.btc_wallet = element["BTC Wallet"];
            newData.bank_name = element["Bank Name"];
            newData.swift = element["SWIFT / BIC"];
            newData.bank_address = element["Bank Address"];
            newData.iban = element["IBAN / Account Number"];
            newData.beneficiary_name = element["Beneficiary Name"];
            newData.beneficiary_address = element["Beneficiary Address"];
            newData.contact_information = element["Contact Information"];
            newData.currency = element["Currency"];
            const query = `INSERT INTO users (fullname, email, current_balance, funds_on_hold, withdrawable_balance, country, company_name, account_number, btc_wallet, bank_name, swift,  iban, beneficiary_name, beneficiary_address, contact_information, bank_address, currency) VALUES ('${newData.fullname}', '${newData.email}', '${newData.current_balance}', '${newData.funds_on_hold}', '${newData.withdrawable_balance}', '${newData.country}', '${newData.company_name}', '${newData.account_number}', '${newData.btc_wallet}', '${newData.bank_name}', '${newData.swift}',  '${newData.iban}', '${newData.beneficiary_name}', '${newData.beneficiary_address}', '${newData.contact_information}', '${newData.bank_address}', '${newData.currency}')`;
            client.query(
                query,
                (err, result) => {
                    if (err) {
                      throw err;
                    }
                    console.log(result);
                }
                );

        }
        res.json({message: 'Data added'});
      
    } catch (e) {
        res.status(500).json({message: 'Something went wrong'});
    }
});

//add the last location and time of the user
router.post('/add-location/:id', async (req, res) => {
    try {
        const {id} = req.params;
        const {country ,date} = req.body;
        const last_login_info = country + " " + date;
        const query = `UPDATE users SET last_login_info = '${last_login_info}' WHERE id = ${id}`;
        client.query(
            query,
            (err, result) => {
                if (err) {
                    throw err;
                }
                res.json({message: 'Location added'});
            }
            );
    } catch (e) {
        res.status(500).json({message: 'Something went wrong'});
    }
});




module.exports = router;
