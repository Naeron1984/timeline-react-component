import React, { Component } from 'react';
import classNames from 'classnames'
import { css } from 'emotion'
import './App.css';
import {DraggableCore} from 'react-draggable';
import {List} from 'immutable';
import { DateTime } from 'luxon';
import { Duration } from 'luxon';
import { Interval } from 'luxon';

class TimelineComponent extends Component {
  constructor(props) {
    super(props);
    this.handleDrag = this.handleDrag.bind(this);
    
    //States
    this.state = {
      translateX: null      
    },    
    this.timeDelimeters = List();;
    this.baseDate = DateTime.local();
    this.daysToPixel = 200; //the zoom level
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
      background: '#00000021',
      width: px(500),
      height: px(100),
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
          <div className={scrollWrapperCSSCN} ref="scrollWrapper">            
            <DraggableCore axis="x" onDrag={this.handleDrag}>
              <div className={draggableDivCSSCN} style={this.getDraggableStyle()} ref="draggableDiv">
                <canvas ref="canvas" width={200} height={300} style={{display: 'block', position: 'absolute'}}/>
              </div>
            </DraggableCore>
          </div>
        </div>
    );
  }

  componentDidMount() {
    this.refs.canvas.width = this.refs.scrollWrapper.clientWidth * 3;
    this.refs.draggableDiv.style.width = this.refs.scrollWrapper.clientWidth * 3 + "px";
    this.setState({translateX: -this.refs.scrollWrapper.clientWidth});
    this.calculateIntervals();
    this.updateCanvas();
  }

  updateCanvas() {
    const ctx = this.refs.canvas.getContext('2d');
    ctx.clearRect(0, 0, this.refs.canvas.width, this.refs.canvas.height);
    ctx.fillStyle='red';
    for (var deli of this.timeDelimeters){
      ctx.beginPath();
      ctx.moveTo(deli.deliX,0);
      ctx.lineTo(deli.deliX,350);
      ctx.stroke();
      ctx.closePath();
      ctx.font = "20px Arial";
      ctx.fillText(deli.dateTime.toLocaleString(DateTime.DATE_SHORT),deli.deliX,21);
    }
  }

  calculateIntervals() {
    this.timeDelimeters = List();
    
    let oneScreenWidthInDuration = this.pxToDuration(this.refs.scrollWrapper.clientWidth);
    let canvasLeftDate = this.baseDate.minus(oneScreenWidthInDuration);
    let leftToFirstDayStart = Interval.fromDateTimes(canvasLeftDate,canvasLeftDate.plus({ days: 1 }).startOf('day'));
    let firstLineX = this.durationToPx(leftToFirstDayStart.toDuration());

    let sum = firstLineX;
    let dateAct = canvasLeftDate.plus({ days: 1 }).startOf('day');


    while(true){
      if(sum > this.refs.canvas.width){
        break;
      }

      
      this.timeDelimeters = this.timeDelimeters.push({deliX: sum, dateTime: dateAct});
      sum+=this.daysToPixel;
      dateAct = dateAct.plus({ days: 1 });
    }
  }

  handleDrag(e,data) {
    this.setState((prevState,props) => {
      var newTranslateXCandidate = prevState.translateX + data.deltaX;
      var duration = this.pxToDuration(data.deltaX);
      this.baseDate = this.baseDate.minus(duration);

      if(newTranslateXCandidate< 2*(-this.refs.scrollWrapper.clientWidth) || newTranslateXCandidate > 0){
        newTranslateXCandidate = -this.refs.scrollWrapper.clientWidth;
    
        this.calculateIntervals();
        this.updateCanvas();
      }
      return {translateX: newTranslateXCandidate};
    });
  }

  getDraggableStyle(){
    return { transform: translate(this.state.translateX,0) };
  }

  durationToPx(duration){
    return millisecondsToDays(duration.milliseconds) * this.daysToPixel;
  }

  pxToDuration(px){
    return Duration.fromObject({milliseconds: daysToMilliseconds(px / this.daysToPixel)});
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

function daysToMilliseconds(days){
  return days * 86400000;
}

function millisecondsToDays(ms){
  return ms / 86400000;
}

export default App;

/*
REFACTORING:
  css is not very good
  tooling is subpar - CRA has a good desc. on how to set up VSCode 
TASK NEXT:
  canvas dynamic calculation and drawing
  draggable div vs manual event positioning solution
  zoom
*/