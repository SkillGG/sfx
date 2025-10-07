import type { Article } from '..'

export const Update: Article = {
	author: 'Skillu',
	date: new Date(1759773695044),
	description: 'Editor style changes and views',
	featured: false,
	slug: `update-061025`,
	title: 'Update 06.10.25',
	content: (
		<>
			<section className='text-justify'>
				<h2>Editor changes</h2>
				<p>
					For a while now I had issues with using the creator on my phone. Now I
					made a small button if the screen is small, and made it show only one
					view Creator or Edit.
					<br />
					The split view is also available, but only on large screens (width
					&gt; 1024px)
				</p>
			</section>
			<section>
				<h2>More in info</h2>
				<p>
					Now the first info-only parsing.
					<br />
					Added <code>RichStringField</code> to be able to add custom html
					elements when parsing.
					<br />
					So far, only <code>\t</code> is getting replaced with{' '}
					<code>&lt;&gt;&amp;emsp;&lt;/&gt;</code> html element (it is a{' '}
					<code>ReactNode</code> so it displays the html entity properly) but it
					will be expanded in the future.
				</p>
			</section>
		</>
	),
}
