import React, { useMemo } from 'react';
import PropTypes from 'prop-types';

const MIN_ZOOM_SCALE = 0;
const MAX_ZOOM_SCALE = 1;

export default function ScrollTransition3D({
  animation,
  cellSpacing,
  children,
  currentSlide,
  dragging,
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
}) {
  const getDistance = function(index, referenceIndex) {
    return Math.abs(index - referenceIndex);
  };

  const getDistanceToCurrentSlide = function(index) {
    return wrapAround
      ? Math.min(
          Math.min(
            getDistance(index, 0) + getDistance(currentSlide, slideCount),
            getDistance(index, slideCount) + getDistance(currentSlide, 0)
          ),
          getDistance(index, currentSlide)
        )
      : getDistance(index, currentSlide);
  };

  const getRelativeDistanceToCurrentSlide = function(index) {
    if (wrapAround) {
      const distanceByLeftEge =
        getDistance(index, 0) + getDistance(currentSlide, slideCount);
      const distanceByRightEdge =
        getDistance(index, slideCount) + getDistance(currentSlide, 0);
      const absoluteDirectDistance = getDistance(index, currentSlide);

      const minimumDistance = Math.min(
        Math.min(distanceByLeftEge, distanceByRightEdge),
        absoluteDirectDistance
      );

      switch (minimumDistance) {
        case absoluteDirectDistance:
          return index - currentSlide;
        case distanceByLeftEge:
          return distanceByLeftEge;
        case distanceByRightEdge:
          return -distanceByRightEdge;
        default:
          return 0;
      }
    } else {
      return index - currentSlide;
    }
  };

  const getZoomOffsetFor = function(relativeDistanceToCurrent) {
    if (relativeDistanceToCurrent === 0) {
      return 0;
    }
    const marginGeneratedByZoom =
      (1 - zoomScale ** Math.abs(relativeDistanceToCurrent)) * slideWidth;
    const direction = relativeDistanceToCurrent < 0 ? -1 : 1;
    const result =
      marginGeneratedByZoom * direction +
      getZoomOffsetFor(
        relativeDistanceToCurrent < 0
          ? relativeDistanceToCurrent + 1
          : relativeDistanceToCurrent - 1
      );
    return result;
  };

  /* eslint-disable complexity */
  const getSlideTargetPosition = function(index) {
    let targetPosition = 0;
    let offset = 0;
    if (index !== currentSlide) {
      const relativeDistanceToCurrentSlide = getRelativeDistanceToCurrentSlide(
        index
      );
      targetPosition =
        (slideWidth + cellSpacing) * relativeDistanceToCurrentSlide -
        getZoomOffsetFor(relativeDistanceToCurrentSlide);

      offset = 0;

      if (
        animation === 'zoom' &&
        (currentSlide === index + 1 ||
          (currentSlide === 0 && index === children.length - 1))
      ) {
        offset = slideOffset;
      } else if (
        animation === 'zoom' &&
        (currentSlide === index - 1 ||
          (currentSlide === children.length - 1 && index === 0))
      ) {
        offset = -slideOffset;
      }
    }
    return targetPosition + offset;
  };
  /* eslint-enable complexity */

  const getTransformScale = function(index) {
    return currentSlide !== index
      ? Math.max(
          Math.min(
            zoomScale ** getDistanceToCurrentSlide(index),
            MAX_ZOOM_SCALE
          ),
          MIN_ZOOM_SCALE
        )
      : 1.0;
  };

  const getOpacityScale = function(index) {
    return currentSlide !== index
      ? Math.max(
          Math.min(
            opacityScale ** getDistanceToCurrentSlide(index),
            MAX_ZOOM_SCALE
          ),
          MIN_ZOOM_SCALE
        )
      : 1.0;
  };

  const getSlideStyles = function(index, positionValue) {
    const targetPosition = getSlideTargetPosition(index, positionValue);
    const transformScale = getTransformScale(index);
    return {
      zIndex: slideCount - getDistanceToCurrentSlide(index),
      boxSizing: 'border-box',
      display: vertical ? 'block' : 'inline-block',
      height: 'auto',
      left: vertical ? 0 : targetPosition,
      listStyleType: 'none',
      marginBottom: vertical ? cellSpacing / 2 : 'auto',
      marginLeft: vertical ? 'auto' : cellSpacing / 2,
      marginRight: vertical ? 'auto' : cellSpacing / 2,
      marginTop: vertical ? cellSpacing / 2 : 'auto',
      MozBoxSizing: 'border-box',
      position: 'absolute',
      top: vertical ? targetPosition : 0,
      transform: `scale(${transformScale})`,
      transition:
        'left 0.4s ease-out, transform 0.4s ease-out, opacity 0.4s ease-out',
      verticalAlign: 'top',
      width: vertical ? '100%' : slideWidth,
      opacity: getOpacityScale(index)
    };
  };

  const listStyles = useMemo(() => {
    const listWidth = slideWidth * React.Children.count(children);
    const spacingOffset = cellSpacing * React.Children.count(children);
    return {
      left: `calc(50% - (${slideWidth}px / 2))`,
      position: 'relative',
      margin: vertical
        ? `${(cellSpacing / 2) * -1}px 0px`
        : `${slideListMargin}px ${(cellSpacing / 2) * -1}px`,
      padding: 0,
      height: vertical ? listWidth + spacingOffset : slideHeight,
      width: vertical ? 'auto' : '100%',
      cursor: dragging === true ? 'pointer' : 'inherit',
      boxSizing: 'border-box',
      MozBoxSizing: 'border-box',
      touchAction: `pinch-zoom ${vertical ? 'pan-x' : 'pan-y'}`
    };
  }, []);

  const formatChildren = useMemo(
    () => {
      const positionValue = vertical ? top : left;
      return React.Children.map(children, (child, index) => {
        const visible = getDistanceToCurrentSlide(index) <= slidesToShow / 2;
        const current = currentSlide === index;
        return (
          <li
            className={`slider-slide${visible ? ' slide-visible' : ''}${
              current ? ' slide-current' : ''
            }`}
            style={getSlideStyles(index, positionValue)}
            key={index}
          >
            {child}
          </li>
        );
      });
    },
    [children, top, left, currentSlide, slidesToShow]
  );

  return (
    <ul className="slider-list" style={listStyles}>
      {formatChildren}
    </ul>
  );
}

ScrollTransition3D.propTypes = {
  cellSpacing: PropTypes.number,
  currentSlide: PropTypes.number,
  dragging: PropTypes.bool,
  isWrappingAround: PropTypes.bool,
  left: PropTypes.number,
  slideCount: PropTypes.number,
  slideHeight: PropTypes.number,
  slideOffset: PropTypes.number,
  slideWidth: PropTypes.number,
  top: PropTypes.number,
  vertical: PropTypes.bool,
  wrapAround: PropTypes.bool,
  zoomScale: PropTypes.number,
  opacityScale: PropTypes.number,
  slidesToShow: PropTypes.number,
  slideListMargin: PropTypes.number
};

ScrollTransition3D.defaultProps = {
  cellSpacing: 0,
  currentSlide: 0,
  dragging: false,
  isWrappingAround: false,
  left: 0,
  slideCount: 0,
  slideHeight: 0,
  slideWidth: 0,
  top: 0,
  vertical: false,
  wrapAround: true,
  zoomScale: 0.75,
  opacityScale: 0.65,
  slidesToShow: 3,
  slideListMargin: 10
};
