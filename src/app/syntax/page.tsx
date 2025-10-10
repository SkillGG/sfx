import { SyntaxHighlight } from './lib/element'

const Page = () => {
	return (
		<>
			<div>Syntax Highlighting tests!</div>
			<div className='dark root'>
				<div>
					<p>
						<SyntaxHighlight language='javascript'>
							<span>const n = 12;</span>
						</SyntaxHighlight>
					</p>
				</div>
			</div>
		</>
	)
}

export default Page
