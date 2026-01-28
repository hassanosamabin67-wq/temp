import React from 'react';
import { Carousel } from 'antd';

interface CustomCarouselProps {
  content: React.ReactNode[]; // Array of React nodes to render as carousel items
  autoplay?: boolean; // Optional autoplay control
  dotPosition?: 'top' | 'bottom' | 'left' | 'right'; // Optional dot position
  effect?: 'scrollx' | 'fade'; // Optional transition effect
}

const CustomCarousel: React.FC<CustomCarouselProps> = ({
  content,
  autoplay = true,
  dotPosition = 'bottom',
  effect = 'scrollx',
}) => (
  <Carousel autoplay={autoplay} dotPosition={dotPosition} effect={effect}>
    {content.map((item, index) => (
      <div key={index} style={{ textAlign: 'center' }}>
        {item}
      </div>
    ))}
  </Carousel>
);

export default CustomCarousel;
