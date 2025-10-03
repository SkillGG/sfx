import { multiRXExtract, rxExtract } from './rxExtract'

describe('Regex extract', () => {
	it('empty extract', () => {
		expect(rxExtract('', /^$/)).toEqual(null)
	})

	it('part extract', () => {
		expect(rxExtract('test12xd', /(?<nums>\d+)/gi)).toEqual({
			out: 'testxd',
			matches: { nums: ['12'] },
		})
	})

	it('multi extracts', () => {
		expect(rxExtract('test12', /(?<n>\d)/g)).toEqual({
			out: 'test',
			matches: { n: ['1', '2'] },
		})
	})

	it('extract multiple groups', () => {
		expect(rxExtract('something:here', /(?<a>.*):(?<b>.*)/gi)).toEqual({
			out: '',
			matches: { a: ['something'], b: ['here'] },
		})
	})

	it.each(['xx<a>(b)[c]:dd', 'xx(b)<a>[c]:dd', 'xx[c]<a>(b):dd'])(
		'multiple regex extracts - %s',
		v => {
			expect(
				multiRXExtract(v, [
					/<(?<a>.*)>/g,
					/\((?<b>.*)\)/g,
					/\[(?<c>.*)\]/g,
					/(?<x>xx:)/g,
				]),
			).toEqual({
				out: 'dd',
				matches: { a: ['a'], b: ['b'], c: ['c'], x: ['xx:'] },
			})
		},
	)

	it('cant find a match', () => {
		expect(multiRXExtract('test', [/a/gi, /b/gi, /c/gi])).toEqual(null)
	})
})
