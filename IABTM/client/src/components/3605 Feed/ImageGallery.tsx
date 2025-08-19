import React, { useState } from 'react';

interface ImageGalleryProps {
  images: string[];
  className?: string;
}

const ImageGallery: React.FC<ImageGalleryProps> = ({ images, className = '' }) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  if (!images || images.length === 0) return null;

  const getImageLayout = (count: number) => {
    switch (count) {
      case 1:
        return 'single';
      case 2:
        return 'double';
      case 3:
        return 'triple';
      case 4:
        return 'quad';
      default:
        return 'grid';
    }
  };

  const layout = getImageLayout(images.length);

  const renderImages = () => {
    switch (layout) {
      case 'single':
        return (
          <div className="w-full">
            <img
              src={images[0]}
              alt="post image"
              className="w-full h-auto max-h-96 md:max-h-[500px] object-cover rounded-lg cursor-pointer hover:opacity-95 transition-opacity"
              onClick={() => setSelectedImage(images[0])}
            />
          </div>
        );

      case 'double':
        return (
          <div className="grid grid-cols-2 gap-2">
            {images.map((img, idx) => (
              <img
                key={idx}
                src={img}
                alt={`post image ${idx + 1}`}
                className="w-full h-48 md:h-64 object-cover rounded-lg cursor-pointer hover:opacity-95 transition-opacity"
                onClick={() => setSelectedImage(img)}
              />
            ))}
          </div>
        );

      case 'triple':
        return (
          <div className="grid grid-cols-2 gap-2">
            <img
              src={images[0]}
              alt="post image 1"
              className="w-full h-48 md:h-64 object-cover rounded-l-lg cursor-pointer hover:opacity-95 transition-opacity"
              onClick={() => setSelectedImage(images[0])}
            />
            <div className="grid grid-rows-2 gap-2">
              {images.slice(1).map((img, idx) => (
                <img
                  key={idx + 1}
                  src={img}
                  alt={`post image ${idx + 2}`}
                  className="w-full h-24 md:h-32 object-cover rounded-r-lg cursor-pointer hover:opacity-95 transition-opacity"
                  onClick={() => setSelectedImage(img)}
                />
              ))}
            </div>
          </div>
        );

      case 'quad':
        return (
          <div className="grid grid-cols-2 gap-2">
            {images.map((img, idx) => (
              <img
                key={idx}
                src={img}
                alt={`post image ${idx + 1}`}
                className={`w-full h-24 md:h-32 object-cover cursor-pointer hover:opacity-95 transition-opacity ${
                  idx === 0 ? 'rounded-tl-lg' : ''
                } ${idx === 1 ? 'rounded-tr-lg' : ''} ${idx === 2 ? 'rounded-bl-lg' : ''} ${
                  idx === 3 ? 'rounded-br-lg' : ''
                }`}
                onClick={() => setSelectedImage(img)}
              />
            ))}
          </div>
        );

      default:
        return (
          <div className="grid grid-cols-2 gap-2">
            {images.slice(0, 4).map((img, idx) => (
              <div key={idx} className="relative">
                <img
                  src={img}
                  alt={`post image ${idx + 1}`}
                  className="w-full h-24 md:h-32 object-cover rounded-lg cursor-pointer hover:opacity-95 transition-opacity"
                  onClick={() => setSelectedImage(img)}
                />
                {idx === 3 && images.length > 4 && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center">
                    <span className="text-white font-semibold text-lg">+{images.length - 4}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        );
    }
  };

  return (
    <>
      <div className={`${className}`}>
        {renderImages()}
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-4xl max-h-full">
            <img
              src={selectedImage}
              alt="full size"
              className="max-w-full max-h-full object-contain"
              onClick={(e) => e.stopPropagation()}
            />
            <button
              className="absolute top-4 right-4 text-white text-2xl hover:text-gray-300"
              onClick={() => setSelectedImage(null)}
            >
              ×
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default ImageGallery;