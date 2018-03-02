import React, { Component } from 'react';
import classNames from 'classnames'
import { css } from 'emotion'
import './App.css';

import Draggable from 'react-draggable'; // The default

class TimelineComponent extends Component { 
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
      //position: 'absolute',
    });

    const scrollWrapperCSSCN = css({
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
            <Draggable axis="x">
              <div className={draggableDivCSSCN}>
                <canvas ref="canvas" width={200} height={300} />
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
      const ctx = this.refs.canvas.getContext('2d');
      ctx.fillStyle='orange';
      ctx.fillRect(100,0, 100, 100);
      ctx.fillRect(0,100, 100, 100);
      ctx.fillRect(100,200, 100, 100);
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

export default App;
