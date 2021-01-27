/* eslint-disable filenames/match-regex */
import React from 'react';

import Carousel from '../../src/index';

export default {
  title: 'Carousel',
  component: Carousel
};

const colors = [
  '7732bb',
  '047cc0',
  '00884b',
  'e3bc13',
  'db7c00',
  'aa231f',
  'e3bc13',
  'db7c00',
  'aa231f'
];

const slides = (args) =>
  colors.map((color, index) => {
    return (
      <img
        key={index}
        src={`https://via.placeholder.com/400/${color}/ffffff/&text=slide${
          index + 1
        }`}
        style={{
          height: args.heightMode === 'current' ? 100 * (index + 1) : 400
        }}
      />
    );
  });

const CarouselStory = ({ ...args }) => (
  <Carousel {...args}>{slides(args)}</Carousel>
);

export const Primary = CarouselStory.bind({});
Primary.args = {
  animation: undefined,
  autoplay: false,
  cellAlign: 'left',
  cellSpacing: 0,
  heightMode: 'max',
  scrollMode: 'remainder',
  slideIndex: 1,
  slidesToScroll: 1,
  slidesToShow: 1,
  transitionMode: 'scroll',
  withoutControls: false,
  wrapAround: false,
  zoomScale: 0.5
};
Primary.argTypes = {
  animation: {
    control: {
      type: 'select',
      options: ['zoom']
    }
  },
  cellAlign: {
    control: {
      type: 'select',
      options: ['left', 'center', 'right']
    }
  },
  heightMode: {
    control: {
      type: 'select',
      options: ['max', 'current', 'first']
    }
  },
  scrollMode: {
    control: {
      type: 'select',
      options: ['remainder', 'page']
    }
  },
  transitionMode: {
    control: {
      type: 'select',
      options: ['scroll', 'fade', 'scroll3d']
    }
  }
};

export const ZoomAnimation = CarouselStory.bind({});
ZoomAnimation.args = { animation: 'zoom' };

export const HeightModeCurrent = CarouselStory.bind({});
HeightModeCurrent.args = { heightMode: 'current' };

export const ScrollModePage = CarouselStory.bind({});
ScrollModePage.args = {
  scrollMode: 'page',
  slidesToShow: 4,
  slidesToScroll: 4
};

export const ScrollModeRemainder = CarouselStory.bind({});
ScrollModeRemainder.args = {
  scrollMode: 'remainder',
  slidesToShow: 4,
  slidesToScroll: 4
};

export const FadeTransition = CarouselStory.bind({});
FadeTransition.args = { transitionMode: 'fade' };

export const CellSpacing = CarouselStory.bind({});
CellSpacing.args = { cellSpacing: 15, slidesToShow: 1.5 };

export const Vertical = CarouselStory.bind({});
Vertical.args = { vertical: true };
