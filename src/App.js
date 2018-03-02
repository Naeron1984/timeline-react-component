import React, { Component } from 'react';
import classNames from 'classnames'
import { css } from 'emotion'
import './App.css';

import Draggable from 'react-draggable'; // The default

class TimelineComponent extends Component {
  constructor(props) {
    super(props);
    this.handleDrag = this.handleDrag.bind(this);
  }

  render() {
    const headerHeight = 20;

    const outerDivCSSCN = css({
      background: 'gray',
      height: px(this.props.height),
      position: 'relative',
    });

    const headerDivCSSCN = css({
      background: 'gold',
      height: px(headerHeight)
    });    

    const draggableDivCSSCN = css({
      background: '#55550055',
      width: px(500),
      height: px(500),
    });

    const scrollWrapperCSSCN = css({
      position: 'relative',
      overflowY: 'scroll',
      overflowX: 'hidden',
      height: px(this.props.height-headerHeight)
    });

    return (
        <div className={outerDivCSSCN}>
          <div className={headerDivCSSCN}>
            Monday, Tuesday, etc.
          </div>
          <div className={scrollWrapperCSSCN}>
            <canvas ref="canvas" width={200} height={300} style={{display: 'block', position: 'absolute'}}/>
            <Draggable axis="x" onDrag={this.handleDrag}>
              <div className={draggableDivCSSCN}>
              </div>
            </Draggable>
          </div>
        </div>
    );
  }

  componentDidMount() {
    this.updateCanvas();
  }

  updateCanvas() {
    var d = new Date();
    var n = d.getTime();
    const ctx = this.refs.canvas.getContext('2d');
    ctx.clearRect(0, 0, this.refs.canvas.width, this.refs.canvas.height);
    ctx.fillStyle='red';
    ctx.fillRect(100,0, 100, 100);
    ctx.fillRect(0,100, 100, n/100 % 100);
    ctx.fillRect(100,200, 100, 100);
  }

  handleDrag() {
    this.updateCanvas();
    console.log("drag");
  }
}

class App extends Component {
  render() {
    
    const height = 300;
    const borderWidth = 0;

    const frameStyleCSSCN = css({
      marginTop: '100px',
      marginBottom: '100px',
      marginLeft: '100px',
      marginRight: '100px',
    });

    const frameDivCSSCN = css({
      height: px(height-(borderWidth*2)),
      border: px(borderWidth)+" solid #00000033",
      position: 'relative',
      top: px(-height),
      pointerEvents:'none',
    });

    return (
        <div className={frameStyleCSSCN}>
          <TimelineComponent height={height}/>
          <div className={frameDivCSSCN}/>
        </div>
    );
  }
}

function px(valueInt){
  return valueInt+'px';
}

function translate(x,y){
  return `translate(${x}px, ${y}px)`;
}

export default App;

/*
REFACTORING:
  css is not very good
TASK NEXT:
  canvas dynamic calculation and drawing
  draggable div vs manual event positioning solution
  zoom
*/