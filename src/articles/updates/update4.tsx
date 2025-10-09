import React, { Fragment } from 'react'
import type { Article } from '..'
import Link from 'next/link'
import { QuoteCode } from './code'

export const Update: Article = {
	author: 'Skillu',
	date: new Date(1760020404410),
	description: `Automating update file creation!`,
	featured: false,
	slug: `update-091025`,
	title: 'Update 09.10.25',
	content: (
		<Fragment>
			<section>
				<h2>No update yesterday</h2>
				<p>
					So there was no update yesterday, because I just didn&apos;t want to
					write one, so I didn&apos;t work on the project at all. To combat
					that, I made creating these files way easier!
				</p>
			</section>
			<section>
				<h2>Update file creator</h2>
				<p>
					So I keep all update articles inside the{' '}
					<code>/articles/updates</code> folder.
				</p>
				<p>
					Now, I found tedious updating and changing the date unix timestamp and
					dates on duplicated <code>update1.tsx</code> file so I made{' '}
					<code>update.template</code> file as a template for the updates= and
					wrote a quick script (<code>newUpdate.ts</code>) to create new update
					files for me!
				</p>
				<p>
					Now I just need to run{' '}
					<QuoteCode value='pnpm update:new'>&gt; pnpm update:new</QuoteCode>{' '}
					and it will create a new <code>update#.tsx</code> file and
					automatically add the update to the list avaiable{' '}
					<Link href='/blog/daily-list'>here</Link>
				</p>
			</section>
		</Fragment>
	),
}
