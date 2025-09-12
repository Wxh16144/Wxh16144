import './contact.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mri from 'mri';
import open from 'open';
import chalk from 'chalk';
import { randomHexColorCode, randomIntegerInRange, genCombinations } from '@wuxh/utils';
import { Fzf } from 'fzf';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const resolvePath = (...arg) => path.resolve(__dirname, ...arg);
const readFileSync = (path) => fs.readFileSync(resolvePath(path), 'utf8');
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const authorLogo = readFileSync('./Wxh16144');
const pkg = JSON.parse(readFileSync('./package.json'));

const contactList = {
  ...globalThis.Wxh16144,
  // tel: 'tel:+86-xxx-xxxx-xxxx',
  '.': pkg.homepage, // source
}

const argv = mri(process.argv.slice(2), {
  alias: { H: 'help', v: 'version', o: 'open', p: 'pick', h: 'hidelogo', s: 'speed' },
  boolean: [...Object.keys(contactList), 'help', 'version', 'open', 'hidelogo'],
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
  const optionArr = genCombinations(['o', 'h', 'p'], { mustInclude: ['p'] });
  const pickClassify = Object.keys(contactList)

  const randomOption = optionArr[randomIntegerInRange(0, optionArr.length - 1)];
  const randomPick = pickClassify[randomIntegerInRange(0, pickClassify.length - 1)];

  return `${pkg.name} -${randomOption} ${randomPick}`
}

async function main(args = argv) {
  let pickLinks = [];
  if (Array.isArray(args.pick)) {
    pickLinks = args.pick.map(x => x.toLowerCase());
  } else if (typeof args.pick === 'string') {
    pickLinks = [args.pick.toLowerCase()];
  } else {
    pickLinks = Object.keys(contactList);
  }

  if (Array.isArray(args._) && args._.length === 1 && args._[0].length) {
    const inputKey = args._[0].toLowerCase();
    const keys = Object.keys(contactList);
    const fzf = new Fzf(keys);
    const [result] = fzf.find(inputKey);
    if (result) {
      pickLinks = [result.item].filter(Boolean);
    }

    if (!('open' in args)) {
      args.open = !!pickLinks.length
    }
  }

  const links = Object.entries(contactList)
    .reduce((acc, [name, link]) => pickLinks.includes(name) ? { ...acc, [name]: link } : acc, {});

  const hideLogo = Object.keys(links).length < Object.keys(contactList).length || args.hidelogo;

  if (args.version) {
    console.log(`${chalk.bold(pkg.name)}: ${chalk.green('v' + pkg.version)}`);
    return;
  }

  if (args.help || Object.keys(links).length === 0) {
    console.log(`
    ${chalk.green(`${chalk.bold(pkg.name)} [keyword] [options]`)}

    ${chalk.blueBright('keyword:')} ${chalk.italic.gray('Fuzzy searches for one of my social media platform links and opens it.')}
    ${chalk.blueBright('options:')}
      -${chalk.bold('p')}, --pick [${Object.keys(contactList).map(val => chalk.hex('#91caff')(val)).join('|')}]
      -${chalk.bold('o')}, --open: use default browser to open the link.
      -${chalk.bold('h')}, --hidelogo: hide auther logo.
      -${chalk.bold('s')}, --speed: set the speed of animation.
      -${chalk.bold('H')}, --help: show help.
      -${chalk.bold('v')}, --version: show version. ${chalk.green('v' + pkg.version)}
      ----------------------------------------
      ${chalk.bold('e.g.')} ${chalk.green(genExample())}
    `)
    return;
  }

  if (!hideLogo) {
    console.log(chalk.hex(randomHexColorCode())(authorLogo));
    await sleep(args.speed)
    console.log(...genLine('=', '#91caff'));
  } else {
    console.log(chalk.bold(`${chalk.green('Author')}: ${pkg.author.name}<${pkg.author.email}>`));
  }

  if (Object.keys(links).length) await sleep(args.speed)

  for (let [name, link] of Object.entries(links)) {
    await sleep(args.speed);
    if (args.open) await open(link);
    const _name = name.charAt(0).toUpperCase() + name.slice(1);
    console.log(chalk.hex('#1677ff')(`  ${chalk.bold(_name)}:`), chalk.underline(chalk.hex('#eb2f96')(link)));
  }

  !hideLogo && console.log(...genLine('=', '#91caff'));
}

export default main;
export { contactList };
