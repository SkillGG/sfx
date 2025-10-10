import React, { Fragment } from 'react'
import type { Article } from '..'
import Link from 'next/link'
import { QuoteCode } from './code'

export const Update: Article = {
	author: 'Skillu',
	date: new Date(1759602545355),
	description: 'Adding update posts.',
	featured: false,
	slug: `update-041025`,
	title: 'Update 04.10.25',
	content: (
		<Fragment>
			<section>
				<h2>What I did today:</h2>
				<ul className='list-decimal px-6 marker:font-mono'>
					<li>Create an update section in the blog.</li>
					<li>Fix some typescript and eslint errors.</li>
				</ul>
			</section>
			<section>
				<h2>Additional info to each task:</h2>
				<ul className='list-decimal px-6 marker:font-mono'>
					<li>
						Also when creating this section, I&apos;ve found the need to add an
						actual &quot;back&quot; button. Previously it was done by just
						navigating to <Link href='/blog'>/blog</Link> which was
						satisfiabale, but now that we link from one blog to another, there
						is a need to go back through the <QuoteCode>React.router</QuoteCode>{' '}
						instead, so I had to code the back button as a separate client
						component.
					</li>
					<li>-</li>
				</ul>
			</section>
		</Fragment>
	),
}
