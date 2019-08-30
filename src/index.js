import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useLayoutEffect
} from 'react';
import PropTypes from 'prop-types';
import ExecutionEnvironment from 'exenv';
import * as d3easing from 'd3-ease';
import { PagingDots, PreviousButton, NextButton } from './default-controls';
import Transitions from './all-transitions';
import Slide from './slide';
import AnnounceSlide, {
  defaultRenderAnnounceSlideMessage
} from './announce-slide';
import {
  addEvent,
  removeEvent,
  swipeDirection,
  shouldUpdate,
  calcSomeInitialState,
  getPropsByTransitionMode
} from './utilities/utilities';
import {
  getImgTagStyles,
  getDecoratorStyles,
  getSliderStyles,
  getFrameStyles,
  getTransitionProps
} from './utilities/style-utilities';
import {
  getValidChildren,
  getSlideHeight
} from './utilities/bootstrapping-utilities';

/* eslint-disable-next-line consistent-return */
const useTimeout = function(callback, delay) {
  const tick = function() {
    callback();
  };
  if (delay !== null) {
    setTimeout(tick, delay);
    // return () => clearTimeout(id);
  }

  // const savedCallback = useRef();

  // // Remember the latest callback
  // useEffect(
  //   () => {
  //     savedCallback.current = callback;
  //   },
  //   [callback]
  // );

  // // Set up the timeout
  // useEffect(
  //   /* eslint-disable-next-line consistent-return */
  //   () => {
  //     const tick = function() {
  //       savedCallback.current();
  //     };
  //     if (delay !== null) {
  //       const id = setTimeout(tick, delay);
  //       return () => clearTimeout(id);
  //     }
  //   },
  //   [delay]
  // );
};

export default function Carousel({
  afterSlide,
  animation,
  beforeSlide,
  cellAlign,
  cellSpacing,
  children,
  clickDisabled,
  frameOverflow,
  framePadding,
  heightMode,
  initialSlideHeight,
  initialSlideWidth,
  slideIndex,
  slidesToScroll,
  slidesToShow,
  slideWidth,
  speed,
  transitionMode,
  vertical,
  wrapAround
}) {
  const sliderFrameEl = useRef(null);
  const sliderFrameWidth = useRef(null);
  const sliderFrameHeight = useRef(null);

  const validChildren = getValidChildren(children);
  const slideCount = getValidChildren(children).length;

  // State

  const [dimensions, setDimensions] = useState({
    height: initialSlideHeight,
    width: initialSlideWidth
  });
  const [currentSlide, setCurrentSlide] = useState(slideIndex);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Helper methods for slide dimensions

  const getHeight = () => {
    if (sliderFrameEl.current !== null) {
      const childNodes = sliderFrameEl.current.childNodes[0].childNodes;

      return getSlideHeight(
        { heightMode, vertical, initialSlideHeight },
        { slidesToShow, currentSlide },
        childNodes
      );
    } else {
      return 0;
    }
  };

  const getWidth = () => {
    let width;
    if (animation === 'zoom') {
      width =
        sliderFrameEl.current.offsetWidth -
        (sliderFrameEl.current.offsetWidth * 15) / 100;
    } else if (typeof slideWidth !== 'number') {
      width = parseInt(slideWidth);
    } else if (vertical) {
      width = (getHeight() / slidesToShow) * slideWidth;
    } else {
      width = (sliderFrameEl.current.offsetWidth / slidesToShow) * slideWidth;
    }

    if (!vertical) {
      width -= cellSpacing * ((100 - 100 / slidesToShow) / 100);
    }

    return width;
  };

  // Slider Frame Measurement

  const sliderFrameElWidth =
    sliderFrameEl.current !== null ? sliderFrameEl.current.offsetWidth : 0;
  sliderFrameHeight.current = getHeight() + cellSpacing * (slidesToShow - 1);
  sliderFrameWidth.current = vertical
    ? sliderFrameHeight.current
    : sliderFrameElWidth;

  let updateSlidesToScroll = slidesToScroll;
  // update slidesToScroll
  if (slidesToScroll === 'auto') {
    updateSlidesToScroll = Math.floor(
      sliderFrameWidth.current / (slideWidth + cellSpacing)
    );
  } else {
    updateSlidesToScroll =
      transitionMode === 'fade'
        ? Math.max(parseInt(slidesToShow), 1)
        : slidesToScroll;
  }

  // Action methods!!

  const nextSlide = () => {
    if (isTransitioning) {
      return;
    }

    setIsTransitioning(true);

    const atEndOfCarousel = currentSlide >= slideCount - slidesToShow;
    if (atEndOfCarousel && !wrapAround && cellAlign === 'left') {
      // Cannot advance to next slide
      return;
    }

    const beyondLastSlide = currentSlide >= slideCount;

    console.log('updateSlidesToScroll', updateSlidesToScroll);

    if (beyondLastSlide) {
      if (!wrapAround) {
        setIsTransitioning(false);
      } else {
        // Going from last slide to first slide
        beforeSlide(currentSlide, 0);
        setCurrentSlide(0);

        setTimeout(() => {
          console.log('1 set timeout!!');
          setIsTransitioning(false);
        }, speed);
      }
    } else if (slideWidth !== 1) {
      setCurrentSlide((currentSlide + updateSlidesToScroll) % slideCount);

      setTimeout(() => {
        console.log('2 set timeout!!');
        setIsTransitioning(false);
      }, speed);
    } else {
      const offset = currentSlide + updateSlidesToScroll;
      const nextSlideIndex =
        cellAlign !== 'left'
          ? offset
          : Math.min(offset, slideCount - slidesToShow);

      console.warn('offset', offset, 'nextSlideIndex', nextSlideIndex);
      setCurrentSlide(nextSlideIndex);

      setTimeout(() => {
        console.log('3 set timeout!!');
        setIsTransitioning(false);
      }, speed);
    }
  };

  const handleClick = useCallback(
    event => {
      nextSlide();
      if (clickDisabled) {
        if (event.metaKey || event.shiftKey || event.altKey || event.ctrlKey) {
          return;
        }
        event.preventDefault();
        event.stopPropagation();

        if (event.nativeEvent) {
          event.nativeEvent.stopPropagation();
        }
      }
    },
    [clickDisabled, currentSlide]
  );

  useEffect(
    () => {
      const validSlideCount = getValidChildren.length;
      const slideCountChanged = validSlideCount !== slideCount;

      setCurrentSlide(slideCountChanged ? slideIndex : currentSlide);

      if (slideCount <= currentSlide) {
        setCurrentSlide(Math.max(slideCount - 1, 0));
      }
    },
    [children, slideCount]
  );

  // Set Slide Dimensions
  useLayoutEffect(
    () => {
      // Calculate the slide height and width
      setDimensions({
        height: getHeight(),
        width: getWidth()
      });
    },
    [
      cellAlign,
      cellSpacing,
      heightMode,
      slideCount,
      slidesToScroll,
      slidesToShow,
      slideWidth,
      transitionMode,
      vertical
    ]
  );

  useLayoutEffect(() => {
    const handleResize = function() {
      // Recalculate the slide height and width
      setDimensions({ height: getHeight(), width: getWidth() });
    };

    const handleReadyStateChange = function() {
      // Recalculate the slide height and width
      setDimensions({ height: getHeight(), width: getWidth() });
    };

    if (ExecutionEnvironment.canUseDOM) {
      addEvent(window, 'resize', handleResize);
      addEvent(document, 'readystatechange', handleReadyStateChange);
      // addEvent(document, 'visibilitychange', handleVisibilityChange);
      // addEvent(document, 'keydown', handleKeyPress);
      return () => {
        removeEvent(window, 'resize', handleResize);
        removeEvent(document, 'readystatechange', handleReadyStateChange);
        // removeEvent(document, 'visibilitychange', handleVisibilityChange);
        // removeEvent(document, 'keydown', handleKeyPress);
      };
    } else {
      return () => {};
    }
  }, []);

  const TransitionControl = Transitions[transitionMode];

  return (
    <div>
      <p>
        {JSON.stringify(dimensions)} currentSlide:{' '}
        {JSON.stringify(currentSlide)} isTransitioning:{' '}
        {JSON.stringify(isTransitioning)}
      </p>
      <p>
        frame: {JSON.stringify(sliderFrameWidth.current)} x{' '}
        {JSON.stringify(sliderFrameHeight.current)}
      </p>
      <div
        className="slider-frame"
        ref={sliderFrameEl}
        style={getFrameStyles(
          frameOverflow,
          vertical,
          framePadding,
          sliderFrameWidth.current
        )}
        onClick={handleClick}
      >
        <TransitionControl
          slideHeight={dimensions.height}
          slideWidth={dimensions.width}
        >
          {validChildren}
        </TransitionControl>
      </div>
    </div>
  );
}

Carousel.displayName = 'Carousel';

Carousel.propTypes = {
  afterSlide: PropTypes.func,
  animation: PropTypes.oneOf(['zoom']),
  autoGenerateStyleTag: PropTypes.bool,
  autoplay: PropTypes.bool,
  autoplayInterval: PropTypes.number,
  autoplayReverse: PropTypes.bool,
  beforeSlide: PropTypes.func,
  cellAlign: PropTypes.oneOf(['left', 'center', 'right']),
  cellSpacing: PropTypes.number,
  disableAnimation: PropTypes.bool,
  disableEdgeSwiping: PropTypes.bool,
  dragging: PropTypes.bool,
  easing: PropTypes.string,
  edgeEasing: PropTypes.string,
  enableKeyboardControls: PropTypes.bool,
  frameOverflow: PropTypes.string,
  framePadding: PropTypes.string,
  height: PropTypes.string,
  heightMode: PropTypes.oneOf(['first', 'current', 'max']),
  initialSlideHeight: PropTypes.number,
  initialSlideWidth: PropTypes.number,
  onDragStart: PropTypes.func,
  onResize: PropTypes.func,
  opacityScale: PropTypes.number,
  pauseOnHover: PropTypes.bool,
  renderAnnounceSlideMessage: PropTypes.func,
  renderBottomCenterControls: PropTypes.func,
  renderBottomLeftControls: PropTypes.func,
  renderBottomRightControls: PropTypes.func,
  renderCenterCenterControls: PropTypes.func,
  renderCenterLeftControls: PropTypes.func,
  renderCenterRightControls: PropTypes.func,
  renderTopCenterControls: PropTypes.func,
  renderTopLeftControls: PropTypes.func,
  renderTopRightControls: PropTypes.func,
  slideIndex: PropTypes.number,
  slideListMargin: PropTypes.number,
  slideOffset: PropTypes.number,
  slidesToScroll: PropTypes.oneOfType([
    PropTypes.number,
    PropTypes.oneOf(['auto'])
  ]),
  slidesToShow: PropTypes.number,
  slideWidth: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  speed: PropTypes.number,
  swiping: PropTypes.bool,
  transitionMode: PropTypes.oneOf(['scroll', 'fade', 'scroll3d']),
  vertical: PropTypes.bool,
  width: PropTypes.string,
  withoutControls: PropTypes.bool,
  wrapAround: PropTypes.bool
};

Carousel.defaultProps = {
  afterSlide: () => {},
  autoGenerateStyleTag: true,
  autoplay: false,
  autoplayInterval: 3000,
  autoplayReverse: false,
  beforeSlide: () => {},
  cellAlign: 'left',
  cellSpacing: 0,
  disableAnimation: false,
  disableEdgeSwiping: false,
  dragging: true,
  easing: 'easeCircleOut',
  edgeEasing: 'easeElasticOut',
  enableKeyboardControls: false,
  frameOverflow: 'hidden',
  framePadding: '0px',
  height: 'auto',
  heightMode: 'max',
  onResize: () => {},
  pauseOnHover: true,
  renderAnnounceSlideMessage: defaultRenderAnnounceSlideMessage,
  renderBottomCenterControls: props => <PagingDots {...props} />,
  renderCenterLeftControls: props => <PreviousButton {...props} />,
  renderCenterRightControls: props => <NextButton {...props} />,
  slideIndex: 0,
  slideListMargin: 10,
  slideOffset: 25,
  slidesToScroll: 1,
  slidesToShow: 1,
  slideWidth: 1,
  speed: 500,
  style: {},
  swiping: true,
  transitionMode: 'scroll',
  vertical: false,
  width: '100%',
  withoutControls: false,
  wrapAround: false
};
