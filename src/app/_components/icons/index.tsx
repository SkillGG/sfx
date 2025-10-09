import { cn } from '@/utils/utils'
import type { ClassValue } from 'clsx'
import type React from 'react'

type Icon<
	Ts extends string = 'svg',
	Extra extends Record<Ts, ClassValue> = Record<Ts, ClassValue>,
> = (props: {
	classNames?: { svg?: ClassValue } & Partial<Extra>
}) => React.ReactNode

export const InfoIcon: Icon<'path'> = ({ classNames }) => {
	return (
		<svg
			id='regular-circle-question'
			viewBox='0 0 512 512'
			className={cn(
				'bg-(--main-bg)',
				'fill-(color:--accent-500)',
				classNames?.svg,
			)}
		>
			<path
				d='M256 0C114.6 0 0 114.6 0 256s114.6 256 256 256s256-114.6 256-256S397.4 0 256 0zM256 464c-114.7 0-208-93.31-208-208S141.3 48 256 48s208 93.31 208 208S370.7 464 256 464zM256 336c-18 0-32 14-32 32s13.1 32 32 32c17.1 0 32-14 32-32S273.1 336 256 336zM289.1 128h-51.1C199 128 168 159 168 198c0 13 11 24 24 24s24-11 24-24C216 186 225.1 176 237.1 176h51.1C301.1 176 312 186 312 198c0 8-4 14.1-11 18.1L244 251C236 256 232 264 232 272V288c0 13 11 24 24 24S280 301 280 288V286l45.1-28c21-13 34-36 34-60C360 159 329 128 289.1 128z'
				className={cn(classNames?.path)}
			></path>
		</svg>
	)
}

export const SplitIcon: Icon<'path'> = ({ classNames }) => {
	return (
		<svg
			width={24}
			height={24}
			viewBox='0 0 24 24'
			className={cn(classNames?.svg)}
		>
			<path
				fillRule='evenodd'
				clipRule='evenodd'
				className={cn(classNames?.path)}
				d='M6 4C4.34315 4 3 5.34315 3 7V17C3 18.6569 4.34315 20 6 20H18C19.6569 20 21 18.6569 21 17V7C21 5.34315 19.6569 4 18 4H6ZM5 7C5 6.44772 5.44772 6 6 6H11V18H6C5.44772 18 5 17.5523 5 17V7ZM13 18H18C18.5523 18 19 17.5523 19 17V7C19 6.44772 18.5523 6 18 6H13V18Z'
			></path>
		</svg>
	)
}

export const EditIcon: Icon<'path'> = ({ classNames }) => {
	return (
		<svg
			viewBox='0 0 24 24'
			fill='none'
			width={24}
			height={24}
			className={cn(classNames?.svg)}
		>
			<path
				d='M12 8.00012L4 16.0001V20.0001L8 20.0001L16 12.0001M12 8.00012L14.8686 5.13146L14.8704 5.12976C15.2652 4.73488 15.463 4.53709 15.691 4.46301C15.8919 4.39775 16.1082 4.39775 16.3091 4.46301C16.5369 4.53704 16.7345 4.7346 17.1288 5.12892L18.8686 6.86872C19.2646 7.26474 19.4627 7.46284 19.5369 7.69117C19.6022 7.89201 19.6021 8.10835 19.5369 8.3092C19.4628 8.53736 19.265 8.73516 18.8695 9.13061L18.8686 9.13146L16 12.0001M12 8.00012L16 12.0001'
				strokeWidth='2'
				strokeLinecap='round'
				strokeLinejoin='round'
				className={cn(classNames?.path)}
			></path>
		</svg>
	)
}

export const QuestionMark: Icon<'path'> = ({ classNames }) => {
	return (
		<svg
			id='regular-circle-question'
			viewBox='0 0 512 512'
			className={cn(
				'bg-(--main-bg)',
				'fill-(color:--accent-500)',
				classNames?.svg,
			)}
		>
			<path
				d='M256 0C114.6 0 0 114.6 0 256s114.6 256 256 256s256-114.6 256-256S397.4 0 256 0zM256 464c-114.7 0-208-93.31-208-208S141.3 48 256 48s208 93.31 208 208S370.7 464 256 464zM256 336c-18 0-32 14-32 32s13.1 32 32 32c17.1 0 32-14 32-32S273.1 336 256 336zM289.1 128h-51.1C199 128 168 159 168 198c0 13 11 24 24 24s24-11 24-24C216 186 225.1 176 237.1 176h51.1C301.1 176 312 186 312 198c0 8-4 14.1-11 18.1L244 251C236 256 232 264 232 272V288c0 13 11 24 24 24S280 301 280 288V286l45.1-28c21-13 34-36 34-60C360 159 329 128 289.1 128z'
				className={cn(classNames?.path)}
			></path>
		</svg>
	)
}

export const CopyIcon: Icon<'dashLine' | 'bg' | 'rect'> = ({ classNames }) => {
	return (
		<svg
			viewBox='0 0 24 24'
			className={cn(classNames?.svg)}
		>
			<rect
				width='24'
				height='24'
				className={cn('fill-transparent', classNames?.bg)}
			></rect>
			<rect
				x={4}
				y={8}
				rx={1}
				width={12}
				height={12}
				strokeLinecap='round'
				strokeLinejoin='round'
				className={cn('fill-white stroke-black', classNames?.rect)}
			></rect>
			<path
				d='M8 6V5C8 4.44772 8.44772 4 9 4H19C19.5523 4 20 4.44772 20 5V15C20 15.5523 19.5523 16 19 16H18'
				strokeLinecap='round'
				strokeLinejoin='round'
				strokeDasharray='2 2'
				className={cn('stroke-black', classNames?.dashLine)}
			></path>
		</svg>
	)
}

export const ClipboardIcon: Icon<'clip' | 'arrow' | 'board' | 'content'> = ({
	classNames,
}) => {
	return (
		<svg
			viewBox='0 0 24 24'
			fill='none'
			className={cn(classNames?.svg, classNames?.content)}
		>
			<path
				d='M10 6H14C16 6 16 5 16 4C16 2 15 2 14 2H10C9 2 8 2 8 4C8 6 9 6 10 6Z'
				strokeWidth='1.5'
				strokeMiterlimit='10'
				strokeLinecap='round'
				strokeLinejoin='round'
				className={cn(classNames?.clip)}
			></path>
			<path
				d='M14 22H9C4 22 3 20 3 16V10C3 5.44002 4.67 4.20002 8 4.02002'
				strokeWidth='1.5'
				strokeMiterlimit='10'
				strokeLinecap='round'
				strokeLinejoin='round'
				className={cn(classNames?.board)}
			></path>
			<path
				d='M16 4.02002C19.33 4.20002 21 5.43002 21 10V15'
				strokeWidth='1.5'
				strokeMiterlimit='10'
				strokeLinecap='round'
				strokeLinejoin='round'
				className={cn(classNames?.board)}
			></path>
			<path
				d='M15 19V16H18'
				strokeWidth='1.5'
				strokeMiterlimit='10'
				strokeLinecap='round'
				strokeLinejoin='round'
				className={cn(classNames?.arrow)}
			></path>
			<path
				d='M21 22L15.04 16.04'
				strokeWidth='1.5'
				strokeMiterlimit='10'
				strokeLinecap='round'
				strokeLinejoin='round'
				className={cn(classNames?.arrow)}
			></path>
		</svg>
	)
}
