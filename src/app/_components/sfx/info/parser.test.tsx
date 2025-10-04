import { parseInfo, type InfoField } from './parser'

const test = (v: string, exp: InfoField[]) => expect(parseInfo(v)).toEqual(exp)

describe('field types', () => {
	it('empty string text', () => {
		test('', [{ type: 'string', value: '' }])
	})
})
