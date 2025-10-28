const fs = require('node:fs');
const process = require('node:process');

const { name } = JSON.parse(fs.readFileSync('./package.json', 'utf8'));

if (name.startsWith('@')) {
	console.error('Package should not be scoped');
	process.exit(1);
}

if (!name.startsWith('directus-')) {
	console.error('Package name should start with "directus-"');
	process.exit(1);
}
