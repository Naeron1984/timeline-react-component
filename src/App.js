import './App.css';

import {Enum} from 'enumify';

import React, { Component } from 'react';
import classNames from 'classnames'

import { css } from 'emotion'

import { fromEvent } from 'rxjs/observable/fromEvent';

import { DraggableCore } from 'react-draggable';
import { List } from 'immutable';

import { DateTime } from 'luxon';
import { Duration } from 'luxon';
import { Interval } from 'luxon';

import EventSocket from './eventSocket.js';
import TlEventCache from './TlEventCache.js';

class EventPreloadState extends Enum {}
EventPreloadState.initEnum(['NOTLOADED', 'LOADING', 'LOADED', 'ERROR']);

class TimelineComponent extends Component {
  constructor(props) {
    super(props);
    this.handleDrag = this.handleDrag.bind(this);
    this.handleResize = this.handleResize.bind(this);
    this.onTimelineEventReceived = this.onTimelineEventReceived.bind(this);

    //States
    this.state = {
      translateX: null,
      visibleEvents: []
    },    
    this.timeDelimeters = List();;
    this.baseDate = DateTime.local();
    this.daysToPixel = 200; //the zoom level

    this.pastPreloadState = EventPreloadState.NOTLOADED;
    this.futurePreloadState = EventPreloadState.NOTLOADED;

    this.eventSocket = new EventSocket();
    this.TlEventCache = new TlEventCache();
    this.onTimelineEventReceivedSubscription = this.eventSocket.eventSubject.subscribe(this.onTimelineEventReceived);
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
    this.update();

    this.resizeSubscription = fromEvent(window, 'resize')      
      .subscribe(this.handleResize);

    //for now keep it here, and if performance is not good enough then call it before
    let oneScreenWidthInDuration = this.pxToDuration(this.refs.scrollWrapper.clientWidth);
    let canvasLeftDate = this.baseDate.minus(this.pxToDuration(this.refs.scrollWrapper.clientWidth));
    let canvaseRightDate = canvasLeftDate.plus(oneScreenWidthInDuration).plus(oneScreenWidthInDuration).plus(oneScreenWidthInDuration);    
    this.eventSocket.askForIntervalPastDuplex(canvasLeftDate, canvaseRightDate);
    this.eventSocket.askForIntervalFutureDuplex(canvasLeftDate, canvaseRightDate);
  }

  componentWillUnmount() {
    this.resizeSubscription.unsubscribe();
    this.onTimelineEventReceivedSubscription.unsubscribe();
  }

  handleResize(e) {
    this.update();
  }

  handleDrag(e,data) {
    this.setState((prevState,props) => {
      var newTranslateXCandidate = prevState.translateX + data.deltaX;
      var duration = this.pxToDuration(data.deltaX);
      this.baseDate = this.baseDate.minus(duration);

      if(newTranslateXCandidate< 2*(-this.refs.scrollWrapper.clientWidth) || newTranslateXCandidate > 0){
        console.log("Switching board (future direction).");

        this.calculateIntervals();
        this.redrawCanvas();


        return {translateX: -this.refs.scrollWrapper.clientWidth};
      }else{
        let oneScreenWidthInDuration = this.pxToDuration(this.refs.scrollWrapper.clientWidth);
        let canvasLeftDate = this.baseDate.minus(this.pxToDuration(this.refs.scrollWrapper.clientWidth + newTranslateXCandidate));
        let canvaseRightDate = canvasLeftDate.plus(oneScreenWidthInDuration).plus(oneScreenWidthInDuration).plus(oneScreenWidthInDuration);
        let futureCanvasRightDate = canvaseRightDate.plus(oneScreenWidthInDuration);

        if(newTranslateXCandidate< 1.5 * (-this.refs.scrollWrapper.clientWidth)){
          if(this.futurePreloadState == EventPreloadState.NOTLOADED){
            console.log("Preloading future events...");
            this.futurePreloadState = EventPreloadState.LOADING;
            this.eventSocket.askForIntervalFutureDuplex(canvaseRightDate, futureCanvasRightDate);
          }
        }

        if(newTranslateXCandidate > 0.5 * (this.refs.scrollWrapper.clientWidth)){
          //console.log("Preloading past events...");

        }

        return {translateX: newTranslateXCandidate};
      }
    });
  }  

  update() {
    this.refs.canvas.width = this.refs.scrollWrapper.clientWidth * 3;
    this.refs.draggableDiv.style.width = this.refs.scrollWrapper.clientWidth * 3 + "px";
    this.setState({translateX: -this.refs.scrollWrapper.clientWidth});
    this.calculateIntervals();
    this.redrawCanvas();
  }

  calculateIntervals(translateX) {
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

  redrawCanvas() {
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

  onTimelineEventReceived(rawEvents){
    let oneScreenWidthInDuration = this.pxToDuration(this.refs.scrollWrapper.clientWidth);
    let startDate = this.baseDate.minus(oneScreenWidthInDuration);
    let endDate = startDate.plus(oneScreenWidthInDuration).plus(oneScreenWidthInDuration).plus(oneScreenWidthInDuration);    
    this.TlEventCache.merge(rawEvents);
    let changeSet = this.TlEventCache.getEvents(startDate,endDate);
    if(!changeSet.isEmpty()){
      this.setState({visibleEvents: changeSet});
    }

    console.log(rawEvents);
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
  type annotations
  DI
  check immutable coding style
  tooling is subpar - CRA has a good desc. on how to set up VSCode 
TASK NEXT:
  dynamic loading of events:
    render new events (filter out duplicates) and handle page switches
    ask for new events etc. if resize happens
    past
    error handling if result doesn't arrive
    purge events on scroll/resize after or before
  zoom
    buttons
  header
*/