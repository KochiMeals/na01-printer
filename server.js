require('dotenv').config()
var lp = require("node-lp");
const express = require('express')
var pkginfo = require('pkginfo')(module);

const app = express()
app.use(express.json());
const port = process.env.HTTP_PORT ?? 8000
const host = process.env.HTTP_HOST ?? '127.0.0.1'
printer = lp({
	destination: process.env.PRINTER
});

app.get('/', async (req, res) => {
	res.send({
		service: {
			name: module.exports.name,
			author: module.exports.author,
			version: module.exports.version,
			description: module.exports.description,
		},
	})
})
app.post('/print', (req, res) => {
	data = Buffer.from(req.body.print_data, 'base64');
	printer.queue(data, () => {
		res.send({success: true, "message": "Printed"})
	});
})

app.listen(port, host, () => {
	console.log(`Example app listening on port ${port}`)
})