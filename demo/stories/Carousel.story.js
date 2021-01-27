/* eslint-disable filenames/match-regex */
import React from 'react';

import Carousel from '../../src/index';
import { withKnobs, boolean, number, select } from '@storybook/addon-knobs';

export default {
  title: 'Example/Carousel',
  component: Carousel,
  decorators: [withKnobs]
};

const getProps = () => ({
  animation: select('animation', { Default: undefined, Zoom: 'zoom' }),
  autoplay: boolean('autoplay', false),
  cellAlign: select(
    'cellAlign',
    { Left: 'left', Center: 'center', Right: 'right' },
    'left'
  ),
  cellSpacing: number('cellSpacing', 0),
  heightMode: select(
    'heightMode',
    { Max: 'max', Current: 'current', First: 'first' },
    'max'
  ),
  length: number('length', 6),
  scrollMode: select('scrollMode', { Remainder: 'remainder', Page: 'page' }),
  slideIndex: number('scrollIndex', 0),
  slidesToScroll: number('slidesToScroll', 1),
  slidesToShow: number('slidesToShow', 1),
  transitionMode: select('transitionMode', {
    Scroll: 'scroll',
    Fade: 'fade',
    Scroll3d: 'scroll3d'
  }),
  withoutControls: boolean('withoutControls', false),
  wrapAround: boolean('wrapAround', false),
  zoomScale: number('zoomScale', 0.5)
});

const slides = [1, 2, 3, 4, 5].map((index) => {
  return <img key={index} src={`/demo/stories/assets/${index}.jpg`} />;
});

export const Primary = () => <Carousel {...getProps()}>{slides}</Carousel>;
