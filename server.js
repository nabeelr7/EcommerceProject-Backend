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
    MongoClient.connect(url, { useNewUrlParser: true }, function (err, db) {
        if (err) throw err;
        let dbo = db.db("my-database")
        dbo.collection("accounts").findOne({ username: parsed.username }, (err, result) => {
            if (err) throw err
            if (result) {
                res.send(JSON.stringify(
                    { "success": "false" }
                ))
                return
            } else {
                dbo.collection("accounts").insertOne(parsed, (err, result) => {
                    if (err) throw err
                    console.log("success")
                    let sessionID = genID()
                    sessions[sessionID] = parsed.username
                    res.set('Set-Cookie', sessionID)
                    res.send(JSON.stringify(
                        { "success": "true" }
                    ))
                })
            }
            db.close()
        })
    })
})

app.post("/login", (req, res) => {
    let parsed = JSON.parse(req.body)
    let username = parsed.username
    let password = parsed.password

    if (passwords[username] !== password) {
        res.send(JSON.stringify(
            { "success": "false" }
        ))
        return
    }

    let sessionID = genID()
    sessions[username] = sessionID

    res.send(JSON.stringify(
        { "success": "true" }
    ))
})

app.post("/addItem", (req, res) => {
    let parsed = JSON.parse(req.body)
    let title = parsed.title
    let price = parsed.price
    let description = parsed.description
    let category = parsed.category
    let itemID = genID()
    itemDescriptions[itemID] = {
        title: title,
        description: description,
        category: category,
        price: price
    }
    let username = sessions[sessionID]
    if (usersItems[username] === undefined) {
        usersItems[username] = []
    }
    usersItems[username] = usersItems[username].concat(itemID)
    res.send(JSON.stringify({ success: true }))
})

app.get("/getAllItems", (req, res) => {
    res.send(JSON.stringify(itemDescriptions))
})


app.listen(4030, function () { console.log("Server started on port 4030") })
