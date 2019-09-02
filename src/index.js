import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useLayoutEffect,
  useMemo
} from 'react';
import PropTypes from 'prop-types';
import ExecutionEnvironment from 'exenv';
import Animate from 'react-move/Animate';
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
  getFrameStyles
} from './utilities/style-utilities';
import {
  addAccessibility,
  getValidChildren,
  getSlideHeight
} from './utilities/bootstrapping-utilities';

export default function Carousel({
  afterSlide,
  animation,
  autoGenerateStyleTag,
  beforeSlide,
  cellAlign,
  cellSpacing,
  children,
  clickDisabled,
  disableAnimation,
  disableEdgeSwiping,
  dragging,
  easing,
  edgeEasing,
  enableKeyboardControls,
  frameOverflow,
  framePadding,
  heightMode,
  initialSlideHeight,
  initialSlideWidth,
  onDragStart,
  opacityScale,
  slideIndex,
  slideListMargin,
  slideOffset,
  slidesToScroll,
  slidesToShow,
  slideWidth,
  speed,
  swiping,
  transitionMode,
  vertical,
  wrapAround,
  zoomScale
}) {
  // Setup
  const sliderFrameEl = useRef();
  const updateSlidesToScroll = useRef(slidesToScroll);
  const touchObject = useRef({});

  const validChildren = getValidChildren(children);
  const slideCount = getValidChildren(children).length;

  // State
  const [frame, setFrame] = useState({ height: 0, width: 0 });
  const [dimensions, setDimensions] = useState({
    height: initialSlideHeight,
    width: initialSlideWidth
  });
  const [currentSlide, setCurrentSlide] = useState(slideIndex);
  const [currentSlideOffset, setCurrentSlideOffset] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [wrapping, setWrapping] = useState({
    isWrapping: false,
    index: null,
    reset: false
  });
  const [hasInteraction, setHasInteraction] = useState(false); // to remove animation from the initial slide on the page load when non-default slideIndex is used
  const [isDragging, setIsDragging] = useState(false);
  const initialEasing = disableAnimation
    ? () => {}
    : () => d3easing.easeCircleOut;
  const [easeFunction, setEaseFunction] = useState(d3easing.easeCircleOut);

  // Helper methods for slide dimensions

  const getHeight = (node = sliderFrameEl.current) => {
    if (node !== null) {
      const childNodes = node.childNodes[0].childNodes;

      return getSlideHeight(
        { heightMode, vertical, initialSlideHeight },
        { slidesToShow, currentSlide },
        childNodes
      );
    } else {
      return 0;
    }
  };

  const getWidth = (node = sliderFrameEl.current) => {
    let width;
    if (animation === 'zoom') {
      width = node.offsetWidth - (node.offsetWidth * 15) / 100;
    } else if (typeof slideWidth !== 'number') {
      width = parseInt(slideWidth);
    } else if (vertical) {
      width = (getHeight() / slidesToShow) * slideWidth;
    } else {
      width = (node.offsetWidth / slidesToShow) * slideWidth;
    }

    if (!vertical) {
      width -= cellSpacing * ((100 - 100 / slidesToShow) / 100);
    }

    return width;
  };

  // Slider Frame Measurement

  const sliderFrame = useCallback(
    node => {
      if (node !== null) {
        sliderFrameEl.current = node;
        // The initial `height` is incorrect because the children have not loaded yet ugh
        // which is why there is a dependency on `dimensions`
        const height = getHeight(node) + cellSpacing * (slidesToShow - 1);
        const initialWidth = node.offsetWidth;
        const width = vertical ? height : initialWidth;
        setFrame({ height, width });
      }
    },
    [dimensions]
  ); // Is there a better way?

  // Make sure `slidesToScroll` is a number
  useEffect(
    () => {
      if (slidesToScroll === 'auto') {
        updateSlidesToScroll.current = Math.floor(
          frame.width / (getWidth() + cellSpacing)
        );
      }
      if (transitionMode === 'fade') {
        updateSlidesToScroll.current = Math.max(parseInt(slidesToShow), 3);
      }
    },
    [slidesToScroll, frame]
  );

  // Animation Method

  const getTargetLeft = (touchOffset, index) => {
    const targetIndex = index || currentSlide;

    let offset;
    switch (cellAlign) {
      case 'left': {
        offset = 0;
        offset -= cellSpacing * targetIndex;
        break;
      }
      case 'center': {
        offset = (frame.width - getWidth()) / 2;
        offset -= cellSpacing * targetIndex;
        break;
      }
      case 'right': {
        offset = frame.width - getWidth();
        offset -= cellSpacing * targetIndex;
        break;
      }
    }

    const isLastSlide =
      currentSlide > 0 && targetIndex + updateSlidesToScroll >= slideCount;

    let left = getWidth() * targetIndex;
    if (
      isLastSlide &&
      slideWidth !== 1 &&
      !wrapAround &&
      slidesToScroll === 'auto'
    ) {
      left = getWidth() * slideCount - frame.width;
      offset = 0;
      offset -= cellSpacing * (slideCount - 1);
    }

    offset -= touchOffset || 0;

    return (left - offset) * -1;
  };

  // Calculate how much each slide should move
  const getOffsetDeltas = () => {
    let offset = 0;

    if (wrapping) {
      offset = getTargetLeft(null, wrapping.index);
    } else {
      offset = getTargetLeft(
        touchObject.current.length * touchObject.current.direction
      );
    }

    return { tx: vertical ? 0 : offset, ty: vertical ? offset : 0 };
  };

  const isEdgeSwiping = () => {
    const { tx, ty } = getOffsetDeltas();

    if (vertical) {
      const rowHeight = getHeight() / slidesToShow;
      const slidesLeftToShow = slideCount - slidesToShow;
      const lastSlideLimit = rowHeight * slidesLeftToShow;

      // returns true if ty offset is outside first or last slide
      return ty > 0 || -ty > lastSlideLimit;
    }

    // returns true if tx offset is outside first or last slide
    return tx > 0 || -tx > getWidth() * (slideCount - 1);
  };

  // Action methods!!

  const goToSlide = index => {
    if (isTransitioning || !Number.isInteger(index)) {
      return;
    }

    beforeSlide(currentSlide, index);

    setHasInteraction(true);
    setEaseFunction(d3easing[easing]);
    setIsTransitioning(true);

    setCurrentSlide(index);
    // TODO: set `left`
    // TODO: set `top`

    // TODO: Assign this timeout an `id` and make sure it clears on unmount to avoid the
    // Warning: Can't perform a React state update on an unmounted component.
    setTimeout(() => {
      // TODO: resetAutoplay()
      setWrapping({ isWrapping: false, index: null });
      setIsTransitioning(false);
      afterSlide(index);
    }, speed);
  };

  const previousSlide = () => {
    if (currentSlide <= 0 && !wrapAround) {
      // Cannot advance to previous slide
      return;
    }

    let previousSlideIndex = Math.max(
      0,
      currentSlide - updateSlidesToScroll.current
    );
    if (wrapAround) {
      previousSlideIndex = currentSlide - updateSlidesToScroll.current;

      const beforeFirstSlide = previousSlideIndex < 0;
      if (beforeFirstSlide) {
        // Go to last slide
        previousSlideIndex = slideCount - updateSlidesToScroll.current;
        setWrapping({
          ...wrapping,
          isWrapping: true,
          index: previousSlideIndex
        });
      }
    }

    goToSlide(previousSlideIndex);
  };

  const nextSlide = () => {
    const atEndOfCarousel = currentSlide >= slideCount - slidesToShow;
    if (atEndOfCarousel && !wrapAround && cellAlign === 'left') {
      // Cannot advance to next slide
      return;
    }

    const offset = currentSlide + updateSlidesToScroll.current;
    const beyondLastSlide = offset >= slideCount;
    let nextSlideIndex;

    if (beyondLastSlide) {
      // Reached end of Carousel
      if (!wrapAround) {
        // TODO: Figure out why the below was here. It should fix auto scroll?
        // if (slideWidth !== 1) {
        //   nextSlideIndex =
        //     (currentSlide + updateSlidesToScroll.current) % slideCount;

        //   goToSlide(nextSlideIndex);
        // }

        // Do not go to first slide
        setIsTransitioning(false);
      } else {
        // Going from last slide to first slide
        setWrapping({ ...wrapping, isWrapping: true, index: 0 });
        goToSlide(0);
      }
    } else {
      // Advance to next slide
      nextSlideIndex =
        cellAlign !== 'left'
          ? offset
          : Math.min(offset, slideCount - slidesToShow);

      goToSlide(nextSlideIndex);
    }
  };

  // Touch & Mouse Events

  const handleMouseOver = () => {
    console.log('TODO: handleMouseOver()');
    // if (this.props.pauseOnHover) {
    //   this.pauseAutoplay();
    // }
  };

  const handleMouseOut = () => {
    console.log('TODO: handleMouseOut()');
    // if (this.autoplayPaused) {
    //   this.unpauseAutoplay();
    // }
  };

  const handleSwipe = () => {
    //  updateSlidesToScroll
    let updateSlidesToShow = slidesToShow;

    if (slidesToScroll === 'auto') {
      updateSlidesToShow = updateSlidesToScroll.current;
    }

    if (touchObject.current.length > getWidth() / updateSlidesToShow / 5) {
      if (touchObject.current.direction === 1) {
        if (currentSlide >= slideCount - updateSlidesToShow && !wrapAround) {
          setEaseFunction(d3easing[edgeEasing]);
        } else {
          nextSlide();
        }
      } else if (touchObject.current.direction === -1) {
        if (currentSlide <= 0 && !wrapAround) {
          setEaseFunction(d3easing[edgeEasing]);
        } else {
          previousSlide();
        }
      }
    } else {
      // TODO: Why is the below necessary? Isn't it already on that slide?
      // goToSlide(currentSlide);
    }

    // wait for `handleClick` event before resetting clickDisabled
    setTimeout(() => {
      //TODO: this.clickDisabled = false;
      console.log('TODO: set clickDisabled to false');
    }, 0);
    touchObject.current = {};

    setIsDragging(false);
  };

  const getTouchEvents = function() {
    if (swiping === false) {
      return { onTouchStart: handleMouseOver, onTouchEnd: handleMouseOut };
    }

    return {
      onTouchStart: e => {
        touchObject.current = {
          startX: e.touches[0].pageX,
          startY: e.touches[0].pageY
        };
        handleMouseOver();

        if (onDragStart) {
          onDragStart();
        }

        setIsDragging(true);
      },
      onTouchMove: e => {
        const direction = swipeDirection(
          touchObject.current.startX,
          e.touches[0].pageX,
          touchObject.current.startY,
          e.touches[0].pageY,
          vertical
        );

        if (direction !== 0) {
          e.preventDefault();
        }

        const length = vertical
          ? Math.round(
              Math.sqrt(
                Math.pow(e.touches[0].pageY - touchObject.current.startY, 2)
              )
            )
          : Math.round(
              Math.sqrt(
                Math.pow(e.touches[0].pageX - touchObject.current.startX, 2)
              )
            );

        touchObject.current = {
          startX: touchObject.current.startX,
          startY: touchObject.current.startY,
          endX: e.touches[0].pageX,
          endY: e.touches[0].pageY,
          length,
          direction
        };

        setCurrentSlideOffset(
          getTargetLeft(
            touchObject.current.length * touchObject.current.direction
          )
        );

        // TODO
        //   setLeft: vertical
        //     ? 0
        //     : this.getTargetLeft(
        //         touchObject.current.length * touchObject.current.direction
        //       ),
        //   setTop: vertical
        //     ? this.getTargetLeft(
        //         touchObject.current.length * touchObject.current.direction
        //       )
        //     : 0
        // });
      },
      onTouchEnd: e => {
        handleSwipe(e);
        handleMouseOut();
      },
      onTouchCancel: e => {
        handleSwipe(e);
      }
    };
  };

  const getMouseEvents = function() {
    if (dragging === false) {
      return { onMouseOver: handleMouseOver, onMouseOut: handleMouseOut };
    }

    return {
      onMouseOver: handleMouseOver,
      onMouseOut: handleMouseOut,
      onMouseDown: e => {
        touchObject.current = { startX: e.clientX, startY: e.clientY };

        if (onDragStart) {
          onDragStart();
        }

        setIsDragging(true);
      },
      onMouseMove: e => {
        if (!isDragging) {
          return;
        }

        const direction = swipeDirection(
          touchObject.current.startX,
          e.clientX,
          touchObject.current.startY,
          e.clientY,
          vertical
        );

        if (direction !== 0) {
          e.preventDefault();
        }

        const length = vertical
          ? Math.round(
              Math.sqrt(Math.pow(e.clientY - touchObject.current.startY, 2))
            )
          : Math.round(
              Math.sqrt(Math.pow(e.clientX - touchObject.current.startX, 2))
            );

        // prevents disabling click just because mouse moves a fraction of a pixel
        // if (length >= 10) this.clickDisabled = true;

        touchObject.current = {
          startX: touchObject.current.startX,
          startY: touchObject.current.startY,
          endX: e.clientX,
          endY: e.clientY,
          length,
          direction
        };

        setCurrentSlideOffset(
          getTargetLeft(
            touchObject.current.length * touchObject.current.direction
          )
        );
      },
      onMouseUp: e => {
        if (
          touchObject.current.length === 0 ||
          touchObject.current.length === undefined
        ) {
          setIsDragging(false);
          return;
        }

        handleSwipe(e);
      },
      onMouseLeave: e => {
        if (!isDragging) {
          return;
        }

        handleSwipe(e);
      }
    };
  };

  const handleClick = event => {
    // debugging:
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
  };

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

    // eslint-disable-next-line complexity
    const handleKeyPress = function(event) {
      if (enableKeyboardControls) {
        switch (event.keyCode) {
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
          // TODO:
          // case 32:
          //   if (this.state.pauseOnHover && this.props.autoplay) {
          //     this.setState({ pauseOnHover: false });
          //     this.pauseAutoplay();
          //     break;
          //   } else {
          //     this.setState({ pauseOnHover: true });
          //     this.unpauseAutoplay();
          //     break;
          //   }
        }
      }
    };

    if (ExecutionEnvironment.canUseDOM) {
      addEvent(window, 'resize', handleResize);
      addEvent(document, 'readystatechange', handleReadyStateChange);
      // addEvent(document, 'visibilitychange', handleVisibilityChange);
      addEvent(document, 'keydown', handleKeyPress);
      return () => {
        removeEvent(window, 'resize', handleResize);
        removeEvent(document, 'readystatechange', handleReadyStateChange);
        // removeEvent(document, 'visibilitychange', handleVisibilityChange);
        removeEvent(document, 'keydown', handleKeyPress);
      };
    } else {
      return () => {};
    }
  }, []);

  const TransitionControl = Transitions[transitionMode];
  const touchEvents = getTouchEvents();
  const mouseEvents = getMouseEvents();

  return (
    <div>
      <p>
        {JSON.stringify(dimensions)} currentSlide:{' '}
        {JSON.stringify(currentSlide)} isTransitioning:{' '}
        {JSON.stringify(isTransitioning)}
      </p>
      <p> {JSON.stringify(wrapping)}</p>
      <p>
        frame: {JSON.stringify(frame.width)} x {JSON.stringify(frame.height)}
      </p>
      <div
        className="slider-frame"
        ref={sliderFrame}
        style={getFrameStyles(
          frameOverflow,
          vertical,
          framePadding,
          frame.width
        )}
        {...touchEvents}
        {...mouseEvents}
        onClick={handleClick}
      >
        <Animate
          show
          start={{ tx: 0, ty: 0 }}
          update={() => {
            const { tx, ty } = getOffsetDeltas();

            if (disableEdgeSwiping && !wrapAround && isEdgeSwiping()) {
              return {};
            } else {
              const duration =
                isDragging ||
                (!isDragging && wrapping.reset && wrapAround) ||
                disableAnimation ||
                !hasInteraction
                  ? 0
                  : speed;

              return {
                tx,
                ty,
                timing: { duration, ease: d3easing.easeCircleOut },
                events: {
                  end: () => {
                    // TODO: ease: easeFunction
                    const newOffset = getTargetLeft();
                    if (newOffset !== currentSlideOffset) {
                      setCurrentSlideOffset(newOffset);
                      setWrapping({
                        ...wrapping,
                        isWrapping: false,
                        reset: true
                      });

                      setTimeout(() => {
                        setWrapping({ ...wrapping, reset: false });
                      }, 0);
                    }
                  }
                }
              };
            }
          }}
          children={({ tx, ty }) => (
            <TransitionControl
              animation={animation}
              cellSpacing={cellSpacing}
              currentSlide={currentSlide}
              deltaX={tx}
              deltaY={ty}
              dragging={isDragging}
              isWrappingAround={wrapping.isWrapping}
              left={vertical ? 0 : currentSlideOffset}
              opacityScale={opacityScale}
              slideCount={slideCount}
              slideHeight={dimensions.height}
              slideListMargin={slideListMargin}
              slideOffset={slideOffset}
              slidesToShow={slidesToShow}
              slideWidth={dimensions.width}
              top={vertical ? currentSlideOffset : 0}
              vertical={vertical}
              wrapAround={wrapAround}
              zoomScale={zoomScale}
            >
              {addAccessibility(validChildren, slidesToShow, currentSlide)}
            </TransitionControl>
          )}
        />
      </div>

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
  currentSlideOffset: PropTypes.number,
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
  currentSlideOffset: 25,
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
