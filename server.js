require('dotenv').config()
var lp = require("node-lp");
const express = require('express')
var pkginfo = require('pkginfo')(module);
const Handlebars = require('handlebars');

const app = express()
app.use(express.json());
const port = process.env.HTTP_PORT ?? 8000
const host = process.env.HTTP_HOST ?? '127.0.0.1'
printer = lp({
	destination: process.env.PRINTER
});

const verifyToken = (req, res, next) => {
	if((req.headers.authorization || "").split(' ')[1] == process.env.AUTH_KEY)
		next();
	else
		res.status(403).send({result: false,	error: "Unauthorized", });
};

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
app.post('/print', verifyToken, (req, res) => {
	print_data = Buffer.from(req.body.print_data, 'base64');
	printer.queue(print_data, () => {
		res.send({success: true, "message": "Printed"})
	});
})
app.post('/print-template', verifyToken, (req, res) => {
	var source_template_ht = fs.readFileSync('./templates/' + req.body.template_filename, 'utf8');
	var template = Handlebars.compile(source_template_ht);
	var print_data = template(req.body.template.data);
	printer.queue(print_data, () => {
		res.send({success: true, "message": "Printed"})
	});
})

app.listen(port, host, () => {
	console.log(`Example app listening on port ${port}`)
})