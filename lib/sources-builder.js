var inquirer = require('inquirer')

var sources = []
isBeginning = true

var sourceType = {
  type: 'list',
  name: 'sourceType',
  message: 'Please choose the source type?',
  choices: ['mongoDB', 'mySQL', 'files', 'file']
}

var mongoDBquestions = [
  {
    type: 'input',
    name: 'DbName',
    message: 'Enter database name ...'
  },
  {
    type: 'input',
    name: 'DbHost',
    message: 'Enter host (just hit enter to skip)...'
  },
  {
    type: 'input',
    name: 'DbPort',
    message: 'Enter port (just hit enter to skip)...'
  }
]

var fileQuestions = [
  {
    type: 'input',
    name: 'path',
    message: 'Enter path ...'
  }
]

var filesQuestions = [
  {
    type: 'confirm',
    name: 'archive',
    message: 'Want to archive these files (just hit enter for YES)?',
    default: true
  },
  {
    type: 'input',
    name: 'path',
    message: 'Enter path ...'
  },
  {
    type: 'input',
    name: 'name',
    message: 'Enter a name for this source ...'
  }
]

var mySQLquestions = [
  {
    type: 'input',
    name: 'DbName',
    message: 'Enter database name ...'
  },
  {
    type: 'input',
    name: 'DbHost',
    message: 'Enter host (just hit enter to skip)...'
  },
  {
    type: 'input',
    name: 'DbPort',
    message: 'Enter port (just hit enter to skip)...'
  },
  {
    type: 'input',
    name: 'DbUser',
    message: 'Enter database user ...'
  },
  {
    type: 'input',
    name: 'DbPassword',
    message: 'Enter database password (just hit enter to skip)...'
  }
]

var askForAnotherSource = [
  {
    type: 'confirm',
    name: 'addAgain',
    message: 'Want to enter another source ?',
    default: true
  }
]

function sourcesBuilder() {
  return new Promise((resolve, reject) => {
    function addSource() {
      inquirer.prompt(sourceType).then(answers => {
        switch (answers.sourceType) {
          case 'mongoDB':
            inquirer.prompt(mongoDBquestions).then(answers => {
              sources.push({
                type: 'mongoDB',
                ...answers,
              })
              addAnotherDest()
            })
            break
          case 'file':
            inquirer.prompt(fileQuestions).then(answers => {
              sources.push({
                type: 'file',
                ...answers,
              })
              addAnotherDest()
            })
            break
          case 'files':
            inquirer.prompt(filesQuestions).then(answers => {
              sources.push({
                type: 'files',
                ...answers,
              })
              addAnotherDest()
            })
            break
          case 'mySQL':
            inquirer.prompt(mySQLquestions).then(answers => {
              sources.push({
                type: 'mySQL',
                ...answers,
              })
              addAnotherDest()
            })
            break
        }
      })
    }

    function addAnotherDest() {
      if (isBeginning) {
        addSource()
        isBeginning = false
      } else {
        inquirer.prompt(askForAnotherSource).then(answers => {
          if (answers.addAgain) {
            addSource()
          } else {
            resolve(sources)
          }
        })
      }
    }

    addAnotherDest()
  })
}

module.exports = {
  sourcesBuilder
}
