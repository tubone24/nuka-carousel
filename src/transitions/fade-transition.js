import React, { useMemo } from 'react';
import PropTypes from 'prop-types';

export default function FadeTransition({
  cellSpacing,
  children,
  currentSlide,
  deltaX,
  deltaY,
  dragging,
  slideCount,
  slideHeight,
  slideWidth,
  slidesToShow,
  vertical
}) {
  const containerStyles = useMemo(
    () => {
      const width = slideWidth * slidesToShow;

      return {
        boxSizing: 'border-box',
        cursor: dragging === true ? 'pointer' : 'inherit',
        display: 'block',
        height: slideHeight,
        margin: vertical
          ? `${(cellSpacing / 2) * -1}px 0px`
          : `0px ${(cellSpacing / 2) * -1}px`,
        MozBoxSizing: 'border-box',
        padding: 0,
        touchAction: 'none',
        width
      };
    },
    [cellSpacing, dragging, slideHeight, slideWidth, slidesToShow, vertical]
  );

  const getSlideStyles = function(index, data) {
    return {
      boxSizing: 'border-box',
      display: 'block',
      height: 'auto',
      left: data[index] ? data[index].left : 0,
      listStyleType: 'none',
      marginBottom: 'auto',
      marginLeft: cellSpacing / 2,
      marginRight: cellSpacing / 2,
      marginTop: 'auto',
      MozBoxSizing: 'border-box',
      opacity: data[index] ? data[index].opacity : 0,
      position: 'absolute',
      top: 0,
      verticalAlign: 'top',
      visibility: data[index] ? 'inherit' : 'hidden',
      width: slideWidth
    };
  };

  const formatChildren = function(opacity) {
    return React.Children.map(children, (child, index) => {
      const visible =
        index >= currentSlide && index < currentSlide + slidesToShow;
      return (
        <li
          className={`slider-slide${visible ? ' slide-visible' : ''}`}
          style={getSlideStyles(index, opacity)}
          key={index}
        >
          {child}
        </li>
      );
    });
  };

  const getSlideOpacityAndLeftMap = function(fadeFrom, fadeTo, fade) {
    // Figure out which position to fade to
    let fadeToPosition = fadeTo;
    if (fadeFrom > fade && fadeFrom === 0) {
      fadeToPosition = fadeFrom - slidesToShow;
    } else if (fadeFrom < fade && fadeFrom + slidesToShow > slideCount - 1) {
      fadeToPosition = fadeFrom + slidesToShow;
    }

    // Calculate opacity for active slides
    const opacity = {};
    if (fadeFrom === fadeTo) {
      opacity[fadeFrom] = 1;
    } else {
      const distance = fadeFrom - fadeToPosition;
      opacity[fadeFrom] = (fade - fadeToPosition) / distance;
      opacity[fadeTo] = (fadeFrom - fade) / distance;
    }

    // Calculate left for slides and merge in opacity
    const map = {};
    for (let i = 0; i < slidesToShow; i++) {
      map[fadeFrom + i] = {
        opacity: opacity[fadeFrom],
        left: slideWidth * i
      };

      map[fadeTo + i] = {
        opacity: opacity[fadeTo],
        left: slideWidth * i
      };
    }

    return map;
  };

  const fade = -(deltaX || deltaY) / slideWidth;

  let fadeFromSlide = currentSlide;

  if (parseInt(fade) === fade) {
    fadeFromSlide = fade;
  }

  const opacityAndLeftMap = getSlideOpacityAndLeftMap(
    fadeFromSlide,
    currentSlide,
    fade
  );

  const renderChildren = formatChildren(opacityAndLeftMap);

  return (
    <ul className="slider-list" style={containerStyles}>
      {renderChildren}
    </ul>
  );
}

FadeTransition.propTypes = {
  cellSpacing: PropTypes.number,
  currentSlide: PropTypes.number,
  deltaX: PropTypes.number,
  deltaY: PropTypes.number,
  dragging: PropTypes.bool,
  isWrappingAround: PropTypes.bool,
  left: PropTypes.number,
  slideCount: PropTypes.number,
  slideHeight: PropTypes.number,
  slidesToShow: PropTypes.number,
  slideWidth: PropTypes.number,
  top: PropTypes.number,
  vertical: PropTypes.bool,
  wrapAround: PropTypes.bool
};

FadeTransition.defaultProps = {
  cellSpacing: 0,
  currentSlide: 0,
  deltaX: 0,
  deltaY: 0,
  dragging: false,
  isWrappingAround: false,
  left: 0,
  slideCount: 0,
  slideHeight: 0,
  slidesToShow: 1,
  slideWidth: 0,
  top: 0,
  vertical: false,
  wrapAround: false
};
