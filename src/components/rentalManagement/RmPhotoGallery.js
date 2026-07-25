import React from 'react';

/** Resolve a displayable image URL from common RM photo shapes. */
export const resolveRmPhotoUrl = (item) => {
  if (!item) return null;
  if (typeof item === 'string') {
    const v = item.trim();
    return v || null;
  }
  return (
    item.photo_url_s3_image
    || item.rm_cust_photo_s3_image
    || item.photoUrl
    || item.photo_url
    || item.rm_cust_photo
    || null
  );
};

/**
 * Compact photo strip used across RM pages.
 * @param {Array|string} photos - array of photo objects/urls, or a single url/string
 */
const RmPhotoGallery = ({
  photos,
  size = 'md',
  className = '',
  emptyLabel = null,
  max = 8,
}) => {
  const list = (Array.isArray(photos) ? photos : photos ? [photos] : [])
    .map((p) => ({
      url: resolveRmPhotoUrl(p),
      caption: typeof p === 'object' ? (p.caption || '') : '',
      key: typeof p === 'object' ? (p.id || p.photo_url || p.photoUrl) : p,
    }))
    .filter((p) => p.url)
    .slice(0, max);

  if (!list.length) {
    if (!emptyLabel) return null;
    return <p className="text-xs text-gray-400">{emptyLabel}</p>;
  }

  const sizeClass =
    size === 'sm'
      ? 'h-10 w-10'
      : size === 'lg'
        ? 'h-24 w-24'
        : 'h-16 w-16';

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {list.map((p, idx) => (
        <a
          key={`${p.key || p.url}-${idx}`}
          href={p.url}
          target="_blank"
          rel="noopener noreferrer"
          title={p.caption || 'View photo'}
          className={`${sizeClass} rounded-lg overflow-hidden border border-gray-200 bg-gray-50 shrink-0`}
        >
          <img
            src={p.url}
            alt={p.caption || `Photo ${idx + 1}`}
            className="h-full w-full object-cover"
            onError={(e) => {
              e.target.style.opacity = '0.3';
            }}
          />
        </a>
      ))}
      {Array.isArray(photos) && photos.length > max && (
        <span className="text-xs text-gray-500 self-center">+{photos.length - max} more</span>
      )}
    </div>
  );
};

export default RmPhotoGallery;
