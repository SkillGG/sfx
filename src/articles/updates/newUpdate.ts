import { readFile, writeFile } from 'fs/promises'
import path from 'path'

import chalk from 'chalk'

const main = async (args: string[]) => {
	const soft = args.includes('--soft')

	if (soft)
		console.warn(
			chalk.yellow(
				'Running in soft mode! No changes to any files will be made! Remove --soft flag to turn this behavior off',
			),
		)

	const { UpdateArticles } = await import('./')

	const { id } = UpdateArticles.findLast(() => true) as unknown as {
		id: number
	}

	const newID = id + 2

	const dirPath = path.join(path.dirname('.'), 'src/articles/updates')

	const templateFile = (
		await readFile(path.join(dirPath, 'update.template')).then(q =>
			q.toString('utf-8'),
		)
	).split('\n')
	templateFile[5] = ''

	const date = new Date()

	const time = date.getTime()
	const [day, month, year] = [
		`${date.getDate()}`.padStart(2, '0'),
		`${date.getMonth() + 1}`.padStart(2, '0'),
		`${date.getFullYear()}`.substring(2),
	]

	const title = `Update ${day}.${month}.${year}`
	const slug = `update-${day}${month}${year}`
	const descArgIndex = args.includes('-d') ? args.indexOf('-d') : -2
	const description =
		args[descArgIndex + 1]
			?.replaceAll('\\\\n', '\n')
			.replaceAll('\\\\t', '\t') ?? ''

	const newData = templateFile
		.map(line => {
			return line
				.replace(/\{\s*slug\s*\}/g, slug)
				.replace(/\{\s*title\s*\}/g, title)
				.replace(/\{\s*unixtime\s*\}/, `${time}`)
				.replace(/\{\s*desc\s*\}/, `${description}`)
		})
		.filter(q => !!q)

	console.log(
		chalk.green('Creating a new Update article\n'),
		`\t${chalk.greenBright('title:')}\t\t${chalk.hex('#fa0')(title)}\n`,
		`\t${chalk.greenBright('slug:')}\t\t${chalk.hex('#fa0')(slug)}\n`,
		`\t${chalk.greenBright('description:')}\t${chalk.hex('#fa0')(description.split('\n').join('\n\t\t\t'))}`,
	)
	if (!soft) await writeFile(path.join(dirPath, `update${newID}.tsx`), newData)

	const indexFile = (
		await readFile(path.join(dirPath, 'index.tsx')).then(q =>
			q.toString('utf-8'),
		)
	).split('\n')

	const newIndexFile = indexFile
		.map(line => {
			return /\/\/ \+import/.exec(line)
				? [
						`import { Update as Update${newID} } from "./update${newID}"\n`,
						line,
					]
				: line
		})
		.flat(2)
		.map(line => {
			return /\/\/ \+array/.exec(line) ? [`\tUpdate${newID},\n`, line] : line
		})
		.flat(2)

	console.log(
		chalk.green('Added'),
		chalk.greenBright(`Update${newID}`),
		chalk.green('to index.tsx'),
	)

	if (!soft) await writeFile(path.join(dirPath, './index.tsx'), newIndexFile)
}

void main(process.argv)
