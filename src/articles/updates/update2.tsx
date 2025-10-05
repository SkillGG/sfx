import type { Article } from '..'

export const Update: Article = {
	author: 'Skillu',
	date: new Date(1759654611207),
	description: 'SFX Info parser updates',
	featured: false,
	slug: `update-051025`,
	title: 'Update 05.10.25',
	content: (
		<>
			<section className='text-justify'>
				<h2 className='text-center text-xl'>SFX Info parser</h2>
				<p>
					So `SFX Info` is a field of hidden-by-default information about the
					sound effect. It is accesible by the little questionmark icon right
					beside the SFX name itself.
				</p>
				<p>
					It opens a window that will show all tl-non-essential information
					about the SFX. For example: sources for all the information, images
					etc.
				</p>
				<p>
					I&apos;m planning on it also containing source/additional info about
					the translation in the translated SFX.
				</p>
				<p>
					As info will be using some specific text values, and doesn&apos;t use
					the <code>type=long</code>
				</p>
			</section>
		</>
	),
}
