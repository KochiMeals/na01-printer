// Env
require("dotenv").config();

// Requires
const fs = require("fs");
var _ = require("lodash");
const express = require("express");
const { v4: uuidv4 } = require("uuid");
// var pkginfo = require("pkginfo")(module);
const Handlebars = require("handlebars");

// Init
const app = express();
app.use(express.json());
const port = process.env.HTTP_PORT ?? 8000;
const host = process.env.HTTP_HOST ?? "127.0.0.1";
const worker = process.env.WORKER ?? 0;

switch (worker) {
	default:
		var printer = require("@thiagoelg/node-printer");
		break;
	case "1":
		var lp = require("node-lp");
		break;
}

Handlebars.registerHelper("if_even", function (conditional, options) {
	if (conditional % 2 == 0) {
		return options.fn(this);
	} else {
		return options.inverse(this);
	}
});
const verifyToken = (req, res, next) => {
	if ((req.headers.authorization || "").split(" ")[1] == process.env.AUTH_KEY)
		next();
	else res.status(403).send({ result: false, error: "Unauthorized" });
};

app.get("/", (req, res) => {
	res.send({
		service: {
			name: module.exports.name,
			author: module.exports.author,
			version: module.exports.version,
			description: module.exports.description,
		},
		templates: fs.readdirSync("./templates/").map(function (fileName) {
			return {
				name: fileName,
				info_url:
					req.protocol + "://" + req.headers.host + "/templates/" + fileName,
			};
		}),
	});
});
app.post("/print", verifyToken, (req, res) => {
	print_data = Buffer.from(req.body.print_data, "base64");
	execPrint(print_data, res);
});
app.post("/print-template", verifyToken, async (req, res) => {
	var source_template_ht = fs.readFileSync(
		"./templates/" + req.body.template.filename,
		"utf8"
	);
	var template = Handlebars.compile(source_template_ht);
	items = req.body.template.data.items;
	shift_x = req.body.template.shift_x ?? 0;
	if (items.length % 2 == 1) {
		last_item = {};
		Object.keys(items[items.length - 1]).forEach(key => {
			last_item[key] = "EOF";
		});
		items.push(last_item);
	}
	var print_data = await template({ items, shift_x });
	execPrint(print_data, res);
});
app.post("/show-template", verifyToken, async (req, res) => {
	var source_template_ht = fs.readFileSync(
		"./templates/" + req.body.template.filename,
		"utf8"
	);
	var template = Handlebars.compile(source_template_ht);
	items = req.body.template.data.items;
	if (items.length % 2 == 1) {
		last_item = {};
		Object.keys(items[items.length - 1]).forEach(key => {
			last_item[key] = "EOF";
		});
		items.push(last_item);
	}
	var print_data = await template({ items });
	res.send(print_data);
});

function execPrint(payload, res) {
	var uuid = uuidv4();
	var path = __dirname + "/tmp/" + uuid;
	fs.writeFile(path, payload, err => {
		if (err) {
			res.send({ success: false, point: "writeFile", message: err });
		} else {
			switch (worker) {
				case "1":
					// try {
					var printer = lp({ destination: process.env.PRINTER });
					printer.queue(path);
					res.send({ success: true, message: "Printed" });
					// } catch (err) {
					// 	res.send({ success: false, message: e });
					// }
					break;
				default:
					printer.printDirect({
						data: fs.readFileSync(path),
						printer: process.env.PRINTER,
						success: function (jobID) {
							console.log("sent to printer with ID: " + jobID);
							res.send({ success: true, message: "Printed", job_id: jobID });
						},
						error: function (err) {
							console.log(err);
							res.send({ success: false, message: err });
						},
					});
					break;
			}
		}
	});
}

app.listen(port, host, () => {
	console.log(`Example app listening on port ${port} with cwd of ${__dirname}`);
});
