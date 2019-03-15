import React from 'react';

const defaultButtonStyles = disabled => ({
  border: 0,
  background: 'rgba(0,0,0,0.4)',
  color: 'white',
  padding: 10,
  opacity: disabled ? 0.3 : 1,
  cursor: disabled ? 'not-allowed' : 'pointer'
});

export class PreviousButton extends React.Component {
  constructor() {
    super(...arguments);
    this.handleClick = this.handleClick.bind(this);
  }
  handleClick(event) {
    event.preventDefault();
    this.props.previousSlide();
  }
  render() {
    const disabled =
      (this.props.currentSlide === 0 && !this.props.wrapAround) ||
      this.props.slideCount === 0;
    return (
      <button
        style={defaultButtonStyles(disabled)}
        disabled={disabled}
        onClick={this.handleClick}
        aria-label="previous"
      >
        PREV
      </button>
    );
  }
}

export class NextButton extends React.Component {
  constructor() {
    super(...arguments);
    this.handleClick = this.handleClick.bind(this);
    this.nextButtonDisable = this.nextButtonDisabled.bind(this);
  }
  handleClick(event) {
    event.preventDefault();
    this.props.nextSlide();
  }

  nextButtonDisabled(params) {
    const { wrapAround, slidesToShow, currentSlide, slideCount } = params;
    let buttonDisabled = false;
    if (!wrapAround) {
      if (slidesToShow > 1) {
        const remainingSlides = slideCount - currentSlide - 1;
        buttonDisabled = remainingSlides === 0;
      } else {
        const lastSlideIndex = slideCount - 1;
        buttonDisabled = currentSlide + 1 > lastSlideIndex;
      }
    }
    return buttonDisabled;
  }
  render() {
    const {
      wrapAround,
      slidesToShow,
      currentSlide,
      cellAlign,
      slideCount
    } = this.props;

    const disabled = this.nextButtonDisabled({
      wrapAround,
      slidesToShow,
      currentSlide,
      cellAlign,
      slideCount
    });

    return (
      <button
        style={defaultButtonStyles(disabled)}
        disabled={disabled}
        onClick={this.handleClick}
        aria-label="next"
      >
        NEXT
      </button>
    );
  }
}

export class PagingDots extends React.Component {
  getDotIndexes(slideCount, slidesToScroll, slidesToShow, cellAlign) {
    // 
    const dotIndexes = [];
    const trueSlidesToShow = slidesToShow > 1.9 ? slidesToShow : 1;
    console.log('true slides to show: ', trueSlidesToShow);
    let lastDotIndex = slideCount - 1;
    // const lastDotIndex = slideCount - 1; // this fixes anything < 2
    console.log('slideCount: ', slideCount);
    console.log('lastDotIndex: ', lastDotIndex);
    // switch (cellAlign) {
    //   case 'center':
    //     break;
    //   case 'right':
    //     lastDotIndex += slidesToShow - 1;
    //     break;
    // }

    if (lastDotIndex < 0) {
      return [0];
    }
    console.log('slides to scroll by: ', slidesToScroll);

    for (let i = 0; i < lastDotIndex; i += slidesToScroll) { 
      // changing this to 1 fixes everything < 2
      dotIndexes.push(i);
    }
    console.log('most of the indexes: ', dotIndexes);
    // console.log('quick maths: ', dotIndexes.length - 1);
    // console.log('this is the current last: ', dotIndexes[dotIndexes.length - 1]);
    // console.log('last dot! ', lastDotIndex);
    // if (lastDotIndex > dotIndexes[dotIndexes.length - 1]) {
    dotIndexes.push(lastDotIndex);
    // }
    console.log('all dem indexes: ', dotIndexes);
    return dotIndexes;
  }

  getListStyles() {
    return {
      position: 'relative',
      margin: 0,
      top: -10,
      padding: 0
    };
  }

  getListItemStyles() {
    return {
      listStyleType: 'none',
      display: 'inline-block'
    };
  }

  getButtonStyles(active) {
    return {
      border: 0,
      background: 'transparent',
      color: 'black',
      cursor: 'pointer',
      padding: 10,
      fontSize: 24,
      opacity: active ? 1 : 0.5
    };
  }

  render() {
    const indexes = this.getDotIndexes(
      this.props.slideCount,
      this.props.slidesToScroll,
      this.props.slidesToShow,
      this.props.cellAlign
    );
    return (
      <ul style={this.getListStyles()}>
        {indexes.map(index => {
          return (
            <li style={this.getListItemStyles()} key={index}>
              <button
                style={this.getButtonStyles(this.props.currentSlide === index)}
                onClick={this.props.goToSlide.bind(null, index)}
                aria-label={`slide ${index + 1} bullet`}
              >
                &bull;
              </button>
            </li>
          );
        })}
      </ul>
    );
  }
}
