import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import PropTypes from 'prop-types';
import ExecutionEnvironment from 'exenv';
import * as d3easing from 'd3-ease';
import { PagingDots, PreviousButton, NextButton } from './default-controls';
import Slide from './slide';
import AnnounceSlide, {
  defaultRenderAnnounceSlideMessage
} from './announce-slide';
import {
  addEvent,
  removeEvent,
  getPropsByTransitionMode,
  swipeDirection,
  shouldUpdate,
  calcSomeInitialState
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

const useInterval = function(callback, delay) {
  const savedCallback = useRef();

  // Remember the latest callback.
  useEffect(
    () => {
      savedCallback.current = callback;
    },
    [callback]
  );

  // Set up the interval.
  useEffect(
    /* eslint-disable-next-line consistent-return */
    () => {
      const tick = function() {
        savedCallback.current();
      };
      if (delay !== null) {
        const id = setInterval(tick, delay);
        return () => clearInterval(id);
      }
    },
    [delay]
  );
};

// TODO: export { NextButton, PreviousButton, PagingDots };

/* eslint-disable-next-line complexity */
export default function Carousel({
  afterSlide,
  animation,
  autoGenerateStyleTag,
  autoplay,
  autoplayInterval,
  autoplayReverse,
  beforeSlide,
  // cellAlign,
  cellSpacing,
  children,
  disableAnimation,
  disableEdgeSwiping,
  dragging,
  easing,
  edgeEasing,
  enableKeyboardControls,
  frameOverflow,
  framePadding,
  height,
  heightMode,
  initialSlideHeight,
  initialSlideWidth,
  onDragStart,
  onResize,
  opacityScale,
  pauseOnHover,
  renderAnnounceSlideMessage,
  renderBottomCenterControls,
  renderBottomLeftControls,
  renderBottomRightControls,
  renderCenterCenterControls,
  renderCenterLeftControls,
  renderCenterRightControls,
  renderTopCenterControls,
  renderTopLeftControls,
  renderTopRightControls,
  slideIndex,
  slideListMargin,
  slideOffset,
  // slidesToScroll,
  // slidesToShow,
  // slideWidth,
  speed,
  swiping,
  transitionMode,
  vertical,
  width,
  withoutControls,
  wrapAround
}) {
  // use sliderFrameEl for `this.frame`
  const sliderFrameEl = useRef(null);

  let clickDisabled = false;
  let isTransitioning = false;
  let touchObject = {};
  let controlsMap = [
    { funcName: 'renderTopLeftControls', key: 'TopLeft' },
    { funcName: 'renderTopCenterControls', key: 'TopCenter' },
    { funcName: 'renderTopRightControls', key: 'TopRight' },
    { funcName: 'renderCenterLeftControls', key: 'CenterLeft' },
    { funcName: 'renderCenterCenterControls', key: 'CenterCenter' },
    { funcName: 'renderCenterRightControls', key: 'CenterRight' },
    { funcName: 'renderBottomLeftControls', key: 'BottomLeft' },
    { funcName: 'renderBottomCenterControls', key: 'BottomCenter' },
    { funcName: 'renderBottomRightControls', key: 'BottomRight' }
  ];
  let childNodesMutationObs = null;

  const validChildren = getValidChildren(children);

  // State
  const [currentSlide, setCurrentSlide] = useState(slideIndex);
  const [isDragging, setIsDragging] = useState(false);
  const [isEasing, setIsEasing] = useState(
    disableAnimation ? '' : d3easing.easeCircleOut
  );
  // hasInteraction: to remove animation from the initial slide on the page load when non-default slideIndex is used
  const [hasInteraction, setHasInteraction] = useState(false);
  const [isWrappingAround, setIsWrappingAround] = useState(false);
  const [left, setLeft] = useState(0);
  const [top, setTop] = useState(0);
  const [resetWrapAroundPosition, setResetWrapAroundPosition] = useState(false);
  const [slideCount, setSlideCount] = useState(validChildren.length);
  const [wrapToIndex, setWrapToIndex] = useState(null);
  const [slideWidth, setSlideWidth] = useState(
    vertical ? initialSlideHeight || 0 : initialSlideWidth || 0
  );
  const [slideHeight, setSlideHeight] = useState(
    vertical
      ? (initialSlideHeight || 0) * slidesToShow
      : initialSlideHeight || 0
  );
  const [frameWidth, setFrameWidth] = useState(vertical ? frameHeight : '100%');
  const [frameHeight, setFrameHeight] = useState(
    slideHeight + cellSpacing * (slidesToShow - 1)
  );
  const [slidesToScroll, setSlidesToScroll] = useState(
    getPropsByTransitionMode({ slidesToShow, transitionMode }, 'slidesToScroll')
  );
  const [slidesToShow, setSlidesToShow] = useState(
    getPropsByTransitionMode({ slidesToShow, transitionMode }, 'slidesToShow')
  );
  const [cellAlign, setCellAlign] = useState(
    getPropsByTransitionMode({ slidesToShow, transitionMode }, 'cellAlign')
  );
  const [isPlaying, setIsPlaying] = useState(autoplay);

  const setDimensions = function() {
    console.warn('TODO: setDimensions');
  };

  const resetAutoplay = function() {
    if (autoplay && isPlaying) {
      // TODO:
      // stopAutoplay() (which clearInterval)
      // startAutoplay (setInterval)
      console.warn('TODO: resetAutoplay() is this needed?');
    }
  };

  // Action Methods

  /* eslint-disable-next-line complexity */
  const goToSlide = function(index, props) {
    if (props) {
      console.log('goToSlide has custom props!!', props);
    }

    if (isTransitioning) {
      return;
    }

    setHasInteraction(true);
    setIsEasing(d3easing[easing]);

    isTransitioning = true;

    const prevSlide = currentSlide;

    if (index >= slideCount || index < 0) {
      if (!wrapAround) {
        isTransitioning = false;
        return;
      }
      if (index >= slideCount) {
        beforeSlide(currentSlide, 0);

        setLeft(vertical ? 0 : getTargetLeft(slideWidth, currentSlide));
        setTop(vertical ? getTargetLeft(slideWidth, currentSlide) : 0);
        setCurrentSlide(0);
        setIsWrappingAround(true);
        setWrapToIndex(index);

        // TODO: This setTimeout needs to happen after all of the above?
        setTimeout(() => {
          resetAutoplay();
          isTransitioning = false;
          if (index !== prevSlide) {
            afterSlide(0);
          }
        }, speed);

        return;
      } else {
        const endSlide = slideCount - slidesToScroll;
        beforeSlide(currentSlide, endSlide);

        setLeft(vertical ? 0 : getTargetLeft(0, currentSlide));
        setTop(vertical ? getTargetLeft(0, currentSlide) : 0);
        setCurrentSlide(endSlide);
        setIsWrappingAround(true);
        setWrapToIndex(index);

        // TODO: This setTimeout needs to happen after all of the above?
        setTimeout(() => {
          resetAutoplay();
          isTransitioning = false;
          if (index !== prevSlide) {
            afterSlide(slideCount - 1);
          }
        }, speed);

        // this.setState(
        //   prevState => ({
        //     left: props.vertical
        //       ? 0
        //       : this.getTargetLeft(0, prevState.currentSlide),
        //     top: props.vertical
        //       ? this.getTargetLeft(0, prevState.currentSlide)
        //       : 0,
        //     currentSlide: endSlide,
        //     isWrappingAround: true,
        //     wrapToIndex: index
        //   }),
        //   () => {
        //     setTimeout(() => {
        //       this.resetAutoplay();
        //       this.isTransitioning = false;
        //       if (index !== previousSlide) {
        //         this.props.afterSlide(this.state.slideCount - 1);
        //       }
        //     }, props.speed);
        //   }
        // );
        return;
      }
    }
  };

  const nextSlide = function() {
    if (slidesToScroll === 'auto') {
      setSlidesToShow(slidesToScroll);
    }

    if (
      currentSlide >= slideCount - slidesToShow &&
      !wrapAround &&
      cellAlign === 'left'
    ) {
      return;
    }

    if (wrapAround) {
      goToSlide(currentSlide + slidesToScroll);
    } else {
      if (slideWidth !== 1) {
        goToSlide(currentSlide + slidesToScroll);
        return;
      }
      const offset = currentSlide + slidesToScroll;
      const nextSlideIndex =
        cellAlign !== 'left'
          ? offset
          : Math.min(offset, slideCount - slidesToShow);
      goToSlide(nextSlideIndex);
    }
  };

  const previousSlide = function() {
    if (currentSlide <= 0 && !wrapAround) {
      return;
    }

    if (wrapAround) {
      goToSlide(currentSlide - slidesToScroll);
    } else {
      goToSlide(Math.max(0, currentSlide - slidesToScroll));
    }
  };

  // Handle Autoplay
  useInterval(
    () => {
      // previously: autoplayIterator()
      if (wrapAround) {
        if (autoplayReverse) {
          previousSlide();
        } else {
          nextSlide();
        }
        return;
      }
      if (autoplayReverse) {
        if (currentSlide !== 0) {
          previousSlide();
        } else {
          // clearInterval
          setIsPlaying(false);
        }
      } else if (currentSlide !== slideCount - slidesToShow) {
        nextSlide();
      } else {
        // clearInterval
        setIsPlaying(false);
      }
    },
    isPlaying ? autoplayInterval : null
  );

  // Bootstrapping
  useEffect(() => {
    // previously: bindEvents()
    const handleResize = function() {
      setDimensions(null, onResize);
    };

    const handleReadyStateChange = function() {
      setDimensions();
    };

    const handleVisibilityChange = function() {
      if (document.hidden) {
        // pause autoplay
        if (autoplay) {
          setIsPlaying(false);
        }
      } else if (autoplay && !isPlaying) {
        // unpause autoplay
        setIsPlaying(true);
      }
    };

    const handleKeyPress = function() {
      console.warn('TODO: handleKeyPress');
    };

    if (ExecutionEnvironment.canUseDOM) {
      addEvent(window, 'resize', handleResize);
      addEvent(document, 'readystatechange', handleReadyStateChange);
      addEvent(document, 'visibilitychange', handleVisibilityChange);
      addEvent(document, 'keydown', handleKeyPress);
      return () => {
        removeEvent(window, 'resize', handleResize);
        removeEvent(document, 'readystatechange', handleReadyStateChange);
        removeEvent(document, 'visibilitychange', handleVisibilityChange);
        removeEvent(document, 'keydown', handleKeyPress);
      };
    } else {
      return () => {};
    }
  });

  const duration =
    this.state.dragging ||
    (!this.state.dragging &&
      this.state.resetWrapAroundPosition &&
      this.props.wrapAround) ||
    this.props.disableAnimation ||
    !this.state.hasInteraction
      ? 0
      : this.props.speed;

  const frameStyles = getFrameStyles(
    frameOverflow,
    vertical,
    framePadding,
    frameWidth
  );

  // TODO:
  // const touchEvents = this.getTouchEvents();
  // const mouseEvents = this.getMouseEvents();

  const handleClick = function() {
    console.warn('TODO: handleClick()');
  };

  const getTargetLeft = function() {
    console.warn('TODO: getTargetLeft()');
  };

  return (
    <div
      className={['slider', className || ''].join(' ')}
      style={Object.assign({}, getSliderStyles(width, height), style)}
    >
      {!autoplay && (
        <AnnounceSlide
          message={renderAnnounceSlideMessage({
            currentSlide,
            slideCount
          })}
        />
      )}
      <div
        className="slider-frame"
        ref={sliderFrameEl}
        style={frameStyles}
        onClickCapture={handleClick}
      >
        //
        <Slide
          currentSlide={currentSlide}
          duration={duration}
          disableEdgeSwiping={disableEdgeSwiping}
          easing={easing} // isEdgeSwiping={this.isEdgeSwiping} // getOffsetDeltas={this.getOffsetDeltas}
          slidesToShow={slidesToShow}
          transitionMode={transitionMode}
          wrapAround={
            wrapAround // transitionProps={getTransitionProps(this.props, this.state)}
          }
          endEvent={() => {
            const newLeft = vertical ? 0 : getTargetLeft();
            const newTop = vertical ? getTargetLeft() : 0;

            if (newLeft !== left || newTop !== top) {
              setLeft(newLeft);
              setTop(newTop);
              setIsWrappingAround(false);
              setResetWrapAroundPosition(true);
              // set true then to false immediately after?
              setResetWrapAroundPosition(false);

              // this.setState(
              //   {
              //     left: newLeft,
              //     top: newTop,
              //     isWrappingAround: false,
              //     resetWrapAroundPosition: true
              //   },
              //   () => {
              //     this.setState({
              //       resetWrapAroundPosition: false
              //     });
              //   }
              // );
            }
          }}
        >
          {validChildren}
        </Slide>
      </div>

      {/* TODO 
      {this.renderControls()}

      {autoGenerateStyleTag && (
        <style
          type="text/css"
          dangerouslySetInnerHTML={{ __html: getImgTagStyles() }}
        />
      )}
      */}
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
