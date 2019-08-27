import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
const MIN_ZOOM_SCALE = 0;
const MAX_ZOOM_SCALE = 1;

export default function ScrollTransition({
  animation,
  cellSpacing,
  children,
  currentSlide,
  deltaX,
  deltaY,
  dragging,
  isWrappingAround,
  left,
  slideCount,
  slideHeight,
  slideOffset,
  slidesToShow,
  slideWidth,
  top,
  vertical,
  wrapAround,
  zoomScale
}) {
  const getSlideDirection = function(start, end, isWrapping) {
    let direction = 0;
    if (start === end) return direction;

    if (isWrapping) {
      direction = start < end ? -1 : 1;
    } else {
      direction = start < end ? 1 : -1;
    }

    return direction;
  };

  /* eslint-disable complexity */
  const getSlideTargetPosition = function(index, positionValue) {
    let targetPosition = (slideWidth + cellSpacing) * index;
    const startSlide = Math.min(
      Math.abs(Math.floor(positionValue / slideWidth)),
      slideCount - 1
    );

    let offset = 0;

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

    if (wrapAround && index !== startSlide) {
      const direction = getSlideDirection(
        startSlide,
        currentSlide,
        isWrappingAround
      );
      let slidesBefore = Math.floor((slideCount - 1) / 2);
      let slidesAfter = slideCount - slidesBefore - 1;

      if (direction < 0) {
        const temp = slidesBefore;
        slidesBefore = slidesAfter;
        slidesAfter = temp;
      }

      const distanceFromStart = Math.abs(startSlide - index);
      if (index < startSlide) {
        if (distanceFromStart > slidesBefore) {
          targetPosition = (slideWidth + cellSpacing) * (slideCount + index);
        }
      } else if (distanceFromStart > slidesAfter) {
        targetPosition = (slideWidth + cellSpacing) * (slideCount - index) * -1;
      }
    }

    return targetPosition + offset;
  };
  /* eslint-enable complexity */

  const getSlideStyles = function(index, positionValue) {
    const targetPosition = getSlideTargetPosition(index, positionValue);
    const transformScale =
      animation === 'zoom' && currentSlide !== index
        ? Math.max(Math.min(zoomScale, MAX_ZOOM_SCALE), MIN_ZOOM_SCALE)
        : 1.0;
    return {
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
      transition: 'transform .4s linear',
      verticalAlign: 'top',
      width: vertical ? '100%' : slideWidth
    };
  };

  const listStyles = useMemo(
    () => {
      const listWidth = slideWidth * React.Children.count(children);
      const spacingOffset = cellSpacing * React.Children.count(children);
      const transform = `translate3d(${deltaX}px, ${deltaY}px, 0)`;
      return {
        transform,
        WebkitTransform: transform,
        msTransform: `translate(${deltaX}px, ${deltaY}px)`,
        position: 'relative',
        display: 'block',
        margin: vertical
          ? `${(cellSpacing / 2) * -1}px 0px`
          : `0px ${(cellSpacing / 2) * -1}px`,
        padding: 0,
        height: vertical ? listWidth + spacingOffset : slideHeight,
        width: vertical ? 'auto' : listWidth + spacingOffset,
        cursor: dragging === true ? 'pointer' : 'inherit',
        boxSizing: 'border-box',
        MozBoxSizing: 'border-box',
        touchAction: `pinch-zoom ${vertical ? 'pan-x' : 'pan-y'}`
      };
    },
    [children, cellSpacing, deltaX, deltaY, dragging, vertical]
  );

  const formatChildren = useMemo(
    () => {
      const positionValue = vertical ? top : left;
      return React.Children.map(children, (child, index) => {
        const visible =
          index >= currentSlide && index < currentSlide + slidesToShow;
        return (
          <li
            className={`slider-slide${visible ? ' slide-visible' : ''}`}
            style={getSlideStyles(index, positionValue)}
            key={index}
          >
            {child}
          </li>
        );
      });
    },
    [children, currentSlide, vertical]
  );

  return (
    <ul className="slider-list" style={listStyles}>
      {formatChildren}
    </ul>
  );
}

ScrollTransition.propTypes = {
  animation: PropTypes.oneOf(['zoom']),
  cellSpacing: PropTypes.number,
  currentSlide: PropTypes.number,
  deltaX: PropTypes.number,
  deltaY: PropTypes.number,
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
  zoomScale: PropTypes.number
};

ScrollTransition.defaultProps = {
  cellSpacing: 0,
  currentSlide: 0,
  deltaX: 0,
  deltaY: 0,
  dragging: false,
  isWrappingAround: false,
  left: 0,
  slideCount: 0,
  slideHeight: 0,
  slideWidth: 0,
  top: 0,
  vertical: false,
  wrapAround: false,
  zoomScale: 0.85
};
