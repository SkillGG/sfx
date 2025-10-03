import { SimpleSFXCard } from '@/app/_components/sfx/simpleSFX'
import { api } from '@/trpc/server'
import { IMAGE_SIZE, toLangObject } from '@/utils/utils'
import { ImageResponse } from 'next/og'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * An endpoint to create OpenGraph image of the sfx
 *
 * /api/images?id=<sfxid>
 */
export async function GET(req: NextRequest): Promise<Response> {
	const url = new URL(req.url)

	const { searchParams } = url

	const id = searchParams.get('id')

	if (id) {
		const idx = Number(id)
		if (idx > 0 && isFinite(idx) && !isNaN(idx)) {
			const sfxs = await api.sfx.listSFX({ id: idx })
			const langs = await api.sfx.listLangs()
			toLangObject(langs)
			const sfx = sfxs[0]
			// console.log("Founds sfx", sfxs);
			if (sfx) {
				const size = IMAGE_SIZE
				return new ImageResponse(
					(
						<SimpleSFXCard
							sfx={sfx}
							langs={langs}
							size={size}
						/>
					),
					size,
				)
			}
		}
	}

	const headers = new Headers()
	headers.set('Content-Type', 'image/png')
	const blob = await (
		await fetch(`${url.origin}/android-chrome-192x192.png`)
	).arrayBuffer()

	return new NextResponse(blob, { headers, status: 200, statusText: 'OK' })
}
