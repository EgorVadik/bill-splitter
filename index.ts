import inquirer from 'inquirer'
import fs from 'fs/promises'
import chalk from 'chalk'
import groupBy from 'just-group-by'

type Data = {
    name: string
    amount: number
    peopleWhoAte: number
    date: string
    people: string[]
}

type Person = {
    id: number
    name: string
}

async function main() {
    const { action } = await inquirer.prompt([
        {
            type: 'list',
            name: 'action',
            message: 'What do you want to do?',
            choices: [
                'Add new entry',
                'Add person',
                'List people',
                'Remove person',
                'Delete Last Entry',
                'List Current Entries',
                'Calculate For Each',
                'List Previous Data',
                'Clear Console',
                'Clear Data',
                'Exit',
            ],
            pageSize: 10,
        },
    ])

    switch (action) {
        case 'Add new entry': {
            const existsPeople = await fs.exists('people.json')
            const dataPeople = existsPeople
                ? await fs.readFile('people.json', 'utf-8')
                : '[]'
            const parsedPeopleData: Person[] = JSON.parse(dataPeople)

            if (parsedPeopleData.length === 0) {
                console.log(
                    chalk.bold.red('No people found. Please add people first.')
                )
                return
            }

            const { name, amount, people } = await inquirer.prompt([
                {
                    type: 'list',
                    name: 'name',
                    message: 'Who paid for this?',
                    choices: parsedPeopleData.map((person) => person.name),
                },
                {
                    type: 'number',
                    name: 'amount',
                    message: 'How much did he pay?',
                    min: 1,
                    max: 150,
                },
                {
                    type: 'checkbox',
                    name: 'people',
                    message: 'Who ate?',
                    choices: parsedPeopleData.map((person) => person.name),
                },
            ])

            const newData: Data = {
                name,
                amount,
                peopleWhoAte: people.length,
                date: new Date().toISOString(),
                people,
            }

            const exists = await fs.exists('data.json')
            const data = exists ? await fs.readFile('data.json', 'utf-8') : '[]'
            const parsedData: Data[] = JSON.parse(data)
            parsedData.push(newData)
            await fs.writeFile('data.json', JSON.stringify(parsedData, null, 2))
            console.log('Data saved successfully')
            break
        }
        case 'List Current Entries': {
            const exists = await fs.exists('data.json')
            const data = exists ? await fs.readFile('data.json', 'utf-8') : '[]'
            const parsedData: Data[] = JSON.parse(data)

            console.log('\n\n')
            parsedData.forEach((item) => {
                console.log(
                    `${chalk.bold.cyan(item.name)} paid ${chalk.bold.green(
                        item.amount
                    )} for ${chalk.yellow(
                        item.people.join(', ')
                    )} people on ${chalk.magenta(
                        new Date(item.date).toDateString()
                    )}`
                )
            })
            console.log('\n\n')
            break
        }
        case 'Calculate For Each': {
            const exists = await fs.exists('data.json')
            const data = exists ? await fs.readFile('data.json', 'utf-8') : '[]'
            const parsedData: Data[] = JSON.parse(data)

            const groupedData = groupBy(parsedData, (item) =>
                item.people.sort().join(', ')
            )

            console.log('\n\n')
            for (const [key, value] of Object.entries(groupedData)) {
                const peopleWhoAte = key.split(', ').length
                const whoPaidGroup = groupBy(value, (item) => item.name)

                for (const [key, value] of Object.entries(whoPaidGroup)) {
                    const amount = value.reduce(
                        (acc, item) => acc + item.amount,
                        0
                    )

                    const average = amount / peopleWhoAte

                    console.log(
                        `${chalk.bold.cyan(key)} ${chalk.bold.yellow(
                            'should get'
                        )} ${chalk.bold.green(
                            average.toFixed(2)
                        )} ${chalk.bold.yellow('from')} ${chalk.bold.magenta(
                            value
                                .at(-1)
                                ?.people.filter((person) => person !== key)
                                .join(', ') ?? 'No one'
                        )}`
                    )
                }
            }
            console.log('\n\n')
            break
        }
        case 'Add person': {
            const { name } = await inquirer.prompt([
                {
                    type: 'input',
                    name: 'name',
                    message: 'Who is the person?',
                },
            ])

            const exists = await fs.exists('people.json')
            const data = exists
                ? await fs.readFile('people.json', 'utf-8')
                : '[]'
            const parsedData: Person[] = JSON.parse(data)
            parsedData.push({
                id:
                    parsedData && parsedData.length > 0
                        ? (parsedData?.at(-1)?.id ?? 0) + 1
                        : 1,
                name,
            })
            await fs.writeFile(
                'people.json',
                JSON.stringify(parsedData, null, 2)
            )
            console.log(`${chalk.bold.green(name)} added successfully`)
            break
        }
        case 'List people': {
            const exists = await fs.exists('people.json')
            const data = exists
                ? await fs.readFile('people.json', 'utf-8')
                : '[]'
            const parsedData: Person[] = JSON.parse(data)
            console.log(parsedData)
            break
        }
        case 'Remove person': {
            const exists = await fs.exists('people.json')
            const data = exists
                ? await fs.readFile('people.json', 'utf-8')
                : '[]'
            const parsedData: Person[] = JSON.parse(data)

            const { name } = await inquirer.prompt([
                {
                    type: 'list',
                    name: 'name',
                    message: 'Who is the person?',
                    choices: [
                        ...parsedData.map((person) => person.name),
                        'Cancel',
                    ],
                },
            ])

            if (name === 'Cancel') {
                console.log('Cancelled')
                break
            }

            const filteredData = parsedData.filter(
                (person) => person.name !== name
            )
            await fs.writeFile(
                'people.json',
                JSON.stringify(filteredData, null, 2)
            )
            console.log(`${chalk.bold.green(name)} removed successfully`)
            break
        }
        case 'Delete Last Entry': {
            const exists = await fs.exists('data.json')
            const data = exists ? await fs.readFile('data.json', 'utf-8') : '[]'
            const parsedData: Data[] = JSON.parse(data)
            parsedData.pop()
            await fs.writeFile('data.json', JSON.stringify(parsedData, null, 2))
            console.log('Last entry deleted successfully')
            break
        }
        case 'List Previous Data': {
            const folderExists = await fs.exists('previous-data')
            if (!folderExists) {
                console.log('No previous data found')
                break
            }

            const files = await fs.readdir('previous-data')

            const { file } = await inquirer.prompt([
                {
                    type: 'list',
                    name: 'file',
                    message: 'Select a file',
                    choices: [...files, 'Cancel'],
                },
            ])

            if (file === 'Cancel') {
                console.log('Cancelled')
                break
            }

            const data = await fs.readFile(`previous-data/${file}`, 'utf-8')
            const parsedData: Data[] = JSON.parse(data)
            console.log('\n\n')
            parsedData.forEach((item) => {
                console.log(
                    `${chalk.bold.cyan(item.name)} paid ${chalk.bold.green(
                        item.amount
                    )} for ${chalk.yellow(
                        item.people.join(', ')
                    )} people on ${chalk.magenta(
                        new Date(item.date).toDateString()
                    )}`
                )
            })
            console.log('\n\n')

            break
        }
        case 'Clear Console': {
            console.clear()
            break
        }
        case 'Clear Data': {
            const { confirm } = await inquirer.prompt([
                {
                    type: 'confirm',
                    name: 'confirm',
                    message: 'Are you sure you want to clear the data?',
                    default: false,
                },
            ])
            if (confirm) {
                const exists = await fs.exists('data.json')
                if (!exists) {
                    console.log('No data to clear')
                    break
                }

                const parsedData: Data[] = JSON.parse(
                    await fs.readFile('data.json', 'utf-8')
                )

                const folderExists = await fs.exists('previous-data')
                if (!folderExists) {
                    await fs.mkdir('previous-data')
                }

                await fs.writeFile(
                    `previous-data/${new Date().toISOString()}.json`,
                    JSON.stringify(parsedData, null, 2)
                )

                await fs.writeFile('data.json', '[]')
                console.log('Data cleared successfully')
            } else {
                console.log('Cancelled')
            }

            break
        }
        case 'Exit': {
            process.exit(0)
        }
    }
}

while (true) {
    await main()
}
