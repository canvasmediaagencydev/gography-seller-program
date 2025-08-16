'use client'

interface TripImageProps {
  src: string
  alt: string
  className?: string
}

export default function TripImage({ src, alt, className }: TripImageProps) {
  return (
    <img 
      src={src} 
      alt={alt}
      className={className}
      onError={(e) => {
        const target = e.target as HTMLImageElement;
        target.style.display = 'none';
      }}
    />
  )
}
