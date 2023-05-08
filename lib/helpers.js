const path = require('path')
const fs = require('fs')
var moment = require('moment')
var archiver = require('archiver')
const fse = require('fs-extra')

function sync(opt) {
  return new Promise((resolve, reject) => {
    console.log('Start sync process ...')
    
    var spawn = require('child_process').spawn
    const ls = spawn('rclone', ['sync', opt.source, opt.dest, '-P'])

    ls.stderr.on('data', data => {
      console.log(`stderr: ${data}`)
    })

    ls.stdout.on('data', (data) => {
      console.log(data.toString())
    })

    ls.on('close', code => {
      console.log('Sync process completed!')
      resolve(code)
      //   console.log(`child process exited with code ${code}`);
    })
  })
}

function mySQL(opt) {
  return new Promise((resolve, reject) => {
    /**
     * MySQL
     * https://stackoverflow.com/a/48035109/3263601
     */
    var spawn = require('child_process').spawn
    var wstream = fs.createWriteStream(opt.dumpFile + '.sql')
    wstream.on('open', function(fd) {
      var args = [
        '--user=' + opt.DbUser,
        opt['DbPassword'] && ('--password=' + opt.DbPassword),
        opt['DbHost'] && ('--host=' + opt.DbHost),
        opt['DbPort'] && ('--port=' + opt.DbPort),
        opt.DbName,
      ].filter(Boolean);
      var mysqldump = spawn('mysqldump', args);
      mysqldump.stdout
        .pipe(wstream)
        .on('error', function(err) {
          console.error(err.message)
        });
      mysqldump.stderr.on('data', function(line) {
        console.error(line.toString())
      });
      mysqldump
        .on('error', function(err) {
          console.error(err.message)
          reject(err);
        })
        .on('exit', function(code) {
          if (code) {
            reject(new Error('mysqldump exit code: ' + code));
          } else {
            console.log('mySQL Job Completed!')
            resolve();
          }
        });
    });
  })
}

function mongoDB(opt) {
  return new Promise((resolve, reject) => {
    var spawn = require('child_process').spawn
    var wstream = fs.createWriteStream(opt.dumpFile + '.tar.gz')
        wstream.on('open', function(fd) {
          var args = [
            opt['DbHost'] && ('--host=' + opt.DbHost),
            opt['DbPort'] && ('--port=' + opt.DbPort),
            '--archive',
            '--gzip',
            '--quiet',
            '--db=' + opt.DbName,
          ].filter(Boolean);
          var mongodump = spawn('mongodump', args);
          mongodump.stdout
            .pipe(wstream)
            .on('error', function(err) {
              console.error(err.message)
            });
          mongodump.stderr.on('data', function(line) {
            console.error(line.toString())
          });
          mongodump
            .on('error', function(err) {
              console.error(err.message)
              reject(err);
            })
            .on('exit', function(code) {
              if (code) {
                reject(new Error('mongodump exit code: ' + code));
              } else {
                console.log('mongoDB Job Completed!')
                resolve();
              }
            });
        });
  })
}

function listFolders(pathOnRemote) {
  return new Promise((resolve, reject) => {
    var spawn = require('child_process').spawn
    const ls = spawn('rclone', [
      'lsjson',
      `${SBConfig.remoteName}:${pathOnRemote}`
    ])

    var allData = ''
    ls.stdout.on('data', data => {
      allData += data
    })

    ls.stderr.on('data', data => {
      // console.log(`stderr: ${data}`)
    })

    ls.on('close', code => {
      try {
        var folderNames = JSON.parse(allData).map(e => e.Name)
      } catch (error) {
        var folderNames = []
      }
      resolve(folderNames)
      //   console.log(`child process exited with code ${code}`);
    })
  })
}

//Delete folder on the remote
function purge(pathOnRemote) {
  return new Promise((resolve, reject) => {
    var spawn = require('child_process').spawn
    const ls = spawn('rclone', [
      'purge',
      `${SBConfig.remoteName}:${pathOnRemote}`
    ])

    ls.stderr.on('data', data => {
      console.log(`stderr: ${data}`)
    })

    ls.on('close', code => {
      resolve(true)
      //   console.log(`child process exited with code ${code}`);
    })
  })
}

/**
 * folders like [
        '2018-05-15-2255',
        '2018-05-15-2245',
        '2018-05-16-2255',
        '2018-04-16-2256',
        '2018-05-31-2256'
    ]
 */
function oldestDate(folders) {
  var sortedFolders = folders.sort(function(left, right) {
    return moment(left, 'YYYY-MM-DD-HHmm').diff(
      moment(right, 'YYYY-MM-DD-HHmm')
    )
  })

  if (sortedFolders.length) {
    return sortedFolders[0]
  }

  return null
}

function getFilesList(folderPath) {
  return new Promise((resolve, reject) => {
    fs.readdir(folderPath, (err, files) => {
      if (err) {
        reject(err)
      }
      resolve(files)
    })
  })
}

function deleteFile(file) {
  return new Promise((resolve, reject) => {
    fs.unlink(file, err => {
      if (err) {
        reject(err)
      }
      resolve()
    })
  })
}

async function emptyDir(dir) {
  try {
    await fse.emptyDir(dir)
  } catch (err) {
    console.error(err)
  }
}

function createTmpIfNotExist() {
  return new Promise((resolve, reject) => {
    var dir = process.cwd() + '/tmp'

    fs.exists(dir, exists => {
      if (exists) {
        resolve()
      } else {
        fs.mkdir(dir, err => {
          if (err) {
            reject(err)
          }
          resolve()
        })
      }
    })
  })
}

function createCurrentDateTimeFolder(currentDateTime) {
  return new Promise((resolve, reject) => {
    var dir = process.cwd() + '/tmp/' + currentDateTime

    fs.exists(dir, exists => {
      if (exists) {
        resolve()
      } else {
        fs.mkdir(dir, err => {
          if (err) {
            reject(err)
          }
          resolve()
        })
      }
    })
  })
}

function archiveMaker(opt) {
  return new Promise((resolve, reject) => {
    console.log(
      'Archiver working on: ' +
        process.cwd() +
        '/tmp/' +
        opt.currentDateTime +
        '/' +
        opt.name +
        '.zip'
    )
    // create a file to stream archive data to.
    var output = fs.createWriteStream(
      process.cwd() + '/tmp/' + opt.currentDateTime + '/' + opt.name + '.zip'
    )
    var archive = archiver('zip', {
      zlib: { level: 0 } // Sets the compression level.
    })

    // listen for all archive data to be written
    // 'close' event is fired only when a file descriptor is involved
    output.on('close', function() {
      resolve()
      console.log(archive.pointer() + ' total bytes')
      console.log(
        'archiver has been finalized and the output file descriptor has closed.'
      )
    })

    // This event is fired when the data source is drained no matter what was the data source.
    // It is not part of this library but rather from the NodeJS Stream API.
    // @see: https://nodejs.org/api/stream.html#stream_event_end
    output.on('end', function() {
      console.log('Data has been drained')
    })

    // good practice to catch warnings (ie stat failures and other non-blocking errors)
    archive.on('warning', function(err) {
      if (err.code === 'ENOENT') {
        // log warning
      } else {
        // throw error
        throw err
      }
    })

    // good practice to catch this error explicitly
    archive.on('error', function(err) {
      reject(err)
      throw err
    })

    // pipe archive data to the file
    archive.pipe(output)

    // append files from a sub-directory, putting its contents at the root of archive
    archive.directory(opt.path, false)

    // finalize the archive (ie we are done appending files but streams have to finish yet)
    // 'close', 'end' or 'finish' may be fired right after calling this method so register to them beforehand
    archive.finalize()
  })
}

function sequentialIterationWithPromises(tasks, cb = null) {
  let promise = tasks.reduce((prev, task) => {
    return prev.then(() => {
      return task()
    })
  }, Promise.resolve())

  promise.then(() => {
    //All tasks completed
    if (cb instanceof Function) {
      cb()
    }
  })
}

function handleMongoDBSource(source) {
  return new Promise((resolve, reject) => {
    var dumpFile =
      process.cwd() + '/tmp/' + source.currentDateTime + '/' + source.DbName
    mongoDB({ ...source, dumpFile })
      .then(() => {
        resolve()
      })
      .catch(e => {
        console.log(e)
        reject(e)
      })
  })
}

function handleFileSource(source) {
  return new Promise((resolve, reject) => {
    //Copy the file to for example tmp/2019-07-13-0430/filename.ext
    fse
      .copy(
        source.path,
        `${process.cwd()}/tmp/${source.currentDateTime}/${path.basename(
          source.path
        )}`
      )
      .then(() => resolve())
      .catch(err => {
        console.error(err)
        reject(err)
      })
  })
}

function handleFilesSource(source) {
  return new Promise((resolve, reject) => {
    if (source.archive) {
      var archiveName = source.name + '_' + source.currentDateTime
      archiveMaker({
        path: source.path,
        name: archiveName,
        currentDateTime: source.currentDateTime
      })
        .then(() => {
          resolve()
        })
        .catch(e => {
          console.log(e)
          reject(e)
        })
    } else {
      //Copy the files to for example tmp/2019-07-13-0430
      fse
        .copy(source.path, `${process.cwd()}/tmp/${source.currentDateTime}`)
        .then(() => resolve())
        .catch(err => {
          console.error(err)
          reject(err)
        })
    }
  })
}

function handleMySQLSource(source) {
  return new Promise((resolve, reject) => {
    var dumpFile =
      process.cwd() + '/tmp/' + source.currentDateTime + '/' + source.DbName
    mySQL({ ...source, dumpFile })
      .then(() => {
        resolve()
      })
      .catch(e => {
        console.log(e)
        reject(e)
      })
  })
}

module.exports = {
  sync,
  mySQL,
  mongoDB,
  listFolders,
  getFilesList,
  oldestDate,
  purge,
  deleteFile,
  archiveMaker,
  sequentialIterationWithPromises,
  handleMongoDBSource,
  handleFileSource,
  handleFilesSource,
  handleMySQLSource,
  createTmpIfNotExist,
  createCurrentDateTimeFolder,
  emptyDir
}
