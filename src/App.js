import './App.css';

import {Enum} from 'enumify';

import React, { Component } from 'react';
import Measure from 'react-measure';

import { css } from 'emotion'

import { DraggableCore } from 'react-draggable';
import { List } from 'immutable';

import { DateTime } from 'luxon';
import { Duration } from 'luxon';
import { Interval } from 'luxon';

import EventSocket from './eventSocket.js';
import TlEventCache from './TlEventCache.js';

class EventPreloadState extends Enum {}
EventPreloadState.initEnum(['NOTLOADED', 'LOADING', 'LOADED', 'ERROR']);

function EventBox(props) {

  const liCSSCN = css({
    position: 'absolute',
    background: 'red',
    left: px(props.leftPx),
    top: px(props.event.row * 20),
    width: px(props.rightPx - props.leftPx),
    height: px(20),
  });

  return (
    <li className={liCSSCN}>
      {props.event.text}
    </li>
  )
}

class TimelineComponent extends Component {
  constructor(props) {
    super(props);

    //TODO: refactor with DI
    this.eventSocket = new EventSocket();
    this.TlEventCache = new TlEventCache();

    //Event handlers
    this.handleDrag = this.handleDrag.bind(this);
    this.onTimelineEventReceived = this.onTimelineEventReceived.bind(this);
    this.onTimelineEventReceivedSubscription = this.eventSocket.eventSubject.subscribe(this.onTimelineEventReceived);

    //React States
    this.state = {
      translateX: null,
      visibleEvents: List(),
      scrollWrapperClient: {
        width: 0,
      }
    };

    //Normal States
    this.canvas = null;
    this.baseDate = DateTime.local();
    this.daysToPixel = 200; //the zoom level
    this.pastPreloadState = EventPreloadState.NOTLOADED;
    this.futurePreloadState = EventPreloadState.NOTLOADED;    
  }

  renderEventBoxes() {
    const canvasLeftDate = this.canvasLeftDate();
    const canvasRightDate = this.canvasRightDate();
    return this.state.visibleEvents.map((index,event)=>{

      const startDate = event.startDate < canvasLeftDate ? canvasLeftDate : event.startDate;
      const endDate = event.endDate > canvasRightDate ? canvasRightDate : event.endDate;

      const toPx = (dtEnd) =>  this.durationToPx(Interval.fromDateTimes(canvasLeftDate,dtEnd).toDuration());

      const eventStartPx = toPx(startDate);
      const eventEndPx = toPx(endDate);
      return (<EventBox event={event} leftPx={eventStartPx} rightPx={eventEndPx} key={event.guid}/>);
    });
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
      position: 'absolute',
      background: '#00000021',
      height: px(150),
      width: px(this.state.scrollWrapperClient.width * 3)
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
          <Measure client onResize={(contentRect) => {
              this.setState({ 
                scrollWrapperClient: contentRect.client,
                translateX: -contentRect.client.width
              });              
            }}>
            {({ measureRef }) =>
              <div className={scrollWrapperCSSCN} ref={measureRef}>
                <DraggableCore axis="x" onDrag={this.handleDrag}>
                  <div className={draggableDivCSSCN} style={this.getDraggableStyle()}>
                    <canvas ref={(canvas) => { this.canvas = canvas;}} width={this.state.scrollWrapperClient.width * 3} height={300} style={{display: 'block', position: 'absolute'}}/>
                    <ul style={{listStyleType: 'none'}}>
                      {this.renderEventBoxes()}
                    </ul>
                  </div>
                </DraggableCore>
              </div>
            }
          </Measure>
        </div>
    );
  }

  componentDidMount() {
    const canvasLeftDate = this.canvasLeftDate();
    const canvasRightDate = this.canvasRightDate();
    this.eventSocket.askForIntervalPastDuplex(canvasLeftDate, canvasRightDate);
    this.eventSocket.askForIntervalFutureDuplex(canvasLeftDate, canvasRightDate);
  }

  componentWillUnmount() {
    this.onTimelineEventReceivedSubscription.unsubscribe();
  }

  componentDidUpdate(prevProps,prevState) {
    if(this.trOneThird() === this.state.translateX){
      //this isn't technically correct but the intent is to update after canvas was recycled
      this.redrawCanvas();
    }
  }

  handleDrag(e,data) {
    this.setState((prevState,props) => {
      const newTranslateXCandidate = prevState.translateX + data.deltaX;
      const duration = this.pxToDuration(data.deltaX);
      this.baseDate = this.baseDate.minus(duration);

      if(newTranslateXCandidate< this.trTwoThird() || newTranslateXCandidate > this.trLeftEdge()){
        console.log("<< Switching board >>");
        return {translateX: -this.state.scrollWrapperClient.width};
      }else{
        const sw1 = this.oneScreenWidthInDuration();
        const canvaseRightDate = this.canvasLeftDate().plus(sw1).plus(sw1).plus(sw1);
        const futureCanvasRightDate = canvaseRightDate.plus(sw1).plus(sw1);

        if(newTranslateXCandidate < 1.5 * this.trOneThird()){
          // if(this.futurePreloadState === EventPreloadState.NOTLOADED){
            console.log("Preloading future events...");
            //this.futurePreloadState = EventPreloadState.LOADING;
            this.eventSocket.askForIntervalFutureDuplex(canvaseRightDate, futureCanvasRightDate);
          //}
        }

        if(newTranslateXCandidate < 0.5 * this.trOneThird()){
          //console.log("Preloading past events...");

        }

        return {translateX: newTranslateXCandidate};
      }
    });
  }  

  redrawCanvas() {
    const canvasLeftDate = this.canvasLeftDate();
    const firstVisibleDate = canvasLeftDate.plus({ days: 1 }).startOf('day');
    const leftToFirstDayStart = Interval.fromDateTimes(canvasLeftDate,firstVisibleDate);
    let sum = this.durationToPx(leftToFirstDayStart.toDuration());
    let dateAct = firstVisibleDate;
    let timeDelimeters = List();    

    while(true){
      if(sum > this.canvas.width){
        break;
      }
      
      timeDelimeters = timeDelimeters.push({deliX: sum, dateTime: dateAct});
      sum+=this.daysToPixel;
      dateAct = dateAct.plus({ days: 1 });
    }

    const ctx = this.canvas.getContext('2d');
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.fillStyle='red';
    for (let deli of timeDelimeters){
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
    this.TlEventCache.merge(rawEvents);
    let changeSet = this.TlEventCache.getEvents(this.canvasLeftDate(),this.canvasRightDate());
    if(!changeSet.isEmpty()){
      this.setState({visibleEvents: changeSet});
    }

    console.log(rawEvents);
  }

  trLeftEdge() {
    return 0;
  }

  trOneThird() {
    return -this.state.scrollWrapperClient.width;
  }

  trTwoThird() {
    return 2*(-this.state.scrollWrapperClient.width);
  }

  canvasLeftDate(){
    return this.baseDate.minus(this.pxToDuration(this.state.scrollWrapperClient.width));
  }

  canvasRightDate() {
    const sw1 = this.oneScreenWidthInDuration();
    return this.canvasLeftDate().plus(sw1).plus(sw1).plus(sw1);
  }

  oneScreenWidthInDuration(){
    return this.pxToDuration(this.state.scrollWrapperClient.width);
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

NEXT:
  new state flags for
    -freshly loaded
    -freshly resized
    -freshly recycled
    Any simpler alternative???

REFACTORING:
  css is not very good
  type annotations
  dependency injection
  check immutable coding style
  tooling is sub-par - CRA has a good desc. on how to set up VSCode
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