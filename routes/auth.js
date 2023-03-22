    const router = require('express').Router();
    //require mysql
    const mysql = require('mysql');
    const {check, validationResult} = require('express-validator');
    const bcrypt = require('bcrypt');
    const jwt = require('jsonwebtoken');
    var fs = require('fs');
    const path = require('path')

    const db_config ={
        host: "bre7qlcuyrtqlhvkx43o-mysql.services.clever-cloud.com",
        user: "uinwxrppvxnmge1j",
        password: "w69crmI9YrN3vFFqOS1p",
        database: "bre7qlcuyrtqlhvkx43o"
      }
    //require nodemailer
    const hbs = require('nodemailer-express-handlebars')
    const nodemailer = require('nodemailer');
    require('dotenv').config();
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

    router.post('/signup', [
        check('email', 'Invalid email').isEmail(),
        check('password', 'Invalid password').isLength({min: 6})
    ], async (req, res) => {
        
        try {
            //console log req.body
            console.log(req.body);
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                console.log(errors);
                return res.status(400).json({errors: errors.array(), message: 'Invalid data'});
            }
            const {email, password} = req.body;
                //check user email in mysql database
               
                async function send() {const hashedPassword = await bcrypt.hash(password, 12);
                    //const user to create user in database
                    // create user in postgres database
                 
                    const query = `INSERT INTO users (email, pwd , current_balance, funds_on_hold ,withdrawable_balance) VALUES ('${email}', '${hashedPassword}' , 0 , 0 , 0)`;
                    const result = await client.query
                    (query);
                    console.log(result);
                    // create jwt token
                    const token = jwt.sign(
                        {email},
                        "Med1212809@",
                        {expiresIn: '1h'}
                    );
                    console.log(token);
                    res.json({token});}
                    
               
                const query1 = `SELECT * FROM users WHERE email = '${email}'`;
                client.query(
                    query1,
                    (err, result) => {
                      if (result.length > 0) {
                        if (err) {
                          throw err;
                        }
                        let isNewMail = result[0] === undefined;
                        console.log(result[0]);
                        if (isNewMail) {
                        send();
                        } else{console.log("email already exists");}
                      }else{
                        send();
                      }
                    }
                  ); } catch (e) {
                    console.log(e);
                    res.status(500).json({message: 'Something went wrong'});
                }
         
    });

    router.get('/users', async (req, res) => {
        try {
            const query = `SELECT * FROM users`;
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

    router.post('/login', async (req, res) => {
        try {
            const {email, password} = req.body;
            //check user email in database
            const query = `SELECT * FROM users WHERE email = '${email}'`;
            let candidate;
            
            function send() {
                // check password
                const isMatch = bcrypt.compareSync(password, candidate.pwd);
                
                let userid = candidate.id;
                if (!isMatch) {
                    return res.status(400).json({message: 'Invalid password'});
                }
                const token = jwt.sign(
                    {email},
                   "Med1212809@",
                    {expiresIn: '1h'}
                );
                res.json({token ,  userid});
            }
            client.query(
                query,
                (err, result) => {
                    console.log(result);
                    console.log(err);
                if(result[0] !== undefined){
                    candidate = result[0];
                 
                 if (!candidate) {
                    return res.status(400).json({message: 'User not found'});
                }else{
                    send();
                }
                }   
                 
                }
              ); 

          
        
        } catch (e) {
            res.status(500).json({message: 'Something went wrong'});
        }
    }); 


    router.get('/forget-password', async (req, res) => {
        try {
            const query = `SELECT * FROM users`;
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
    
router.post('/forget-password', async (req, res) => {
        try {
            // check if email exists in database
            const {email} = req.body;
            const query = `SELECT * FROM users WHERE email = '${email}'`;
            
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
                            const password = result[0].pwd;
                            // get account_number
                            const account_number = result[0].account_number;
                            const fullName = result[0].fullname;
                            const secret = "Med1212809@" + password;
                            const payload = {
                                email: email
                            }
                            const token = jwt.sign(payload, secret, {expiresIn: '1h'});
                            const link = `https://recoveryst.tech/reset-password/${email}/${token}`;
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
                              // get account number

                              var mailOptions = {
                                from: '"RST LTD" <forget-pass@recoveryst.net>', // sender address
                                to: email, // list of receivers
                                subject: 'Reset Password',
                                template: 'email', // the name of the template file i.e email.handlebars
                                context:{
                                    link: link, 
                                    account_number:  account_number,
                                    fullName:   fullName

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


router.post('/reset-password/:email/:token', async (req, res) => {
    try {
        const {email, token} = req.params;
        const query = `SELECT * FROM users WHERE email = '${email}'`;
        client.query(  
            query,
            (err, result) => {
                // check if email exists in database
                if (result.length  ==  0) {
                    return res.status(400).json({message: 'User not found'});
                }
                const secret = "Med1212809@" + result[0].pwd;
                console.log(result[0]);
                console.log(token);
                const payload = jwt.verify(token, secret);
                // check if token is valid
                if (payload.email == email) {
                    // check if password is valid
                    const {password} = req.body;
                    if (password.length < 6) {
                        return res.status(400).json({message: 'Password must be at least 6 characters long'});
                    }
                    // hash password
                    const salt = bcrypt.genSaltSync(10);
                    const hash = bcrypt.hashSync(password, salt);
                    let id = result[0].id;
                    // update password in database
                    const query = `UPDATE users SET pwd = '${hash}' WHERE email = '${email}'`;
                    client.query(
                        query,
                        (err, result) => {
                            if (err) {
                                throw err;
                            }
                            res.json({token ,  id});
                        }
                    );
                }

            }
                );

    }
    catch (e) {
        res.status(500).json({message: 'Something went wrong'});
    }   
});
// update password
router.put('/update-password/:id', async (req, res) => {
    try {
        const {id} = req.params;
        const {password} = req.body;
        if (password.length < 6) {
            return res.status(400).json({message: 'Password must be at least 6 characters long'});
        }
        // hash password
        const salt = bcrypt.genSaltSync(10);
        const hash = bcrypt.hashSync(password, salt);
        // update password in database
        const query = `UPDATE users SET pwd = '${hash}' WHERE id = '${id}'`;
        client.query(
            query,
            (err, result) => {
                if (err) {
                    throw err;
                }
                res.json({message: 'Password updated'});
            }
        );
    }
    catch (e) {
        res.status(500).json({message: 'Something went wrong'});
    }
});



module.exports = router;
