let express = require('express')
let app = express()
let bodyParser = require('body-parser')
app.use(bodyParser.raw({ type: '*/*' }))

let passwords = {}
let sessions = {}
let usersItems = {}
let itemDescriptions = {}

const genID = () => { return Math.floor(Math.random() * 10000000000) }

app.post("/signup", (req, res) => {
    let parsed = JSON.parse(req.body)
    let username = parsed.username
    let password = parsed.password

    if (passwords[username]) {
        res.send(JSON.stringify(
            { "success": "false" }
        ))
        return
    }

    passwords[username] = password
    let sessionID = genID()
    sessions[sessionID] = username
    res.set('Set-Cookie', sessionID)
    res.send(JSON.stringify(
        { "success": "true" }
    ))
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
    let itemID = genID()
    itemDescriptions[itemID] = {
        title: title,
        description: description,
        price: price
    }
    let username = sessions[sessionID]
    if (usersItems[username] === undefined){
        usersItems[username] = []
    }
    usersItems[username] = usersItems[username].concat(itemID)
    res.send(JSON.stringify({success: true}))
})


app.listen(4030, function () { console.log("Server started on port 4030") })
