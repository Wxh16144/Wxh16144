const fs = require('fs');
const path = require('path');
const mri = require('mri');
const open = require('open');
const chalk = require('chalk');

const resolvePath = (...arg) => path.resolve(__dirname, ...arg);
const readFileSync = (path) => fs.readFileSync(resolvePath(path), 'utf8');
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const autherLogo = readFileSync('./Wxh16144');
const package = JSON.parse(readFileSync('./package.json'));

const contactList = {
  github: 'https://github.com/wxh16144',
  twitter: 'https://twitter.com/wxh16144',
  weibo: 'https://weibo.com/wxh16144',
  zhihu: 'https://www.zhihu.com/people/wxh16144',
  telegram: 'https://t.me/wxh16144',
  blog: 'https://wxh16144.github.io',
  email: `mailto:${package.author.email}`,
  dev: 'https://dev.to/wxh16144',
  npm: 'https://www.npmjs.com/~wxh16144',
  docker: 'https://hub.docker.com/u/wxh16144',
  // tel: 'tel:+86-xxx-xxxx-xxxx',
}

const argv = mri(process.argv.slice(2), {
  alias: { H: 'help', v: 'version', o: 'open', p: 'pick', h: 'hidelogo', s: 'speed' },
  boolean: [...Object.keys(contactList)],
  default: { pick: Object.keys(contactList), speed: Math.floor(1000 / 60) }
});

async function main(args = argv) {

  const pickLinks = (
    Array.isArray(args.pick) ? args.pick : typeof args.pick === 'string' ? [args.pick] : []
  ).reduce((acc, cur) => typeof cur === 'string' ? acc.concat(cur.toLowerCase()) : acc, [])

  const links = Object
    .entries(contactList)
    .reduce((acc, [name, link]) => pickLinks.includes(name) ? { ...acc, [name]: link } : acc, {});

  const hideLogo = args.hidelogo;

  if (args.version) {
    console.log(`${chalk.bold(package.name)}: ${chalk.blue('v' + package.version)}`);
    return;
  }

  if (args.help || Object.keys(links).length === 0) {
    console.log(`
    ${chalk.green(`${package.name} [options]`)}
      -p, --pick [${Object.keys(contactList).join('|')}]
      -o, --open: use default browser to open the link.
      -h, --hidelogo: hide auther logo.
      -s, --speed: set the speed of animation.
      -H, --help: show help.
      -v, --version: show version. ${chalk.blue('v' + package.version)}
      ----------------------------------------
      ${chalk.bold('e.g.')} ${chalk.green(`${package.name} -hop ${Object.keys(contactList)[0]}`)}
    `)
    return;
  }

  if (!hideLogo) {
    console.log(autherLogo);
    await sleep(args.speed)
    console.log('\n', '='.repeat(57), '\n');
  } else {
    console.log(chalk.bold(`${chalk.green('Author')}: ${package.author.name}<${package.author.email}>`));
  }

  if (Object.keys(links).length) await sleep(args.speed)

  for (let [name, link] of Object.entries(links)) {
    await sleep(args.speed);
    if (args.open) await open(link);
    const _name = name.charAt(0).toUpperCase() + name.slice(1);
    console.log(chalk.blue(`  ${chalk.bold(_name)}:`), chalk.underline(chalk.blue(link)));
  }

  !hideLogo && console.log('\n', '='.repeat(57), '\n');

}

module.exports = main;
module.exports.contactList = contactList;
