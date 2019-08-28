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
import Slide from './slide';
import AnnounceSlide, {
  defaultRenderAnnounceSlideMessage
} from './announce-slide';
import {
  addEvent,
  removeEvent,
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
  useLayoutEffect(
    () => {
      savedCallback.current = callback;
    },
    [callback]
  );

  // Set up the interval.
  useLayoutEffect(
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
  cellAlign,
  cellSpacing,
  children,
  className,
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
  slidesToScroll,
  slidesToShow,
  // slideWidth,
  speed,
  style,
  swiping,
  transitionMode,
  vertical,
  width,
  withoutControls,
  wrapAround,
  zoomScale
}) {
  // use sliderFrameEl for `this.frame`
  const sliderFrameEl = useRef(null);

  // let clickDisabled = false;
  // let isTransitioning = false;
  let touchObject = {};
  let childNodesMutationObs = null;

  const validChildren = getValidChildren(children);

  // State
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [clickDisabled, setClickDisabled] = useState(false);
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
  const [frameHeight, setFrameHeight] = useState(
    slideHeight + cellSpacing * (slidesToShow - 1)
  );
  const [frameWidth, setFrameWidth] = useState(vertical ? frameHeight : '100%');

  const [isPlaying, setIsPlaying] = useState(autoplay);
  const [isPausedOnHover, setIsPausedOnHover] = useState(pauseOnHover);

  // Massage props
  if (transitionMode === 'fade') {
    slidesToShow = Math.max(parseInt(slidesToShow), 1);
    slidesToScroll = Math.max(parseInt(slidesToShow), 1);
    cellAlign = 'left';
  }

  const getTargetLeft = function(touchOffset, slide) {
    let offset;
    const target = slide || currentSlide;
    switch (cellAlign) {
      case 'left': {
        offset = 0;
        offset -= cellSpacing * target;
        break;
      }
      case 'center': {
        offset = (frameWidth - slideWidth) / 2;
        offset -= cellSpacing * target;
        break;
      }
      case 'right': {
        offset = frameWidth - slideWidth;
        offset -= cellSpacing * target;
        break;
      }
    }

    let newLeft = slideWidth * target;

    const lastSlide = currentSlide > 0 && target + slidesToScroll >= slideCount;

    if (
      lastSlide &&
      slideWidth !== 1 &&
      !wrapAround &&
      slidesToScroll === 'auto'
    ) {
      newLeft = slideWidth * slideCount - frameWidth;
      offset = 0;
      offset -= cellSpacing * (slideCount - 1);
    }

    offset -= touchOffset || 0;

    return (newLeft - offset) * -1;
  };

  const calcSlideHeightAndWidth = function() {
    const childNodes = sliderFrameEl.current.childNodes[0].childNodes;
    const newSlideHeight = getSlideHeight(
      { heightMode, vertical, initialSlideHeight },
      { slidesToShow, currentSlide },
      childNodes
    );

    //slide width

    let newSlideWidth;

    if (animation === 'zoom') {
      newSlideWidth =
        sliderFrameEl.current.offsetWidth -
        (sliderFrameEl.current.offsetWidth * 15) / 100;
    } else if (typeof slideWidth !== 'number') {
      newSlideWidth = parseInt(slideWidth);
    } else if (vertical) {
      newSlideWidth = (newSlideHeight / slidesToShow) * slideWidth;
    } else {
      newSlideWidth = (sliderFrameEl.offsetWidth / slidesToShow) * slideWidth;
    }

    if (!vertical) {
      newSlideWidth -= cellSpacing * ((100 - 100 / slidesToShow) / 100);
    }

    return { newSlideHeight, newSlideWidth };
  };

  const setDimensions = (stateCb = () => {}) => {
    const { newSlideHeight, newSlideWidth } = calcSlideHeightAndWidth();

    const newFrameHeight = newSlideHeight + cellSpacing * (slidesToShow - 1);
    const newFrameWidth = vertical ? newFrameHeight : sliderFrameEl.offsetWidth;

    if (slidesToScroll === 'auto') {
      slidesToScroll = Math.floor(
        newFrameWidth / (newSlideWidth + cellSpacing)
      );
    }

    setFrameWidth(frameWidth);
    setFrameHeight(frameHeight);
    // setSlidesToShow(slidesToShow);
    setSlideWidth(slideWidth);
    setLeft(vertical ? 0 : getTargetLeft());
    setTop(vertical ? getTargetLeft() : 0);

    stateCb();

    const newLeft = vertical ? 0 : getTargetLeft();
    const newTop = vertical ? getTargetLeft() : 0;

    if (newLeft !== left) {
      setLeft(newLeft);
    }
    if (newTop !== top) {
      setTop(newTop);
    }
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

    setIsTransitioning(true);

    const prevSlide = currentSlide;

    if (index >= slideCount || index < 0) {
      if (!wrapAround) {
        setIsTransitioning(false);
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
          setIsTransitioning(false);
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
          setIsTransitioning(false);
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
    // if (slidesToScroll === 'auto') {
    //   setSlidesToShow(slidesToScroll);
    // }

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
      } else if (autoplayReverse) {
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

  // eslint-disable-next-line complexity
  const handleKeyPress = useCallback(e => {
    console.warn('TODO: handleKeyPress');
    if (enableKeyboardControls) {
      switch (e.keyCode) {
        case 39:
        case 68:
        case 38:
        case 87:
          nextSlide();
          break;
        case 37:
        case 65:
        case 40:
        case 83:
          previousSlide();
          break;
        case 81:
          goToSlide(0);
          break;
        case 69:
          goToSlide(slideCount - 1);
          break;
        case 32:
          if (isPausedOnHover && autoplay) {
            setIsPausedOnHover(false);
            setIsPlaying(false);
            console.warn('TODO: confirm pause autoplay?', isPlaying);
            break;
          } else {
            setIsPausedOnHover(true);
            setIsPlaying(true);
            console.warn('TODO: confirm unpause autoplay?', isPlaying);
            break;
          }
      }
    }
  }, []);

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

  // Bootstrapping
  // useLayoutEffect(() => {
  //   // previously: bindEvents()
  //   if (ExecutionEnvironment.canUseDOM) {
  //     addEvent(window, 'resize', handleResize);
  //     addEvent(document, 'readystatechange', handleReadyStateChange);
  //     addEvent(document, 'visibilitychange', handleVisibilityChange);
  //     addEvent(document, 'keydown', handleKeyPress);
  //     return () => {
  //       removeEvent(window, 'resize', handleResize);
  //       removeEvent(document, 'readystatechange', handleReadyStateChange);
  //       removeEvent(document, 'visibilitychange', handleVisibilityChange);
  //       removeEvent(document, 'keydown', handleKeyPress);
  //     };
  //   } else {
  //     return () => {};
  //   }
  // }, []);

  const duration =
    isDragging ||
    (!isDragging && resetWrapAroundPosition && wrapAround) ||
    disableAnimation ||
    !hasInteraction
      ? 0
      : speed;

  const frameStyles = getFrameStyles(
    frameOverflow,
    vertical,
    framePadding,
    frameWidth
  );

  // TODO:
  // const touchEvents = this.getTouchEvents();
  // const mouseEvents = this.getMouseEvents();

  const handleClick = useCallback(
    event => {
      if (clickDisabled === true) {
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
    [clickDisabled]
  );

  const getOffsetDeltas = function() {
    let offset = 0;

    if (isWrappingAround) {
      offset = getTargetLeft(null, wrapToIndex);
    } else {
      offset = getTargetLeft(touchObject.length * touchObject.direction);
    }

    return { tx: vertical ? 0 : offset, ty: vertical ? offset : 0 };
  };

  const isEdgeSwiping = function() {
    const { tx, ty } = getOffsetDeltas();

    if (vertical) {
      const rowHeight = slideHeight / slidesToShow;
      const slidesLeftToShow = slideCount - slidesToShow;
      const lastSlideLimit = rowHeight * slidesLeftToShow;

      // returns true if ty offset is outside first or last slide
      return ty > 0 || -ty > lastSlideLimit;
    }

    // returns true if tx offset is outside first or last slide
    return tx > 0 || -tx > slideWidth * (slideCount - 1);
  };

  const renderControls = function() {
    const controlsMap = [
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

    if (withoutControls) {
      return controlsMap.map(() => null);
    } else {
      return controlsMap.map(({ funcName, key }) => {
        // const func = this.props[funcName];
        const controlChildren =
          funcName &&
          typeof funcName === 'function' &&
          funcName({
            cellAlign,
            cellSpacing,
            currentSlide,
            frameWidth,
            goToSlide: index => goToSlide(index),
            nextSlide: () => nextSlide(),
            previousSlide: () => previousSlide(),
            slideCount,
            slidesToScroll,
            slidesToShow,
            slideWidth,
            wrapAround
          });

        return (
          controlChildren && (
            <div
              className={`slider-control-${key.toLowerCase()}`}
              style={getDecoratorStyles(key)}
              key={key}
            >
              {controlChildren}
            </div>
          )
        );
      });
    }
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
        <Slide
          currentSlide={currentSlide}
          duration={duration}
          disableEdgeSwiping={disableEdgeSwiping}
          easing={easing}
          isEdgeSwiping={isEdgeSwiping}
          getOffsetDeltas={getOffsetDeltas}
          slidesToShow={slidesToShow}
          transitionMode={transitionMode}
          wrapAround={wrapAround}
          transitionProps={{
            animation,
            cellSpacing,
            currentSlide,
            dragging,
            isWrappingAround,
            left,
            opacityScale,
            slideCount,
            slideHeight,
            slideListMargin,
            slideOffset,
            slidesToShow,
            slideWidth,
            top,
            vertical,
            wrapAround,
            zoomScale
          }}
          endEvent={() => {
            const newLeft = vertical ? 0 : getTargetLeft();
            const newTop = vertical ? getTargetLeft() : 0;

            if (newLeft !== left || newTop !== top) {
              setLeft(newLeft);
              setTop(newTop);
              setIsWrappingAround(false);
              console.warn(
                'resetWrapAroundPosition true?',
                resetWrapAroundPosition
              );
              setResetWrapAroundPosition(true);
              console.warn(
                'resetWrapAroundPosition false?',
                resetWrapAroundPosition
              );
              // set true then to false immediately after?
              setResetWrapAroundPosition(false);
            }
          }}
        >
          {validChildren}
        </Slide>
      </div>

      {renderControls()}

      {autoGenerateStyleTag && (
        <style
          type="text/css"
          dangerouslySetInnerHTML={{ __html: getImgTagStyles() }}
        />
      )}
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
