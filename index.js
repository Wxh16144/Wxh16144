const fs = require('fs');
const path = require('path');
const mri = require('mri');
const open = require('open');
const chalk = require('chalk');
const utils = require('@wuxh/utils')

const resolvePath = (...arg) => path.resolve(__dirname, ...arg);
const readFileSync = (path) => fs.readFileSync(resolvePath(path), 'utf8');
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const authorLogo = readFileSync('./Wxh16144');
const package = JSON.parse(readFileSync('./package.json'));

const contactList = {
  github: 'https://github.com/wxh16144',
  // twitter: 'https://twitter.com/wxh16144',
  x: 'https://x.com/wxh16144',
  weibo: 'https://weibo.com/wxh16144',
  zhihu: 'https://zhihu.com/people/wxh16144',
  telegram: 'https://t.me/wxh16144',
  blog: 'https://wxh16144.github.io',
  email: `mailto:${package.author.email}`,
  dev: 'https://dev.to/wxh16144',
  npm: 'https://npmjs.com/~wxh16144',
  docker: 'https://hub.docker.com/u/wxh16144',
  v2ex: 'https://v2ex.com/member/wxh16144',
  wakatime: 'https://wakatime.com/@wxh16144',
  // tel: 'tel:+86-xxx-xxxx-xxxx',
  '.': package.homepage,
}

const argv = mri(process.argv.slice(2), {
  alias: { H: 'help', v: 'version', o: 'open', p: 'pick', h: 'hidelogo', s: 'speed' },
  boolean: [...Object.keys(contactList)],
  default: { pick: Object.keys(contactList), speed: Math.floor(1000 / 60) }
});

function genLine(style = '-', color, length = 57) {
  let line = style.repeat(length)
  if (color) {
    line = chalk.hex(color)(line)
  }
  return ['\n', line, '\n']
}

function genExample() {
  const optionArr = utils.genCombinations(['o', 'h', 'p'], { mustInclude: ['p'] });
  const pickClassify = Object.keys(contactList)

  const randomOption = optionArr[utils.randomIntegerInRange(0, optionArr.length - 1)];
  const randomPick = pickClassify[utils.randomIntegerInRange(0, pickClassify.length - 1)];

  return `${package.name} -${randomOption} ${randomPick}`
}

async function main(args = argv) {

  const pickLinks = (
    Array.isArray(args.pick) ? args.pick : typeof args.pick === 'string' ? [args.pick] : []
  ).reduce((acc, cur) => typeof cur === 'string' ? acc.concat(cur.toLowerCase()) : acc, [])

  const links = Object
    .entries(contactList)
    .reduce((acc, [name, link]) => pickLinks.includes(name) ? { ...acc, [name]: link } : acc, {});

  const hideLogo = args.hidelogo;

  if (args.version) {
    console.log(`${chalk.bold(package.name)}: ${chalk.green('v' + package.version)}`);
    return;
  }

  if (args.help || Object.keys(links).length === 0) {
    console.log(`
    ${chalk.green(`${chalk.bold(package.name)} [options]`)}
      -${chalk.bold('p')}, --pick [${Object.keys(contactList).map(val=>chalk.hex('#91caff')(val)).join('|')}]
      -${chalk.bold('o')}, --open: use default browser to open the link.
      -${chalk.bold('h')}, --hidelogo: hide auther logo.
      -${chalk.bold('s')}, --speed: set the speed of animation.
      -${chalk.bold('H')}, --help: show help.
      -${chalk.bold('v')}, --version: show version. ${chalk.green('v' + package.version)}
      ----------------------------------------
      ${chalk.bold('e.g.')} ${chalk.green(genExample())}
    `)
    return;
  }

  if (!hideLogo) {
    console.log(chalk.hex(utils.randomHexColorCode())(authorLogo));
    await sleep(args.speed)
    console.log(...genLine('=', '#91caff'));
  } else {
    console.log(chalk.bold(`${chalk.green('Author')}: ${package.author.name}<${package.author.email}>`));
  }

  if (Object.keys(links).length) await sleep(args.speed)

  for (let [name, link] of Object.entries(links)) {
    await sleep(args.speed);
    if (args.open) await open(link);
    const _name = name.charAt(0).toUpperCase() + name.slice(1);
    console.log(chalk.hex('#1677ff')(`  ${chalk.bold(_name)}:`), chalk.underline(chalk.hex('#eb2f96')(link)));
  }

  !hideLogo && console.log(...genLine('=', '#91caff'));;
}

module.exports = main;
module.exports.contactList = contactList;
