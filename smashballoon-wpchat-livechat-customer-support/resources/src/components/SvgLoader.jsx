import React, { useMemo, useState, useEffect } from 'react';
import { cn } from '@Utils/cn';
import { iconLoaders } from './iconLoaders';

// Cache to store loaded components (not promises)
const resolvedIconCache = new Map();

const SvgLoader = React.memo(({ name, className, style, onClick, ...rest }) => {
  const [LoadedIcon, setLoadedIcon] = useState(() => resolvedIconCache.get(name));

  useEffect(() => {
    if (!name) return;
    if (resolvedIconCache.has(name)) {
      setLoadedIcon(() => resolvedIconCache.get(name));
      return;
    }

    const loader = iconLoaders[name];
    if (!loader) {
      return;
    }

    loader().then((mod) => {
      resolvedIconCache.set(name, mod.default);
      setLoadedIcon(() => mod.default);
    });
  }, [name]);

  if (!LoadedIcon) return null; // or return a small spinner

  // Icons are decorative by default — hide from assistive tech unless the
  // caller makes the icon itself interactive (onClick/role/tabIndex) or
  // overrides aria-hidden explicitly.
  const isInteractive = Boolean(onClick) || rest.role !== undefined || rest.tabIndex !== undefined;
  const ariaHidden = rest['aria-hidden'] ?? (isInteractive ? undefined : 'true');

  return (
    <LoadedIcon
      className={cn('wpchat:inline-block wpchat:align-middle', className)}
      style={style}
      onClick={onClick}
      focusable='false'
      {...rest}
      aria-hidden={ariaHidden}
    />
  );
});

export default SvgLoader;
