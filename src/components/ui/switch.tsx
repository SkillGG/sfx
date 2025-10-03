'use client'

import * as React from 'react'
import * as SwitchPrimitives from '@radix-ui/react-switch'

import { cn } from '@/utils/utils'

const Switch = ({
	className,
	ref,
	thumb,
	...props
}: React.ComponentProps<typeof SwitchPrimitives.Root> & {
	thumb?: React.ComponentProps<typeof SwitchPrimitives.Thumb>
}) => (
	<SwitchPrimitives.Root
		className={cn(
			'peer inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent shadow-sm transition-colors focus-visible:ring-2 focus-visible:ring-(color:--input-focus-border) focus-visible:ring-offset-2 focus-visible:ring-offset-white focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-(--switch-on-bg) data-[state=unchecked]:bg-(--switch-off-bg)',
			className,
		)}
		{...props}
		ref={ref}
	>
		<SwitchPrimitives.Thumb
			{...thumb}
			className={cn(
				'pointer-events-none block h-4 w-4 rounded-full shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-4 data-[state=checked]:bg-(--switch-on-color) data-[state=unchecked]:translate-x-0 data-[state=unchecked]:bg-(--switch-off-color)',
				thumb?.className,
			)}
		/>
	</SwitchPrimitives.Root>
)
Switch.displayName = SwitchPrimitives.Root.displayName

export { Switch }
