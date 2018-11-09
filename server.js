let express = require('express')
let app = express()
let bodyParser = require('body-parser')
const MongoClient = require("mongodb").MongoClient;
let multer = require('multer');
let upload = multer({ dest: 'uploads/' })
app.use(bodyParser.raw({ type: 'application/json' }))
const url = "mongodb://admin:password1@ds151753.mlab.com:51753/my-database";
let sha256 = require("sha256")


let sessions = {}


const genID = () => { return Math.floor(Math.random() * 10000000000) }

app.post('/profile', upload.single('avatar'), function (req, res, next) {
    // req.file is the `avatar` file
    // req.body will hold the text fields, if there were any
  })

app.post("/signup", (req, res) => {
    let parsed = JSON.parse(req.body)
    parsed.password = sha256(parsed.password)
    parsed.items = []
    MongoClient.connect(url, { useNewUrlParser: true }, function (err, db) {
        if (err) throw err;
        let dbo = db.db("my-database")
        dbo.collection("accounts").findOne({ username: parsed.username }, (err, result) => {
            if (err) throw err
            if (result) {
                res.send(JSON.stringify(
                    { success: false }
                ))
                db.close()
                return
            } else {
                dbo.collection("accounts").insertOne(parsed, (err, result) => {
                    if (err) throw err
                    let sessionID = genID()
                    sessions[sessionID] = parsed.username
                    res.set('Set-Cookie', sessionID)
                    console.log("success")
                    dbo.collection("cart").insertOne({username: parsed.username}, (err, result) => {
                        if (err) throw err
                        console.log("cart created")
                    })
                    res.send(JSON.stringify(
                        { success: true }
                        ))
                        db.close()
                })
            }
        })
    })
})

app.post("/login", (req, res) => {
    let parsed = JSON.parse(req.body)
    MongoClient.connect(url, { useNewUrlParser: true }, function (err, db) {
        if (err) throw err
        let dbo = db.db("my-database")
        dbo.collection("accounts").findOne({ username: parsed.username }, (err, result) => {
            if (result === null) {
                res.send(JSON.stringify(
                    { success: false }
                ))
                db.close()
                return
            }
            if (err) throw err
            if (result.password === sha256(parsed.password)) {
                let sessionID = genID()
                sessions[sessionID] = parsed.username
                res.set('Set-Cookie', sessionID)
                console.log("logged in")
                res.send(JSON.stringify(
                    { success: true }
                ))
                db.close()
            } 
        })
    })})

app.post("/addItem", (req, res) => {
    let parsed = JSON.parse(req.body)
    let itemID = genID()
    let sessionID = req.headers.cookie
    let newItem = {
        title: parsed.title.toLowerCase(),
        description: parsed.description,
        category: parsed.category,
        price: parsed.price,
        username: sessions[sessionID],
        itemID: itemID,
        source: parsed.source
    }
    MongoClient.connect(url, { useNewUrlParser: true }, (err, db) => {
        if (err) throw err
        let dbo = db.db("my-database")
        dbo.collection("items").insertOne(newItem, (err, result) => {
            if (err) throw err
            console.log("item added")
        })
    })

    MongoClient.connect(url, { useNewUrlParser: true }, (err, db) => {
        if (err) throw err
        let dbo = db.db("my-database")
        dbo.collection("accounts").updateOne({username: newItem.username}, {$push:{items: newItem.itemID}}, (err, res) => {
            if (err) throw err
            console.log("Users Items Updated")
        })
    })    
    res.send(JSON.stringify({ success: true }))
    db.close()
})

app.get("/getAllItems", (req, res) => {
    MongoClient.connect(url, { useNewUrlParser:true }, (err, db) => {
        if (err) throw err
        let dbo = db.db("my-database")
        dbo.collection("items").find({}).toArray((err, result) => {
            if (err) throw err
            res.send(JSON.stringify(result))
            db.close()
        })
    })
})

app.post("/search", (req, res) => {
    let parsed = JSON.parse(req.body)
    let query = parsed.query.toLowerCase()
    MongoClient.connect(url, { useNewUrlParser:true }, (err, db) => {
        if (err) throw err
        let dbo = db.db("my-database")
        dbo.collection("items").find().toArray((err, result) => {
            if (err) throw err
            let filtered = result.filter(function(item){
                return item.title.includes(query)
              })
            res.send(JSON.stringify(filtered))
            db.close()
        })
    })
})

app.post("/getItemsByCategory", (req, res) => {
    let parsed = JSON.parse(req.body)
    console.log(parsed)
    let categoryName = parsed.category
    MongoClient.connect(url, {useNewUrlParser: true}, (err, db) => {
        if (err) throw err
        let dbo = db.db("my-database")
        dbo.collection("items").find({category: categoryName}).toArray((err, result) => {
            if (err) throw err
            res.send(JSON.stringify(result))
            db.close()
        })
    })
})

app.post("/getUsersListings", (req, res) => {
    let parsed = JSON.parse(req.body)
    console.log("received from client "+parsed)
    let username = parsed.username
    MongoClient.connect(url, { useNewUrlParser:true }, (err, db) => {
        if (err) throw err
        let dbo = db.db("my-database")
        dbo.collection("items").find({username: username}).toArray((err, result) => {
            if (err) throw err
            console.log('result sent'+ result)
            res.send(JSON.stringify(result))
            db.close()
        })
    })
})

app.post("/addToCart", (req, res) => {
    let parsed = JSON.parse(req.body)
    let username = parsed.username
    MongoClient.connect(url, { useNewUrlParser:true }, (err, db) => {
        if (err) throw err
        let dbo = db.db("my-database")
        dbo.collection("items").findOne({itemID: parseInt(parsed.itemId)}, (err, result) => {
            if (err) throw err
            console.log(result)
            
            dbo.collection("cart").updateOne({username: username},{$push:{cart: result}}, (err, result) => {
                if (err) throw err
                res.send({success: true})
                db.close()
            })
        })
    })
})

// app.post("/removeFromCart", (req, res) => {
//     let parsed = JSON.parse(req.body)
//     let username = parsed.username
//     MongoClient.connect(url, { useNewUrlParser:true }, (err, db) => {
//         if (err) throw err
//         let dbo = db.db("my-database")
//         dbo.collection("cart").
//     })
// })

app.post("/getCart", (req, res) => {
    let parsed = JSON.parse(req.body)
    let username = parsed.username
    MongoClient.connect(url, { useNewUrlParser:true }, (err, db) => {
        if (err) throw err
        let dbo = db.db("my-database")
        dbo.collection("cart").find({username: username}).toArray((err, result) => {
            if (err) throw err
            res.send(JSON.stringify(result))
            db.close()
        })
    })
})

app.post("/getItem", (req, res) => {
    let parsed = JSON.parse(req.body)
    let id = parsed.itemId
    MongoClient.connect(url, { useNewUrlParser:true }, (err, db) => {
        if (err) throw err
        let dbo = db.db("my-database")
        dbo.collection("items").findOne({itemID:parseInt(id)}, (err, result) => {
            if (err) throw err
            res.send(JSON.stringify(result))
        })
    })
})



app.listen(4030, function () { console.log("Server started on port 4030") })
