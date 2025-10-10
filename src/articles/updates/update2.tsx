import React, { Fragment } from 'react'
import type { Article } from '..'
import Link from 'next/link'
import { QuoteCode } from './code'

export const Update: Article = {
	author: 'Skillu',
	date: new Date(1759654611207),
	description: 'SFX Info parser updates',
	featured: false,
	slug: `update-051025`,
	title: 'Update 05.10.25',
	content: (
		<Fragment>
			<section className='text-justify'>
				<h2>
					The <QuoteCode>info</QuoteCode> field
				</h2>
				<p>
					So <QuoteCode>info</QuoteCode> is a new field of hidden-by-default
					information about the sound effect. It is accesible by the little
					questionmark icon right beside the SFX name itself.
				</p>
				<p>
					It opens a window that will show all tl-non-essential information
					about the SFX.
					<br />
					For example: sources for all the information, images etc.
					<br />
					I&apos;m planning on it also containing source/additional info about
					the translation in the translated SFX.
					<br />
					As <QuoteCode>info</QuoteCode> field will be using an extended set of
					field types, and doesn&apos;t use the{' '}
					<QuoteCode>long:&quot;parse&quot;</QuoteCode> text parser that is used
					for other SFX fields, I need to create a new parser for that.
				</p>
				<p>
					To keep backwards-compatibility with the other fields, I will be using
					the original parser, but I plan to extend its use for{' '}
					<QuoteCode>info</QuoteCode> field&apos;s sake.
				</p>
			</section>
			<section>
				<h2>Languages not loading</h2>
				<p>
					Due to a racing condition in the code, the language selection boxes in{' '}
					<Link href='/creator'>/creator</Link> page did not load languages
					properly.
					<br />
					That&apos;s why I decided to force load languages before showing or
					loading any other content, so they load properly before showing the{' '}
					<Link href='/creator'>/creator</Link> page.
				</p>
				<p>
					Doing so made <QuoteCode>ThemeProvider</QuoteCode> reset every time,
					so I had to reorganize the provider&apos;s order to load the themes
					correctly.
				</p>
			</section>
			<section>
				<h2>Blog updates</h2>
				<p>
					I also added few changes to blog&apos;s styling. Made the tags, author
					and date have consistent styles by moving their styles into a separate
					components.
				</p>
				<p>
					Also made the blog more consistant by reusing components in every
					single screen of the blog. Now there won&apos;t be any jarring style
					changes between page loadings in whole <Link href='/blog'>/blog</Link>{' '}
					side of the site.
				</p>
			</section>
		</Fragment>
	),
}
