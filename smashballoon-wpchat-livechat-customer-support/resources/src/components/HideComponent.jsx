export function HideOnMobile({ children }) {
  return <span className='wpchat:hidden wpchat:md:block'>{children}</span>;
}

export function HideOnDesktop({ children }) {
  return <span className='wpchat:md:hidden'>{children}</span>;
}
