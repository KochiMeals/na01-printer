require('dotenv').config()
var lp = require("node-lp");
const fs = require('fs')
const express = require('express')
var pkginfo = require('pkginfo')(module);
var _ = require('lodash');
const Handlebars = require('handlebars');

const app = express()
app.use(express.json());
const port = process.env.HTTP_PORT ?? 8000
const host = process.env.HTTP_HOST ?? '127.0.0.1'
printer = lp({
	destination: process.env.PRINTER
});

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
				var source_template_ht = fs.readFileSync('./templates/' + fileName, 'utf8');
				var template = Handlebars.compile(source_template_ht);
				return {
					name: fileName,
					info_url: req.protocol + "://" + req.headers.host + '/templates/' + fileName,
					
				};
			})
	})
})
app.get('/templates/:filename', (req, res) => {

	var data = {};
	fs.readFileSync('./templates/' + req.params.filename, 'utf8').match(/\{\{\s+[\w\.]+\s+\}\}/g).forEach((variable) => {
		variable_name = variable.replace('{{', '').replace('}}', '').trim();
		_.set(data, variable_name, "Data");
	})
	// _.forEach(variables_array, function (value, key) {
	// 	_.set(variables, key, value[]);
	// });
	res.send({
		template: {
			filename: req.params.filename,
			data
		}
	})
})
app.post('/print', verifyToken, (req, res) => {
	print_data = Buffer.from(req.body.print_data, 'base64');
	printer.queue(print_data, () => {
		res.send({ success: true, "message": "Printed" })
	});
})
app.post('/print-template', verifyToken, async (req, res) => {
	var source_template_ht = fs.readFileSync('./templates/' + req.body.template.filename, 'utf8');
	var template = Handlebars.compile(source_template_ht);
	var print_data = await template(req.body.template.data);
	printer.queue(print_data, () => {
		res.send({ success: true, "message": "Printed", print_data})
	});
})

app.listen(port, host, () => {
	console.log(`Example app listening on port ${port}`)
})