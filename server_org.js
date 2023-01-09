// Env
require('dotenv').config()

// Requires
const fs = require('fs')
var _ = require('lodash')
var lp = require("node-lp")
const express = require('express')
const { v4: uuidv4 } = require('uuid')
var pkginfo = require('pkginfo')(module)
const Handlebars = require('handlebars')

// Init
const app = express()
app.use(express.json());
const port = process.env.HTTP_PORT ?? 8000
const host = process.env.HTTP_HOST ?? '127.0.0.1'
printer = lp({
	destination: process.env.PRINTER
});

// Middleware
const verifyToken = (req, res, next) => {
	if ((req.headers.authorization || "").split(' ')[1] == process.env.AUTH_KEY)
		next();
	else
		res.status(403).send({ result: false, error: "Unauthorized", });
};


app.get('/', (req, res) => {
	res.send({
		service: {
			name: module.exports.name,
			author: module.exports.author,
			version: module.exports.version,
			description: module.exports.description,
		},
		templates: fs.readdirSync('./templates/')
			.map(function (fileName) {
				return { name: fileName, info_url: req.protocol + "://" + req.headers.host + '/templates/' + fileName, };
			})
	})
})
app.get('/templates/:filename', (req, res) => {
	var data = {};
	fs.readFileSync('./templates/' + req.params.filename, 'utf8').match(/\{\{\s+[\w\.]+\s+\}\}/g).forEach((variable) => {
		_.set(data, variable.replace('{{', '').replace('}}', '').trim(), "Data");
	})
	res.send({
		template: {
			filename: req.params.filename,
			data
		}
	})
})
app.post('/print', verifyToken, (req, res) => {
	print_data = Buffer.from(req.body.print_data, 'base64')
	execPrint(print_data, res)
})
app.post('/print-template', verifyToken, async (req, res) => {
	var source_template_ht = fs.readFileSync('./templates/' + req.body.template.filename, 'utf8');
	var template = Handlebars.compile(source_template_ht);
	var print_data = await template(req.body.template.data);
	// console.log("BP1"); console.log(print_data); console.log("BP2");
	execPrint(print_data, res)
	// console.log("BP3");
})

function execPrint(payload, res) {
	var uuid = uuidv4()
	var path = __dirname + '/tmp/' + uuid;
	// console.log("BP4"); console.log(path); console.log("BP5");
	fs.writeFile(path, payload, (err) => {
		if(err)
			res.send({ success: false, "message": err })
		printer.queue(path, () => {
			res.send({ success: true, "message": "Printed" })
		});
	});
}

app.listen(port, host, () => {
	console.log(`Example app listening on port ${port} with cwd of ${__dirname}`)
})