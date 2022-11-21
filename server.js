require('dotenv').config()
var lp = require("node-lp");
const fs = require('fs')
const express = require('express')
const { v4: uuidv4 } = require('uuid');
var pkginfo = require('pkginfo')(module);
var _ = require('underscore');

const app = express()
app.use(express.json());
const port = process.env.HTTP_PORT ?? 8000
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
		tmp_files: _.without(fs.readdirSync('./tmp/'), '.gitignore').map(function (fileName) {
			return {
				name: fileName,
				age_in_ms: Math.floor((Date.now() - fs.statSync('./tmp/' + fileName).mtime.getTime()) / 1000),
			};
		})
	})
})
app.post('/print', (req, res) => {
	uuid = uuidv4();
	data = Buffer.from(req.body.print_data, 'base64');
	path = "./tmp/" + uuid + ".prn"
	fs.writeFile(path, data, (err) => {
		if(err) {
			res.send({success: false, "message": err})
		}
		else {
			printer.queue (path, () => {
				res.send({success: true, "message": "Printed"})
				setTimeout(() => {
					fs.unlink(path, (err) => {})
				}, 15 * 1000)
			});
		}
	})
})

app.listen(port, () => {
	console.log(`Example app listening on port ${port}`)
})