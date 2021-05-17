import fs from 'fs'
import * as lockfile from '@yarnpkg/lockfile'

const args = process.argv.slice(2)
const filepath = args[0]
const packageToFind = args[1]

let file = fs.readFileSync(filepath, 'utf8')
let json = lockfile.parse(file)
const yarnLock = Object.entries(json.object)

const findDependentPackages = (packageName) => {
  const dependentPackages = []
  for (let [key, value] of yarnLock) {
    const dependencies = value.dependencies && Object.keys(value.dependencies)
    if (isDependency(packageName, dependencies)) {
      dependentPackages.push(trimPackageName(key))
    }
  }
  return dependentPackages
}

const isDependency = (packageName, dependencies) => {
  if (!dependencies) return false
  for(let dependency of dependencies) {
    if (dependency === packageName) return true
  }
  return false
}

const trimPackageName = (packageName) => {
  const stripped = packageName.replace('"', '')
  return stripped.split(/@[^a-zA-Z]/)[0]
}

const format = () => {
  const result = recursivelyGetPath([packageToFind])[0]
  return result.map(r => r.split(',')[0])
}

const recursivelyGetPath = (packageNames) => {
  if (packageNames.length === 0) return ['']
  const paths = packageNames.map(packageName => {
    if (!dependencyMap[packageName]) return {packageName, path: [packageName]}
    const path = recursivelyGetPath(dependencyMap[packageName])
    return {packageName, path}
  })
  return paths.map(({packageName, path}) => {
    if (!path) return `${packageName}`
    return path.map(p => {
      const needsArrow = !!packageName && !!dependencyMap[packageName] && !!dependencyMap[packageName][0]
      return `${packageName}${needsArrow ? ' -> ' : ''}${p}`
    })
  })
}

const dependencyMap = {}
const toSearch = [packageToFind]

while (toSearch.length > 0) {
  let currentPackage = toSearch.shift()
  let dependentPackages = findDependentPackages(currentPackage)
  dependencyMap[currentPackage] = [...dependentPackages]
  toSearch.push(...dependentPackages)
}

//console.log(dependencyMap)
console.log(format())

