import React, { Fragment } from 'react'
import type { Article } from '..'
import { QuoteCode } from './code'

export const Update: Article = {
	author: 'Skillu',
	date: new Date(1760102336076),
	description: `Hydration Errors everywehere!`,
	featured: false,
	slug: `update-101025`,
	title: 'Update 10.10.25',
	content: (
		<Fragment>
			<section>
				<h2>Theme fixes</h2>
				<p>
					I wanted to make the site dark-by-default so it won&apos;t blind
					dark-mode users every time they load the page. In order to do that, I
					had to clean up the mess that the <code>useThere</code> and{' '}
					<code>ThemeProvider</code> were.
				</p>
				<p>
					Surprisingly it was quite easy to do. I changed all the styles in{' '}
					<code>globals.css</code> to be run when there is <code>.light</code>{' '}
					class applied, and made the default theme (before the user-selected
					one load from localStorage) be the dark one.
				</p>
				<p>
					By doing that I&apos;ve also stumbled on some other issues. I noticed,
					that the light theme broke completely. That was because I wasn&apos;t
					setting the <code>.light</code> class onto the root node, thus the css
					didn&apos;t apply properly.
				</p>
				<p>
					After I added the light theme to the root node, as I did with the dark
					theme using{' '}
					<QuoteCode value=''>
						document.documentElement.classList.toggle(&apos;light&apos;, mode
						=== &apos;light&apos;)
					</QuoteCode>
					which, I must admit, was not the best solution, but it worked for just
					the dark theme, I expected React to start complaining about the
					HydrationErrors, which it did.
				</p>
				<p>
					I knew from the beggining that using <code>classList.toggle</code>{' '}
					could cause hydration errors, but I did it anyway because I
					couldn&apos;t find any other way this could work while still working
					in both client and server components.
					<br />
					Before, somehow it didn&apos;t error out, but now that it ran every
					time no matter which theme was selected, React finally started
					complaining about HydrationErrors.
				</p>
				<h3>The fix</h3>
				<p>
					So I decided to finally fix this issue. Read a bit about it, and
					finally decided to just add a <code>div.root</code> to the{' '}
					<code>ThemeProvider</code> that sets the theme for the entire page. I
					had to slightly change the <code>globals.css</code> classes to not be
					on <code>:root</code> but on the newly formed <code>div.root</code>{' '}
					element, but it was a quite quick fix.
				</p>
				<p>
					Thanks to that I also was able to remove all uses of{' '}
					<code>useTheme</code> from the various <code>page.tsx</code> files
					where they just provided redundant styles before the{' '}
					<code>documentElement.classList.toggle</code> took effect.
				</p>
				<p>
					Thanks to this, now the page starts nicely with a dark-mode spinner,
					which changes to selected theme/accent color after it loads those
					values from localStorage, and the colors neatly propagate to all
					children nodes. No matter if they&apos;re server or client components
				</p>
				<h3>Syntax highlighting</h3>
				<p>
					I also tried making the <code>&gt;QuoteCode&lt;</code> component allow
					for syntax highlighting, but unfortunately the library I&apos;ve found
					for syntax highlighting is not cooperating with how I write this blog
					and uses the <code>&gt;pre&lt;</code> and <code>&gt;span&lt;</code>s
					to highlight the code instead of CSS <code>::highlight()</code>{' '}
					selectors, which would be way easier to work with and wouldn&apos;t
					cause React HydrationErrors.
				</p>
				<p>
					I do plan on making the SyntaxHighlighting work here, but I&apos;d
					need more time to create a library for that :P
				</p>
			</section>
		</Fragment>
	),
}
