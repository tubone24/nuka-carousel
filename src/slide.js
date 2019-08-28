import React from 'react';
import Animate from 'react-move/Animate';
import Transitions from './all-transitions';
import { addAccessibility } from './utilities/bootstrapping-utilities';

export default function Slide({
  children,
  currentSlide,
  disableEdgeSwiping,
  duration,
  easing,
  getOffsetDeltas,
  isEdgeSwiping,
  slidesToShow,
  transitionMode,
  transitionProps,
  wrapAround,
  // Function
  endEvent
}) {
  const TransitionControl = Transitions[transitionMode];

  return (
    <Animate
      show
      start={{ tx: 0, ty: 0 }}
      update={() => {
        const { tx, ty } = getOffsetDeltas();

        if (disableEdgeSwiping && !wrapAround && isEdgeSwiping()) {
          return {};
        } else {
          return {
            tx,
            ty,
            timing: {
              duration,
              ease: easing
            },
            events: {
              end: endEvent
            }
          };
        }
      }}
      children={({ tx, ty }) => {
        return (
          <TransitionControl {...transitionProps} deltaX={tx} deltaY={ty}>
            {addAccessibility(children, slidesToShow, currentSlide)}
          </TransitionControl>
        );
      }}
    />
  );
}
