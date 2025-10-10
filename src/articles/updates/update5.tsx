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
					had to clean up the mess that the <QuoteCode>useTheme</QuoteCode> and{' '}
					<QuoteCode>ThemeProvider</QuoteCode> were.
				</p>
				<p>
					Surprisingly it was quite easy to do. I changed all the styles in{' '}
					<QuoteCode>globals.css</QuoteCode> to be run when there is{' '}
					<QuoteCode>.light</QuoteCode> class applied, and made the default
					theme (before the user-selected one load from localStorage) be the
					dark one.
				</p>
				<p>
					By doing that I&apos;ve also stumbled on some other issues. I noticed,
					that the light theme broke completely. That was because I wasn&apos;t
					setting the <QuoteCode>.light</QuoteCode> class onto the root node,
					thus the css didn&apos;t apply properly.
				</p>
				<p>
					After I added the light theme to the root node, as I did with the dark
					theme using{' '}
					<QuoteCode
						block
						lang='javascript'
						value={`document.documentElement.classList.toggle('light', mode	=== 'light')`}
					>
						{`document.documentElement.classList.toggle('light', mode	=== 'light')`}
					</QuoteCode>
					which, I must admit, was not the best solution, but it worked for just
					the dark theme, I expected React to start complaining about the
					HydrationErrors, which it did.
				</p>
				<p>
					I knew from the beggining that using{' '}
					<QuoteCode>classList.toggle</QuoteCode> could cause hydration errors,
					but I did it anyway because I couldn&apos;t find any other way this
					could work while still working in both client and server components.
					<br />
					Before, somehow it didn&apos;t error out, but now that it ran every
					time no matter which theme was selected, React finally started
					complaining about HydrationErrors.
				</p>
				<h3>The fix</h3>
				<p>
					So I decided to finally fix this issue. Read a bit about it, and
					finally decided to just add a <QuoteCode>div.root</QuoteCode> to the{' '}
					<QuoteCode>ThemeProvider</QuoteCode> that sets the theme for the
					entire page. I had to slightly change the{' '}
					<QuoteCode>globals.css</QuoteCode> classes to not be on{' '}
					<QuoteCode>:root</QuoteCode> but on the newly formed{' '}
					<QuoteCode>div.root</QuoteCode> element, but it was a quite quick fix.
				</p>
				<p>
					Thanks to that I also was able to remove all uses of{' '}
					<QuoteCode>useTheme</QuoteCode> from the various{' '}
					<QuoteCode>page.tsx</QuoteCode> files where they just provided
					redundant styles before the{' '}
					<QuoteCode>documentElement.classList.toggle</QuoteCode> took effect.
				</p>
				<p>
					Thanks to this, now the page starts nicely with a dark-mode spinner,
					which changes to selected theme/accent color after it loads those
					values from localStorage, and the colors neatly propagate to all
					children nodes. No matter if they&apos;re server or client components
				</p>
				<h2>Syntax highlighting</h2>
				<p>
					I also tried making the <QuoteCode>&lt;QuoteCode&gt;</QuoteCode>{' '}
					component allow for syntax highlighting, but unfortunately the library
					I&apos;ve found for syntax highlighting is not cooperating with how I
					write this blog and uses the <QuoteCode>&lt;pre&gt;</QuoteCode> and{' '}
					<QuoteCode>&lt;span&gt;</QuoteCode>s to highlight the code instead of
					CSS <QuoteCode>::highlight()</QuoteCode> selectors, which would be way
					easier to work with and wouldn&apos;t cause React HydrationErrors.
				</p>
				<p>
					I do plan on making the SyntaxHighlighting work here, but I&apos;d
					need more time to create a library for that :P
				</p>
				<p>
					<br />
					Soooo after the whole day of working, I managed to make CSS
					highlighting work! Yay Now the{' '}
					<QuoteCode>&lt;SyntaxHighlight&gt;</QuoteCode> element allows me to
					create syntax highlighted version of the code!
					<br />I added it to <QuoteCode>{'<QuoteCode>'}</QuoteCode> element
					with the <QuoteCode>{'block'}</QuoteCode> view enabled.
				</p>
				<p>
					It looks like this (theme code of this app):
					<QuoteCode
						block
						className='max-h-40 overflow-x-scroll overflow-y-scroll'
						lang='javascript'
					>
						{`// hydrate from storage and system preference
useEffect(() => {
	const lsMode = localStorage.getItem('darkMode') as LightMode | null
	if (lsMode) setMode(lsMode)
	else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
		setMode('dark')
	}
	const lsAccent = localStorage.getItem('accentName') as AccentName | null
	if (lsAccent) setAccent(lsAccent)
}, [])

useEffect(() => {
	localStorage.setItem('darkMode', mode)
}, [mode])

useEffect(() => {
	localStorage.setItem('accentName', accent)
}, [accent])`}
					</QuoteCode>
				</p>
				<p>
					And to enable it in <QuoteCode>block</QuoteCode> mode, I just have to
					add <QuoteCode>{"lang='javascript'"}</QuoteCode> for it to work! So
					far only js and css are supported, but I will figure out how to load
					more prismjs languages soon!
				</p>
			</section>
		</Fragment>
	),
}
