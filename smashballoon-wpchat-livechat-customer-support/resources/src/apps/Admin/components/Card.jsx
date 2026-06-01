import React from 'react'
import { cn } from '@Utils/cn';

function Card({className, children}) {
  return (
    <div className={cn('wpchat:px-8 wpchat:pt-5 wpchat:pb-6 wpchat:rounded-lg wpchat:shadow-md wpchat:bg-white wpchat:mb-2', className)}>
        {children}
    </div>
  )
}

export default Card;