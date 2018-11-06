let express = require('express')
let app = express()
let bodyParser = require('body-parser')
app.use(bodyParser.raw({ type: '*/*' }))


app.get('/foobar', function(req, res) {
	res.send("Hello world!")
})
app.post('/hasbody', function(req, res) {
    res.send('You sent: ' + req.body.toString())
 })
 

app.listen(4000, function() { console.log("Server started on port 4000") })
