import React, { useMemo, useState, useEffect } from 'react';
import { cn } from '@Utils/cn';
import { iconLoaders } from './iconLoaders';

// Cache to store loaded components (not promises)
const resolvedIconCache = new Map();

const SvgLoader = React.memo(({ name, className, style, onClick }) => {
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

  return (
    <LoadedIcon
      className={cn('wpchat:inline-block wpchat:align-middle', className)}
      style={style}
      onClick={onClick}
    />
  );
});

export default SvgLoader;
