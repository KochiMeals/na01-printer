require('dotenv').config()
const fs = require('fs')
const fetch = require('node-fetch')

url = "https://km-kterm-01.ddpl.xyz/print"

data = fs.readFileSync('./samples/PROD01.prn');
print_data = Buffer.from(data).toString('base64');

async function run() {
	const request = await fetch(url, {
		method: 'POST',
		body: JSON.stringify({
			print_data 
		}),
		headers: {
			'Authorization': "Bearer " + process.env.AUTH_KEY,
			'Content-Type': 'application/json',
		}
	});
	const response = await request.json();
	console.log(response);
}

run();