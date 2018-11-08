let express = require('express')
let app = express()
let bodyParser = require('body-parser')
const MongoClient = require("mongodb").MongoClient;
app.use(bodyParser.raw({ type: '*/*' }))
const url = "mongodb://admin:password1@ds151753.mlab.com:51753/my-database";


let sessions = {}
let usersItems = {}
let itemDescriptions = {}

const genID = () => { return Math.floor(Math.random() * 10000000000) }

app.post("/signup", (req, res) => {
    let parsed = JSON.parse(req.body)
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
                return
            } else {
                dbo.collection("accounts").insertOne(parsed, (err, result) => {
                    if (err) throw err
                    let sessionID = genID()
                    sessions[sessionID] = parsed.username
                    res.set('Set-Cookie', sessionID)
                    console.log("success")
                    res.send(JSON.stringify(
                        { success: true }
                    ))
                })
            }
            db.close()
        })
    })
})

app.post("/login", (req, res) => {
    let parsed = JSON.parse(req.body)
    MongoClient.connect(url, { useNewUrlParser: true }, function (err, db) {
        if (err) throw err
        let dbo = db.db("my-database")
        dbo.collection("accounts").findOne({ username: parsed.username }, (err, result) => {
            if (err) throw err
            if (result.password === parsed.password) {
                let sessionID = genID()
                sessions[sessionID] = parsed.username
                res.set('Set-Cookie', sessionID)
                console.log("logged in")
                res.send(JSON.stringify(
                    { success: true }
                ))
            } else {
                res.send(JSON.stringify(
                    { success: false }
                ))
                return
            }
            db.close()
        })
    })})

app.post("/addItem", (req, res) => {
    let parsed = JSON.parse(req.body)
    let itemID = genID()
    let sessionID = req.headers.cookie
    let newItem = {
        title: parsed.title,
        description: parsed.description,
        category: parsed.category,
        price: parsed.price,
        username: sessions[sessionID],
        itemID: itemID
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
        dbo.collection("accounts").updateOne({username: newItem.username}, {$set:{items: newItem.itemID}}, (err, res) => {
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
            
        })
    })
    res.send(JSON.stringify(itemDescriptions))
})

app.post("/search", (req, res) => {
    let parsed = JSON.parse(req.body)
    let query = parsed.query
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
    let categoryName = parsed.categoryType
    MongoClient.connect(url, {useNewUrlParser: true}, (err, db) => {
        if (err) throw err
        let dbo = db.db("my-database")
        dbo.collection("items").find().toArray((err, result) => {
            if (err) throw err
            let filtered = result.filter(function(item){
                return item.category.includes(categoryName)
            })
            res.send(JSON.stringify(filtered))
            db.close()
        })
    })
})

app.listen(4030, function () { console.log("Server started on port 4030") })
