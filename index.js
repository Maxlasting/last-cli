#!/usr/bin/env node
const program = require('commander')
const download = require('download-git-repo')
const handlebars = require('handlebars')
const inquirer = require('inquirer')
const ora = require('ora')
const chalk = require('chalk')
const symbols = require('log-symbols')
const fs = require('fs')
const shell = require('shelljs')

const registry = {
  'vue-ssr': 'https://github.com:Maxlasting/vue-ssr-template#master',
  'vue-spa': 'https://github.com:Maxlasting/vue-www-template#master',
  'koa': 'https://github.com:Maxlasting/last-koa-template#master'
}

const initCommands = [
  {
    name: 'description',
    message: 'entry description of project'
  },
  {
    name: 'author',
    message: 'entry author of project'
  }
]

const installCommands = {
  type: 'confirm',
  name: 'ifInstall',
  message: 'Initialize git and install dependence now? (default: yes)',
  default: true
}

const downloadPromise = (url, name, options = { clone: true }) => new Promise(async (resolve, reject) => {
  const answers = await inquirer.prompt(initCommands)
  const spinner = ora('download template ...')

  spinner.start()

  download(url, name, options, (err) => {
    if (err) {
      spinner.fail()
      console.error(symbols.error, chalk.red(err))
      return reject(err)
    }

    spinner.succeed()

    const fileName = `${name}/package.json`

    const meta = {
      name,
      description: answers.description,
      author: answers.author
    }

    if (fs.existsSync(fileName)) {
      const content = fs.readFileSync(fileName).toString()
      const result = handlebars.compile(content)(meta)
      fs.writeFileSync(fileName, result);
    }

    console.log(symbols.success, chalk.green('template init ok!'))
    
    return resolve()
  })
})

const installPromise = (name) => new Promise(async (resolve, reject) => {
  const { ifInstall } = await inquirer.prompt(installCommands)

  if (!ifInstall) return resolve()
  
  const spinner = ora('Installing ...')

  spinner.start()

  shell.exec(`cd ${name} && git init && npm i`, (err, stdout, stderr) => {
    if (err) {
      spinner.fail()
      console.log(symbols.error, chalk.red(err))
      return reject(err)
    }

    spinner.succeed()
    console.log(symbols.success, chalk.green('The object has installed dependence successfully!'))
    return resolve()
  })
})

program

  .version('0.0.1', '-v, --version')

  .command('init [query] <name>')

  .option('vue-ssr')

  .action( async (query, name) => {
    if (!fs.existsSync(name)) {
      const url = registry[query]

      if (!url) return console.error('Error init query!')

      try {
        await downloadPromise(url, name)
        await installPromise(name)
      } catch (error) {
        console.error(error)
      }

    } else {
      console.error(symbols.error, chalk.red('The project has already created!'))
    }
  })

program.parse(process.argv)


