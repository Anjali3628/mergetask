const con = require("./connection");
var express = require("express");
var app = express();
const bodyParser = require('body-parser');
const md5 = require('md5');
const jwt = require("jsonwebtoken");
// require("dotenv").config();
const cookieParser = require("cookie-parser");
const path = require("path");


app.use(cookieParser());
app.set('view engine', "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.get('/', (req, res) => {
    try {
        res.render("form");
    } catch (err) {
        res.send(err)
    }
}
);


app.post('/insert', async (req, res) => {
    try {
        let characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        function random(n) {
            let salt = '';
            for (let i = 0; i < n; i++) {
                salt += characters.charAt(Math.floor(Math.random() * characters.length));
            }
            return salt;

        }
        var { firstname, lastname, contact, email } = req.body;
        sql = 'insert into `registration` (`firstname`, `lastname`, `contactno`, `emailid`, `salt`, `access_key`) VALUES (?, ?, ?, ?, ?, ?)';
        data = await con.promise().query(sql, [firstname, lastname, contact, email, random(4), random(12)]);
        id = data[0].insertId;

        data = await con.promise().query(`select * from registration where id = ${id}`);
        result = data[0][0];
        res.render("accesskey", { result });
    } catch (err) {
        res.send(err);
    }

})

app.get("/password", async (req, res) => {
    try {
        var id = req.query.id;
        data = await con.promise().query(`select * from registration where id = ${id}`);
        result = data[0][0];

        var difference = new Date().valueOf() - result.created_at.valueOf();
        var datete = result.created_at.valueOf();
        // console.log(datete);
        var min = Math.floor(difference / 1000);
        // console.log(min);

        // let accesskey = req.query.accesskey;
        res.render("password", { result, min });;
    } catch (err) {
        res.send(err);
    }
});

app.post("/password", async (req, res) => {
    try {
        var { salt, id, accesskey, password, retype_password } = req.body;
        if (password === retype_password) {
            // console.log(salt);
            password = password + salt;
            let md5password = md5(password);
            sql2 = `update registration set password1 = ? where id = ? and access_key = ? `;
            // console.log(sql2);
            // console.log(md5password);
            await con.promise().query(sql2, [md5password, id, accesskey]);
            res.json({ msg: "hello" });
        } else {
            res.json({ msg: "err" });
        }
    } catch (err) {
        res.send(err);
    }
});

app.get("/login", async (req, res) => {
    res.render("login");
})

app.post("/login", async (req, res) => {
    try {
        var { email, password} = req.body;
      console.log(email);
        sql = `select * from registration where emailid = ?`;
        data = await con.promise().query(sql, [email]);
        result = data[0][0];
        console.log(result.salt);
        if (data[0].length === 0) {
            res.json({ msg: "email or password wrong" });
        }
        let md5pass = md5(password + result.salt);
        console.log(md5pass);
        console.log(result.password1);
        if (result.password1 === md5pass) {
            const token = jwt.sign({ email }, `md5password`, { expiresIn: '1h' });
            console.log(token);
            res.cookie('token', token, { expires: new Date(Date.now() +900000), httpOnly: true });
            res.json({ msg: "welcome2" });
         
            res.render("welcome1");
            // else {
            //     return res.redirect("/login");
            // }
        }
    }
    catch (err) {
        res.send(err);
    }
});

app.get("/welcome1", (req, res) => {
    console.log(req.cookies);
    console.log(req.query);
    console.log(req.cookies.token);
    if (req.cookies.token) {
        res.render('welcome1');
    } else {
        res.render("login");
    }
});


app.get("/forgotpass", (req, res) => {
    res.render("forgotpass");
});

app.post("/forgotpass", async (req, res) => {

    var { emailid } = req.body;
    console.log(req.body);
    let characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    function random(n) {
        let salt = '';
        for (let i = 0; i < n; i++) {
            salt += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        return salt;

    }
    // sql = `update registration set access_key = ?, salt = ? where emailid = ? `;
    // data = await con.promise().query(sql, [random(4), random(12),emailid]);
    sql1 = `select * from registration where emailid  = ?`;
    data6 = await con.promise().query(sql1, [emailid]);
    result = data6[0][0];
    console.log(result);
    // res.render('link', { result });
    // var sql= `select * from registration where emailid =?`;
    // data=await con.promise().query(sql,[emailid]);
    // result = data[0][0];
    // console.log(result);
    res.render('link', { result });

    // res.render("forgotpass");
});


app.get("/task01", (req,res)=> {
    res.sendFile(path.join(__dirname, 'views', 'table.html'));
});

app.get("/task02", (req,res) => {
    res.sendFile(path.join(__dirname, 'views', 'event.html'));
});

app.get("/task03", (req,res) =>{
    res.sendFile(path.join(__dirname,'views','game.html'));
});

app.get("/task04", (req,res) =>{
    res.sendFile(path.join(__dirname, 'views', 'TicTacToe.html'));
});

app.get("/task05", (req,res) =>{
    res.sendFile(path.join(__dirname, 'views','formt.html'));
});

app.get("/task06", (req,res) =>{
    try{
        const result = [];
        if(req.query.txtquery) {
            const p = req.query.page || 1;
            var sql = req.query.txtquery;

            con.query(sql, (err,result) => {
                if(err) console.log(err);
                else{
                    const limit = 30;
                    const lastpage = Math.ceil(result.length/limit);
                    const offset = (Number(p) - 1)* limit;
                    if(sql.includes('limit')){
                        const key = Object.keys(result[0]);
                        res.render('data',{ result, key, sql, p, lastpage });
                    }else{
                    var sql2 = sql + ` limit ${limit} offset ${offset}`;
                    console.log(sql2);
                    const key = Object.keys(result[0]);
                    con.query(sql2,(err,result)=>{
                        if(err) console.log(err);
                        else
                        res.render('data', { result, key, sql, sql2, p, lastpage });
                    })
                }
            }
            })
        }else{
            res.render('data', { result });
        }
        
    }catch(err){
        console.log(err);
    }

});
app.get("/task07", (req,res) =>{
    const p = req.query.page || 1;
    const limit = 150;
    const last = Math.ceil(200 / 50);
    const offset = (p - 1) * 50;

   const sql = `select e.id, s.FirstName, t.examtype_name, sum(e.ob_theory) as theory, sum(e.obt_practical)
          as practical from exam_master as e inner join STUDENT_MASTER as s on e.id = s.id
          inner join exam_type as t on e.examtype_id = t.examtype_id 
          group by t.examtype_id, s.id 
          order by e.id limit ${limit} offset ${offset}`;


    con.query(sql, (err, result) => {
        if (err) console.log(err);
        else
            console.log(result[0]);
        res.render('./table', { result });

    })


});
app.get('/view',(req,res)=>{
    id = req.query.id;
    sql = `select s.id, s.FirstName, sub.sub_name, e.examtype_id, e.ob_theory as theory,
           e.obt_practical as practical from STUDENT_MASTER as s inner join exam_master as e on
           s.id = e.id inner join
           sub_master as sub on sub.sub_id = e.sub_id 
           where e.id = ${id}`;

    sql2 = `select count(*) as attendance from attendance_master where id = ${id} and present='p'`;
    
    
    
    con.query(sql, (err, result) => {
        if (err) console.log(err);
    
        con.query(sql2, (err, result2) => {
            if (err) console.log(err);

            res.render('./view', { result,result2 });
        })
    })

});

app.get('/task08', (req, res) => {
    const p = req.query.page || 1;
    const offset = (p-1)*40;
    const lastpage = Math.ceil(200/40);
    const m = req.query.month || 'december2023';
    const y = m.slice(0,-4);
    console.log(m);


    sql = `select s.id, s.FirstName, monthname(a.date) as month,count(a.present)
     as presentDay from STUDENT_MASTER
           as s inner join attendance_master as a on s.id=a.id where a.present='P'
            group by id,month having month="${y}"
           order by a.id limit 40 offset ${offset}`;

    con.query(sql, function (err, result) {
        if (err) console.log (err);
        res.render('attendance', { result, p, m, lastpage});
        console.log(result);
    })
    // res.send("hello!")
});

app.get('/task09', (req, res) => {
    const p = req.query.page || 1;
    console.log(p);
    const limit = 200;
    const order = req.query.sort || 'asc';
    const order_by = req.query.select || 'id';
    const offset = (p-1)*limit;
    const lastpage = Math.ceil(50000/limit);

    const sortorder = req.query.sort === 'desc' ? 'desc' : 'asc';
    const sortcolumn = req.query.select || 'id' || 'FirstName' ;
    

   

    var sql = `select * from student_MASTER ORDER BY ${order_by} ${order} limit ${limit} offset ${offset}`;

    con.query(sql,function(err,result){
        if(err) throw err;
        res.render('record' ,{result , p, order_by, order, lastpage, sortorder, sortcolumn});
        console.log(result);
    })

});



app.listen(3040);