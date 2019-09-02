import Carousel from '../src/index';
import React from 'react';
import ReactDom from 'react-dom';

export default function App() {
  return (
    <Carousel wrapAround speed={500} slidesToScroll="auto">
      <img src="https://www.fillmurray.com/600/400" />
      <img src="http://placekitten.com/600/400" />
      <img src="https://www.fillmurray.com/700/400" />
    </Carousel>
  );
}

// const colors = ['bf2a2e', 'c5311e', 'ad6c25', '318467', '235bba', '371e87'];

// class App extends React.Component {
//   constructor() {
//     super(...arguments);
//     this.state = {
//       slideIndex: 0,
//       length: 6,
//       wrapAround: false,
//       animation: undefined,
//       underlineHeader: false,
//       zoomScale: 0.5,
//       slidesToShow: 1,
//       cellAlign: 'left',
//       transitionMode: 'scroll',
//       heightMode: 'max',
//       withoutControls: false
//     };

//     this.handleClick = this.handleClick.bind(this);
//     this.handleZoomScaleChange = this.handleZoomScaleChange.bind(this);
//   }

//   handleClick() {
//     this.setState({ underlineHeader: !this.state.underlineHeader });
//   }

//   handleZoomScaleChange(event) {
//     this.setState({
//       zoomScale: event.target.value
//     });
//   }

//   render() {
//     return (
//       <main style={{ backgroundColor: '#eee' }}>
//         <div style={{ margin: 'auto' }}>
//           <Carousel
//             slidesToShow={this.state.slidesToShow}
//             slidesToScroll={this.state.slidesToScroll}
//             withoutControls={this.state.withoutControls}
//             transitionMode={this.state.transitionMode}
//             cellAlign={this.state.cellAlign}
//             animation={this.state.animation}
//             zoomScale={Number(this.state.zoomScale || 0)}
//             wrapAround={this.state.wrapAround}
//             slideIndex={this.state.slideIndex}
//             heightMode={this.state.heightMode}
//             renderTopCenterControls={({ currentSlide }) => (
//               <div
//                 style={{
//                   color: '#fff',
//                   textDecoration: this.state.underlineHeader
//                     ? 'underline'
//                     : 'none'
//                 }}
//               >
//                 Nuka Carousel: Slide {currentSlide + 1}
//               </div>
//             )}
//             renderAnnounceSlideMessage={({ currentSlide, slideCount }) => {
//               return `Showing slide ${currentSlide + 1} of ${slideCount}`;
//             }}
//           >
//             {colors.slice(0, this.state.length).map((color, index) => (
//               <div
//                 key={color}
//                 onClick={this.handleClick}
//                 style={{
//                   backgroundColor: `#${color}`,
//                   color: '#fff',
//                   fontWeight: 'bold',
//                   fontSize: '3rem',
//                   display: 'flex',
//                   alignItems: 'center',
//                   justifyContent: 'center',
//                   height:
//                     this.state.heightMode === 'current'
//                       ? 100 * (index + 1)
//                       : 400
//                 }}
//               >
//                 Slide {index + 1}
//               </div>
//             ))}
//           </Carousel>
//         </div>
//         <div style={{ display: 'flex', justifyContent: 'space-between' }}>
//           <div>
//             <button onClick={() => this.setState({ slideIndex: 0 })}>1</button>
//             <button onClick={() => this.setState({ slideIndex: 1 })}>2</button>
//             <button onClick={() => this.setState({ slideIndex: 2 })}>3</button>
//             <button onClick={() => this.setState({ slideIndex: 3 })}>4</button>
//             <button onClick={() => this.setState({ slideIndex: 4 })}>5</button>
//             <button onClick={() => this.setState({ slideIndex: 5 })}>6</button>
//           </div>
//           <div>
//             <button
//               onClick={() =>
//                 this.setState(prevState => {
//                   const length = prevState.length === 6 ? 3 : 6;
//                   return {
//                     length
//                   };
//                 })
//               }
//             >
//               Toggle Show 3 Slides Only
//             </button>
//             <button
//               onClick={() =>
//                 this.setState({
//                   transitionMode:
//                     this.state.transitionMode === 'fade' ? 'scroll' : 'fade',
//                   animation: undefined
//                 })
//               }
//             >
//               Toggle Fade {this.state.transitionMode === 'fade' ? 'Off' : 'On'}
//             </button>
//             <button
//               onClick={() =>
//                 this.setState(prevState => ({
//                   wrapAround: !prevState.wrapAround
//                 }))
//               }
//             >
//               Toggle Wrap Around
//             </button>
//           </div>
//         </div>
//         {this.state.transitionMode !== 'fade' && (
//           <>
//             <div style={{ display: 'flex', justifyContent: 'space-between' }}>
//               {this.state.slidesToShow > 1.0 && (
//                 <div>
//                   <button onClick={() => this.setState({ cellAlign: 'left' })}>
//                     Left
//                   </button>
//                   <button
//                     onClick={() => this.setState({ cellAlign: 'center' })}
//                   >
//                     Center
//                   </button>
//                   <button onClick={() => this.setState({ cellAlign: 'right' })}>
//                     Right
//                   </button>
//                 </div>
//               )}
//               <div style={{ marginLeft: 'auto' }}>
//                 <button
//                   onClick={() =>
//                     this.setState({
//                       slidesToShow: this.state.slidesToShow > 1.0 ? 1.0 : 1.25
//                     })
//                   }
//                 >
//                   Toggle Partially Visible Slides
//                 </button>
//                 <button
//                   onClick={() =>
//                     this.setState({
//                       heightMode:
//                         this.state.heightMode === 'current' ? 'max' : 'current'
//                     })
//                   }
//                 >
//                   Toggle Height Mode Current
//                 </button>
//                 <button
//                   onClick={() =>
//                     this.setState({
//                       withoutControls: !this.state.withoutControls
//                     })
//                   }
//                 >
//                   Toggle Controls
//                 </button>
//               </div>
//             </div>
//             <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
//               {this.state.animation === 'zoom' && (
//                 <input
//                   type="number"
//                   value={this.state.zoomScale}
//                   onChange={this.handleZoomScaleChange}
//                 />
//               )}
//               <button
//                 onClick={() =>
//                   this.setState({
//                     animation:
//                       this.state.animation === 'zoom' ? undefined : 'zoom',
//                     cellAlign: 'center'
//                   })
//                 }
//               >
//                 Toggle Zoom Animation{' '}
//                 {this.state.animation === 'zoom' ? 'Off' : 'On'}
//               </button>
//             </div>
//           </>
//         )}
//       </main>
//     );
//   }
// }

ReactDom.render(<App />, document.getElementById('content'));
