import HeaderSkeleton from '@AC/Skeleton/HeaderSkeleton';
import SkeletonBlock from '@AC/Skeleton/SkeletonBlock';

/**
 * ArchiveSkeleton Component
 *
 * This React functional component serves as a skeleton loader
 * for the Archive page or section. It is typically used to indicate 
 * that content is being loaded by displaying a placeholder UI.
 *
 * @component
 * @returns {JSX.Element} The skeleton UI for the archive content.
 */
export default function ArchiveSkeleton() {
  // Table Row
  const TableRow = () => (
    <div className='wpchat:flex wpchat:items-start wpchat:justify-between wpchat:bg-white wpchat:px-4 wpchat:py-4'>
      {/* Left side */}
      <div className='wpchat:flex wpchat:flex-1 wpchat:gap-3'>
        <SkeletonBlock className='wpchat:mt-1 wpchat:h-4 wpchat:w-4' />
        <div className='wpchat:flex-1 wpchat:space-y-2 wpchat:pe-2.5'>
          <SkeletonBlock className='wpchat:h-4 wpchat:w-1/2' />
          <SkeletonBlock className='wpchat:h-3 wpchat:w-1/3' />
          <SkeletonBlock className='wpchat:h-3 wpchat:w-1/4' />
        </div>
      </div>
      {/* Action buttons */}
      <div className='wpchat:flex wpchat:gap-2'>
        <SkeletonBlock className='wpchat:h-8 wpchat:w-8 wpchat:rounded-md' />
        <SkeletonBlock className='wpchat:h-8 wpchat:w-8 wpchat:rounded-md' />
        <SkeletonBlock className='wpchat:h-8 wpchat:w-8 wpchat:rounded-md' />
      </div>
    </div>
  );

  return (
    <div>
      {/* Header section */}
      <HeaderSkeleton />

      {/* Table header */}
      <div className='wpchat:overflow-hidden wpchat:rounded'>
        <div className='wpchat:px-4 wpchat:py-5 wpchat:md:px-13 wpchat:md:pt-6'>
          <div className='wpchat:flex wpchat:gap-2 wpchat:pb-3'>
            <SkeletonBlock className='wpchat:h-9 wpchat:w-28' /> {/* Bulk Actions */}
            <SkeletonBlock className='wpchat:h-9 wpchat:w-20' /> {/* Apply */}
          </div>

          <div className='wpchat:flex wpchat:items-center wpchat:gap-4 wpchat:bg-gray-50 wpchat:px-4 wpchat:py-3'>
            <SkeletonBlock className='wpchat:h-4 wpchat:w-4' />
            <SkeletonBlock className='wpchat:h-4 wpchat:w-24' />
          </div>
          {/* Rows */}
          {[...Array(4)].map((_, idx) => (
            <TableRow key={idx} />
          ))}
        </div>
      </div>
    </div>
  );
}
